import "dotenv/config";
import { beforeEach, afterAll } from "vitest";
import { cleanTestData, prisma } from "./helpers/reset-db";

// ก่อนเริ่มรันแต่ละ test() ให้ลบข้อมูลในตาราง wallet ออกก่อนเสมอ
beforeEach(async () => {
  await cleanTestData();
});

// หลังรัน test ทั้งหมดเสร็จ ให้ปิด connection ของ Prisma
afterAll(async () => {
  await prisma.$disconnect();
});
