import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "../api/auth.services";
import {
  userService,
  type UpdateUsernamePayload,
  type UpdateEmailPayload,
  type UpdatePasswordPayload,
  type DeleteAccountPayload,
} from "../services/user.services";
import { useAuthStore } from "../stores/useAuthStore";

// ดึงข้อมูลโปรไฟล์ล่าสุด (username/email) ใช้แสดงผลในหน้า Settings
export const useProfileQuery = () => {
  return useQuery({
    queryKey: ["users", "me"],
    queryFn: authService.getProfile,
  });
};

// เปลี่ยน Username พร้อม sync เข้า React Query cache และ Zustand store
export const useUpdateUsernameMutation = () => {
  const queryClient = useQueryClient();
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: (payload: UpdateUsernamePayload) =>
      userService.updateUsername(payload),
    onSuccess: async (updatedUser) => {
      // รีเฟรช cache ให้หน้า Settings เห็นค่าล่าสุด
      await queryClient.invalidateQueries({ queryKey: ["users", "me"] });
      // sync เข้า Zustand ด้วย ให้ navbar/dashboard เห็นชื่อใหม่ทันทีไม่ต้อง logout
      updateUser(updatedUser);
    },
  });
};

// เปลี่ยน Email พร้อม sync เข้า React Query cache และ Zustand store
export const useUpdateEmailMutation = () => {
  const queryClient = useQueryClient();
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: (payload: UpdateEmailPayload) =>
      userService.updateEmail(payload),
    onSuccess: async (updatedUser) => {
      await queryClient.invalidateQueries({ queryKey: ["users", "me"] });
      updateUser(updatedUser);
    },
  });
};

// เปลี่ยน Password — ไม่ต้อง sync ที่ไหนเพิ่ม เพราะ response ไม่มีข้อมูล user กลับมาเลย
export const useUpdatePasswordMutation = () => {
  return useMutation({
    mutationFn: (payload: UpdatePasswordPayload) =>
      userService.updatePassword(payload),
  });
};

// ลบบัญชี — เคลียร์ Zustand store ด้วยหลังสำเร็จ ให้ตรงกับความจริงที่ backend ลบไปแล้ว
export const useDeleteAccountMutation = () => {
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: (payload: DeleteAccountPayload) =>
      userService.deleteAccount(payload),
    onSuccess: () => {
      logout();
    },
  });
};
