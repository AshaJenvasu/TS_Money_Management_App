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
    const response = await api.get("/auth/me");
    return response.data;
  },

  // ออกจากระบบ
  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },
};
