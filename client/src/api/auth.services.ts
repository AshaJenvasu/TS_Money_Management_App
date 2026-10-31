import { api } from "./axios";

export interface LoginPayload {
  identifier: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export const authService = {
  // สมัครสมาชิก
  register: async (payload: RegisterPayload) => {
    const response = await api.post("/auth/register", payload);
    return response.data;
  },

  // เข้าสู่ระบบ (ส่ง rememberMe ไปด้วย)
  login: async (payload: LoginPayload) => {
    const response = await api.post("/auth/login", payload);
    return response.data;
  },

  // ตรวจสอบสถานะล็อกอินตอนเปิดเว็บ/รีเฟรชหน้า
  getProfile: async () => {
    const response = await api.get("users/me");
    return response.data;
  },

  // ออกจากระบบ
  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },

  // ขอลิงก์รีเซ็ตรหัสผ่านทางอีเมล
  forgotPassword: async (
    payload: ForgotPasswordPayload,
  ): Promise<{ message: string }> => {
    const response = await api.post("/auth/forgot-password", payload);
    return response.data;
  },

  // ตั้งรหัสผ่านใหม่ด้วย token จากอีเมล
  resetPassword: async (
    payload: ResetPasswordPayload,
  ): Promise<{ message: string }> => {
    const response = await api.post("/auth/reset-password", payload);
    return response.data;
  },
};
