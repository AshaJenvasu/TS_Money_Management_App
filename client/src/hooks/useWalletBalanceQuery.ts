import { useQuery } from "@tanstack/react-query";
import { walletService } from "../services/wallet.services";

// ดึงยอดเงินของ Wallet ตาม ID ที่ระบุ
export const useWalletBalanceQuery = (walletId: string) => {
  return useQuery({
    queryKey: ["wallets", walletId, "balance"],
    queryFn: () => walletService.getWalletBalance(walletId),
    enabled: Boolean(walletId),
  });
};
