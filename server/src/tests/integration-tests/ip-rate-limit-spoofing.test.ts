import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
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

async function statuses(count: number, makeHeaders: (i: number) => Record<string, string>) {
  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    result.push((await login(makeHeaders(i))).status);
  }
  return result;
}

describe("IP rate limit - x-forwarded-for spoofing", () => {
  beforeEach(() => {
    fakeRedis.reset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("🔴 should not be bypassed by changing entries the client prepends (1 trusted hop)", async () => {
    // Arrange: proxy จริงต่อ IP ของผู้โจมตีไว้ท้ายสุดเสมอ ส่วนทางซ้ายผู้โจมตีใส่ค่าสุ่มใหม่ทุก request
    const realIp = "203.0.113.50";

    // Act
    const result = await statuses(LOGIN_IP_LIMIT + 1, (i) => ({
      "x-forwarded-for": `198.51.100.${i + 1}, ${realIp}`,
    }));

    // Assert: ยังนับรวมเป็น IP เดียวกัน request ที่ 11 โดน 429
    expect(result.slice(0, LOGIN_IP_LIMIT).every((s) => s === 401)).toBe(true);
    expect(result[LOGIN_IP_LIMIT]).toBe(429);
    expect(fakeRedis.store.has(`ratelimit:login-ip:${realIp}`)).toBe(true);
  });

  test("🔴 should count from the right with the configured number of trusted hops (2 hops)", async () => {
    vi.stubEnv("TRUSTED_PROXY_HOPS", "2");
    const realIp = "203.0.113.60";

    const result = await statuses(LOGIN_IP_LIMIT + 1, (i) => ({
      "x-forwarded-for": `198.51.100.${i + 1}, ${realIp}, 10.0.0.1`,
    }));

    expect(result[LOGIN_IP_LIMIT]).toBe(429);
    expect(fakeRedis.store.has(`ratelimit:login-ip:${realIp}`)).toBe(true);
    expect(fakeRedis.store.has("ratelimit:login-ip:10.0.0.1")).toBe(false);
  });

  test("🔴 should not trust x-real-ip sent by the client", async () => {
    const result = await statuses(LOGIN_IP_LIMIT + 2, (i) => ({
      "x-real-ip": `198.51.100.${i + 1}`,
    }));

    // ไม่มี x-forwarded-for = อ่าน IP ไม่ได้ = ข้าม IP limit (ไม่สร้างตัวนับ ไม่ใช้ค่า x-real-ip)
    expect(result.every((s) => s === 401)).toBe(true);
    expect(
      [...fakeRedis.store.keys()].some((key) => key.startsWith("ratelimit:login-ip:")),
    ).toBe(false);
  });

  test("🔴 should skip the IP limit when TRUSTED_PROXY_HOPS is not set (header is not trusted)", async () => {
    vi.stubEnv("TRUSTED_PROXY_HOPS", "");

    const result = await statuses(LOGIN_IP_LIMIT + 2, () => ({
      "x-forwarded-for": "203.0.113.70",
    }));

    expect(result.every((s) => s === 401)).toBe(true);
    expect(
      [...fakeRedis.store.keys()].some((key) => key.startsWith("ratelimit:login-ip:")),
    ).toBe(false);
  });

  test("🔴 should skip the IP limit when x-forwarded-for has fewer entries than trusted hops", async () => {
    vi.stubEnv("TRUSTED_PROXY_HOPS", "2");

    const result = await statuses(LOGIN_IP_LIMIT + 2, () => ({
      "x-forwarded-for": "203.0.113.80",
    }));

    expect(result.every((s) => s === 401)).toBe(true);
  });
});
