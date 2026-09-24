import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing in environment variables (.env)");
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ message: "Unauthorized: Missing or invalid token" }, 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = await verify(token, JWT_SECRET, "HS256");
    // บันทึกข้อมูล User ลงใน Context ให้ Controller ดึงไปใช้ต่อได้ง่ายๆ
    c.set("jwtPayload", payload);
    await next();
  } catch (error) {
    return c.json({ message: "Unauthorized: Invalid or expired token" }, 401);
  }
});
