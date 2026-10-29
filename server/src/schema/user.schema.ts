import { z } from "@hono/zod-openapi";

// 1. นิยาม Zod Schema สำหรับ Request Params (รับ id จาก path)
export const UserParamsSchema = z.object({
  id: z.string().openapi({
    param: {
      name: "id",
      in: "path",
    },
    example: "usr_123",
  }),
});

// 2. นิยาม Zod Schema สำหรับ Response
export const UserResponseSchema = z.object({
  id: z.string().openapi({
    example: "usr_123",
  }),
  name: z.string().openapi({
    example: "John Doe",
  }),
  age: z.number().openapi({
    example: 25,
  }),
});

// 3. นิยาม Zod Schema สำหรับ Body ตอนเปลี่ยน Username ของตัวเอง
export const UpdateUsernameBodySchema = z.object({
  username: z
    .string()
    .min(3, "Username ต้องมีอย่างน้อย 3 ตัวอักษร")
    .max(20, "Username ต้องไม่เกิน 20 ตัวอักษร")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username ใช้ได้แค่ตัวอักษรอังกฤษ ตัวเลข และเครื่องหมาย _ กับ -",
    )
    .openapi({ example: "new_username" }),
});

// นิยาม Zod Schema สำหรับ Body ตอนเปลี่ยน Email ของตัวเอง ต้องแนบ current password มายืนยันด้วย
export const UpdateEmailBodySchema = z.object({
  email: z.string().email("รูปแบบ Email ไม่ถูกต้อง").openapi({
    example: "new_email@example.com",
  }),
  currentPassword: z
    .string()
    .min(1, "กรุณากรอกรหัสผ่านปัจจุบัน")
    .openapi({ example: "password123" }),
});

// นิยาม Zod Schema สำหรับ Body ตอนเปลี่ยน Password ของตัวเอง — newPassword ใช้กฎความแข็งแรงเดียวกับตอน Register ฝั่ง client
export const UpdatePasswordBodySchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "กรุณากรอกรหัสผ่านปัจจุบัน")
      .openapi({ example: "oldPassword123!" }),
    newPassword: z
      .string()
      .min(8, "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร")
      .regex(/[A-Z]/, "รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว")
      .regex(/[a-z]/, "รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว")
      .regex(/[0-9]/, "รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว")
      .regex(/[^A-Za-z0-9]/, "รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว")
      .openapi({ example: "newPassword456!" }),
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม",
    path: ["newPassword"],
  });

// นิยาม Zod Schema สำหรับ Body ตอนลบบัญชีตัวเอง — ขอ current password ยืนยันเท่านั้น
// (การพิมพ์ username ซ้ำเป็น UX friction ฝั่ง frontend อย่างเดียว ไม่ส่งมา validate ที่นี่)
export const DeleteAccountBodySchema = z.object({
  currentPassword: z
    .string()
    .min(1, "กรุณากรอกรหัสผ่านปัจจุบัน")
    .openapi({ example: "password123" }),
});
