import { Hono } from "hono";

import { z } from "zod";

const app = new Hono();

const userSchema = z.object({
  // 📧 email ต้องเป็น string และต้องมีรูปแบบ Email ที่ถูกต้อง
  email: z.string().email(),

  // 🔢 age ต้องเป็น number และต้อง >= 1
  age: z.number().min(1),
});

// 🚪 สร้าง API POST /users
// Client สามารถส่งข้อมูล User เข้ามาที่ endpoint นี้ได้
app.post("/users", async (c) => {
  // 📥 อ่านข้อมูล JSON ที่ Client ส่งมา
  //
  // เช่น Client ส่ง:
  // {
  //   "email": "asha@email.com",
  //   "age": 20
  // }
  //
  const body = await c.req.json();

  // 🛡️ เอา body ไปให้ Zod ตรวจสอบกับ userSchema
  //
  // Zod จะตรวจว่า:
  // 1. email เป็น string ไหม
  // 2. email เป็น Email จริงไหม
  // 3. age เป็น number ไหม
  // 4. age >= 1 ไหม
  const result = userSchema.safeParse(body);

  // ❌ ถ้าข้อมูลไม่ผ่าน Zod
  //
  // เช่น:
  // {
  //   "email": "hello",
  //   "age": -5
  // }
  //
  // Zod จะบอกว่า validation ไม่ผ่าน
  if (!result.success) {
    // 🚫 หยุดตรงนี้
    // ไม่ปล่อยข้อมูลที่ผิดเข้าไปทำงานต่อ
    // และส่ง Error กลับไปให้ Client
    return c.json({ error: result.error }, 400);
  }

  // ✅ ถ้ามาถึงตรงนี้ แปลว่า Zod ตรวจแล้วว่าข้อมูลผ่าน
  //
  // result.data = ข้อมูลที่ผ่าน validation แล้ว
  const user = result.data;

  // 📤 ส่งข้อมูลที่ผ่านการตรวจสอบกลับไปให้ Client
  return c.json(user);
});

// 📦 export app เพื่อให้ไฟล์อื่นสามารถนำ Hono app นี้ไปใช้งานได้
export default app;
