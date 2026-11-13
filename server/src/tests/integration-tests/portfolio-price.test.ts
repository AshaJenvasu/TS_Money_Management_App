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
    vi.useRealTimers();
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

  test("🟢 AC2 Cache Hit: second request within TTL should use cached price without calling CoinGecko again", async () => {
    // Arrange
    const { testUser, authHeader } = await createTestUserWithToken();
    await createPortfolioWithHolding(testUser.id, {
      symbol: "BTC",
      name: "[TEST] Bitcoin",
      assetType: "crypto",
      quantity: "0.5",
      avgCostPerUnit: "60000",
    });
    stubCoinGeckoPrices({ BTC: 72000 });

    // Act: ยิงสองครั้งติดกัน (ยังไม่หมด TTL)
    const firstRes = await app.request("/api/v1/portfolio", {
      method: "GET",
      headers: { ...authHeader },
    });
    const secondRes = await app.request("/api/v1/portfolio", {
      method: "GET",
      headers: { ...authHeader },
    });
    const secondBody = await secondRes.json();

    // Assert: ทั้งสองครั้งได้ราคาเดียวกัน แต่ CoinGecko ถูกเรียกแค่ครั้งเดียว
    expect(firstRes.status).toBe(200);
    expect(secondRes.status).toBe(200);
    expect(Number(secondBody.holdings[0].currentPrice)).toBe(72000);
    expect(coingeckoFetch).toHaveBeenCalledTimes(1);
  });

  test("🟢 AC3 Cache Expired: should refetch from CoinGecko after TTL and cache the new price with a fresh TTL", async () => {
    // Arrange
    const { testUser, authHeader } = await createTestUserWithToken();
    await createPortfolioWithHolding(testUser.id, {
      symbol: "BTC",
      name: "[TEST] Bitcoin",
      assetType: "crypto",
      quantity: "0.5",
      avgCostPerUnit: "60000",
    });
    const getPortfolio = () =>
      app.request("/api/v1/portfolio", {
        method: "GET",
        headers: { ...authHeader },
      });

    // Act 1: ยิงครั้งแรก ได้ราคา 72,000 และถูก cache
    stubCoinGeckoPrices({ BTC: 72000 });
    await getPortfolio();

    // Act 2: เลื่อนเวลาไป 10 นาที (เกิน TTL สูงสุด 5 นาที) แล้วราคาตลาดเปลี่ยนเป็น 80,000
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() + 10 * 60 * 1000);
    stubCoinGeckoPrices({ BTC: 80000 });
    const expiredRes = await getPortfolio();
    const expiredBody = await expiredRes.json();

    // Assert: cache หมดอายุ จึงยิง CoinGecko ใหม่และได้ราคาใหม่
    expect(expiredRes.status).toBe(200);
    expect(Number(expiredBody.holdings[0].currentPrice)).toBe(80000);
    expect(coingeckoFetch).toHaveBeenCalledTimes(2);

    // Act 3: ยิงอีกครั้งทันที ต้องใช้ราคาใหม่จาก cache (TTL ใหม่) ไม่ยิง CoinGecko อีก
    const freshRes = await getPortfolio();
    const freshBody = await freshRes.json();
    expect(Number(freshBody.holdings[0].currentPrice)).toBe(80000);
    expect(coingeckoFetch).toHaveBeenCalledTimes(2);
  });

  test("🟢 AC5 Stock out of scope: should return null price and priceUnavailable=true without calling CoinGecko", async () => {
    // Arrange: ถือหุ้นที่ใช้ symbol ตรงกับเหรียญใน CoinGecko (BTC) เพื่อให้แน่ใจว่าไม่ถูกเอาไปหาราคา crypto
    const { testUser, authHeader } = await createTestUserWithToken();
    await createPortfolioWithHolding(testUser.id, {
      symbol: "BTC",
      name: "[TEST] Stock With Crypto Symbol",
      assetType: "stock",
      quantity: "10",
      avgCostPerUnit: "100",
    });
    stubCoinGeckoPrices({ BTC: 72000 });

    // Act
    const res = await app.request("/api/v1/portfolio", {
      method: "GET",
      headers: { ...authHeader },
    });
    const body = await res.json();

    // Assert: ตอบ 200 ด้วยรูปแบบเดียวกับ AC4 และไม่ยิง CoinGecko เลย
    expect(res.status).toBe(200);
    const holding = body.holdings[0];
    expect(holding.currentPrice).toBeNull();
    expect(holding.currentValue).toBeNull();
    expect(holding.unrealizedPnl).toBeNull();
    expect(holding.unrealizedPnlPercent).toBeNull();
    expect(holding.priceUnavailable).toBe(true);
    expect(coingeckoFetch).not.toHaveBeenCalled();
  });

  describe("🔴 AC4 CoinGecko fails and no cached price", () => {
    const failureModes: Array<[string, () => void]> = [
      [
        "network error / timeout",
        () => coingeckoFetch.mockRejectedValue(new Error("network down")),
      ],
      [
        "rate limited (HTTP 429)",
        () =>
          coingeckoFetch.mockResolvedValue(
            new Response(JSON.stringify({ status: { error_code: 429 } }), {
              status: 429,
              headers: { "Content-Type": "application/json" },
            }),
          ),
      ],
    ];

    test.each(failureModes)(
      "should return 200 with null price and priceUnavailable=true on %s",
      async (_name, simulateFailure) => {
        // Arrange
        const { testUser, authHeader } = await createTestUserWithToken();
        await createPortfolioWithHolding(testUser.id, {
          symbol: "BTC",
          name: "[TEST] Bitcoin",
          assetType: "crypto",
          quantity: "0.5",
          avgCostPerUnit: "60000",
        });
        simulateFailure();

        // Act
        const res = await app.request("/api/v1/portfolio", {
          method: "GET",
          headers: { ...authHeader },
        });
        const body = await res.json();

        // Assert: endpoint ไม่พัง และข้อมูลต้นทุนเดิมยังอยู่ครบ
        expect(res.status).toBe(200);
        const holding = body.holdings[0];
        expect(holding.quantity).toBeDefined();
        expect(Number(holding.avgCostPerUnit)).toBe(60000);
        expect(holding.currentPrice).toBeNull();
        expect(holding.currentValue).toBeNull();
        expect(holding.unrealizedPnl).toBeNull();
        expect(holding.unrealizedPnlPercent).toBeNull();
        expect(holding.priceUnavailable).toBe(true);
      },
    );
  });
});
