import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import app from "../../index";
import { createTestUserWithToken } from "../helpers/auth";

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
