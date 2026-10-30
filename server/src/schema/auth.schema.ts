import { createRoute, z } from "@hono/zod-openapi";

// ==========================================
// 1. Register Schemas & Route
// ==========================================
export const RegisterBodySchema = z.object({
  email: z.string().email().openapi({ example: "user@example.com" }),
  username: z.string().min(1).openapi({ example: "johndoe" }),
  password: z.string().min(6).openapi({ example: "password123" }),
});

export const RegisterResponseSchema = z.object({
  id: z.string().openapi({ example: "1" }),
  email: z.string().email().openapi({ example: "user@example.com" }),
  username: z.string().openapi({ example: "johndoe" }),
});

// ==========================================
// 2. Login Schemas & Route
// ==========================================
export const LoginBodySchema = z.object({
  identifier: z.string().openapi({ example: "user@example.com" }),

  password: z.string().min(6).openapi({
    example: "password123",
  }),

  rememberMe: z.boolean().openapi({
    example: true,
  }),
});

export const LoginResponseSchema = z.object({
  message: z.string(),
  token: z.string(),
  user: z.object({
    id: z.union([z.string(), z.number()]),
    username: z.string(),
    email: z.string(),
  }),
});

// ==========================================
// 3. Get Profile Schemas & Route
// ==========================================

export const userProfileResponseSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email(),
});

// ==========================================
// 4. Change Password Schemas & Route
// ==========================================

// กฎความแข็งแรงของ password แบบ reusable เพราะใช้ซ้ำทั้งที่นี่และ UpdatePasswordBodySchema ใน user.schema.ts
export const strongPasswordSchema = z
  .string()
  .min(8, "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร")
  .regex(/[A-Z]/, "รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว")
  .regex(/[a-z]/, "รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว")
  .regex(/[0-9]/, "รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว")
  .regex(/[^A-Za-z0-9]/, "รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว");

// นิยาม Zod Schema สำหรับ Body ตอนขอ reset password link
export const ForgotPasswordBodySchema = z.object({
  email: z.string().email("รูปแบบ Email ไม่ถูกต้อง").openapi({
    example: "user@example.com",
  }),
});

// นิยาม Zod Schema สำหรับ Body ตอนตั้ง password ใหม่ด้วย reset token
export const ResetPasswordBodySchema = z.object({
  token: z.string().min(1, "Token ไม่ถูกต้อง").openapi({
    example: "a1b2c3d4e5f6...",
  }),
  newPassword: strongPasswordSchema.openapi({ example: "NewPassword456!" }),
});
