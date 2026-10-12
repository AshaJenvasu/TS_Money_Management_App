import { useQuery } from "@tanstack/react-query";
import { walletService } from "../services/wallet.services";

export const useWalletsQuery = () => {
  return useQuery({
    // ใช้ระบุข้อมูล Wallet ใน Query Cache
    queryKey: ["wallets"],

    // ฟังก์ชันที่เรียก Backend API
    queryFn: walletService.getWallets,
  });
};

/*🧠 ทำความเข้าใจแนวคิด
- useQuery() จัดการการดึงข้อมูลและเก็บ Cache ให้เรา
- queryKey: ["wallets"] เป็นชื่ออ้างอิงข้อมูลชุดนี้ใน Cache
- queryFn คือฟังก์ชันที่ TanStack Query เรียกเพื่อดึงข้อมูลจาก API
- ถ้าดึงไม่สำเร็จ TanStack Query จะจัดการ Error State ให้เรา */
