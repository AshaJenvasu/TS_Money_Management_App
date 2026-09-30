// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting idempotent seeding...");

  // 1. สร้าง/อัปเดต User หลักสำหรับทดสอบ (Demo User)
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {}, // หากมีอยู่แล้ว ไม่ต้องทำอะไร
    create: {
      email: "demo@example.com",
      username: "demouser",
      passwordHash: "hashed_password_12345",
      portfolio: { create: {} },
    },
  });

  // 2. สร้าง Wallet ตัวอย่างเฉพาะเมื่อยังไม่มี Wallet นี้
  const walletNames = ["Main Bank", "Cash Wallet", "Crypto Exchange"];

  for (const name of walletNames) {
    await prisma.wallet.upsert({
      where: {
        userId_name: {
          userId: demoUser.id,
          name: name,
        },
      },
      update: {},
      create: {
        userId: demoUser.id,
        name: name,
      },
    });
  }

  console.log("✅ Seeding completed safely!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
