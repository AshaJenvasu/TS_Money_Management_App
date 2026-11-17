import { describe, test, expect } from "vitest";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import app from "../../index";
import { prisma } from "../helpers/reset-db";
import { createTestUserWithToken } from "../helpers/auth";

function resetPassword(token: string, newPassword: string) {
  return app.request("/api/v1/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });
}

// สร้าง reset token ที่ยังไม่ถูกใช้ลง DB โดยตรง (ไม่ผ่านการส่งอีเมล) คืน token ดิบที่ user จะได้จากลิงก์
async function createResetToken(userId: bigint) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const row = await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  });
  return { rawToken, tokenId: row.id };
}

describe("POST /api/v1/auth/reset-password - token reuse race", () => {
  test("🟢 Happy Path: should reset the password once and mark the token as used", async () => {
    const { testUser } = await createTestUserWithToken();
    const { rawToken, tokenId } = await createResetToken(testUser.id);

    const res = await resetPassword(rawToken, "NewPassword456!");

    expect(res.status).toBe(200);
    const token = await prisma.passwordResetToken.findUnique({
      where: { id: tokenId },
    });
    expect(token?.usedAt).not.toBeNull();
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: testUser.id },
    });
    expect(await bcrypt.compare("NewPassword456!", user.passwordHash)).toBe(
      true,
    );
  });

  test("🔴 Sad Path: should return 400 when the token was already used", async () => {
    const { testUser } = await createTestUserWithToken();
    const { rawToken } = await createResetToken(testUser.id);
    await resetPassword(rawToken, "FirstPassword1!");

    const res = await resetPassword(rawToken, "SecondPassword2!");

    expect(res.status).toBe(400);
  });

  test("🔴 Race: should let only one of two concurrent requests with the same token succeed", async () => {
    // Arrange
    const { testUser } = await createTestUserWithToken();
    const { rawToken } = await createResetToken(testUser.id);
    const passwordA = "PasswordAlpha1!";
    const passwordB = "PasswordBravo2!";

    // Act: ยิงพร้อมกันด้วย token เดียวกันแต่รหัสผ่านใหม่ต่างกัน
    const [resA, resB] = await Promise.all([
      resetPassword(rawToken, passwordA),
      resetPassword(rawToken, passwordB),
    ]);

    // Assert: ผ่านแค่ 1 ครั้ง อีกครั้งโดนปฏิเสธ
    expect([resA.status, resB.status].sort()).toEqual([200, 400]);

    // รหัสผ่านสุดท้ายต้องเป็นของ request ที่ผ่านเท่านั้น (ไม่ใช่ของฝั่งที่ถูกปฏิเสธ)
    const winner = resA.status === 200 ? passwordA : passwordB;
    const loser = resA.status === 200 ? passwordB : passwordA;
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: testUser.id },
    });
    expect(await bcrypt.compare(winner, user.passwordHash)).toBe(true);
    expect(await bcrypt.compare(loser, user.passwordHash)).toBe(false);
  });
});
