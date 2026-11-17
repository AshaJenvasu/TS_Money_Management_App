import { redis } from "../config/redis.js";
import { logger } from "../utils/logger.js";

const COINGECKO_SEARCH_URL = "https://api.coingecko.com/api/v3/search";
const COINGECKO_TIMEOUT_MS = 5000;

// cache ผลค้นหาสั้น ๆ กันยิง CoinGecko ซ้ำเมื่อพิมพ์คำเดิมถี่ ๆ (key แยกตามคำค้นที่ trim + ตัวพิมพ์เล็กแล้ว)
const SEARCH_CACHE_TTL_SECONDS = 60;
const searchCacheKey = (query: string) =>
  `coin-search:${query.trim().toLowerCase()}`;

export interface CoinSearchResult {
  id: string;
  symbol: string;
  name: string;
}

interface CoinGeckoSearchResponse {
  coins: Array<{ id: string; symbol: string; name: string }>;
}

export class CoinSearchService {
  // ค้นหาเหรียญแบบ real-time จาก CoinGecko ไม่เก็บรายชื่อเหรียญไว้ใน DB ของเราเอง
  static async search(query: string): Promise<CoinSearchResult[]> {
    const cacheKey = searchCacheKey(query);

    // Redis ล่มต้องไม่ทำให้ค้นหาเหรียญใช้ไม่ได้: อ่าน/เขียน cache พลาดก็ข้ามไปถาม CoinGecko ตรง
    try {
      const cached = await redis.get<CoinSearchResult[]>(cacheKey);
      if (cached !== null) return cached;
    } catch (error) {
      logger.warn({ err: error }, "Coin search cache read failed");
    }

    const coins = await CoinSearchService.fetchFromCoinGecko(query);

    // cache เฉพาะผลที่สำเร็จ (ถ้า CoinGecko ล้มจะ throw ก่อนถึงตรงนี้ จึงไม่ cache ความล้มเหลว)
    try {
      await redis.set(cacheKey, coins, { ex: SEARCH_CACHE_TTL_SECONDS });
    } catch (error) {
      logger.warn({ err: error }, "Coin search cache write failed");
    }

    return coins;
  }

  private static async fetchFromCoinGecko(
    query: string,
  ): Promise<CoinSearchResult[]> {
    const params = new URLSearchParams({ query });
    const response = await fetch(`${COINGECKO_SEARCH_URL}?${params}`, {
      signal: AbortSignal.timeout(COINGECKO_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`CoinGecko responded with HTTP ${response.status}`);
    }

    const data = (await response.json()) as CoinGeckoSearchResponse;
    return data.coins.map(({ id, symbol, name }) => ({ id, symbol, name }));
  }
}
