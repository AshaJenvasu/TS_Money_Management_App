import { createHash, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import { createMiddleware } from "hono/factory";
import { redis } from "../config/redis.js";
import { logger } from "../utils/logger.js";

export interface IpRateLimitOptions {
  // ชื่อกลุ่ม limit ใช้ประกอบ Redis key ให้แต่ละ endpoint นับแยกกัน
  name: string;
  maxRequests: number;
  windowSeconds: number;
  // ข้อความที่ตอบกลับเมื่อโดน 429
  message: string;
}

// เส้นทางจริงของผู้ใช้ทุกคนคือ browser -> Vercel (rewrite /api) -> Render เสมอ จึงเชื่อ x-vercel-forwarded-for เป็นหลัก
// header นี้ Vercel ตั้งเองจาก connection ที่เข้ามาที่ edge ของมัน (ไม่ใช่ค่าที่ client ส่งมา และเป็น header สงวนของ Vercel)
// ไม่ใช้ x-forwarded-for / x-real-ip เพราะ client ปลอมได้ และไม่ใช้ cf-connecting-ip เพราะทดสอบจริงแล้วเห็นเป็น IP ของ Vercel ไม่ใช่ผู้ใช้
//
// แต่ Render เปิดให้ยิงตรงได้ (ข้าม Vercel) ผู้ยิงตรงจึงตั้ง x-vercel-forwarded-for เองเป็นอะไรก็ได้ ปิดช่องนี้ด้วย shared secret:
// Vercel แปะ header x-internal-proxy-secret (ค่าจาก env INTERNAL_PROXY_SECRET, ดู client/vercel.json) ไปกับทุก request ที่ proxy มา
// ฝั่งนี้เชื่อ x-vercel-forwarded-for ก็ต่อเมื่อ secret ตรงกับ env INTERNAL_PROXY_SECRET ของ Render เท่านั้น
//
// คืน null เมื่ออ่าน IP ไม่ได้ (ไม่ได้ตั้ง secret ฝั่งนี้, ไม่มี/secret ไม่ตรง, ไม่มี header IP หรือค่าไม่ใช่ IP ที่ถูกต้อง)
// เพื่อให้ผู้เรียก fail-open พร้อม warn (ไม่บล็อกทั้งแอป) แทนการรวมทุกคนไว้ใน bucket เดียวกัน
// ค่าที่ไม่ใช่ IP ถูกปฏิเสธ กันเอา string ยาว ๆ มาสร้าง key ใน Redis
export const INTERNAL_PROXY_SECRET_HEADER = "x-internal-proxy-secret";

if (process.env.NODE_ENV === "production" && !process.env.INTERNAL_PROXY_SECRET) {
  logger.warn(
    "INTERNAL_PROXY_SECRET is not set: x-vercel-forwarded-for is not trusted, so IP rate limits are skipped",
  );
}

// เทียบแบบ timing-safe: hash ก่อนเพื่อให้ยาวเท่ากันเสมอ (timingSafeEqual ไม่ throw และไม่รั่วความยาวของ secret)
function secretsMatch(provided: string, expected: string): boolean {
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export function getClientIp(
  headers: { vercelForwardedFor?: string; internalProxySecret?: string },
  expectedSecret: string | undefined,
): string | null {
  if (!expectedSecret || !headers.internalProxySecret) return null;
  if (!secretsMatch(headers.internalProxySecret, expectedSecret)) return null;

  const value = headers.vercelForwardedFor?.trim();
  if (!value || isIP(value) === 0) return null;
  return value;
}

// Fixed-window rate limit ต่อ IP เก็บตัวนับใน Redis (Upstash)
export const ipRateLimit = (options: IpRateLimitOptions) =>
  createMiddleware(async (c, next) => {
    const ip = getClientIp(
      {
        vercelForwardedFor: c.req.header("x-vercel-forwarded-for"),
        internalProxySecret: c.req.header(INTERNAL_PROXY_SECRET_HEADER),
      },
      process.env.INTERNAL_PROXY_SECRET,
    );

    // Fail-open: อ่าน IP ไม่ได้ก็ข้าม rate limit ของ request นี้ (ยังมี limit ต่อ email ใน DB เป็นด่านสอง)
    if (!ip) {
      logger.warn(
        { path: c.req.path, limit: options.name },
        "Client IP could not be determined, skipping IP rate limit",
      );
      await next();
      return;
    }

    const key = `ratelimit:${options.name}:${ip}`;

    try {
      const count = await redis.incr(key);
      // NX: ตั้งอายุเฉพาะ key ที่ยังไม่มีอายุ จึงไม่ต่อเวลาใหม่ทุก request และถ้ารอบแรกตั้งอายุไม่สำเร็จ รอบถัดไปจะตั้งให้
      await redis.expire(key, options.windowSeconds, "NX");

      if (count > options.maxRequests) {
        // บอกวินาทีที่ต้องรอจากอายุที่เหลือของตัวนับ (ถ้าอ่านไม่ได้ใช้ทั้งหน้าต่าง)
        const ttl = await redis.ttl(key).catch(() => -1);
        c.header(
          "Retry-After",
          String(ttl > 0 ? ttl : options.windowSeconds),
        );
        return c.json({ message: options.message }, 429);
      }
    } catch (error) {
      // Fail-open: Redis ล่มต้องไม่ทำให้ผู้ใช้ทุกคนใช้งานไม่ได้ (ยังมี limit ต่อ email ใน DB เป็นด่านสอง)
      logger.warn({ err: error }, "Rate limit check failed, allowing request");
    }

    await next();
  });
