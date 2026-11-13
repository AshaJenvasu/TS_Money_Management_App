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

// อ่าน IP ของผู้ใช้หลัง proxy (Render) จากค่าซ้ายสุดของ x-forwarded-for
// หมายเหตุ: ค่าซ้ายสุดผู้ใช้ปลอมเองได้ จึงเป็นเพียงด่านแรก (ยังมี rate limit ต่อ email ใน DB เป็นด่านสอง)
// คืน null เมื่ออ่าน IP ไม่ได้ เพื่อให้ผู้เรียก fail-open แทนการรวมทุกคนไว้ใน bucket เดียวกัน
function getClientIp(
  forwardedFor: string | undefined,
  realIp: string | undefined,
): string | null {
  const first = forwardedFor?.split(",")[0]?.trim();
  return first || realIp?.trim() || null;
}

// Fixed-window rate limit ต่อ IP เก็บตัวนับใน Redis (Upstash)
export const ipRateLimit = (options: IpRateLimitOptions) =>
  createMiddleware(async (c, next) => {
    const ip = getClientIp(
      c.req.header("x-forwarded-for"),
      c.req.header("x-real-ip"),
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
