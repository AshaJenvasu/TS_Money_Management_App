import { useQuery } from "@tanstack/react-query";
import { portfolioService } from "../services/portfolio.services";

export function usePortfolioQuery() {
  return useQuery({
    queryKey: ["portfolio"],
    queryFn: portfolioService.getPortfolio,
  });
}
