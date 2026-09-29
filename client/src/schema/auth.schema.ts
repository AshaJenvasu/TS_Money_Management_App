import { z } from "zod";

// Regex สำหรับเช็ก Username ภาษาอังกฤษ ตัวเลข และ underscore/dash เท่านั้น (3-20 ตัวอักษร)
const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;

// 1. Schema สำหรับ LoginForm
export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "กรุณากรอก Email หรือ Username นะจ้ะ")
    .refine(
      (val) => {
        // เช็กว่าเป็น Email ที่ถูกต้อง หรือ เป็น Username ภาษาอังกฤษ/ตัวเลขที่ถูกต้อง
        const isEmail = z.string().email().safeParse(val).success;
        const isUsername = usernameRegex.test(val);
        return isEmail || isUsername;
      },
      {
        message:
          "กรุณากรอก Email ที่ถูกต้อง หรือ Username (ภาษาอังกฤษ/ตัวเลข 3-20 ตัวอักษร)",
      },
    ),
  password: z
    .string()
    .min(8, "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษรนะจ้ะ")
    .regex(/[A-Z]/, "รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัวนะจ้ะ")
    .regex(/[a-z]/, "รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัวนะจ้ะ")
    .regex(/[0-9]/, "รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัวนะจ้ะ")
    .regex(/[^A-Za-z0-9]/, "รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัวนะจ้ะ"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// 2. Schema สำหรับ RegisterForm
export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username ต้องมีอย่างน้อย 3 ตัวอักษรนะจ้ะ")
      .max(20, "Username ต้องไม่เกิน 20 ตัวอักษรนะจ้ะ")
      .regex(
        usernameRegex,
        "Username ต้องเป็นภาษาอังกฤษ ตัวเลข หรือเครื่องหมาย _ และ - เท่านั้นนะจ้ะ",
      ),
    email: z
      .string()
      .min(1, "กรุณากรอก Email นะจ้ะ")
      .email("รูปแบบ Email ไม่ถูกต้องนะจ้ะ"),
    password: z
      .string()
      .min(8, "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษรนะจ้ะ")
      .regex(/[A-Z]/, "รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัวนะจ้ะ")
      .regex(/[a-z]/, "รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัวนะจ้ะ")
      .regex(/[0-9]/, "รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัวนะจ้ะ")
      .regex(/[^A-Za-z0-9]/, "รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัวนะจ้ะ"),
    confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่านนะจ้ะ"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกันนะจ้ะ",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
