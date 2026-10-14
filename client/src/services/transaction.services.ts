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

export const transactionService = {
  // ดึง Transactions ตาม Wallet ID
  getTransactions: async (walletId: string): Promise<Transaction[]> => {
    const response = await api.get<Transaction[]>(
      `/wallets/${walletId}/transactions`,
    );

    return response.data;
  },
};
