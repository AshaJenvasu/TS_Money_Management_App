// ผู้ให้ราคาตลาด: คืน Map ของ symbol (ตัวพิมพ์ใหญ่) -> ราคา USD เฉพาะ symbol ที่หาราคาเจอ
export interface PriceProvider {
  getPrices(symbols: string[]): Promise<Map<string, number>>;
}

interface CoinGeckoMarketItem {
  symbol: string;
  current_price: number | null;
}

const COINGECKO_MARKETS_URL = "https://api.coingecko.com/api/v3/coins/markets";

export class CoinGeckoPriceProvider implements PriceProvider {
  async getPrices(symbols: string[]): Promise<Map<string, number>> {
    const prices = new Map<string, number>();
    if (symbols.length === 0) return prices;

    const query = new URLSearchParams({
      vs_currency: "usd",
      symbols: symbols.map((symbol) => symbol.toLowerCase()).join(","),
    });
    const response = await fetch(`${COINGECKO_MARKETS_URL}?${query}`);
    const items = (await response.json()) as CoinGeckoMarketItem[];

    for (const item of items) {
      if (item.current_price !== null) {
        prices.set(item.symbol.toUpperCase(), item.current_price);
      }
    }
    return prices;
  }
}
