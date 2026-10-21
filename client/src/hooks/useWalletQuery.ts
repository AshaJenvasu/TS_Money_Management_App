import { useQuery } from "@tanstack/react-query";
import { walletService } from "../services/wallet.services";

// ดึงข้อมูล wallet เดียวตาม publicId (ใช้ตอนเปิดหน้า Wallet Detail)
export const useWalletQuery = (publicId: string) => {
  return useQuery({
    queryKey: ["wallets", publicId],
    queryFn: () => walletService.getWalletById(publicId),
    enabled: Boolean(publicId),
  });
};
