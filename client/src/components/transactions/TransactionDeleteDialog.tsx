import { createPortal } from "react-dom";
import { AlertTriangle, Trash2 } from "lucide-react";
import axios from "axios";
import type { Transaction } from "../../services/transaction.services";
import { useDeleteTransactionMutation } from "../../hooks/useTransactionsQuery";
import { formatCurrency } from "../../utils/formatCurrency";

interface TransactionDeleteDialogProps {
  transaction: Transaction;
  walletName: string;
  onClose: () => void;
}

export default function TransactionDeleteDialog({
  transaction,
  walletName,
  onClose,
}: TransactionDeleteDialogProps) {
  const deleteMutation = useDeleteTransactionMutation();

  const handleDelete = () => {
    deleteMutation.mutate(
      {
        walletId: transaction.wallet_id,
        transactionId: transaction.id,
      },
      {
        onSuccess: onClose,
        onError: (error: unknown) => {
          if (axios.isAxiosError<{ message?: string }>(error)) {
            // แสดงข้อความจาก API หากลบไม่สำเร็จ
            window.alert(
              error.response?.data?.message ??
                "ลบรายการไม่สำเร็จ กรุณาลองอีกครั้ง",
            );
            return;
          }

          window.alert("เกิดข้อผิดพลาดที่ไม่คาดคิด");
        },
      },
    );
  };

  const isIncome = transaction.transaction_type === "income";

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-transaction-title"
        aria-describedby="delete-transaction-description"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h2
              id="delete-transaction-title"
              className="text-xl font-bold text-[#39365F]"
            >
              ยืนยันการลบรายการ
            </h2>
            <p className="text-sm text-gray-500">
              การลบนี้ไม่สามารถย้อนกลับได้
            </p>
          </div>
        </div>

        <div
          id="delete-transaction-description"
          className="mb-6 rounded-xl bg-gray-50 p-4 text-sm text-[#39365F]"
        >
          <p className="font-semibold">
            {transaction.note?.trim() || "ไม่มีหมายเหตุ"}
          </p>
          <p className="mt-1 text-gray-500">{walletName}</p>
          <p
            className={`mt-2 font-bold ${
              isIncome ? "text-green-600" : "text-red-600"
            }`}
          >
            {isIncome ? "+" : "-"}
            {formatCurrency(Number(transaction.amount))}
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="btn"
            onClick={onClose}
            disabled={deleteMutation.isPending}
          >
            ยกเลิก
          </button>
          <button
            type="button"
            className="btn border-0 bg-red-600 text-white hover:bg-red-700"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              "กำลังลบ..."
            ) : (
              <>
                <Trash2 size={16} />
                ยืนยันการลบ
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
