import { useQuery } from "@tanstack/react-query";
import { portfolioService } from "../services/portfolio.services";

// ดึงประวัติธุรกรรมซื้อขายทั้งหมด
// queryKey ซ้อนใต้ "portfolio" เพื่อให้ invalidateQueries({ queryKey: ["portfolio"] })
// รีเฟรชทั้งยอด holding (/portfolio) และประวัติ (/portfolio/transactions) พร้อมกันทีเดียวตอนมี mutation
export const usePortfolioTransactionsQuery = () => {
  return useQuery({
    queryKey: ["portfolio", "transactions"],
    queryFn: portfolioService.getPortfolioTransactions,
  });
};
