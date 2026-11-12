import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import app from "../../index";
import { prisma } from "../helpers/reset-db";
import { createTestUserWithToken } from "../helpers/auth";

// Redis (Upstash) เป็น external boundary: แทนด้วย in-memory fake ที่รองรับ TTL (ex = วินาที)
// ใช้ vi.hoisted เพื่อให้ factory ของ vi.mock เข้าถึง store ได้
const fakeRedis = vi.hoisted(() => {
  const store = new Map<string, { value: unknown; expiresAt: number | null }>();
  return {
    store,
    client: {
      async get(key: string) {
        const entry = store.get(key);
        if (!entry) return null;
        if (entry.expiresAt !== null && Date.now() >= entry.expiresAt) {
          store.delete(key);
          return null;
        }
        return entry.value;
      },
      async set(key: string, value: unknown, opts?: { ex?: number }) {
        store.set(key, {
          value,
          expiresAt: opts?.ex ? Date.now() + opts.ex * 1000 : null,
        });
        return "OK";
      },
    },
  };
});

vi.mock("../../config/redis", () => ({ redis: fakeRedis.client }));

// CoinGecko เป็น external boundary: stub global fetch (GET /coins/markets คืน array ที่มี symbol + current_price)
const coingeckoFetch = vi.fn();

function stubCoinGeckoPrices(prices: Record<string, number>) {
  coingeckoFetch.mockImplementation(async (input: unknown) => {
    const url = String(input);
    if (!url.includes("coingecko")) {
      throw new Error(`Unexpected fetch in test: ${url}`);
    }
    const body = Object.entries(prices).map(([symbol, price]) => ({
      id: symbol,
      symbol: symbol.toLowerCase(),
      current_price: price,
    }));
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });
}

async function createPortfolioWithHolding(
  userId: bigint,
  holding: {
    symbol: string;
    name: string;
    assetType: "crypto" | "stock";
    quantity: string;
    avgCostPerUnit: string;
  },
) {
  const portfolio = await prisma.portfolio.create({ data: { userId } });
  const asset = await prisma.asset.create({
    data: {
      userId,
      symbol: holding.symbol,
      name: holding.name,
      assetType: holding.assetType,
    },
  });
  await prisma.assetHolding.create({
    data: {
      portfolioId: portfolio.id,
      assetId: asset.id,
      quantity: holding.quantity,
      avgCostPerUnit: holding.avgCostPerUnit,
    },
  });
}

describe("GET /api/v1/portfolio - real-time crypto price", () => {
  beforeEach(() => {
    fakeRedis.store.clear();
    coingeckoFetch.mockReset();
    vi.stubGlobal("fetch", coingeckoFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("🟢 AC1 Happy Path: crypto holding should include current price, value and unrealized P&L", async () => {
    // Arrange: ถือ BTC 0.5 หน่วย ต้นทุนเฉลี่ย 60,000 และราคาตลาดตอนนี้ 72,000
    const { testUser, authHeader } = await createTestUserWithToken();
    await createPortfolioWithHolding(testUser.id, {
      symbol: "BTC",
      name: "[TEST] Bitcoin",
      assetType: "crypto",
      quantity: "0.5",
      avgCostPerUnit: "60000",
    });
    stubCoinGeckoPrices({ BTC: 72000 });

    // Act
    const res = await app.request("/api/v1/portfolio", {
      method: "GET",
      headers: { ...authHeader },
    });
    const body = await res.json();

    // Assert: 0.5 × 72,000 = 36,000 | ต้นทุน 0.5 × 60,000 = 30,000 | P&L = +6,000 (+20%)
    expect(res.status).toBe(200);
    expect(body.holdings).toHaveLength(1);
    const holding = body.holdings[0];
    expect(Number(holding.currentPrice)).toBe(72000);
    expect(Number(holding.currentValue)).toBe(36000);
    expect(Number(holding.unrealizedPnl)).toBe(6000);
    expect(Number(holding.unrealizedPnlPercent)).toBe(20);
    expect(holding.priceUnavailable).toBe(false);
  });
});
