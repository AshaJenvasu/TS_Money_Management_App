import {
  useQueries,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  transactionService,
  type UpdateTransactionPayload,
  type CreateTransactionPayload,
} from "../services/transaction.services";
import type { GetTransactionsParams } from "../services/transaction.services";
export const useTransactionsQuery = (walletIds: string[]) => {
  return useQueries({
    queries: walletIds.map((walletId) => ({
      queryKey: ["transactions", walletId],
      queryFn: () => transactionService.getTransactions(walletId),
    })),
  });
};

// ดึง Transaction ของ wallet เดียว พร้อม filter วันที่และ pagination (ใช้ที่หน้า Wallet Detail)
export const useWalletTransactionsQuery = (
  walletId: string,
  params?: GetTransactionsParams,
) => {
  return useQuery({
    queryKey: ["transactions", walletId, params],
    queryFn: () => transactionService.getTransactions(walletId, params),
    enabled: !!walletId,
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

// เชื่อม Mutation กับ Cache ของรายการธุรกรรม
export const useUpdateTransactionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      walletId,
      transactionId,
      payload,
    }: {
      walletId: string;
      transactionId: string;
      payload: UpdateTransactionPayload;
    }) =>
      transactionService.updateTransaction(walletId, transactionId, payload),
    onSuccess: async () => {
      // รีเฟรชรายการธุรกรรมทั้งหมด
      await queryClient.invalidateQueries({
        queryKey: ["transactions"],
      });

      // รีเฟรช Wallet และยอดเงินของทุก Wallet
      await queryClient.invalidateQueries({
        queryKey: ["wallets"],
      });
    },
  });
};

// ลบ Transaction และรีเฟรชข้อมูลที่เกี่ยวข้อง
export const useDeleteTransactionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      walletId,
      transactionId,
    }: {
      walletId: string;
      transactionId: string;
    }) => transactionService.deleteTransaction(walletId, transactionId),
    onSuccess: async () => {
      // รีเฟรชรายการธุรกรรมทั้งหมด
      await queryClient.invalidateQueries({
        queryKey: ["transactions"],
      });

      // รีเฟรช Wallet และยอดเงินของทุก Wallet
      await queryClient.invalidateQueries({
        queryKey: ["wallets"],
      });
    },
  });
};

export const useCreateTransactionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      walletId,
      payload,
    }: {
      walletId: string;
      payload: CreateTransactionPayload;
    }) => transactionService.createTransaction(walletId, payload),

    onSuccess: async () => {
      // รีเฟรชรายการธุรกรรมทุกชุดหลังสร้างสำเร็จ
      await queryClient.invalidateQueries({
        queryKey: ["transactions"],
      });

      // รีเฟรชข้อมูล Wallet หากยอดเงินคงเหลืออยู่ใน Cache นี้
      await queryClient.invalidateQueries({
        queryKey: ["wallets"],
      });
    },
  });
};

//useQuery ใช้ดึงข้อมูล ชุดเดียว ต่อหนึ่งครั้งที่เรียก

//useQueries ใช้ดึงข้อมูล หลายชุด พร้อมกัน โดยรับเป็น array และจำนวนคิวรีเปลี่ยนได้ตามข้อมูล

//สิ่งที่ตัดสินคือ "จำนวนคำขอ (request)" ไม่ใช่ "จำนวนข้อมูลที่ได้กลับมา" ฟังก์ชันของเราเรียก API ครั้งเดียว แล้วได้ transaction กลับมาเป็น array ทั้งก้อน
