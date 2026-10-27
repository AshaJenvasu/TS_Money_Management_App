import { api } from "../api/axios";

export interface Transaction {
  id: string;
  wallet_id: string;
  transaction_type: "income" | "expense";
  amount: string;
  note: string | null;
  transaction_date: string;
  created_at: string;
}

// รูปแบบ Pagination ที่ Backend ส่งกลับมา
export interface TransactionPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Response สำหรับ Transaction หลาย Wallet
export interface PaginatedTransactionsResponse {
  data: Transaction[];
  pagination: TransactionPagination;
}

// กำหนดข้อมูลที่ส่งไปแก้ไข Transaction
export interface UpdateTransactionPayload {
  transaction_type: "income" | "expense";
  amount: string;
  note: string | null;
  transaction_date: string;
}

export interface CreateTransactionPayload {
  transaction_type: "income" | "expense";
  amount: string;
  note: string | null;
  transaction_date: string;
}

// กำหนดพารามิเตอร์ filter วันที่และ pagination ที่ backend รองรับ
export interface GetTransactionsParams {
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export const transactionService = {
  // ดึง Transactions ตาม Wallet ID พร้อม filter วันที่และ pagination (Wallet Detail)
  getTransactions: async (
    walletId: string,
    params?: GetTransactionsParams,
  ): Promise<PaginatedTransactionsResponse> => {
    const response = await api.get<PaginatedTransactionsResponse>(
      `/wallets/${walletId}/transactions`,
      { params },
    );

    return response.data;
  },

  // ดึง Transactions จากทุก Wallet พร้อม Pagination (Dashboard)
  getAllTransactions: async (
    page: number = 1,
    limit: number = 5,
    from?: string,
    to?: string,
  ): Promise<PaginatedTransactionsResponse> => {
    const response = await api.get<PaginatedTransactionsResponse>(
      "/transactions",
      {
        params: { page, limit, from, to },
      },
    );

    return response.data;
  },

  // update Transaction
  updateTransaction: async (
    walletId: string,
    transactionId: string,
    payload: UpdateTransactionPayload,
  ): Promise<Transaction> => {
    const response = await api.put<Transaction>(
      `/wallets/${walletId}/transactions/${transactionId}`,
      payload,
    );
    return response.data;
  },

  // delete Transaction
  deleteTransaction: async (
    walletId: string,
    transactionId: string,
  ): Promise<void> => {
    await api.delete(`/wallets/${walletId}/transactions/${transactionId}`);
  },

  createTransaction: async (
    walletId: string,
    payload: CreateTransactionPayload,
  ): Promise<Transaction> => {
    const response = await api.post<Transaction>(
      `/wallets/${walletId}/transactions`,
      payload,
    );

    return response.data;
  },
};
