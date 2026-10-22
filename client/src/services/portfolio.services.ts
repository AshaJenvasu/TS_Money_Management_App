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

// ชนิดของธุรกรรมซื้อขาย ตรงกับ Prisma enum PortfolioTransactionType
export type PortfolioTransactionType = "buy" | "sell";

// รายการธุรกรรมซื้อขายหนึ่งรายการ
export interface PortfolioTransactionListItem {
  transactionId: string;
  portfolioId: string;
  assetId: string;
  assetName: string;
  symbol: string;
  transactionType: PortfolioTransactionType;
  quantity: string;
  pricePerUnit: string;
  transactionDate: string;
}

// field ผสม camelCase/snake_case ตาม backend จริง ห้ามแก้ตามสัญชาตญาณ
export interface CreatePortfolioTransactionPayload {
  assetId: string;
  transaction_type: PortfolioTransactionType;
  quantity: string;
  price_per_unit: string;
  transaction_date: string;
}

export interface CreatePortfolioTransactionResult {
  transaction: {
    id: string;
    portfolioId: string;
    assetId: string;
    transaction_type: PortfolioTransactionType;
    quantity: string;
    price_per_unit: string;
    transaction_date: string;
  };
  holding: {
    id: string;
    assetId: string;
    quantity: string;
    avgCostPerUnit: string;
  };
}

// แก้ไขธุรกรรม ทุก field เป็น optional ส่งเฉพาะที่เปลี่ยน
export interface UpdatePortfolioTransactionPayload {
  transaction_type?: PortfolioTransactionType;
  quantity?: string;
  price_per_unit?: string;
  transaction_date?: string;
}

export interface UpdatePortfolioTransactionResult {
  transactionId: string;
  assetId: string;
  quantity: string;
  avgCostPerUnit: string;
}

export interface DeletePortfolioTransactionResult {
  message: string;
  transactionId: string;
  assetId: string;
  quantity: string;
  avgCostPerUnit: string;
}

export const portfolioService = {
  getPortfolio: async (): Promise<Portfolio> => {
    const response = await api.get<Portfolio>("/portfolio");
    return response.data;
  },

  // ดึงประวัติธุรกรรมซื้อขายทั้งหมดของ Portfolio ไม่แยกตาม Asset
  getPortfolioTransactions: async (): Promise<
    PortfolioTransactionListItem[]
  > => {
    const response = await api.get<{
      transactions: PortfolioTransactionListItem[];
    }>("/portfolio/transactions");
    return response.data.transactions;
  },

  // บันทึกธุรกรรมซื้อ/ขาย backend คำนวณ holding ใหม่ให้อัตโนมัติ
  createTransaction: async (
    payload: CreatePortfolioTransactionPayload,
  ): Promise<CreatePortfolioTransactionResult> => {
    const response = await api.post<CreatePortfolioTransactionResult>(
      "/portfolio/transactions",
      payload,
    );
    return response.data;
  },

  // แก้ไขธุรกรรม backend คำนวณ holding ใหม่จากประวัติทั้งหมดอีกครั้ง
  updateTransaction: async (
    assetId: string,
    transactionId: string,
    payload: UpdatePortfolioTransactionPayload,
  ): Promise<UpdatePortfolioTransactionResult> => {
    const response = await api.put<UpdatePortfolioTransactionResult>(
      `/assets/${assetId}/transactions/${transactionId}`,
      payload,
    );
    return response.data;
  },

  // ลบธุรกรรม backend คำนวณ holding ใหม่จากประวัติที่เหลือ
  deleteTransaction: async (
    assetId: string,
    transactionId: string,
  ): Promise<DeletePortfolioTransactionResult> => {
    const response = await api.delete<DeletePortfolioTransactionResult>(
      `/assets/${assetId}/transactions/${transactionId}`,
    );
    return response.data;
  },
};
