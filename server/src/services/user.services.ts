import { UserRepository } from "../repositories/user.repository.js";
import bcrypt from "bcryptjs";

export class UserService {
  // อัปเดต Username ของ User พร้อมเช็คว่าซ้ำกับคนอื่นหรือไม่ก่อนเขียนลง DB
  static async updateUsername(userId: bigint, newUsername: string) {
    // เช็คว่ามีคนอื่นใช้ username นี้อยู่แล้วหรือยัง (ไม่นับตัวเอง)
    const existing = await UserRepository.findByUsername(newUsername);
    if (existing && existing.id !== userId) {
      throw new Error("USERNAME_TAKEN");
    }

    try {
      return await UserRepository.updateUsername(userId, newUsername);
    } catch (error: any) {
      // กันเคส race condition: อีกคนเพิ่งจอง username นี้ไปพอดีหลังจากเช็คผ่านแล้ว
      // Prisma โยน error code P2002 ตอนชน unique constraint ที่ DB โดยตรง
      if (error.code === "P2002") {
        throw new Error("USERNAME_TAKEN");
      }
      throw error;
    }
  }
  // อัปเดต Email ของ User พร้อมเช็ค current password และเช็คว่า email ซ้ำกับคนอื่นหรือไม่ก่อนเขียนลง DB
  static async updateEmail(
    userId: bigint,
    newEmail: string,
    currentPassword: string,
  ) {
    // ดึงข้อมูล User ปัจจุบันมาใช้เช็ค password hash
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }
    // ยืนยันตัวตนด้วย current password ก่อนอนุญาตให้เปลี่ยน email
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new Error("INVALID_PASSWORD");
    }

    // เช็คว่ามีคนอื่นใช้ email นี้อยู่แล้วหรือยัง (ไม่นับตัวเอง)
    const existing = await UserRepository.findByEmail(newEmail);
    if (existing && existing.id !== userId) {
      throw new Error("EMAIL_TAKEN");
    }

    try {
      return await UserRepository.updateEmail(userId, newEmail);
    } catch (error: any) {
      // กันเคส race condition เหมือนตอน updateUsername
      if (error.code === "P2002") {
        throw new Error("EMAIL_TAKEN");
      }
      throw error;
    }
  }
}
