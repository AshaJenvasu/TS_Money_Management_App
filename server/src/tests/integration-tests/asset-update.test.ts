import { describe, test, expect } from "vitest";
import app from "../../index";
import { prisma } from "../helpers/reset-db";
import { createTestUserWithToken } from "../helpers/auth";

function putAsset(
  authHeader: Record<string, string>,
  assetId: bigint,
  body: unknown,
) {
  return app.request(`/api/v1/assets/${assetId}`, {
    method: "PUT",
    headers: { ...authHeader, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function deleteAsset(authHeader: Record<string, string>, assetId: bigint) {
  return app.request(`/api/v1/assets/${assetId}`, {
    method: "DELETE",
    headers: authHeader,
  });
}

// createTestUserWithToken ใช้ Date.now() ตั้ง username/email จึงต้องเว้นช่วงก่อนสร้าง user คนที่สอง
async function createSecondUser() {
  await new Promise((resolve) => setTimeout(resolve, 5));
  return createTestUserWithToken();
}

async function createAsset(userId: bigint, symbol: string, name: string) {
  return prisma.asset.create({
    data: { userId, symbol, name, assetType: "stock" },
  });
}

// สร้าง asset ที่มีประวัติซื้อขาย (ซื้อ 10 แล้วขายออก sellQuantity) พร้อม holding ที่เหลือ
async function createAssetWithHistory(
  userId: bigint,
  symbol: string,
  name: string,
  sellQuantity: number,
) {
  const asset = await createAsset(userId, symbol, name);
  const portfolio = await prisma.portfolio.create({ data: { userId } });

  await prisma.portfolioTransaction.create({
    data: {
      portfolioId: portfolio.id,
      assetId: asset.id,
      transactionType: "buy",
      quantity: 10,
      pricePerUnit: 100,
      transactionDate: new Date("2026-01-01"),
    },
  });
  if (sellQuantity > 0) {
    await prisma.portfolioTransaction.create({
      data: {
        portfolioId: portfolio.id,
        assetId: asset.id,
        transactionType: "sell",
        quantity: sellQuantity,
        pricePerUnit: 120,
        transactionDate: new Date("2026-02-01"),
      },
    });
  }
  await prisma.assetHolding.create({
    data: {
      portfolioId: portfolio.id,
      assetId: asset.id,
      quantity: 10 - sellQuantity,
      avgCostPerUnit: 100,
    },
  });

  return asset;
}

describe("PUT /api/v1/assets/:id - ownership และ history check", () => {
  test("🔴 Sad Path: user B แก้ชื่อ asset ของ user A ไม่ได้ (404 เหมือน DELETE) และชื่อใน DB ไม่เปลี่ยน", async () => {
    const { testUser: userA } = await createTestUserWithToken();
    const { authHeader: headerB } = await createSecondUser();
    const asset = await createAsset(userA.id, "AAPL", "[TEST] Apple");

    // DELETE ของ asset คนอื่นคืน 404 เราต้องได้ status/ข้อความเดียวกัน ไม่ leak ว่า asset มีอยู่
    const deleteRes = await deleteAsset(headerB, asset.id);
    const res = await putAsset(headerB, asset.id, { name: "[TEST] Hacked" });

    expect(deleteRes.status).toBe(404);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "Asset not found" });

    const saved = await prisma.asset.findUnique({ where: { id: asset.id } });
    expect(saved?.name).toBe("[TEST] Apple");
  });

  test.each([
    ["ยังถืออยู่", 4],
    ["ขายหมดแล้ว (quantity = 0)", 10],
  ])(
    "🔴 Sad Path: เจ้าของแก้ชื่อ asset ที่มีประวัติซื้อขายไม่ได้ (%s) -> 400",
    async (_label, sellQuantity) => {
      const { testUser, authHeader } = await createTestUserWithToken();
      const asset = await createAssetWithHistory(
        testUser.id,
        "TSLA",
        "[TEST] Tesla",
        sellQuantity,
      );

      const res = await putAsset(authHeader, asset.id, {
        name: "[TEST] Tesla Renamed",
      });

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        message: "Cannot update asset that has transaction history",
      });
      const saved = await prisma.asset.findUnique({ where: { id: asset.id } });
      expect(saved?.name).toBe("[TEST] Tesla");
    },
  );

  test("🟢 Regression: เจ้าของแก้ชื่อ asset ที่ไม่มี holding/ประวัติเลยได้ตามเดิม", async () => {
    const { testUser, authHeader } = await createTestUserWithToken();
    const asset = await createAsset(testUser.id, "NVDA", "[TEST] Nvidia");

    const res = await putAsset(authHeader, asset.id, {
      name: "[TEST] Nvidia Corp",
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("[TEST] Nvidia Corp");
    const saved = await prisma.asset.findUnique({ where: { id: asset.id } });
    expect(saved?.name).toBe("[TEST] Nvidia Corp");
  });

  test("🔴 Race: transaction ที่กำลัง insert (ยังไม่ commit) ระหว่าง check กับ update ต้องทำให้แก้ชื่อไม่ได้ (400)", async () => {
    const { testUser, authHeader } = await createTestUserWithToken();
    const asset = await createAsset(testUser.id, "AMZN", "[TEST] Amazon");
    const portfolio = await prisma.portfolio.create({
      data: { userId: testUser.id },
    });

    let releaseInsert!: () => void;
    const insertMayCommit = new Promise<void>((resolve) => {
      releaseInsert = resolve;
    });
    let insertStarted!: () => void;
    const insertDone = new Promise<void>((resolve) => {
      insertStarted = resolve;
    });

    // ฝั่งซื้อขาย: insert transaction แล้วค้างไว้ก่อน commit
    const buyer = prisma.$transaction(async (tx) => {
      await tx.portfolioTransaction.create({
        data: {
          portfolioId: portfolio.id,
          assetId: asset.id,
          transactionType: "buy",
          quantity: 1,
          pricePerUnit: 100,
          transactionDate: new Date("2026-03-01"),
        },
      });
      insertStarted();
      await insertMayCommit;
    });

    await insertDone;
    // ฝั่งแก้ชื่อ: ยิงเข้ามาตอน transaction ข้างบนยังไม่ commit (นับเจอ 0 ถ้าไม่ล็อกแถว asset)
    const updating = putAsset(authHeader, asset.id, {
      name: "[TEST] Amazon Renamed",
    });
    await new Promise((resolve) => setTimeout(resolve, 300));
    releaseInsert();
    await buyer;
    const res = await updating;

    expect(res.status).toBe(400);
    const saved = await prisma.asset.findUnique({ where: { id: asset.id } });
    expect(saved?.name).toBe("[TEST] Amazon");
  });
});
