import { describe, test, expect, vi, beforeEach } from "vitest";
import app from "../../index";
import { fakeRedis } from "../helpers/fake-redis";

// Redis (Upstash) เป็น external boundary: ใช้ in-memory fake ร่วมกับ test อื่น
vi.mock("../../config/redis", async () => ({
  redis: (await import("../helpers/fake-redis")).fakeRedis.client,
}));

const LOGIN_IP_LIMIT = 10;
let counter = 0;

// ทุก request ใช้ identifier ไม่ซ้ำกัน เพื่อไม่ให้ชั้น identifier มาปนกับผลของชั้น IP
function login(headers: Record<string, string>) {
  counter += 1;
  return app.request("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({
      identifier: `nobody_${counter}@example.com`,
      password: "wrong-password-123",
      rememberMe: false,
    }),
  });
}

async function statuses(
  count: number,
  makeHeaders: (i: number) => Record<string, string>,
) {
  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    result.push((await login(makeHeaders(i))).status);
  }
  return result;
}

const ipKeys = () =>
  [...fakeRedis.store.keys()].filter((key) =>
    key.startsWith("ratelimit:login-ip:"),
  );

describe("IP rate limit - client IP comes from x-vercel-forwarded-for", () => {
  beforeEach(() => {
    fakeRedis.reset();
  });

  test("🟢 should count requests per x-vercel-forwarded-for and return 429 after the limit", async () => {
    const ip = "203.0.113.50";

    const result = await statuses(LOGIN_IP_LIMIT + 1, () => ({
      "x-vercel-forwarded-for": ip,
    }));

    expect(result.slice(0, LOGIN_IP_LIMIT).every((s) => s === 401)).toBe(true);
    expect(result[LOGIN_IP_LIMIT]).toBe(429);
    expect(fakeRedis.store.has(`ratelimit:login-ip:${ip}`)).toBe(true);
  });

  test("🟢 should keep a separate counter for each x-vercel-forwarded-for value", async () => {
    await statuses(LOGIN_IP_LIMIT + 1, () => ({
      "x-vercel-forwarded-for": "203.0.113.51",
    }));

    const other = await login({ "x-vercel-forwarded-for": "203.0.113.52" });

    expect(other.status).toBe(401);
  });

  test("🔴 should ignore x-forwarded-for, x-real-ip and cf-connecting-ip (no x-vercel-forwarded-for => skip, no error)", async () => {
    // ค่าเดียวกันทุก request และเป็น IP ที่ถูกต้อง: ถ้ามีการอ่าน header เหล่านี้จะนับรวมแล้วโดน 429
    const result = await statuses(LOGIN_IP_LIMIT + 2, () => ({
      "x-forwarded-for": "203.0.113.60",
      "x-real-ip": "203.0.113.60",
      "cf-connecting-ip": "203.0.113.60",
    }));

    // ข้าม IP limit (ไม่ throw ไม่ 5xx) ตอบ 401 ตามปกติของ login ผิด และไม่สร้างตัวนับต่อ IP
    expect(result.every((s) => s === 401)).toBe(true);
    expect(ipKeys()).toEqual([]);
  });

  test("🔴 should skip the IP limit when x-vercel-forwarded-for is not a valid IP", async () => {
    const result = await statuses(LOGIN_IP_LIMIT + 2, (i) => ({
      "x-vercel-forwarded-for": `not-an-ip-${i}`,
    }));

    expect(result.every((s) => s === 401)).toBe(true);
    expect(ipKeys()).toEqual([]);
  });
});
