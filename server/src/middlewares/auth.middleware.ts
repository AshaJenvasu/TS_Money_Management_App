import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import { UserRepository } from "../repositories/user.repository.js";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing in environment variables (.env)");
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const token = getCookie(c, "auth_token");

  if (!token) {
    return c.json({ message: "Unauthorized: Missing or invalid token" }, 401);
  }

  try {
    const payload = await verify(token, JWT_SECRET, "HS256");

    // Fail-closed: token ที่ไม่มี iat เลยถือว่าเก่าเกินไป ไม่ไว้ใจ (เช่น token ที่ sign มาก่อนฟีเจอร์นี้มีอยู่)
    if (typeof payload.iat !== "number") {
      return c.json({ message: "Unauthorized: Please log in again" }, 401);
    }

    // เช็คว่า token นี้ถูกสร้างก่อน user จะเปลี่ยน password ล่าสุดหรือไม่ (session invalidation)
    const userStatus = await UserRepository.findPasswordChangedAtById(
      BigInt(payload.id as string),
    );

    if (!userStatus) {
      return c.json({ message: "Unauthorized: User not found" }, 401);
    }

    if (userStatus.passwordChangedAt) {
      const passwordChangedAtSeconds = Math.floor(
        userStatus.passwordChangedAt.getTime() / 1000,
      );

      if (payload.iat < passwordChangedAtSeconds) {
        return c.json({ message: "Unauthorized: Please log in again" }, 401);
      }
    }

    // บันทึกข้อมูล User ลงใน Context ให้ Controller ดึงไปใช้ต่อได้ง่ายๆ
    c.set("jwtPayload", payload);
    await next();
  } catch (_error) {
    return c.json({ message: "Unauthorized: Invalid or expired token" }, 401);
  }
});
