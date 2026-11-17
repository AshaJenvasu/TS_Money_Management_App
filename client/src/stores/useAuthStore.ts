import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id?: string;
  email?: string;
  username?: string;
}

interface AuthState {
  user: User | null;
  setAuth: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
}

// เวอร์ชัน 0 เก็บ JWT (token) ไว้ใน localStorage ด้วย ซึ่ง XSS อ่านได้และทำให้ cookie httpOnly ไร้ผล
// session จริงอยู่ใน cookie ที่ server ตั้งให้ (client ไม่เคยแนบ token เอง) จึงทิ้ง token ของเดิมตอน migrate จากเวอร์ชัน 0 (เหลือเฉพาะ user)
export const AUTH_STORE_VERSION = 1;

export function migrateAuthState(persisted: unknown): { user: User | null } {
  const user =
    typeof persisted === "object" && persisted !== null && "user" in persisted
      ? ((persisted as { user: User | null }).user ?? null)
      : null;
  return { user };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      // user ที่ไม่ใช่ null = "เคย login แล้ว" ใช้ตัดสินใจฝั่ง UI เท่านั้น ความจริงของ session อยู่ที่ cookie และ server เป็นคนตรวจ
      setAuth: (user) => set({ user }),
      // อัปเดตเฉพาะข้อมูล user บางส่วน (เช่น username/email)
      updateUser: (updates) => set({ user: { ...get().user, ...updates } }),
      logout: () => set({ user: null }),
    }),
    {
      name: "auth-storage", // ชื่อ key ใน LocalStorage
      version: AUTH_STORE_VERSION,
      migrate: (persisted) => migrateAuthState(persisted),
      // เก็บเฉพาะ user (ไม่ sensitive) ไม่เก็บ function หรือข้อมูลอื่นลง localStorage
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
