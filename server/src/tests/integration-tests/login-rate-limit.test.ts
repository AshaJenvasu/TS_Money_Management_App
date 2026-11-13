import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import bcrypt from "bcryptjs";
import app from "../../index";
import { prisma } from "../helpers/reset-db";
import { fakeRedis } from "../helpers/fake-redis";

// Redis (Upstash) เป็น external boundary: ใช้ in-memory fake ร่วมกับ test อื่น
vi.mock("../../config/redis", async () => ({
  redis: (await import("../helpers/fake-redis")).fakeRedis.client,
}));

const PASSWORD = "correct-password-123";
const WRONG_PASSWORD = "wrong-password-123";
const WINDOW_SECONDS = 15 * 60;

let userCounter = 0;

// สร้าง user จริงที่ login ได้ (email ขึ้นต้น test_ เพื่อให้ cleanTestData ลบให้)
async function createLoginUser() {
  userCounter += 1;
  const unique = `${Date.now()}_${userCounter}`;
  const user = await prisma.user.create({
    data: {
      username: `test_login_${unique}`,
      email: `test_login_${unique}@example.com`,
      passwordHash: await bcrypt.hash(PASSWORD, 4),
    },
  });
  return user;
}

// ไม่ส่ง ip = ไม่ใส่ header x-forwarded-for เลย (จำลองกรณีอ่าน IP ไม่ได้)
function login(identifier: string, password: string, ip?: string) {
  return app.request("/api/v1/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(ip ? { "x-forwarded-for": ip } : {}),
    },
    body: JSON.stringify({ identifier, password, rememberMe: false }),
  });
}

// IP ที่ไม่ซ้ำกันในแต่ละครั้ง เพื่อแยก limit ชั้น email ออกจากชั้น IP
let ipCounter = 0;
const freshIp = () => `198.51.100.${(ipCounter += 1) % 250}`;

function expectValidRetryAfter(res: Response) {
  const retryAfter = Number(res.headers.get("Retry-After"));
  expect(Number.isInteger(retryAfter)).toBe(true);
  expect(retryAfter).toBeGreaterThanOrEqual(1);
  expect(retryAfter).toBeLessThanOrEqual(WINDOW_SECONDS);
}

describe("POST /api/v1/auth/login - rate limit", () => {
  beforeEach(() => {
    fakeRedis.reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Layer 1: per-IP (10 requests / 15 minutes)", () => {
    test("🔴 should allow 10 requests per IP then return 429 even with the correct password", async () => {
      const user = await createLoginUser();
      const ip = "203.0.113.10";

      // 10 ครั้งแรก: ใช้ identifier ต่างกันที่ไม่มีอยู่จริง (ล้มเหลว 401) เพื่อไม่ให้ชั้น email เข้ามาเกี่ยว
      for (let i = 0; i < 10; i++) {
        const res = await login(`nobody_${i}@example.com`, WRONG_PASSWORD, ip);
        expect(res.status).toBe(401);
      }

      // ครั้งที่ 11: บัญชีจริง รหัสถูก ก็ต้องโดนบล็อก (นับทุก request ไม่ว่าสำเร็จหรือไม่)
      const blocked = await login(user.email, PASSWORD, ip);
      expect(blocked.status).toBe(429);
    });

    test("🟢 should not count requests from a different IP", async () => {
      const user = await createLoginUser();
      for (let i = 0; i < 10; i++) {
        await login(`nobody_${i}@example.com`, WRONG_PASSWORD, "203.0.113.10");
      }

      const blocked = await login(user.email, PASSWORD, "203.0.113.10");
      const otherIp = await login(user.email, PASSWORD, "203.0.113.11");

      expect(blocked.status).toBe(429);
      expect(otherIp.status).toBe(200);
    });

    test("🟢 should allow requests again after the 15 minute window", async () => {
      const user = await createLoginUser();
      const ip = "203.0.113.10";
      for (let i = 0; i < 10; i++) {
        await login(`nobody_${i}@example.com`, WRONG_PASSWORD, ip);
      }
      expect((await login(user.email, PASSWORD, ip)).status).toBe(429);

      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(Date.now() + 16 * 60 * 1000);

      expect((await login(user.email, PASSWORD, ip)).status).toBe(200);
    });

    test("🔴 should send a Retry-After header with the 429", async () => {
      const user = await createLoginUser();
      const ip = "203.0.113.10";
      for (let i = 0; i < 10; i++) {
        await login(`nobody_${i}@example.com`, WRONG_PASSWORD, ip);
      }

      const blocked = await login(user.email, PASSWORD, ip);

      expect(blocked.status).toBe(429);
      expectValidRetryAfter(blocked);
    });

    test("🟢 should skip the IP limit when the client IP cannot be determined", async () => {
      for (let i = 0; i < 11; i++) {
        const res = await login(`nobody_${i}@example.com`, WRONG_PASSWORD);
        expect(res.status).toBe(401);
      }
    });
  });

  describe("Layer 2: per-identifier failed attempts (5 failures / 15 minutes)", () => {
    test("🔴 should return 401 for failures 1-5, then 429 on the 6th attempt even with the correct password", async () => {
      const user = await createLoginUser();

      for (let i = 0; i < 5; i++) {
        const res = await login(user.email, WRONG_PASSWORD, freshIp());
        expect(res.status).toBe(401);
      }

      const blocked = await login(user.email, PASSWORD, freshIp());
      expect(blocked.status).toBe(429);
      expectValidRetryAfter(blocked);
    });

    test("🟢 should not count failures of a different identifier", async () => {
      const locked = await createLoginUser();
      const other = await createLoginUser();
      for (let i = 0; i < 5; i++) {
        await login(locked.email, WRONG_PASSWORD, freshIp());
      }

      expect((await login(locked.email, PASSWORD, freshIp())).status).toBe(429);
      expect((await login(other.email, PASSWORD, freshIp())).status).toBe(200);
    });

    test("🔴 should not count successful logins", async () => {
      const user = await createLoginUser();

      // login สำเร็จ 8 ครั้ง (มากกว่า limit 5) ต้องผ่านทั้งหมด
      for (let i = 0; i < 8; i++) {
        const res = await login(user.email, PASSWORD, freshIp());
        expect(res.status).toBe(200);
      }

      // และการล้มเหลวครั้งแรกหลังจากนั้นยังต้องเป็น 401 (ตัวนับเริ่มจาก 0)
      expect((await login(user.email, WRONG_PASSWORD, freshIp())).status).toBe(
        401,
      );
    });

    test("🟢 should treat the identifier case-insensitively", async () => {
      const user = await createLoginUser();

      for (let i = 0; i < 3; i++) {
        await login(user.email.toUpperCase(), WRONG_PASSWORD, freshIp());
      }
      for (let i = 0; i < 2; i++) {
        await login(user.email, WRONG_PASSWORD, freshIp());
      }

      expect((await login(user.email, PASSWORD, freshIp())).status).toBe(429);
    });

    test("🟢 should allow login again after the 15 minute window", async () => {
      const user = await createLoginUser();
      for (let i = 0; i < 5; i++) {
        await login(user.email, WRONG_PASSWORD, freshIp());
      }
      expect((await login(user.email, PASSWORD, freshIp())).status).toBe(429);

      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(Date.now() + 16 * 60 * 1000);

      expect((await login(user.email, PASSWORD, freshIp())).status).toBe(200);
    });

    test("🔴 Concurrency: 8 simultaneous wrong guesses on one account must let through exactly 5 (limit 5), never more", async () => {
      const user = await createLoginUser();

      // ยิง 8 ครั้งพร้อมกัน (IP ต่างกันเพื่อแยกออกจากชั้น IP) ด้วยรหัสผิด
      const responses = await Promise.all(
        Array.from({ length: 8 }, () =>
          login(user.email, WRONG_PASSWORD, freshIp()),
        ),
      );
      const statuses = responses.map((res) => res.status);

      // ที่ถูกตรวจรหัสผ่านจริง (ได้ 401) ต้องมี 5 ตัวเป๊ะ ที่เหลือ 3 โดน 429 ก่อนถึงขั้นตรวจรหัส
      expect(statuses.filter((s) => s === 401)).toHaveLength(5);
      expect(statuses.filter((s) => s === 429)).toHaveLength(3);
    });

    test("🔴 Concurrency: a correct login still works after failures, and successes still do not stay counted", async () => {
      const user = await createLoginUser();

      // 4 ครั้งที่ล้มเหลว (ต่ำกว่า limit) แล้วล็อกอินสำเร็จ ต้องผ่าน และไม่ทำให้ตัวนับเพิ่ม
      for (let i = 0; i < 4; i++) {
        await login(user.email, WRONG_PASSWORD, freshIp());
      }
      expect((await login(user.email, PASSWORD, freshIp())).status).toBe(200);

      // ล้มเหลวได้อีก 1 ครั้ง (รวมเป็น 5) ถึงจะถูกล็อก: ถ้า login สำเร็จเมื่อกี้ยังถูกนับ จะล็อกเร็วเกินไป
      expect((await login(user.email, WRONG_PASSWORD, freshIp())).status).toBe(
        401,
      );
      expect((await login(user.email, PASSWORD, freshIp())).status).toBe(429);
    });

    test("🟢 Concurrency: 14 simultaneous requests from one IP must let through exactly 10 (limit 10), never more", async () => {
      const responses = await Promise.all(
        Array.from({ length: 14 }, (_, i) =>
          login(`nobody_${i}@example.com`, WRONG_PASSWORD, "203.0.113.50"),
        ),
      );
      const statuses = responses.map((res) => res.status);

      expect(statuses.filter((s) => s === 401)).toHaveLength(10);
      expect(statuses.filter((s) => s === 429)).toHaveLength(4);
    });

    test("🔴 should fail open when Redis is unavailable", async () => {
      const user = await createLoginUser();
      fakeRedis.failing = true;

      expect((await login(user.email, PASSWORD, freshIp())).status).toBe(200);
      expect((await login(user.email, WRONG_PASSWORD, freshIp())).status).toBe(
        401,
      );
    });
  });
});
