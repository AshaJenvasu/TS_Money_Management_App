import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  user: { id: string; email: string } | null;
  setAuth: (token: string, user: { id: string; email: string }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // 1. ค่าเริ่มต้นตอนยังไม่ได้ล็อกอิน
      token: null,
      user: null,

      // 2. ฟังก์ชันเมื่อล็อกอินสำเร็จ: เอา token กับ user มาเก็บในตู้เซฟ
      setAuth: (token, user) => set({ token, user }),

      // 3. ฟังก์ชันเมื่อกด Logout: ล้างค่าในตู้เซฟกลับเป็น null
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: "auth-storage", // บันทึก Token ลง localStorage ให้อัตโนมัติ
    },
  ),
);
