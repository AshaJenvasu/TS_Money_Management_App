import { prisma } from "../config/prisma";
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
  }) {
    return await prisma.asset.create({
      data,
    });
  }

  /**
   * อัปเดต Asset ตาม ID
   */
  static async update(id: bigint, data: { name: string }) {
    return await prisma.asset.update({
      where: { id },
      data,
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
