import { redis } from "../config/redis.js";
import { RATE_LIMITS } from "../config/rate-limits.js";
import { logger } from "../utils/logger.js";

const { name, maxFailures, windowSeconds } = RATE_LIMITS.loginEmail;

// ปรับ identifier ให้เป็นรูปแบบเดียวกัน (trim + ตัวพิมพ์เล็ก) กันเลี่ยง limit ด้วยการสลับตัวพิมพ์
const keyFor = (identifier: string) =>
  `ratelimit:${name}:${identifier.trim().toLowerCase()}`;

export interface LoginAttemptTicket {
  // วินาทีที่ต้องรอ (ใช้ใส่ Retry-After) เมื่อบัญชีนี้ถูกล็อก ไม่งั้นเป็น null
  retryAfterSeconds: number | null;
  // true เมื่อ attempt นี้จองช่องในตัวนับไว้แล้ว (false เมื่อ Redis ล่มและ fail-open)
  counted: boolean;
}

// ชั้นที่สองของ login rate limit: จำกัดจำนวนการลองรหัสต่อ identifier เพื่อจับ brute-force บัญชีเดียว
//
// ใช้ increment-then-check เพื่อไม่ให้เกิด race condition: ทุก attempt "จองช่อง" ด้วย incr ก่อนตรวจรหัสผ่านเสมอ
// แล้วเทียบค่าที่ incr คืนกลับมากับ limit ทันที (ไม่ get มาเช็คก่อนแล้วค่อย incr ทีหลัง ซึ่งยิงขนานแล้วทะลุ limit ได้)
// ผลคือมีการตรวจรหัสผ่านพร้อมกันได้ไม่เกิน limit เสมอ แม้ยิงขนาน
// login สำเร็จจะคืนช่องกลับด้วย release() จึงนับเฉพาะ login ที่ล้มเหลวตามเดิม
// ทุก method fail-open: Redis ล่มต้องไม่ทำให้ใคร login ไม่ได้
export class LoginThrottle {
  static async beginAttempt(identifier: string): Promise<LoginAttemptTicket> {
    try {
      const key = keyFor(identifier);
      const attempts = await redis.incr(key);
      // NX: ตั้งอายุเฉพาะ key ที่ยังไม่มีอายุ ไม่ต่อเวลาใหม่ทุกครั้ง และถ้ารอบแรกตั้งอายุไม่สำเร็จ รอบถัดไปจะตั้งให้
      await redis.expire(key, windowSeconds, "NX");

      if (attempts <= maxFailures) {
        return { retryAfterSeconds: null, counted: true };
      }

      const ttl = await redis.ttl(key).catch(() => -1);
      return {
        retryAfterSeconds: ttl > 0 ? ttl : windowSeconds,
        counted: true,
      };
    } catch (error) {
      logger.warn({ err: error }, "Login throttle check failed, allowing request");
      return { retryAfterSeconds: null, counted: false };
    }
  }

  // คืนช่องที่จองไว้ เรียกเมื่อ attempt ไม่ใช่ credential ผิด (login สำเร็จ หรือเกิด error อื่นที่ไม่ใช่ความผิดของผู้ใช้)
  static async release(identifier: string): Promise<void> {
    try {
      const key = keyFor(identifier);
      const remaining = await redis.decr(key);
      // ถ้า key หมดอายุไประหว่าง attempt แล้วถูก decr จะได้ค่าติดลบและไม่มีอายุ (ให้ลองได้เกิน limit ถาวร) จึงลบทิ้ง
      if (remaining < 0) {
        await redis.del(key);
      }
    } catch (error) {
      logger.warn({ err: error }, "Failed to release login attempt slot");
    }
  }
}
