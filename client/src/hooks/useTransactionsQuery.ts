import { useQueries } from "@tanstack/react-query";
import { transactionService } from "../services/transaction.services";

export const useTransactionsQuery = (walletIds: string[]) => {
  return useQueries({
    queries: walletIds.map((walletId) => ({
      queryKey: ["transactions", walletId],
      queryFn: () => transactionService.getTransactions(walletId),
    })),
  });
};
