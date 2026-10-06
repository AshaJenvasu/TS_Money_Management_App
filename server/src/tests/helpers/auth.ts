import { sign } from "hono/jwt";
import { prisma } from "./reset-db";

export async function createTestUserWithToken() {
  // 1. สร้าง User จำลองใน DB
  const testUser = await prisma.user.create({
    data: {
      username: `test_user_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      passwordHash: "hashed_password_123",
    },
  });

  // 2. สร้าง JWT Token
  const secret = process.env.JWT_SECRET!;
  const token = await sign(
    {
      id: testUser.id.toString(),
      userId: testUser.id.toString(),
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    },
    secret,
    "HS256",
  );

  return {
    testUser,
    token,
    authHeader: {
      Cookie: `auth_token=${token}`,
    },
  };
}
