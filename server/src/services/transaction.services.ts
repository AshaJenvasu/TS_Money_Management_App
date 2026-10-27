import { prisma } from "../config/prisma.js";
import { TransactionRepository } from "../repositories/transaction.repository.js";
import { TransactionType } from "@prisma/client";

export class TransactionService {
  // 1. Service: getTransactions
  static async getTransactions(
    walletId: bigint,
    userId: bigint,
    filters: { from?: string; to?: string; page: number; limit: number },
  ) {
    // แปลง YYYY-MM-DD เป็นช่วง UTC แบบ [from 00:00, to+1วัน 00:00) กัน edge case เรื่องเศษวินาทีฝั่ง to
    const fromDate = filters.from
      ? new Date(`${filters.from}T00:00:00.000Z`)
      : undefined;
    const toDateExclusive = filters.to
      ? new Date(
          new Date(`${filters.to}T00:00:00.000Z`).getTime() +
            24 * 60 * 60 * 1000,
        )
      : undefined;

    const skip = (filters.page - 1) * filters.limit;

    return await prisma.$transaction(async (tx) => {
      // ตรวจสอบสิทธิ์การเป็นเจ้าของ Wallet
      const wallet = await TransactionRepository.findWalletByIdAndUserId(
        walletId,
        userId,
        tx,
      );
      if (!wallet) throw new Error("WALLET_NOT_FOUND");

      // ดึงรายการและนับจำนวนทั้งหมดพร้อมกัน (ไม่ต้องรอทีละตัว)
      const [transactions, total] = await Promise.all([
        TransactionRepository.findManyByWalletId(
          walletId,
          { fromDate, toDateExclusive, skip, take: filters.limit },
          tx,
        ),
        TransactionRepository.countByWalletId(
          walletId,
          { fromDate, toDateExclusive },
          tx,
        ),
      ]);

      return {
        transactions,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages: Math.ceil(total / filters.limit),
        },
      };
    });
  }

  // 2. Service: createTransaction
  static async createTransaction(
    walletId: bigint,
    userId: bigint,
    data: {
      transactionType: TransactionType;
      amount: number;
      note?: string | null;
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
      note?: string | null;
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

  // ดึง Transaction ทุก Wallet ของ User พร้อม Pagination
  static async getTransactionsByUserId(
    userId: bigint,
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;

    // ดึงข้อมูลและนับจำนวนทั้งหมดพร้อมกันคำสั่งดึงรายการ (findMany) กับนับจำนวนรวม (count) เป็นสองคิวรีที่ ไม่ต้องรอกัน ถ้าเขียนแบบ await ทีละตัว มันจะรอตัวแรกเสร็จก่อนค่อยเริ่มตัวที่สอง แต่ Promise.all สั่งให้ทำ พร้อมกัน แล้วรอจนเสร็จทั้งคู่ เวลาที่ใช้เลยเท่ากับตัวที่ช้าที่สุด ไม่ใช่เอามาบวกกัน เร็วขึ้นเกือบเท่าตัวเลย
    const [transactions, total] = await Promise.all([
      TransactionRepository.findManyByUserId(userId, skip, limit),
      TransactionRepository.countByUserId(userId),
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        //คือจำนวนหน้าทั้งหมด ใช้ ceil (ปัดขึ้น) เพราะเศษก็ยังต้องใช้อีกหน้าหนึ่ง เช่น มี 25 รายการ หน้าละ 10 25 / 10 = 2.5 → ปัดขึ้นเป็น 3 หน้า (หน้าสุดท้ายมี 5 รายการ)
      },
    };
  }
}
