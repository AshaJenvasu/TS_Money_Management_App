import { prisma } from "../config/prisma";
import { Prisma, PortfolioTransactionType } from "@prisma/client";
import { PortfolioRepository } from "../repositories/portfolio.repository";

interface CreatePortfolioTransactionInput {
  userId: bigint;
  assetId: bigint;
  transaction_type: "buy" | "sell";
  quantity: string;
  price_per_unit: string;
  transaction_date: string;
}

// กำหนดข้อมูลที่อนุญาตให้แก้ไขธุรกรรม โดยทุก Field เป็น Optional
interface UpdatePortfolioTransactionInput {
  userId: bigint;
  assetId: bigint;
  transactionId: bigint;
  transaction_type?: "buy" | "sell";
  quantity?: string;
  price_per_unit?: string;
  transaction_date?: string;
}

// กำหนดข้อมูลที่จำเป็นสำหรับลบธุรกรรม
interface DeletePortfolioTransactionInput {
  userId: bigint;
  assetId: bigint;
  transactionId: bigint;
}

export class PortfolioService {
  static async getPortfolio(userId: bigint) {
    const portfolio = await PortfolioRepository.findByUserId(userId);

    if (!portfolio) {
      throw new Error("PORTFOLIO_NOT_FOUND");
    }

    return {
      id: portfolio.id.toString(),
      userId: portfolio.userId.toString(),
      holdings: portfolio.holdings.map((holding) => ({
        id: holding.id.toString(),
        portfolioId: holding.portfolioId.toString(),
        assetId: holding.assetId.toString(),
        quantity: holding.quantity.toString(),
        avgCostPerUnit: holding.avgCostPerUnit.toString(),
        asset: {
          id: holding.asset.id.toString(),
          name: holding.asset.name,
          symbol: holding.asset.symbol,
          assetType: holding.asset.assetType,
        },
      })),
    };
  }

  // บันทึกธุรกรรมและอัปเดต Holding ให้สำเร็จหรือล้มเหลวพร้อมกัน
  static async createPortfolioTransaction(
    input: CreatePortfolioTransactionInput,
  ) {
    return await prisma.$transaction(
      async (tx) => {
        // ตรวจสอบว่าผู้ใช้มี Portfolio อยู่แล้ว
        const portfolio = await PortfolioRepository.findPortfolioByUserId(
          tx,
          input.userId,
        );

        if (!portfolio) {
          throw new Error("PORTFOLIO_NOT_FOUND");
        }

        // ตรวจสอบว่า Asset เป็นของผู้ใช้ที่เข้าสู่ระบบจริง
        const asset = await PortfolioRepository.findAssetByIdAndUserId(
          tx,
          input.assetId,
          input.userId,
        );

        if (!asset) {
          throw new Error("ASSET_NOT_FOUND");
        }

        // ใช้ Decimal คำนวณจำนวนและราคาเพื่อหลีกเลี่ยงความคลาดเคลื่อนของ Number
        const quantity = new Prisma.Decimal(input.quantity);
        const pricePerUnit = new Prisma.Decimal(input.price_per_unit);

        // อ่านยอดถือครองปัจจุบันของ Asset ใน Portfolio
        const holding =
          await PortfolioRepository.findHoldingByPortfolioAndAsset(
            tx,
            portfolio.id,
            asset.id,
          );

        const currentQuantity = holding
          ? new Prisma.Decimal(holding.quantity)
          : new Prisma.Decimal(0);

        const currentAvgCost = holding
          ? new Prisma.Decimal(holding.avgCostPerUnit)
          : new Prisma.Decimal(0);

        let newQuantity: Prisma.Decimal;
        let newAvgCost: Prisma.Decimal;

        if (input.transaction_type === "buy") {
          // ซื้อเพิ่มแล้วคำนวณต้นทุนเฉลี่ยถ่วงน้ำหนัก
          newQuantity = currentQuantity.plus(quantity);

          const totalCost = currentQuantity
            .mul(currentAvgCost)
            .plus(quantity.mul(pricePerUnit));

          newAvgCost = totalCost
            .div(newQuantity)
            .toDecimalPlaces(8, Prisma.Decimal.ROUND_HALF_UP);
        } else {
          // ป้องกันการขายสินทรัพย์ที่ไม่มีหรือขายเกินยอดถือครอง
          if (!holding || quantity.greaterThan(currentQuantity)) {
            throw new Error("INSUFFICIENT_ASSET_QUANTITY");
          }

          newQuantity = currentQuantity.minus(quantity);

          // ราคาขายไม่เปลี่ยนต้นทุนเฉลี่ยของสินทรัพย์ที่เหลือ
          newAvgCost = newQuantity.isZero()
            ? new Prisma.Decimal(0)
            : currentAvgCost;
        }

        // บันทึกประวัติซื้อขายภายใน Transaction เดียวกัน
        const transaction =
          await PortfolioRepository.createPortfolioTransaction(tx, {
            portfolioId: portfolio.id,
            assetId: asset.id,
            transactionType:
              input.transaction_type === "buy"
                ? PortfolioTransactionType.buy
                : PortfolioTransactionType.sell,
            quantity,
            pricePerUnit,
            transactionDate: new Date(input.transaction_date),
          });

        // เพิ่ม Holding ใหม่หรืออัปเดตยอดเดิม
        const updatedHolding = await PortfolioRepository.upsertHolding(tx, {
          portfolioId: portfolio.id,
          assetId: asset.id,
          quantity: newQuantity,
          avgCostPerUnit: newAvgCost,
        });

        // แปลง BigInt และ Decimal เป็น String เพื่อส่ง JSON ได้
        return {
          transaction: {
            id: transaction.id.toString(),
            portfolioId: transaction.portfolioId.toString(),
            assetId: transaction.assetId.toString(),
            transaction_type: transaction.transactionType,
            quantity: transaction.quantity.toString(),
            price_per_unit: transaction.pricePerUnit.toString(),
            transaction_date: transaction.transactionDate.toISOString(),
          },
          holding: {
            id: updatedHolding.id.toString(),
            assetId: updatedHolding.assetId.toString(),
            quantity: updatedHolding.quantity.toString(),
            avgCostPerUnit: updatedHolding.avgCostPerUnit.toString(),
          },
        };
      },
      {
        // ป้องกันธุรกรรมพร้อมกันที่อาจทำให้ยอดขายเกินจำนวนที่ถืออยู่
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  // แก้ไขธุรกรรมและคำนวณยอดถือครองใหม่ทั้งหมด
  static async updatePortfolioTransaction(
    input: UpdatePortfolioTransactionInput,
  ) {
    return await prisma.$transaction(
      async (tx) => {
        // ตรวจสอบว่า Portfolio ของผู้ใช้มีอยู่จริง
        const portfolio = await PortfolioRepository.findPortfolioByUserId(
          tx,
          input.userId,
        );

        if (!portfolio) {
          throw new Error("PORTFOLIO_NOT_FOUND");
        }

        // ตรวจสอบว่า Asset เป็นของผู้ใช้ที่ Login อยู่
        const asset = await PortfolioRepository.findAssetByIdAndUserId(
          tx,
          input.assetId,
          input.userId,
        );

        if (!asset) {
          throw new Error("ASSET_NOT_FOUND");
        }

        // ตรวจสอบว่าธุรกรรมอยู่ใน Asset และ Portfolio ที่ถูกต้อง
        const existingTransaction =
          await PortfolioRepository.findTransactionById(
            tx,
            input.transactionId,
            input.assetId,
          );

        if (
          !existingTransaction ||
          existingTransaction.portfolioId !== portfolio.id
        ) {
          throw new Error("PORTFOLIO_TRANSACTION_NOT_FOUND");
        }

        // สร้างข้อมูลเฉพาะ Field ที่ผู้ใช้ส่งมาแก้ไข
        const updateData: {
          transactionType?: PortfolioTransactionType;
          quantity?: Prisma.Decimal;
          pricePerUnit?: Prisma.Decimal;
          transactionDate?: Date;
        } = {};

        if (input.transaction_type !== undefined) {
          updateData.transactionType =
            input.transaction_type === "buy"
              ? PortfolioTransactionType.buy
              : PortfolioTransactionType.sell;
        }

        if (input.quantity !== undefined) {
          updateData.quantity = new Prisma.Decimal(input.quantity);
        }

        if (input.price_per_unit !== undefined) {
          updateData.pricePerUnit = new Prisma.Decimal(input.price_per_unit);
        }

        if (input.transaction_date !== undefined) {
          updateData.transactionDate = new Date(input.transaction_date);
        }

        // แก้ไขรายการภายใน Transaction ก่อนคำนวณยอดใหม่
        await PortfolioRepository.updatePortfolioTransaction(
          tx,
          input.transactionId,
          updateData,
        );

        // โหลดประวัติทั้งหมดตามวันที่และ ID หลังแก้ไขแล้ว
        const transactions =
          await PortfolioRepository.findTransactionsByAssetId(
            tx,
            portfolio.id,
            asset.id,
          );

        let totalQuantity = new Prisma.Decimal(0);
        let avgCostPerUnit = new Prisma.Decimal(0);

        // คำนวณยอดถือครองใหม่ตามลำดับประวัติ
        for (const transaction of transactions) {
          const quantity = new Prisma.Decimal(transaction.quantity);
          const price = new Prisma.Decimal(transaction.pricePerUnit);

          if (transaction.transactionType === PortfolioTransactionType.buy) {
            // BUY: คำนวณต้นทุนเฉลี่ยถ่วงน้ำหนัก
            const nextQuantity = totalQuantity.plus(quantity);

            const totalCost = totalQuantity
              .mul(avgCostPerUnit)
              .plus(quantity.mul(price));

            avgCostPerUnit = totalCost
              .div(nextQuantity)
              .toDecimalPlaces(8, Prisma.Decimal.ROUND_HALF_UP);

            totalQuantity = nextQuantity;
          } else {
            // SELL: ปฏิเสธหากขายเกินจำนวนที่ถืออยู่ ณ เวลานั้น
            if (quantity.greaterThan(totalQuantity)) {
              throw new Error("INSUFFICIENT_ASSET_QUANTITY");
            }

            totalQuantity = totalQuantity.minus(quantity);

            // หากขายหมด ให้ต้นทุนเฉลี่ยของยอดคงเหลือเป็นศูนย์
            if (totalQuantity.isZero()) {
              avgCostPerUnit = new Prisma.Decimal(0);
            }
          }
        }

        // บันทึกยอดถือครองที่คำนวณใหม่ภายใน Transaction เดียวกัน
        const updatedHolding = await PortfolioRepository.upsertHolding(tx, {
          portfolioId: portfolio.id,
          assetId: asset.id,
          quantity: totalQuantity,
          avgCostPerUnit,
        });

        // ส่งผลลัพธ์ที่แปลง Decimal และ BigInt เป็น String แล้ว
        return {
          transactionId: input.transactionId.toString(),
          assetId: asset.id.toString(),
          quantity: updatedHolding.quantity.toString(),
          avgCostPerUnit: updatedHolding.avgCostPerUnit.toString(),
        };
      },
      {
        // ให้ธุรกรรมที่ทำงานพร้อมกันรักษาความถูกต้องของข้อมูล
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  // ลบธุรกรรมและคำนวณยอดถือครองใหม่ภายใน Transaction เดียวกัน
  static async deletePortfolioTransaction(
    input: DeletePortfolioTransactionInput,
  ) {
    return await prisma.$transaction(
      async (tx) => {
        // ตรวจสอบว่า Portfolio ของผู้ใช้มีอยู่จริง
        const portfolio = await PortfolioRepository.findPortfolioByUserId(
          tx,
          input.userId,
        );

        if (!portfolio) {
          throw new Error("PORTFOLIO_NOT_FOUND");
        }

        // ตรวจสอบว่า Asset เป็นของผู้ใช้ที่เข้าสู่ระบบ
        const asset = await PortfolioRepository.findAssetByIdAndUserId(
          tx,
          input.assetId,
          input.userId,
        );

        if (!asset) {
          throw new Error("ASSET_NOT_FOUND");
        }

        // ตรวจสอบว่าธุรกรรมอยู่ใน Asset และ Portfolio ของผู้ใช้
        const transaction = await PortfolioRepository.findTransactionById(
          tx,
          input.transactionId,
          input.assetId,
        );

        if (!transaction || transaction.portfolioId !== portfolio.id) {
          throw new Error("PORTFOLIO_TRANSACTION_NOT_FOUND");
        }

        // ลบธุรกรรมที่ต้องการ
        await PortfolioRepository.deletePortfolioTransaction(
          tx,
          input.transactionId,
        );

        // โหลดประวัติที่เหลือ เรียงตามวันที่และ ID
        const transactions =
          await PortfolioRepository.findTransactionsByAssetId(
            tx,
            portfolio.id,
            asset.id,
          );

        let totalQuantity = new Prisma.Decimal(0);
        let avgCostPerUnit = new Prisma.Decimal(0);

        // คำนวณยอดและต้นทุนเฉลี่ยใหม่จากประวัติทั้งหมด
        for (const item of transactions) {
          const quantity = new Prisma.Decimal(item.quantity);
          const price = new Prisma.Decimal(item.pricePerUnit);

          if (item.transactionType === PortfolioTransactionType.buy) {
            const nextQuantity = totalQuantity.plus(quantity);

            const totalCost = totalQuantity
              .mul(avgCostPerUnit)
              .plus(quantity.mul(price));

            avgCostPerUnit = totalCost
              .div(nextQuantity)
              .toDecimalPlaces(8, Prisma.Decimal.ROUND_HALF_UP);

            totalQuantity = nextQuantity;
          } else {
            // ป้องกันประวัติที่เหลือทำให้ยอดถือครองติดลบ
            if (quantity.greaterThan(totalQuantity)) {
              throw new Error("INSUFFICIENT_ASSET_QUANTITY");
            }

            totalQuantity = totalQuantity.minus(quantity);

            // เมื่อล้างยอดถือครอง ให้ต้นทุนเฉลี่ยเป็นศูนย์
            if (totalQuantity.isZero()) {
              avgCostPerUnit = new Prisma.Decimal(0);
            }
          }
        }

        // บันทึก Holding ที่คำนวณใหม่
        const updatedHolding = await PortfolioRepository.upsertHolding(tx, {
          portfolioId: portfolio.id,
          assetId: asset.id,
          quantity: totalQuantity,
          avgCostPerUnit,
        });

        // คืน ID ธุรกรรมและยอดถือครองล่าสุด
        return {
          message: "Portfolio transaction deleted successfully",
          transactionId: input.transactionId.toString(),
          assetId: asset.id.toString(),
          quantity: updatedHolding.quantity.toString(),
          avgCostPerUnit: updatedHolding.avgCostPerUnit.toString(),
        };
      },
      {
        // ป้องกันปัญหาข้อมูลขัดแย้งจากธุรกรรมที่ทำพร้อมกัน
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }
}
