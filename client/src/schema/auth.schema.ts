import { z } from "zod";

// 1. Schema สำหรับ LoginForm (รับ identifier และ password)
export const loginSchema = z.object({
  identifier: z.string().min(1, "กรุณากรอก Email หรือ Username นะจ้ะ"),
  password: z.string().min(6, "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษรนะจ้ะ"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// 2. Schema สำหรับ RegisterForm
export const registerSchema = z
  .object({
    username: z.string().min(3, "Username ต้องมีอย่างน้อย 3 ตัวอักษรนะจ้ะ"),
    email: z.string().email("รูปแบบ Email ไม่ถูกต้องนะจ้ะ"),
    password: z
      .string()
      .min(6, "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษรนะจ้ะ"),
    confirmPassword: z.string().min(6, "กรุณายืนยันรหัสผ่านนะจ้ะ"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกันนะจ้ะ",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
