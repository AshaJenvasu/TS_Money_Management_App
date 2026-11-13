const COINGECKO_SEARCH_URL = "https://api.coingecko.com/api/v3/search";
const COINGECKO_TIMEOUT_MS = 5000;

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
