import { useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import {
  portfolioService,
  type PortfolioTransactionListItem,
  type PortfolioTransactionType,
} from "../../services/portfolio.services";
import { formatCurrency } from "../../utils/formatCurrency";

interface TransactionEditDialogProps {
  transaction: PortfolioTransactionListItem;
  onClose: () => void;
}

// Dialog แก้ไขธุรกรรม เรียก PUT /assets/:id/transactions/:transactionId
// เปลี่ยน asset ไม่ได้ เพราะ endpoint ผูกกับ assetId เดิมตาม path เสมอ
export function TransactionEditDialog({
  transaction,
  onClose,
}: TransactionEditDialogProps) {
  const queryClient = useQueryClient();

  const [transactionType, setTransactionType] =
    useState<PortfolioTransactionType>(transaction.transactionType);
  const [quantity, setQuantity] = useState(transaction.quantity);
  const [pricePerUnit, setPricePerUnit] = useState(transaction.pricePerUnit);
  const [date, setDate] = useState(transaction.transactionDate.slice(0, 10));
  const [validationError, setValidationError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const quantityValue = Number(quantity) || 0;
  const priceValue = Number(pricePerUnit) || 0;
  const total = quantityValue * priceValue;

  const updateMutation = useMutation({
    mutationFn: () =>
      portfolioService.updateTransaction(
        transaction.assetId,
        transaction.transactionId,
        {
          transaction_type: transactionType,
          quantity: quantity.trim(),
          price_per_unit: pricePerUnit.trim(),
          transaction_date: new Date(date).toISOString(),
        },
      ),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      onClose();
    },

    onError: (error: unknown) => {
      if (axios.isAxiosError<{ message: string }>(error)) {
        if (error.response?.status === 409) {
          setErrorMessage("แก้ไขไม่ได้ เพราะจะทำให้ยอดถือครองติดลบ");
          return;
        }
        if (error.response?.status === 404) {
          setErrorMessage("ไม่พบธุรกรรมนี้แล้ว");
          return;
        }
        setErrorMessage(
          error.response?.data?.message || "แก้ไขธุรกรรมไม่สำเร็จ",
        );
        return;
      }
      setErrorMessage("เกิดข้อผิดพลาดที่ไม่คาดคิด");
    },
  });

  const handleUpdate = () => {
    if (quantityValue <= 0) {
      setValidationError("กรุณากรอกจำนวนให้มากกว่า 0");
      return;
    }

    if (priceValue <= 0) {
      setValidationError("กรุณากรอกราคาต่อหน่วยให้มากกว่า 0");
      return;
    }

    if (!date) {
      setValidationError("กรุณาเลือกวันที่");
      return;
    }

    setValidationError("");
    setErrorMessage("");
    updateMutation.mutate();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-transaction-title"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h3
          id="edit-transaction-title"
          className="mb-1 text-xl font-bold text-[#39365F]"
        >
          แก้ไขธุรกรรม
        </h3>
        <p className="mb-5 text-sm text-gray-500">
          {transaction.symbol} · {transaction.assetName}
        </p>

        <div className="mb-4 flex gap-3">
          <button
            type="button"
            onClick={() => setTransactionType("buy")}
            disabled={updateMutation.isPending}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition ${
              transactionType === "buy"
                ? "border-[#14775A] bg-[#DDF5EA] text-[#14775A]"
                : "border-gray-200 text-gray-500"
            }`}
          >
            <ArrowDownCircle size={16} />
            BUY
          </button>
          <button
            type="button"
            onClick={() => setTransactionType("sell")}
            disabled={updateMutation.isPending}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition ${
              transactionType === "sell"
                ? "border-[#CF3D6B] bg-[#FFE3EC] text-[#CF3D6B]"
                : "border-gray-200 text-gray-500"
            }`}
          >
            <ArrowUpCircle size={16} />
            SELL
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <label className="form-control">
            <span className="label-text mb-2 font-medium text-[#39365F]">
              Asset
            </span>
            <input
              type="text"
              className="input input-bordered w-full bg-gray-100 text-[#39365F]"
              value={`${transaction.symbol} — ${transaction.assetName}`}
              disabled
            />
          </label>

          <label className="form-control">
            <span className="label-text mb-2 font-medium text-[#39365F]">
              Quantity
            </span>
            <input
              type="number"
              step="any"
              min="0"
              className="input input-bordered w-full bg-white text-[#39365F] focus:border-[#7566C7] focus:outline-none"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                setValidationError("");
                setErrorMessage("");
              }}
              disabled={updateMutation.isPending}
            />
          </label>

          <label className="form-control">
            <span className="label-text mb-2 font-medium text-[#39365F]">
              Price / Unit
            </span>
            <input
              type="number"
              step="any"
              min="0"
              className="input input-bordered w-full bg-white text-[#39365F] focus:border-[#7566C7] focus:outline-none"
              value={pricePerUnit}
              onChange={(e) => {
                setPricePerUnit(e.target.value);
                setValidationError("");
                setErrorMessage("");
              }}
              disabled={updateMutation.isPending}
            />
          </label>

          <label className="form-control">
            <span className="label-text mb-2 font-medium text-[#39365F]">
              Date
            </span>
            <input
              type="date"
              className="input input-bordered w-full bg-white text-[#39365F] focus:border-[#7566C7] focus:outline-none"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setValidationError("");
                setErrorMessage("");
              }}
              disabled={updateMutation.isPending}
            />
          </label>

          <div className="rounded-xl bg-[#F3F5FD] px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#5C6899]">Total</span>
              <span className="text-lg font-extrabold text-[#1F2A5C]">
                ฿{formatCurrency(total)}
              </span>
            </div>
          </div>

          {validationError && (
            <p className="text-sm text-error">{validationError}</p>
          )}
          {errorMessage && <p className="text-sm text-error">{errorMessage}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="btn"
            onClick={onClose}
            disabled={updateMutation.isPending}
          >
            ยกเลิก
          </button>

          <button
            type="button"
            className="btn border-0 bg-[#7566C7] text-white hover:bg-[#6356B8]"
            onClick={handleUpdate}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                กำลังบันทึก...
              </>
            ) : (
              "บันทึก"
            )}
          </button>
        </div>
      </div>

      <button
        type="button"
        className="absolute inset-0 -z-10 cursor-default"
        aria-label="ปิด Popup"
        onClick={() => {
          if (!updateMutation.isPending) {
            onClose();
          }
        }}
      />
    </div>,
    document.body,
  );
}
