import { describe, test, expect } from "vitest";
import app from "../../index";
import { prisma } from "../helpers/reset-db";
import { createTestUserWithToken } from "../helpers/auth";

function postAsset(authHeader: Record<string, string>, body: unknown) {
  return app.request("/api/v1/assets", {
    method: "POST",
    headers: { ...authHeader, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/v1/assets - CoinGecko id", () => {
  test("🟢 Happy Path: should store coingecko_id when creating a crypto asset", async () => {
    // Arrange
    const { testUser, authHeader } = await createTestUserWithToken();

    // Act
    const res = await postAsset(authHeader, {
      symbol: "BTC",
      name: "[TEST] Bitcoin",
      asset_type: "crypto",
      coingecko_id: "bitcoin",
    });

    // Assert: ตอบ 201 พร้อม coingecko_id และบันทึกลง DB จริง
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.coingecko_id).toBe("bitcoin");
    const saved = await prisma.asset.findFirst({
      where: { userId: testUser.id, symbol: "BTC" },
    });
    expect(saved?.coingeckoId).toBe("bitcoin");
  });

  test("🔴 Sad Path: should return 400 Bad Request when creating a crypto asset without coingecko_id", async () => {
    const { testUser, authHeader } = await createTestUserWithToken();

    const res = await postAsset(authHeader, {
      symbol: "BTC",
      name: "[TEST] Bitcoin",
      asset_type: "crypto",
    });

    expect(res.status).toBe(400);
    // ต้องไม่มี asset ถูกสร้างค้างไว้
    const count = await prisma.asset.count({ where: { userId: testUser.id } });
    expect(count).toBe(0);
  });

  test.each([
    ["contains a comma", "BTC,ETH"],
    ["contains a space", "BT C"],
    ["contains a symbol character", "BTC$"],
  ])(
    "🔴 Sad Path: should return 400 Bad Request when symbol %s",
    async (_name, symbol) => {
      const { testUser, authHeader } = await createTestUserWithToken();

      const res = await postAsset(authHeader, {
        symbol,
        name: "[TEST] Invalid Symbol",
        asset_type: "crypto",
        coingecko_id: "bitcoin",
      });

      expect(res.status).toBe(400);
      const count = await prisma.asset.count({
        where: { userId: testUser.id },
      });
      expect(count).toBe(0);
    },
  );

  test("🟢 Stock asset does not need coingecko_id and returns it as null", async () => {
    const { authHeader } = await createTestUserWithToken();

    const res = await postAsset(authHeader, {
      symbol: "AAPL",
      name: "[TEST] Apple",
      asset_type: "stock",
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.coingecko_id).toBeNull();
  });
});
