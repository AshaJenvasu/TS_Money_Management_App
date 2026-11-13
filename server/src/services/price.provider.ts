import { redis } from "../config/redis.js";

// สกุลเงินของราคาตลาด ต้องตรงกับสกุลที่ UI แสดงและที่ user กรอกต้นทุน (บาท) ไม่งั้น P&L จะผิด
const PRICE_CURRENCY = "thb";

// ผู้ให้ราคาตลาด: รับ CoinGecko id (เช่น "bitcoin") คืน Map ของ id -> ราคาเป็นบาท เฉพาะ id ที่หาราคาเจอ
// ใช้ id แทน ticker symbol เพราะ symbol ซ้ำกันได้ ทำให้ได้ราคาผิดเหรียญ
export interface PriceProvider {
  getPrices(coinIds: string[]): Promise<Map<string, number>>;
}

// Cache-aside: เช็ค Redis ก่อนเสมอ ถ้า miss ค่อยถาม provider จริงแล้ว cache ทับ
const PRICE_CACHE_TTL_SECONDS = 120;

// ผล "ไม่เจอ" (เช่นเหรียญถูก delist) cache สั้น ๆ กันยิง CoinGecko ซ้ำทุก request แต่ยังลองใหม่ได้เมื่อหมดอายุ
const NOT_FOUND_MARKER = "not-found";
const NOT_FOUND_CACHE_TTL_SECONDS = 300;

export class CachedPriceProvider implements PriceProvider {
  constructor(private readonly inner: PriceProvider) {}

  async getPrices(coinIds: string[]): Promise<Map<string, number>> {
    const prices = new Map<string, number>();
    const missing: string[] = [];

    for (const coinId of coinIds) {
      const cached = await redis.get<number | typeof NOT_FOUND_MARKER>(
        `price:${PRICE_CURRENCY}:${coinId}`,
      );
      if (cached === null) {
        missing.push(coinId);
      } else if (cached !== NOT_FOUND_MARKER) {
        prices.set(coinId, cached);
      }
    }

    if (missing.length > 0) {
      const fetched = await this.inner.getPrices(missing);
      for (const [coinId, price] of fetched) {
        prices.set(coinId, price);
        await redis.set(`price:${PRICE_CURRENCY}:${coinId}`, price, {
          ex: PRICE_CACHE_TTL_SECONDS,
        });
      }

      for (const coinId of missing) {
        if (!fetched.has(coinId)) {
          await redis.set(`price:${PRICE_CURRENCY}:${coinId}`, NOT_FOUND_MARKER, {
            ex: NOT_FOUND_CACHE_TTL_SECONDS,
          });
        }
      }
    }

    return prices;
  }
}

interface CoinGeckoMarketItem {
  id: string;
  current_price: number | null;
}

const COINGECKO_MARKETS_URL = "https://api.coingecko.com/api/v3/coins/markets";
const COINGECKO_TIMEOUT_MS = 5000;

export class CoinGeckoPriceProvider implements PriceProvider {
  async getPrices(coinIds: string[]): Promise<Map<string, number>> {
    const prices = new Map<string, number>();
    if (coinIds.length === 0) return prices;

    const query = new URLSearchParams({
      vs_currency: PRICE_CURRENCY,
      ids: coinIds.join(","),
    });
    const response = await fetch(`${COINGECKO_MARKETS_URL}?${query}`, {
      signal: AbortSignal.timeout(COINGECKO_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`CoinGecko responded with HTTP ${response.status}`);
    }
    const items = (await response.json()) as CoinGeckoMarketItem[];

    for (const item of items) {
      if (item.current_price !== null) {
        prices.set(item.id, item.current_price);
      }
    }
    return prices;
  }
}
