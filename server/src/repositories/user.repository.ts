import { prisma, type DbClient } from "../config/prisma.js";
import { Prisma } from "@prisma/client";

export class UserRepository {
  // ค้นหา User จาก Email หรือ Username
  static async findByEmailOrUsername(email: string, username: string) {
    return await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });
  }

  static async findByUsername(username: string, db: DbClient = prisma) {
    return await db.user.findUnique({
      where: { username },
    });
  }

  // ตรวจสอบว่ามี Email นี้ถูกใช้โดยคนอื่นอยู่แล้วหรือไม่ (ใช้ตอนเปลี่ยน email)
  static async findByEmail(email: string, db: DbClient = prisma) {
    return await db.user.findUnique({
      where: { email },
    });
  }

  // ค้นหา User จาก id สำหรับดึงข้อมูลโปรไฟล์ล่าสุด (ใช้ตอน /users/me, update, delete)
  static async findById(id: bigint, db: DbClient = prisma) {
    return await db.user.findUnique({
      where: { id },
    });
  }
  // ค้นหา User จาก Identifier (Email หรือ Username) สำหรับ Login
  static async findByIdentifier(identifier: string) {
    return await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });
  }

  // สร้าง User ใหม่ลง Database
  static async createUser(
    tx: Prisma.TransactionClient,
    data: {
      email: string;
      username: string;
      passwordHash: string;
    },
  ) {
    return await tx.user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash: data.passwordHash,
      },
    });
  }

  // อัปเดต Username ของ User
  static async updateUsername(
    id: bigint,
    username: string,
    db: DbClient = prisma,
  ) {
    return await db.user.update({
      where: { id },
      data: { username },
    });
  }

  // อัปเดต Email ของ User
  static async updateEmail(id: bigint, email: string, db: DbClient = prisma) {
    return await db.user.update({
      where: { id },
      data: { email },
    });
  }

  // อัปเดต Password Hash ของ User
  static async updatePasswordHash(
    id: bigint,
    passwordHash: string,
    db: DbClient = prisma,
  ) {
    return await db.user.update({
      where: { id },
      data: {
        passwordHash,
        // เปลี่ยน password ครั้งนี้ ไม่ว่าจะมาจากทางไหน (เปลี่ยนปกติ หรือ reset ด้วย token) ก็ถือว่า session เก่าต้องถูก invalidate เสมอ
        passwordChangedAt: new Date(),
      },
    });
  }

  // ลบ User ออกจาก Database — Cascade ที่ตั้งไว้ใน schema จะลบ wallet/transaction/portfolio/asset ที่พ่วงกันให้อัตโนมัติ
  static async deleteUser(id: bigint, db: DbClient = prisma) {
    return await db.user.delete({
      where: { id },
    });
  }

  // ดึงแค่ passwordChangedAt ของ user (ไม่ดึง passwordHash ทั้งก้อน) ใช้เฉพาะใน authMiddleware ที่ query ทุก request
  static async findPasswordChangedAtById(id: bigint, db: DbClient = prisma) {
    return await db.user.findUnique({
      where: { id },
      select: { passwordChangedAt: true },
    });
  }
}
