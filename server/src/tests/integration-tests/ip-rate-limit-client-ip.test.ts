import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import app from "../../index";
import { fakeRedis } from "../helpers/fake-redis";
import { proxyHeaders } from "../helpers/proxy-headers";

// Redis (Upstash) เป็น external boundary: ใช้ in-memory fake ร่วมกับ test อื่น
vi.mock("../../config/redis", async () => ({
  redis: (await import("../helpers/fake-redis")).fakeRedis.client,
}));

const LOGIN_IP_LIMIT = 10;
const SECRET_HEADER = "x-internal-proxy-secret";
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

describe("IP rate limit - client IP is trusted only with the shared proxy secret", () => {
  beforeEach(() => {
    fakeRedis.reset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("🟢 secret correct + x-vercel-forwarded-for => uses that IP (429 after the limit)", async () => {
    const ip = "203.0.113.50";

    const result = await statuses(LOGIN_IP_LIMIT + 1, () => proxyHeaders(ip));

    expect(result.slice(0, LOGIN_IP_LIMIT).every((s) => s === 401)).toBe(true);
    expect(result[LOGIN_IP_LIMIT]).toBe(429);
    expect(fakeRedis.store.has(`ratelimit:login-ip:${ip}`)).toBe(true);
  });

  test("🟢 should keep a separate counter for each client IP", async () => {
    await statuses(LOGIN_IP_LIMIT + 1, () => proxyHeaders("203.0.113.51"));

    const other = await login(proxyHeaders("203.0.113.52"));

    expect(other.status).toBe(401);
  });

  test("🔴 no secret header => IP limit skipped, no error (direct hit on Render)", async () => {
    const result = await statuses(LOGIN_IP_LIMIT + 2, () => ({
      "x-vercel-forwarded-for": "203.0.113.60",
    }));

    expect(result.every((s) => s === 401)).toBe(true);
    expect(ipKeys()).toEqual([]);
  });

  test("🔴 wrong secret => IP limit skipped, no error", async () => {
    const result = await statuses(LOGIN_IP_LIMIT + 2, () => ({
      "x-vercel-forwarded-for": "203.0.113.61",
      [SECRET_HEADER]: "not-the-real-secret",
    }));

    expect(result.every((s) => s === 401)).toBe(true);
    expect(ipKeys()).toEqual([]);
  });

  test("🔴 secret not configured on the server => IP limit skipped even if a secret is sent", async () => {
    vi.stubEnv("INTERNAL_PROXY_SECRET", "");

    const result = await statuses(LOGIN_IP_LIMIT + 2, () => ({
      "x-vercel-forwarded-for": "203.0.113.62",
      [SECRET_HEADER]: "",
    }));

    expect(result.every((s) => s === 401)).toBe(true);
    expect(ipKeys()).toEqual([]);
  });

  test("🔴 secret correct but no x-vercel-forwarded-for => IP limit skipped", async () => {
    const result = await statuses(LOGIN_IP_LIMIT + 2, () => ({
      [SECRET_HEADER]: proxyHeaders("203.0.113.63")[SECRET_HEADER],
    }));

    expect(result.every((s) => s === 401)).toBe(true);
    expect(ipKeys()).toEqual([]);
  });

  test("🔴 secret correct but x-vercel-forwarded-for is not a valid IP => IP limit skipped", async () => {
    const result = await statuses(LOGIN_IP_LIMIT + 2, (i) =>
      proxyHeaders(`not-an-ip-${i}`),
    );

    expect(result.every((s) => s === 401)).toBe(true);
    expect(ipKeys()).toEqual([]);
  });

  test("🔴 should ignore x-forwarded-for, x-real-ip and cf-connecting-ip even with the secret", async () => {
    // ค่าเดียวกันทุก request และเป็น IP ที่ถูกต้อง: ถ้ามีการอ่าน header เหล่านี้จะนับรวมแล้วโดน 429
    const result = await statuses(LOGIN_IP_LIMIT + 2, () => ({
      [SECRET_HEADER]: proxyHeaders("203.0.113.64")[SECRET_HEADER],
      "x-forwarded-for": "203.0.113.64",
      "x-real-ip": "203.0.113.64",
      "cf-connecting-ip": "203.0.113.64",
    }));

    expect(result.every((s) => s === 401)).toBe(true);
    expect(ipKeys()).toEqual([]);
  });
});
