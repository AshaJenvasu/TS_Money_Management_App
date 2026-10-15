import { useQueries, useQuery } from "@tanstack/react-query";
import { transactionService } from "../services/transaction.services";

export const useTransactionsQuery = (walletIds: string[]) => {
  return useQueries({
    queries: walletIds.map((walletId) => ({
      queryKey: ["transactions", walletId],
      queryFn: () => transactionService.getTransactions(walletId),
    })),
  });
};

// ดึง Transactions จากทุก Wallet ตามหน้าที่เลือก
export const useAllTransactionsQuery = (
  page: number = 1,
  limit: number = 5,
) => {
  return useQuery({
    queryKey: ["transactions", "all", page, limit],
    queryFn: () => transactionService.getAllTransactions(page, limit),
  });
};

//useQuery ใช้ดึงข้อมูล ชุดเดียว ต่อหนึ่งครั้งที่เรียก

//useQueries ใช้ดึงข้อมูล หลายชุด พร้อมกัน โดยรับเป็น array และจำนวนคิวรีเปลี่ยนได้ตามข้อมูล

//สิ่งที่ตัดสินคือ "จำนวนคำขอ (request)" ไม่ใช่ "จำนวนข้อมูลที่ได้กลับมา" ฟังก์ชันของเราเรียก API ครั้งเดียว แล้วได้ transaction กลับมาเป็น array ทั้งก้อน
