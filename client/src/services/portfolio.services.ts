import { api } from "../api/axios";

export interface PortfolioHolding {
  id: string;
  portfolioId: string;
  assetId: string;
  quantity: string;
  avgCostPerUnit: string;
  asset: {
    id: string;
    name: string;
    symbol: string;
    assetType: string;
  };
}

export interface Portfolio {
  id: string;
  userId: string;
  holdings: PortfolioHolding[];
}

export const portfolioService = {
  getPortfolio: async (): Promise<Portfolio> => {
    const response = await api.get<Portfolio>("/portfolio");
    return response.data;
  },
};
