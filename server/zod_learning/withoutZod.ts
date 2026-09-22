import { Hono } from "hono";

const app = new Hono();

app.post("/users", async (c) => {
  const body = await c.req.json();

  // 🔍 ตรวจสอบเองว่า email มีและเป็น string
  if (typeof body.email !== "string") {
    return c.json({ error: "Email must be a string" }, 400);
  }

  // 🔍 ตรวจสอบเองว่า email เป็นรูปแบบ Email
  if (!body.email.includes("@")) {
    return c.json({ error: "Invalid email" }, 400);
  }

  // 🔍 ตรวจสอบเองว่า age เป็น number
  if (typeof body.age !== "number") {
    return c.json({ error: "Age must be a number" }, 400);
  }

  // 🔍 ตรวจสอบเองว่า age >= 1
  if (body.age < 1) {
    return c.json({ error: "Age must be at least 1" }, 400);
  }

  // ✅ ผ่าน validation
  const user = body;

  return c.json(user);
});

export default app;
