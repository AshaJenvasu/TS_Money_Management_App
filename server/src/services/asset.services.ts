import { AssetRepository } from "../repositories/asset.repository";
import { AssetType, Prisma } from "@prisma/client";
import { HTTPException } from "hono/http-exception";

export class AssetService {
  // 1. Service: getAssets
  static async getAssets(userId: bigint) {
    return await AssetRepository.findByUserId(userId);
  }

  // 2. Service: createAsset
  static async createAsset(
    userId: bigint,
    data: { symbol: string; name: string; assetType: AssetType },
  ) {
    try {
      const asset = await AssetRepository.create({
        userId,
        symbol: data.symbol,
        name: data.name,
        assetType: data.assetType,
      });

      return asset;
    } catch (error) {
      const prismaError = error as { code?: string };

      if (prismaError.code === "P2002") {
        throw new Error("ASSET_ALREADY_EXISTS");
      }

      throw error;
    }
  }

  // 3. Service: updateAsset
  static async updateAsset(id: bigint, userId: bigint, data: { name: string }) {
    try {
      return await AssetRepository.update(id, data);
    } catch (error) {
      const prismaError = error as { code?: string };

      if (prismaError.code === "P2025") {
        throw new Error("ASSET_NOT_FOUND");
      }

      if (prismaError.code === "P2002") {
        throw new Error("ASSET_ALREADY_EXISTS");
      }

      throw error;
    }
  }

  // 4. Service: deleteAsset
  static async deleteAsset(id: bigint, userId: bigint) {
    // 1. ตรวจสอบว่า Asset มีอยู่จริงและเป็นของ User คนนี้
    const asset = await AssetRepository.findByIdAndUserId(id, userId);
    if (!asset) {
      throw new Error("ASSET_NOT_FOUND");
    }

    // 2. สั่งลบ (Prisma จะ Cascade ลบ AssetHolding และ PortfolioTransaction ให้ตาม Schema)
    return await AssetRepository.delete(id);
  }

  // 5. Service: getAssetHolding
  static async getAssetHolding(id: bigint, userId: bigint) {
    // 1. ตรวจสอบว่า Asset เป็นของ User จริงไหม
    const asset = await AssetRepository.findByIdAndUserId(id, userId);
    if (!asset) {
      throw new Error("ASSET_NOT_FOUND");
    }

    // 2. ดึงข้อมูล Holding
    const holding = await AssetRepository.findHoldingByAssetId(id);

    // 3. คำนวณ total_cost = quantity * avgCostPerUnit
    if (!holding) {
      return {
        quantity: "0.00000000",
        avg_cost_per_unit: "0.00000000",
        total_cost: "0.00000000",
      };
    }

    const quantity = Number(holding.quantity);
    const avgCost = Number(holding.avgCostPerUnit);
    const totalCost = quantity * avgCost;

    return {
      quantity: holding.quantity.toString(),
      avg_cost_per_unit: holding.avgCostPerUnit.toString(),
      total_cost: totalCost.toFixed(8),
    };
  }
}
