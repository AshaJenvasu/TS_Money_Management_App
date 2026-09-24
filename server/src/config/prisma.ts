import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 1. ดึง Connection String จากไฟล์ .env
const connectionString = process.env.DATABASE_URL;

// 2. สร้าง Driver Adapter ตามข้อกำหนดของ Prisma 7
const adapter = new PrismaPg({ connectionString });

// 3. ส่ง adapter เข้าไปใน PrismaClient Constructor
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
