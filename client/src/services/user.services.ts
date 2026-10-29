import { api } from "../api/axios";

// รูปแบบข้อมูลโปรไฟล์ที่ backend ส่งกลับ ใช้ร่วมกับ response ของเปลี่ยน username/email
export interface UserProfile {
  id: string;
  username: string;
  email: string;
}

export interface UpdateUsernamePayload {
  username: string;
}

export interface UpdateEmailPayload {
  email: string;
  currentPassword: string;
}

export interface UpdatePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface DeleteAccountPayload {
  currentPassword: string;
}

export const userService = {
  // เปลี่ยน Username ของตัวเอง
  updateUsername: async (
    payload: UpdateUsernamePayload,
  ): Promise<UserProfile> => {
    const response = await api.put<UserProfile>("/users/me/username", payload);
    return response.data;
  },

  // เปลี่ยน Email ของตัวเอง ต้องแนบ current password ยืนยันด้วย
  updateEmail: async (payload: UpdateEmailPayload): Promise<UserProfile> => {
    const response = await api.put<UserProfile>("/users/me/email", payload);
    return response.data;
  },

  // เปลี่ยน Password ของตัวเอง
  updatePassword: async (
    payload: UpdatePasswordPayload,
  ): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>(
      "/users/me/password",
      payload,
    );
    return response.data;
  },

  // ลบบัญชีตัวเองถาวร ย้อนกลับไม่ได้
  deleteAccount: async (
    payload: DeleteAccountPayload,
  ): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>("/users/me", {
      data: payload,
    });
    return response.data;
  },
};
