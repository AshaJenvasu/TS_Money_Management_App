import { prisma } from "../config/prisma";
import { Prisma } from "@prisma/client";
import { PortfolioTransactionType } from "@prisma/client";

export class PortfolioRepository {
  // สร้าง Portfolio ของ User
  static async createPortfolio(tx: Prisma.TransactionClient, userId: bigint) {
    return await tx.portfolio.create({
      data: {
        userId,
      },
    });
  }
  // ค้นหา Portfolio ของ User พร้อม JOIN holdings และ asset
  static async findByUserId(userId: bigint) {
    return await prisma.portfolio.findUnique({
      where: { userId },
      include: {
        holdings: {
          include: {
            asset: true,
          },
        },
      },
    });
  }

  // ค้นหา Asset ที่เป็นของผู้ใช้ผ่าน Transaction Client
  static async findAssetByIdAndUserId(
    tx: Prisma.TransactionClient,
    assetId: bigint,
    userId: bigint,
  ) {
    return await tx.asset.findFirst({
      where: {
        id: assetId,
        userId,
      },
    });
  }

  // ค้นหา Holding ของ Asset ภายใน Portfolio ผ่าน Transaction Client
  static async findHoldingByPortfolioAndAsset(
    tx: Prisma.TransactionClient,
    portfolioId: bigint,
    assetId: bigint,
  ) {
    return await tx.assetHolding.findUnique({
      where: {
        portfolioId_assetId: {
          portfolioId,
          assetId,
        },
      },
    });
  }

  // บันทึกประวัติซื้อขายสินทรัพย์ภายใน Transaction Client
  static async createPortfolioTransaction(
    tx: Prisma.TransactionClient,
    data: {
      portfolioId: bigint;
      assetId: bigint;
      transactionType: PortfolioTransactionType;
      quantity: Prisma.Decimal;
      pricePerUnit: Prisma.Decimal;
      transactionDate: Date;
    },
  ) {
    return await tx.portfolioTransaction.create({
      data: {
        portfolioId: data.portfolioId,
        assetId: data.assetId,
        transactionType: data.transactionType,
        quantity: data.quantity,
        pricePerUnit: data.pricePerUnit,
        transactionDate: data.transactionDate,
      },
    });
  }

  // สร้าง Holding ใหม่หรืออัปเดตยอดถือครองเดิมภายใน Transaction
  static async upsertHolding(
    tx: Prisma.TransactionClient,
    data: {
      portfolioId: bigint;
      assetId: bigint;
      quantity: Prisma.Decimal;
      avgCostPerUnit: Prisma.Decimal;
    },
  ) {
    return await tx.assetHolding.upsert({
      where: {
        portfolioId_assetId: {
          portfolioId: data.portfolioId,
          assetId: data.assetId,
        },
      },
      create: {
        portfolioId: data.portfolioId,
        assetId: data.assetId,
        quantity: data.quantity,
        avgCostPerUnit: data.avgCostPerUnit,
      },
      update: {
        quantity: data.quantity,
        avgCostPerUnit: data.avgCostPerUnit,
      },
    });
  }

  // ค้นหา Portfolio ของผู้ใช้ภายใน Database Transaction
  static async findPortfolioByUserId(
    tx: Prisma.TransactionClient,
    userId: bigint,
  ) {
    return await tx.portfolio.findUnique({
      where: { userId },
    });
  }

  // ค้นหารายการซื้อขายด้วย Transaction ID และ Asset ID
  static async findTransactionById(
    tx: Prisma.TransactionClient,
    transactionId: bigint,
    assetId: bigint,
  ) {
    return await tx.portfolioTransaction.findFirst({
      where: {
        id: transactionId,
        assetId,
      },
    });
  }

  // โหลดประวัติซื้อขายทั้งหมด เรียงตามวันที่และ ID เพื่อให้ลำดับแน่นอน
  static async findTransactionsByAssetId(
    tx: Prisma.TransactionClient,
    portfolioId: bigint,
    assetId: bigint,
  ) {
    return await tx.portfolioTransaction.findMany({
      where: {
        portfolioId,
        assetId,
      },
      orderBy: [{ transactionDate: "asc" }, { id: "asc" }],
    });
  }

  // แก้ไขข้อมูลธุรกรรมเดิมภายใน Transaction
  static async updatePortfolioTransaction(
    tx: Prisma.TransactionClient,
    transactionId: bigint,
    data: {
      transactionType?: PortfolioTransactionType;
      quantity?: Prisma.Decimal;
      pricePerUnit?: Prisma.Decimal;
      transactionDate?: Date;
    },
  ) {
    return await tx.portfolioTransaction.update({
      where: { id: transactionId },
      data,
    });
  }

  // ลบประวัติธุรกรรมภายใน Database Transaction
  static async deletePortfolioTransaction(
    tx: Prisma.TransactionClient,
    transactionId: bigint,
  ) {
    return await tx.portfolioTransaction.delete({
      where: { id: transactionId },
    });
  }
}
