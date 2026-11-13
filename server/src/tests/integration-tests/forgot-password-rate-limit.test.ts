import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import app from "../../index";
import { createTestUserWithToken } from "../helpers/auth";
import { sendPasswordResetEmail } from "../../utils/email";
import { fakeRedis } from "../helpers/fake-redis";

// Redis (Upstash) เป็น external boundary: ใช้ in-memory fake ร่วมกับ test อื่น (helpers/fake-redis.ts)
vi.mock("../../config/redis", async () => ({
  redis: (await import("../helpers/fake-redis")).fakeRedis.client,
}));

// การส่งอีเมลเป็น external boundary: ไม่ส่งจริง แค่นับว่าถูกเรียกกี่ครั้ง
vi.mock("../../utils/email", () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

// ไม่ส่ง ip = ไม่ใส่ header x-forwarded-for เลย (จำลองกรณีอ่าน IP ไม่ได้)
function requestReset(email: string, ip?: string) {
  return app.request("/api/v1/auth/forgot-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(ip ? { "x-forwarded-for": ip } : {}),
    },
    body: JSON.stringify({ email }),
  });
}

// สร้าง user จริงหลายคน เพื่อให้แต่ละ email โดนแค่ 1 ครั้ง (ไม่ชน rate limit ต่อ email เดิมใน DB) ผลที่เห็นจึงมาจาก limit ต่อ IP เท่านั้น
async function createUsersWithEmails(count: number) {
  const emails: string[] = [];
  for (let i = 0; i < count; i++) {
    const { testUser } = await createTestUserWithToken();
    emails.push(testUser.email);
    // ให้ email/username ของ user ถัดไปไม่ซ้ำ (helper ใช้ Date.now)
    await new Promise((resolve) => setTimeout(resolve, 2));
  }
  return emails;
}

describe("POST /api/v1/auth/forgot-password - per-IP rate limit", () => {
  beforeEach(() => {
    fakeRedis.reset();
    vi.mocked(sendPasswordResetEmail).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("🔴 should allow 3 requests per IP then return 429 without sending another email", async () => {
    // Arrange
    const emails = await createUsersWithEmails(4);

    // Act: IP เดียวกันยิง 4 ครั้ง (ต่าง email)
    const statuses: number[] = [];
    for (const email of emails) {
      statuses.push((await requestReset(email, "203.0.113.1")).status);
    }

    // Assert: 3 ครั้งแรกผ่าน ครั้งที่ 4 โดนบล็อกและไม่มีอีเมลครั้งที่ 4
    expect(statuses).toEqual([200, 200, 200, 429]);
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(3);
  });

  test("🟢 Concurrency: 6 simultaneous requests from one IP must let through exactly 3 (limit 3), never more", async () => {
    const emails = await createUsersWithEmails(6);

    const responses = await Promise.all(
      emails.map((email) => requestReset(email, "203.0.113.77")),
    );
    const statuses = responses.map((res) => res.status);

    expect(statuses.filter((s) => s === 200)).toHaveLength(3);
    expect(statuses.filter((s) => s === 429)).toHaveLength(3);
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(3);
  });

  test("🟢 should not count requests from a different IP", async () => {
    const emails = await createUsersWithEmails(4);

    for (const email of emails.slice(0, 3)) {
      await requestReset(email, "203.0.113.1");
    }
    const blocked = await requestReset(emails[3], "203.0.113.1");
    const otherIp = await requestReset(emails[3], "203.0.113.2");

    expect(blocked.status).toBe(429);
    expect(otherIp.status).toBe(200);
  });

  test("🟢 should allow requests again after the 15 minute window", async () => {
    const emails = await createUsersWithEmails(4);
    for (const email of emails.slice(0, 3)) {
      await requestReset(email, "203.0.113.1");
    }
    expect((await requestReset(emails[3], "203.0.113.1")).status).toBe(429);

    // เลื่อนเวลา 16 นาที (เกินหน้าต่าง 15 นาที)
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() + 16 * 60 * 1000);

    expect((await requestReset(emails[3], "203.0.113.1")).status).toBe(200);
  });

  test("🔴 should skip the IP rate limit when the client IP cannot be determined", async () => {
    // Arrange: ไม่มี x-forwarded-for และไม่มี x-real-ip ยิง 4 ครั้ง (ต่าง email)
    const emails = await createUsersWithEmails(4);

    // Act
    const statuses: number[] = [];
    for (const email of emails) {
      statuses.push((await requestReset(email)).status);
    }

    // Assert: ไม่นับรวมเป็นกลุ่มเดียว (ไม่มีใครโดน 429 จาก limit ต่อ IP) และอีเมลถูกส่งครบ
    expect(statuses).toEqual([200, 200, 200, 200]);
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(4);
    // ไม่สร้างตัวนับใน Redis เลย
    expect(fakeRedis.store.size).toBe(0);
  });

  test("🔴 should fail open when Redis is unavailable", async () => {
    const [email] = await createUsersWithEmails(1);
    fakeRedis.failing = true;

    const res = await requestReset(email, "203.0.113.1");

    expect(res.status).toBe(200);
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
  });
});
