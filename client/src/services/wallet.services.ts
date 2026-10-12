import { api } from "../api/axios";

// รูปแบบข้อมูล Wallet ที่ Backend ส่งกลับมา
export interface Wallet {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// รูปแบบยอดเงินของ Wallet
export interface WalletBalance {
  balance: string;
}

export const walletService = {
  // ดึง Wallet ทั้งหมด
  getWallets: async (): Promise<Wallet[]> => {
    const response = await api.get<Wallet[]>("/wallets");
    return response.data;
  },

  // ดึงยอดเงินของ Wallet ตาม ID
  getWalletBalance: async (walletId: string): Promise<WalletBalance> => {
    const response = await api.get<WalletBalance>(
      `/wallets/${walletId}/balance`,
    );
    return response.data;
  },
};
