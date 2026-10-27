import { PrismaClient, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

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

  // สร้างเงื่อนไขกรองช่วงวันที่ ใช้ร่วมกันทั้ง findMany และ count กันเขียนซ้ำ
  private static buildDateRangeWhere(fromDate?: Date, toDateExclusive?: Date) {
    if (!fromDate && !toDateExclusive) return {};
    return {
      transactionDate: {
        ...(fromDate && { gte: fromDate }),
        ...(toDateExclusive && { lt: toDateExclusive }),
      },
    };
  }

  // ดึงรายการ Transaction ทั้งหมดใน Wallet
  static async findManyByWalletId(
    walletId: bigint,
    options: {
      fromDate?: Date;
      toDateExclusive?: Date;
      skip?: number;
      take?: number;
    } = {},
    db: DbClient = prisma,
  ) {
    return await db.transaction.findMany({
      where: {
        walletId,
        ...this.buildDateRangeWhere(options.fromDate, options.toDateExclusive),
      },
      orderBy: { transactionDate: "desc" },
      skip: options.skip,
      take: options.take,
    });
  }

  // นับจำนวน Transaction ใน Wallet ตามช่วงวันที่ (optional) สำหรับ pagination
  static async countByWalletId(
    walletId: bigint,
    options: { fromDate?: Date; toDateExclusive?: Date } = {},
    db: DbClient = prisma,
  ) {
    return await db.transaction.count({
      where: {
        walletId,
        ...this.buildDateRangeWhere(options.fromDate, options.toDateExclusive),
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

  // ดึง Transaction ล่าสุดจากทุก Wallet ของ User พร้อม Pagination
  static async findManyByUserId(
    userId: bigint,
    skip: number,
    take: number,
    db: DbClient = prisma,
  ) {
    return await db.transaction.findMany({
      where: {
        wallet: {
          userId,
        },
      },
      orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
      skip,
      take,
    });
  }

  // นับจำนวน Transaction ทั้งหมดของ User จากทุก Wallet
  static async countByUserId(userId: bigint, db: DbClient = prisma) {
    return await db.transaction.count({
      where: {
        wallet: {
          userId,
        },
      },
    });
  }
}
