import { useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import {
  portfolioService,
  type PortfolioTransactionListItem,
} from "../../services/portfolio.services";
import { formatCurrency } from "../../utils/formatCurrency";

interface TransactionDeleteDialogProps {
  transaction: PortfolioTransactionListItem;
  onClose: () => void;
}

// Dialog ยืนยันการลบธุรกรรม เรียก DELETE /assets/:id/transactions/:transactionId
// backend คำนวณ holding ใหม่จากประวัติที่เหลือให้อัตโนมัติ ลบแล้วย้อนกลับไม่ได้
export function TransactionDeleteDialog({
  transaction,
  onClose,
}: TransactionDeleteDialogProps) {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState("");

  const isBuy = transaction.transactionType === "buy";

  const deleteMutation = useMutation({
    mutationFn: () =>
      portfolioService.deleteTransaction(
        transaction.assetId,
        transaction.transactionId,
      ),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      onClose();
    },

    onError: (error: unknown) => {
      if (axios.isAxiosError<{ message: string }>(error)) {
        if (error.response?.status === 409) {
          setErrorMessage(
            "ลบไม่ได้ เพราะจะทำให้ยอดถือครองของรายการที่เหลือติดลบ",
          );
          return;
        }
        if (error.response?.status === 404) {
          setErrorMessage("ไม่พบธุรกรรมนี้แล้ว");
          return;
        }
        setErrorMessage(error.response?.data?.message || "ลบไม่สำเร็จ");
        return;
      }
      setErrorMessage("เกิดข้อผิดพลาดที่ไม่คาดคิด");
    },
  });

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-transaction-title"
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#FFE3EC] text-[#CF3D6B]">
            <Trash2 size={22} />
          </div>
          <h3
            id="delete-transaction-title"
            className="text-xl font-bold text-[#39365F]"
          >
            ลบรายการนี้?
          </h3>
        </div>

        <p className="text-sm text-gray-600">
          {isBuy ? "ซื้อ" : "ขาย"}{" "}
          <span className="font-semibold">{transaction.symbol}</span> จำนวน{" "}
          {transaction.quantity} หน่วย ที่ ฿
          {formatCurrency(Number(transaction.pricePerUnit))} ต่อหน่วย
        </p>

        <div className="mt-3 rounded-xl bg-[#F3F5FD] px-3 py-2.5 text-sm text-[#5C6899]">
          ลบแล้วระบบจะคำนวณยอดถือครองและต้นทุนเฉลี่ยของ {transaction.symbol}{" "}
          ใหม่จากประวัติที่เหลือทั้งหมด การลบนี้ย้อนกลับไม่ได้
        </div>

        {errorMessage && (
          <p className="mt-3 text-sm text-error">{errorMessage}</p>
        )}

        <div className="mt-6 flex justify-end gap-3">
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
            className="btn border-0 bg-[#CF3D6B] text-white hover:bg-[#B52F58]"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                กำลังลบ...
              </>
            ) : (
              "ลบรายการ"
            )}
          </button>
        </div>
      </div>

      <button
        type="button"
        className="absolute inset-0 -z-10 cursor-default"
        aria-label="ปิด Popup"
        onClick={() => {
          if (!deleteMutation.isPending) {
            onClose();
          }
        }}
      />
    </div>,
    document.body,
  );
}
