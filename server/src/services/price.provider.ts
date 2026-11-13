import { redis } from "../config/redis.js";

// ผู้ให้ราคาตลาด: คืน Map ของ symbol (ตัวพิมพ์ใหญ่) -> ราคา USD เฉพาะ symbol ที่หาราคาเจอ
export interface PriceProvider {
  getPrices(symbols: string[]): Promise<Map<string, number>>;
}

// Cache-aside: เช็ค Redis ก่อนเสมอ ถ้า miss ค่อยถาม provider จริงแล้ว cache ทับ
const PRICE_CACHE_TTL_SECONDS = 120;

export class CachedPriceProvider implements PriceProvider {
  constructor(private readonly inner: PriceProvider) {}

  async getPrices(symbols: string[]): Promise<Map<string, number>> {
    const prices = new Map<string, number>();
    const missing: string[] = [];

    for (const symbol of symbols) {
      const cached = await redis.get<number>(`price:usd:${symbol}`);
      if (cached === null) {
        missing.push(symbol);
      } else {
        prices.set(symbol, cached);
      }
    }

    if (missing.length > 0) {
      const fetched = await this.inner.getPrices(missing);
      for (const [symbol, price] of fetched) {
        prices.set(symbol, price);
        await redis.set(`price:usd:${symbol}`, price, {
          ex: PRICE_CACHE_TTL_SECONDS,
        });
      }
    }

    return prices;
  }
}

interface CoinGeckoMarketItem {
  symbol: string;
  current_price: number | null;
}

const COINGECKO_MARKETS_URL = "https://api.coingecko.com/api/v3/coins/markets";
const COINGECKO_TIMEOUT_MS = 5000;

export class CoinGeckoPriceProvider implements PriceProvider {
  async getPrices(symbols: string[]): Promise<Map<string, number>> {
    const prices = new Map<string, number>();
    if (symbols.length === 0) return prices;

    const query = new URLSearchParams({
      vs_currency: "usd",
      symbols: symbols.map((symbol) => symbol.toLowerCase()).join(","),
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
        prices.set(item.symbol.toUpperCase(), item.current_price);
      }
    }
    return prices;
  }
}
