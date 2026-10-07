import { PrismaClient, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

// Type Helper สำหรับ Best Practice รองรับทั้ง Prisma Standard Client และ Transaction Client
export type DbClient = PrismaClient | Prisma.TransactionClient;

export class TransactionRepository {
  //ตรวจสอบว่า Wallet นี้เป็นของ User คนนี้จริงหรือไม่
  static async findWalletByIdAndUserId(
    walletId: bigint,
    userId: bigint,
    db: DbClient = prisma,
  ) {
    return await db.wallet.findFirst({
      where: {
        id: walletId,
        userId,
      },
    });
  }

  // ดึงรายการ Transaction ทั้งหมดใน Wallet
  static async findManyByWalletId(walletId: bigint, db: DbClient = prisma) {
    return await db.transaction.findMany({
      where: {
        walletId,
      },
      orderBy: {
        transactionDate: "desc",
      },
    });
  }

  //ค้นหา Transaction เจาะจงด้วย Transaction ID และ Wallet ID
  static async findByIdAndWalletId(
    id: bigint,
    walletId: bigint,
    db: DbClient = prisma,
  ) {
    return await db.transaction.findFirst({
      where: {
        id,
        walletId,
      },
    });
  }

  //สร้าง Transaction ใหม่
  static async create(
    data: Prisma.TransactionUncheckedCreateInput,
    db: DbClient = prisma,
  ) {
    return await db.transaction.create({
      data,
    });
  }

  //อัปเดต Transaction
  static async update(
    id: bigint,
    data: Prisma.TransactionUncheckedUpdateInput,
    db: DbClient = prisma,
  ) {
    return await db.transaction.update({
      where: {
        id,
      },
      data,
    });
  }

  //ลบ Transaction
  static async delete(id: bigint, db: DbClient = prisma) {
    return await db.transaction.delete({
      where: {
        id,
      },
    });
  }
}
