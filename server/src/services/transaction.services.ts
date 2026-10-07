import { prisma } from "../config/prisma";
import { TransactionRepository } from "../repositories/transaction.repository";
import { TransactionType } from "@prisma/client";

export class TransactionService {
  // 1. Service: getTransactions
  static async getTransactions(walletId: bigint, userId: bigint) {
    return await prisma.$transaction(async (tx) => {
      // ตรวจสอบสิทธิ์การเป็นเจ้าของ Wallet
      const wallet = await TransactionRepository.findWalletByIdAndUserId(
        walletId,
        userId,
        tx,
      );
      if (!wallet) throw new Error("WALLET_NOT_FOUND");

      // ดึงรายการธุรกรรมทั้งหมดจาก Repository
      return await TransactionRepository.findManyByWalletId(walletId, tx);
    });
  }

  // 2. Service: createTransaction
  static async createTransaction(
    walletId: bigint,
    userId: bigint,
    data: {
      transactionType: TransactionType;
      amount: number;
      note?: string;
      transactionDate: Date;
    },
  ) {
    return await prisma.$transaction(async (tx) => {
      // ตรวจสอบสิทธิ์การเป็นเจ้าของ Wallet
      const wallet = await TransactionRepository.findWalletByIdAndUserId(
        walletId,
        userId,
        tx,
      );
      if (!wallet) throw new Error("WALLET_NOT_FOUND");

      // บันทึกธุรกรรมใหม่ลงใน Database
      return await TransactionRepository.create(
        {
          walletId,
          transactionType: data.transactionType,
          amount: data.amount,
          note: data.note,
          transactionDate: data.transactionDate,
        },
        tx,
      );
    });
  }

  // 3. Service: updateTransaction
  static async updateTransaction(
    id: bigint,
    walletId: bigint,
    userId: bigint,
    data: {
      transactionType?: TransactionType;
      amount?: number;
      note?: string;
      transactionDate?: Date;
    },
  ) {
    return await prisma.$transaction(async (tx) => {
      // ตรวจสอบสิทธิ์การเป็นเจ้าของ Wallet
      const wallet = await TransactionRepository.findWalletByIdAndUserId(
        walletId,
        userId,
        tx,
      );
      if (!wallet) throw new Error("WALLET_NOT_FOUND");

      // ตรวจสอบว่ามีรายการธุรกรรมนี้อยู่ใน Wallet จริงหรือไม่
      const existingTx = await TransactionRepository.findByIdAndWalletId(
        id,
        walletId,
        tx,
      );
      if (!existingTx) throw new Error("TRANSACTION_NOT_FOUND");

      // อัปเดตข้อมูลธุรกรรมใน Database
      return await TransactionRepository.update(id, data, tx);
    });
  }

  // 4. Service: deleteTransaction
  static async deleteTransaction(id: bigint, walletId: bigint, userId: bigint) {
    return await prisma.$transaction(async (tx) => {
      // ตรวจสอบสิทธิ์การเป็นเจ้าของ Wallet
      const wallet = await TransactionRepository.findWalletByIdAndUserId(
        walletId,
        userId,
        tx,
      );
      if (!wallet) throw new Error("WALLET_NOT_FOUND");

      // ตรวจสอบว่ามีรายการธุรกรรมนี้อยู่ใน Wallet จริงหรือไม่
      const existingTx = await TransactionRepository.findByIdAndWalletId(
        id,
        walletId,
        tx,
      );
      if (!existingTx) throw new Error("TRANSACTION_NOT_FOUND");

      // ลบรายการธุรกรรมจาก Database
      return await TransactionRepository.delete(id, tx);
    });
  }
}
