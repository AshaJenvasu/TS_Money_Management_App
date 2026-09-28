import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";

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
    // บันทึกข้อมูล User ลงใน Context ให้ Controller ดึงไปใช้ต่อได้ง่ายๆ
    c.set("jwtPayload", payload);
    await next();
  } catch (_error) {
    return c.json({ message: "Unauthorized: Invalid or expired token" }, 401);
  }
});
