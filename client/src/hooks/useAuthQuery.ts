import { useMutation } from "@tanstack/react-query";
import {
  authService,
  type ForgotPasswordPayload,
  type ResetPasswordPayload,
} from "../api/auth.services";

// ขอลิงก์รีเซ็ตรหัสผ่าน — ไม่ sync cache/Zustand ไหนเลย เพราะ user ยังไม่ login และ response ไม่มีข้อมูล user กลับมา
export const useForgotPasswordMutation = () => {
  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) =>
      authService.forgotPassword(payload),
  });
};

// ตั้งรหัสผ่านใหม่ด้วย token จากอีเมล — เช่นเดียวกัน ไม่ sync cache/Zustand เพราะไม่ auto-login
export const useResetPasswordMutation = () => {
  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) =>
      authService.resetPassword(payload),
  });
};
