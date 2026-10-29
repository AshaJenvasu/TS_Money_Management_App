import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id?: string;
  email?: string;
  username?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      // อัปเดตเฉพาะข้อมูล user บางส่วน (เช่น username/email) โดยไม่แตะ token เลย
      updateUser: (updates) => set({ user: { ...get().user, ...updates } }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: "auth-storage", // ชื่อ key ใน LocalStorage
    },
  ),
);
