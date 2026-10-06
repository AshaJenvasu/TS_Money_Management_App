import { prisma } from "../config/prisma";

export class WalletRepository {
  // 1. ดึงรายการ Wallet ทั้งหมด(findmany)ของผู้ใช้ โดยเรียงลำดับจากสร้างใหม่ไปเก่า
  static async findManyByUserId(userId: bigint) {
    return await prisma.wallet.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
  // 2. ค้นหา Wallet จากชื่อและ userId เพื่อตรวจสอบชื่อซ้ำ
  static async findByNameAndUserId(name: string, userId: bigint) {
    return await prisma.wallet.findFirst({
      where: {
        userId,
        name,
      },
    });
  }
  // 3. สร้าง Wallet ใหม่ลงในฐานข้อมูล
  static async create(userId: bigint, name: string) {
    return await prisma.wallet.create({
      data: {
        userId,
        name,
      },
    });
  }
  // 4. ค้นหา Wallet ด้วย walletId และ userId เพื่อตรวจสอบการมีอยู่และสิทธิ์ความเป็นเจ้าของ(findFirst returnแค่อย่างเดียว)
  static async findByIdAndUserId(walletId: bigint, userId: bigint) {
    return await prisma.wallet.findFirst({
      where: {
        id: walletId,
        userId,
      },
    });
  }
  // 5. อัปเดตชื่อ Wallet ในฐานข้อมูล
  static async update(walletId: bigint, name: string) {
    return await prisma.wallet.update({
      where: {
        id: walletId,
      },
      data: {
        name,
      },
    });
  }
  // 6. ลบ Wallet ออกจากฐานข้อมูล
  static async delete(walletId: bigint) {
    return await prisma.wallet.delete({
      where: {
        id: walletId,
      },
    });
  }
  // 7. คำนวณยอดรวมรายรับ (income) และรายจ่าย (expense) ของ Wallet
  static async calculateBalance(walletId: bigint) {
    // หาผลรวมของยอดเงินโดยแบ่งตามประเภท transactionType (income / expense)
    // aggregates คือผลลัพธ์การ "สรุปยอดและจัดกลุ่ม" ข้อมูลจาก Database ผ่าน Prisma
    // ในโค้ดนี้ มันคือ Array ที่เก็บผลรวมของเงิน (_sum.amount) แยกตามประเภทธุรกรรม (transactionType)
    const aggregates = await prisma.transaction.groupBy({
      by: ["transactionType"],
      where: {
        walletId,
      },
      _sum: {
        amount: true,
      },
    });

    let totalIncome = 0;
    let totalExpense = 0;

    // ดึงค่าผลรวมแต่ละประเภทออกมา (ถ้าไม่มีรายการให้ default เป็น 0)
    for (const group of aggregates) {
      if (group.transactionType === "income") {
        totalIncome = group._sum.amount ? Number(group._sum.amount) : 0;
      } else if (group.transactionType === "expense") {
        totalExpense = group._sum.amount ? Number(group._sum.amount) : 0;
      }
    }

    return {
      totalIncome,
      totalExpense,
    };
  }
}
