// src/tests/helpers/reset-db.ts
import { prisma } from "../../config/prisma";

export { prisma };

export async function cleanTestData() {
  // 1. ลบ Transaction ของ Test Wallet
  await prisma.transaction
    .deleteMany({
      where: { wallet: { name: { startsWith: "[TEST]" } } },
    })
    .catch(() => {});

  // 2. ลบ Wallet ของ Test
  await prisma.wallet.deleteMany({
    where: { name: { startsWith: "[TEST]" } },
  });

  // 3. ลบ User ที่สร้างมาเพื่อ Test (ถ้ามี)
  await prisma.user.deleteMany({
    where: { email: { startsWith: "test_" } },
  });
}
