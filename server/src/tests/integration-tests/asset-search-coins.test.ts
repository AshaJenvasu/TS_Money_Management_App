import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import app from "../../index";
import { createTestUserWithToken } from "../helpers/auth";
import { fakeRedis } from "../helpers/fake-redis";

// Redis (Upstash) เป็น external boundary: ใช้ in-memory fake ร่วมกับ test อื่น (cache ผลค้นหา + rate limit)
vi.mock("../../config/redis", async () => ({
  redis: (await import("../helpers/fake-redis")).fakeRedis.client,
}));

// CoinGecko เป็น external boundary: stub global fetch (GET /search คืน { coins: [...] })
const coingeckoFetch = vi.fn();

function stubCoinGeckoSearch(
  coins: Array<{ id: string; name: string; symbol: string }>,
) {
  coingeckoFetch.mockImplementation(async (input: unknown) => {
    const url = String(input);
    if (!url.includes("coingecko")) {
      throw new Error(`Unexpected fetch in test: ${url}`);
    }
    // รูปแบบจริงของ CoinGecko มี field อื่นปนมาด้วย (เช่น market_cap_rank, thumb)
    const body = {
      coins: coins.map((coin, index) => ({
        ...coin,
        api_symbol: coin.id,
        market_cap_rank: index + 1,
        thumb: `https://example.com/${coin.id}.png`,
        large: `https://example.com/${coin.id}-large.png`,
      })),
    };
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });
}

describe("GET /api/v1/assets/search-coins", () => {
  beforeEach(() => {
    fakeRedis.reset();
    coingeckoFetch.mockReset();
    vi.stubGlobal("fetch", coingeckoFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("🟢 Happy Path: should return id, symbol and name of coins matching the query", async () => {
    // Arrange
    const { authHeader } = await createTestUserWithToken();
    stubCoinGeckoSearch([
      { id: "bitcoin", name: "Bitcoin", symbol: "BTC" },
      { id: "bitcoin-cash", name: "Bitcoin Cash", symbol: "BCH" },
    ]);

    // Act
    const res = await app.request("/api/v1/assets/search-coins?q=bitcoin", {
      method: "GET",
      headers: { ...authHeader },
    });

    // Assert: คืนเฉพาะ {id, symbol, name} ตามลำดับที่ CoinGecko ส่งมา และส่ง query ต่อไปที่ CoinGecko จริง
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([
      { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
      { id: "bitcoin-cash", symbol: "BCH", name: "Bitcoin Cash" },
    ]);
    expect(coingeckoFetch).toHaveBeenCalledTimes(1);
    expect(String(coingeckoFetch.mock.calls[0][0])).toContain("query=bitcoin");
  });

  test("🔴 Sad Path: should return 401 Unauthorized when auth_token cookie is missing", async () => {
    const res = await app.request("/api/v1/assets/search-coins?q=bitcoin", {
      method: "GET",
    });

    expect(res.status).toBe(401);
    expect(coingeckoFetch).not.toHaveBeenCalled();
  });

  test.each([
    ["missing", "/api/v1/assets/search-coins"],
    ["empty", "/api/v1/assets/search-coins?q="],
    ["whitespace only", "/api/v1/assets/search-coins?q=%20%20"],
  ])(
    "🔴 Sad Path: should return 400 Bad Request when q is %s, without calling CoinGecko",
    async (_name, url) => {
      const { authHeader } = await createTestUserWithToken();

      const res = await app.request(url, {
        method: "GET",
        headers: { ...authHeader },
      });

      expect(res.status).toBe(400);
      expect(coingeckoFetch).not.toHaveBeenCalled();
    },
  );

  test("🔴 Sad Path: should return 502 Bad Gateway when CoinGecko is unavailable", async () => {
    const { authHeader } = await createTestUserWithToken();
    coingeckoFetch.mockRejectedValue(new Error("network down"));

    const res = await app.request("/api/v1/assets/search-coins?q=bitcoin", {
      method: "GET",
      headers: { ...authHeader },
    });

    expect(res.status).toBe(502);
  });
});

describe("GET /api/v1/assets/search-coins - hardening", () => {
  beforeEach(() => {
    fakeRedis.reset();
    coingeckoFetch.mockReset();
    vi.stubGlobal("fetch", coingeckoFetch);
    stubCoinGeckoSearch([{ id: "bitcoin", name: "Bitcoin", symbol: "BTC" }]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  const search = (
    authHeader: Record<string, string>,
    q: string,
    ip?: string,
  ) =>
    app.request(`/api/v1/assets/search-coins?q=${encodeURIComponent(q)}`, {
      method: "GET",
      headers: { ...authHeader, ...(ip ? { "x-forwarded-for": ip } : {}) },
    });

  describe("max length of q", () => {
    test("🟢 should accept q of exactly 50 characters", async () => {
      const { authHeader } = await createTestUserWithToken();

      const res = await search(authHeader, "a".repeat(50));

      expect(res.status).toBe(200);
    });

    test("🔴 should return 400 for q longer than 50 characters, without calling CoinGecko", async () => {
      const { authHeader } = await createTestUserWithToken();

      const res = await search(authHeader, "a".repeat(51));

      expect(res.status).toBe(400);
      expect(coingeckoFetch).not.toHaveBeenCalled();
    });
  });

  describe("cache", () => {
    test("🟢 should call CoinGecko once for the same query (case and spaces ignored)", async () => {
      const { authHeader } = await createTestUserWithToken();

      const first = await search(authHeader, "bitcoin");
      const second = await search(authHeader, "  BitCoin ");

      expect(second.status).toBe(200);
      expect(await second.json()).toEqual(await first.json());
      expect(coingeckoFetch).toHaveBeenCalledTimes(1);
    });

    test("🟢 should call CoinGecko again for a different query", async () => {
      const { authHeader } = await createTestUserWithToken();

      await search(authHeader, "bitcoin");
      await search(authHeader, "ethereum");

      expect(coingeckoFetch).toHaveBeenCalledTimes(2);
    });

    test("🟢 should call CoinGecko again after the cache expires (60s)", async () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      const { authHeader } = await createTestUserWithToken();

      await search(authHeader, "bitcoin");
      vi.setSystemTime(Date.now() + 59_000);
      await search(authHeader, "bitcoin");
      expect(coingeckoFetch).toHaveBeenCalledTimes(1);

      vi.setSystemTime(Date.now() + 2_000);
      await search(authHeader, "bitcoin");
      expect(coingeckoFetch).toHaveBeenCalledTimes(2);
    });

    test("🔴 should not cache a failed CoinGecko call", async () => {
      const { authHeader } = await createTestUserWithToken();
      coingeckoFetch.mockRejectedValueOnce(new Error("network down"));

      const failed = await search(authHeader, "bitcoin");
      const retried = await search(authHeader, "bitcoin");

      expect(failed.status).toBe(502);
      expect(retried.status).toBe(200);
      expect(coingeckoFetch).toHaveBeenCalledTimes(2);
    });

    test("🔴 should still search via CoinGecko when Redis is down (fail-open)", async () => {
      const { authHeader } = await createTestUserWithToken();
      fakeRedis.failing = true;

      const res = await search(authHeader, "bitcoin");

      expect(res.status).toBe(200);
      expect(coingeckoFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("rate limit per IP", () => {
    test("🔴 should return 429 with Retry-After after 30 requests from the same IP, without calling CoinGecko again", async () => {
      const { authHeader } = await createTestUserWithToken();
      const ip = "198.51.100.77";
      for (let i = 0; i < 30; i++) {
        expect((await search(authHeader, `coin${i}`, ip)).status).toBe(200);
      }
      const callsBefore = coingeckoFetch.mock.calls.length;

      const blocked = await search(authHeader, "one-more", ip);

      expect(blocked.status).toBe(429);
      const retryAfter = Number(blocked.headers.get("Retry-After"));
      expect(retryAfter).toBeGreaterThanOrEqual(1);
      expect(retryAfter).toBeLessThanOrEqual(60);
      expect(coingeckoFetch.mock.calls.length).toBe(callsBefore);
    });

    test("🟢 should not limit a different IP", async () => {
      const { authHeader } = await createTestUserWithToken();
      for (let i = 0; i < 31; i++) {
        await search(authHeader, `coin${i}`, "198.51.100.78");
      }

      const res = await search(authHeader, "bitcoin", "198.51.100.79");

      expect(res.status).toBe(200);
    });

    test("🔴 should return 401 (not consume the limit) when not logged in", async () => {
      const res = await app.request("/api/v1/assets/search-coins?q=bitcoin", {
        method: "GET",
        headers: { "x-forwarded-for": "198.51.100.80" },
      });

      expect(res.status).toBe(401);
      expect(
        [...fakeRedis.store.keys()].some((key) => key.includes("search-coins")),
      ).toBe(false);
    });
  });
});
