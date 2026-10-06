import { WalletRepository } from "../repositories/wallet.repository";

export class WalletService {
  // 1. Service: getWallets
  static async getWallets(userId: bigint) {
    try {
      // ดึงข้อมูล Wallet ทั้งหมดจาก Database ผ่าน Repository
      const wallets = await WalletRepository.findManyByUserId(userId);

      // เคสไม่มี Wallet ให้คืนค่าเป็น Empty Array ([])
      if (!wallets || wallets.length === 0) {
        return [];
      }

      // แปลงโครงสร้างข้อมูล BigInt และ Date ให้เป็น String ตาม API Schema
      return wallets.map(
        (wallet: {
          id: bigint;
          name: string;
          createdAt: Date;
          updatedAt: Date;
        }) => ({
          id: wallet.id.toString(),
          name: wallet.name,
          createdAt: wallet.createdAt.toISOString(),
          updatedAt: wallet.updatedAt.toISOString(),
        }),
      );
    } catch (_error) {
      // โยน Error ต่อเพื่อให้ Controller จัดการตอบกลับเป็น 500 Internal Server Error
      throw new Error("INTERNAL_SERVER_ERROR");
    }
  }
  // 2. Service: createWallet
  static async createWallet(userId: bigint, name: string) {
    try {
      // ตรวจสอบว่าผู้ใช้คนนี้มี Wallet ชื่อซ้ำกันอยู่แล้วหรือไม่
      const existingWallet = await WalletRepository.findByNameAndUserId(
        name,
        userId,
      );
      if (existingWallet) {
        throw new Error("WALLET_NAME_EXISTS");
      }

      // บันทึก Wallet ใหม่ลงฐานข้อมูล
      const wallet = await WalletRepository.create(userId, name);

      // แปลง id เป็น String และ Date เป็น ISO String ตาม API Schema
      return {
        id: wallet.id.toString(),
        name: wallet.name,
        createdAt: wallet.createdAt.toISOString(),
        updatedAt: wallet.updatedAt.toISOString(),
      };
    } catch (error: any) {
      // โยน Error ต่อให้ Controller จัดการแยกแยะ HTTP Status
      if (error.message === "WALLET_NAME_EXISTS") {
        throw error;
      }
      throw new Error("INTERNAL_SERVER_ERROR");
    }
  }
  // 3. Service: getWalletById
  static async getWalletById(walletId: bigint, userId: bigint) {
    try {
      // ดึงข้อมูล Wallet โดยระบุทั้ง walletId และ userId เพื่อยืนยันสิทธิ์ความเป็นเจ้าของ
      const wallet = await WalletRepository.findByIdAndUserId(walletId, userId);
      if (!wallet) {
        throw new Error("WALLET_NOT_FOUND");
      }

      // แปลง id เป็น String และ Date เป็น ISO String ตาม API Schema
      return {
        id: wallet.id.toString(),
        name: wallet.name,
        createdAt: wallet.createdAt.toISOString(),
        updatedAt: wallet.updatedAt.toISOString(),
      };
    } catch (error: any) {
      // โยน Error ต่อให้ Controller จัดการแยกแยะ HTTP Status
      if (error.message === "WALLET_NOT_FOUND") {
        throw error;
      }
      throw new Error("INTERNAL_SERVER_ERROR");
    }
  }
  // 4. Service: updateWallet
  static async updateWallet(walletId: bigint, userId: bigint, name: string) {
    try {
      // 1. ตรวจสอบว่ามี Wallet นี้และเป็นของผู้ใช้คนนี้หรือไม่
      const wallet = await WalletRepository.findByIdAndUserId(walletId, userId);
      if (!wallet) {
        throw new Error("WALLET_NOT_FOUND");
      }

      // 2. ถ้ามีการเปลี่ยนชื่อ ให้ตรวจสอบว่าชื่อใหม่ซ้ำกับ Wallet อื่นของผู้ใช้คนนี้หรือไม่
      if (wallet.name !== name) {
        const existingWallet = await WalletRepository.findByNameAndUserId(
          name,
          userId,
        );
        if (existingWallet) {
          throw new Error("WALLET_NAME_EXISTS");
        }
      }

      // 3. ทำการอัปเดตชื่อ Wallet ในฐานข้อมูล
      const updatedWallet = await WalletRepository.update(walletId, name);

      // แปลง id เป็น String และ Date เป็น ISO String ตาม API Schema
      return {
        id: updatedWallet.id.toString(),
        name: updatedWallet.name,
        createdAt: updatedWallet.createdAt.toISOString(),
        updatedAt: updatedWallet.updatedAt.toISOString(),
      };
    } catch (error: any) {
      // โยน Error ต่อให้ Controller จัดการแยกแยะ HTTP Status
      if (
        error.message === "WALLET_NOT_FOUND" ||
        error.message === "WALLET_NAME_EXISTS"
      ) {
        throw error;
      }
      throw new Error("INTERNAL_SERVER_ERROR");
    }
  }
  // 5. Service: deleteWallet
  static async deleteWallet(walletId: bigint, userId: bigint) {
    try {
      // 1. ตรวจสอบว่ามี Wallet นี้และเป็นของผู้ใช้คนนี้หรือไม่
      const wallet = await WalletRepository.findByIdAndUserId(walletId, userId);
      if (!wallet) {
        throw new Error("WALLET_NOT_FOUND");
      }

      // 2. สั่งลบ Wallet ในฐานข้อมูล
      await WalletRepository.delete(walletId);
      return {
        id: wallet.id.toString(),
        name: wallet.name,
        createdAt: wallet.createdAt.toISOString(),
        updatedAt: wallet.updatedAt.toISOString(),
      };
    } catch (error: any) {
      // โยน Error ต่อให้ Controller จัดการแยกแยะ HTTP Status
      if (error.message === "WALLET_NOT_FOUND") {
        throw error;
      }
      throw new Error("INTERNAL_SERVER_ERROR");
    }
  }
  // 6. Service: getWalletBalance
  static async getWalletBalance(walletId: bigint, userId: bigint) {
    try {
      // 1. ตรวจสอบว่ามี Wallet นี้และเป็นของผู้ใช้คนนี้หรือไม่
      const wallet = await WalletRepository.findByIdAndUserId(walletId, userId);
      if (!wallet) {
        throw new Error("WALLET_NOT_FOUND");
      }

      // 2. ดึงยอดรวม income และ expense จาก Repository
      const { totalIncome, totalExpense } =
        await WalletRepository.calculateBalance(walletId);

      // 3. คำนวณยอดเงินคงเหลือ (รายรับ - รายจ่าย)
      const balance = totalIncome - totalExpense;

      // จัดรูปแบบยอดเงินเป็น String ทศนิยม 2 ตำแหน่งตาม WalletBalanceResponseSchema
      return {
        balance: balance.toFixed(2),
      };
    } catch (error: any) {
      // โยน Error ต่อให้ Controller จัดการแยกแยะ HTTP Status
      if (error.message === "WALLET_NOT_FOUND") {
        throw error;
      }
      throw new Error("INTERNAL_SERVER_ERROR");
    }
  }
}
