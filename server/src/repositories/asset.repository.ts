import { prisma } from "../config/prisma.js";
import { AssetType } from "@prisma/client";

export class AssetRepository {
  /**
   * ค้นหา Assets ทั้งหมดของผู้ใช้
   */
  static async findByUserId(userId: bigint) {
    return await prisma.asset.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * ค้นหา Asset ตาม ID และ UserId
   */
  static async findByIdAndUserId(id: bigint, userId: bigint) {
    return await prisma.asset.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        holdings: true, // include holding เพื่อเอาไปเช็กเงื่อนไขใน Service Layer
      },
    });
  }

  /**
   * สร้าง Asset ใหม่
   */
  static async create(data: {
    userId: bigint;
    name: string;
    symbol: string;
    assetType: AssetType;
    coingeckoId?: string | null;
  }) {
    return await prisma.asset.create({
      data,
    });
  }

  /**
   * แก้ชื่อ Asset แบบ atomic: หา asset (id + userId) → นับ transaction → update ใน $transaction เดียวกัน
   * ล็อกแถว asset ด้วย FOR UPDATE ก่อนนับ เพื่อกัน race ที่มีคนเพิ่ม transaction ให้ asset นี้ระหว่าง check กับ update
   * (insert transaction ต้องถือ lock FOR KEY SHARE บนแถว asset จึงถูกบล็อกจนกว่า transaction นี้จบ)
   */
  static async updateNameIfNoTransactions(
    id: bigint,
    userId: bigint,
    data: { name: string },
  ) {
    return await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<{ id: bigint }[]>`
        SELECT id FROM assets WHERE id = ${id} AND user_id = ${userId} FOR UPDATE
      `;
      if (locked.length === 0) {
        return { status: "not_found" } as const;
      }

      const transactionCount = await tx.portfolioTransaction.count({
        where: { assetId: id },
      });
      if (transactionCount > 0) {
        return { status: "has_transactions" } as const;
      }

      // userId ใน where เป็นชั้นป้องกันสุดท้าย ถ้าไม่ตรงจะ throw P2025
      const asset = await tx.asset.update({
        where: { id, userId },
        data,
      });
      return { status: "updated", asset } as const;
    });
  }

  /**
   * ลบ Asset ตาม ID (Prisma Schema จะสั่ง Cascade ลบ Holding + Transaction ให้อัตโนมัติ)
   */
  static async delete(id: bigint) {
    return await prisma.$transaction(async (tx) => {
      // 1. ลบ Holdings ที่เกี่ยวข้อง
      await tx.assetHolding.deleteMany({
        where: { assetId: id },
      });

      // 2. ลบ Portfolio Transactions ที่เกี่ยวข้อง
      await tx.portfolioTransaction.deleteMany({
        where: { assetId: id },
      });

      // 3. ลบตัว Asset เอง
      return await tx.asset.delete({
        where: { id },
      });
    });
  }

  /**
   * ดึงข้อมูล AssetHolding ของ Asset นี้
   */
  static async findHoldingByAssetId(assetId: bigint) {
    return await prisma.assetHolding.findFirst({
      where: { assetId },
    });
  }
}
