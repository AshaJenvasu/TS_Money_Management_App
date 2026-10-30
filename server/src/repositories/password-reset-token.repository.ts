import { prisma, type DbClient } from "../config/prisma.js";

export class PasswordResetTokenRepository {
  // สร้างแถว reset token ใหม่ลง Database
  static async create(
    data: {
      userId: bigint;
      tokenHash: string;
      expiresAt: Date;
    },
    db: DbClient = prisma,
  ) {
    return await db.passwordResetToken.create({
      data,
    });
  }

  // ค้นหา token จาก hash คืนแถวดิบๆมาเลย ไม่เช็คหมดอายุ/ใช้แล้วหรือยัง ให้ Service เป็นคนตัดสินใจเรื่อง business rule
  static async findByTokenHash(tokenHash: string, db: DbClient = prisma) {
    return await db.passwordResetToken.findUnique({
      where: { tokenHash },
    });
  }

  // Mark ว่า token นี้ถูกใช้ไปแล้ว กันเอาไป reset ซ้ำได้อีก (replay attack)
  static async markAsUsed(id: bigint, db: DbClient = prisma) {
    return await db.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  // นับจำนวนคำขอ reset password ของ user คนนี้ ภายในช่วงเวลาที่กำหนด ใช้ทำ rate limit
  static async countRecentByUserId(
    userId: bigint,
    since: Date,
    db: DbClient = prisma,
  ) {
    return await db.passwordResetToken.count({
      where: {
        userId,
        createdAt: { gte: since },
      },
    });
  }
}
