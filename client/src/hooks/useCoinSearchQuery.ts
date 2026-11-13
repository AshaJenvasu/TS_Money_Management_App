import { useQuery } from "@tanstack/react-query";
import { assetService } from "../services/asset.services";

// ค้นหาเหรียญจาก CoinGecko เริ่มค้นเมื่อพิมพ์ตั้งแต่ 2 ตัวอักษรขึ้นไป
export const useCoinSearchQuery = (query: string) => {
  const trimmedQuery = query.trim();

  return useQuery({
    queryKey: ["coin-search", trimmedQuery],
    queryFn: () => assetService.searchCoins(trimmedQuery),
    enabled: trimmedQuery.length >= 2,
    staleTime: 60_000,
    retry: false,
  });
};
