import { useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import {
  portfolioService,
  type PortfolioTransactionType,
} from "../../services/portfolio.services";
import { formatCurrency } from "../../utils/formatCurrency";
import type { AssetView } from "../../types/investment";

interface TransactionCreateDialogProps {
  assetViews: AssetView[];
  onClose: () => void;
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

// Dialog บันทึกธุรกรรมซื้อ/ขาย เรียก POST /portfolio/transactions
// backend คำนวณ holding ใหม่ให้อัตโนมัติ ไม่ต้องคำนวณฝั่ง client
export function TransactionCreateDialog({
  assetViews,
  onClose,
}: TransactionCreateDialogProps) {
  const queryClient = useQueryClient();

  const [transactionType, setTransactionType] =
    useState<PortfolioTransactionType>("buy");
  const [assetId, setAssetId] = useState(assetViews[0]?.asset.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [date, setDate] = useState(todayDateString());
  const [validationError, setValidationError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const selectedAssetView = assetViews.find(
    (view) => view.asset.id === assetId,
  );
  const quantityValue = Number(quantity) || 0;
  const priceValue = Number(pricePerUnit) || 0;
  const total = quantityValue * priceValue;

  const createMutation = useMutation({
    mutationFn: () =>
      portfolioService.createTransaction({
        assetId,
        transaction_type: transactionType,
        quantity: quantity.trim(),
        price_per_unit: pricePerUnit.trim(),
        transaction_date: new Date(date).toISOString(),
      }),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      onClose();
    },

    onError: (error: unknown) => {
      if (axios.isAxiosError<{ message: string }>(error)) {
        if (error.response?.status === 409) {
          setErrorMessage("จำนวนที่ถืออยู่ไม่พอสำหรับขาย");
          return;
        }
        if (error.response?.status === 404) {
          setErrorMessage("ไม่พบสินทรัพย์หรือพอร์ตนี้");
          return;
        }
        setErrorMessage(
          error.response?.data?.message || "บันทึกธุรกรรมไม่สำเร็จ",
        );
        return;
      }
      setErrorMessage("เกิดข้อผิดพลาดที่ไม่คาดคิด");
    },
  });

  const handleCreate = () => {
    if (!assetId) {
      setValidationError("กรุณาเลือกสินทรัพย์");
      return;
    }

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

    if (
      transactionType === "sell" &&
      selectedAssetView &&
      quantityValue > selectedAssetView.quantity
    ) {
      setValidationError(
        `ถืออยู่แค่ ${selectedAssetView.quantity} ${selectedAssetView.asset.symbol} ขายเกินจำนวนที่มีไม่ได้`,
      );
      return;
    }

    setValidationError("");
    setErrorMessage("");
    createMutation.mutate();
  };

  if (assetViews.length === 0) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
          <p className="text-sm text-gray-600">
            ยังไม่มีสินทรัพย์ในพอร์ต กรุณาเพิ่มสินทรัพย์ก่อนบันทึกธุรกรรม
          </p>
          <button type="button" className="btn mt-5" onClick={onClose}>
            ปิด
          </button>
        </div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-transaction-title"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h3
          id="create-transaction-title"
          className="mb-5 text-xl font-bold text-[#39365F]"
        >
          เพิ่มรายการซื้อขาย
        </h3>

        <div className="mb-4 flex gap-3">
          <button
            type="button"
            onClick={() => setTransactionType("buy")}
            disabled={createMutation.isPending}
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
            disabled={createMutation.isPending}
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
            <select
              className="select select-bordered w-full bg-white text-[#39365F] focus:border-[#7566C7] focus:outline-none"
              value={assetId}
              onChange={(e) => {
                setAssetId(e.target.value);
                setValidationError("");
                setErrorMessage("");
              }}
              disabled={createMutation.isPending}
            >
              {assetViews.map((view) => (
                <option key={view.asset.id} value={view.asset.id}>
                  {view.asset.symbol} — {view.asset.name}
                </option>
              ))}
            </select>
            {transactionType === "sell" && selectedAssetView && (
              <span className="mt-1 text-xs text-[#5C6899]">
                ถืออยู่ {selectedAssetView.quantity}{" "}
                {selectedAssetView.asset.symbol}
              </span>
            )}
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
              placeholder="0.01"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                setValidationError("");
                setErrorMessage("");
              }}
              disabled={createMutation.isPending}
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
              placeholder="2,000,000"
              value={pricePerUnit}
              onChange={(e) => {
                setPricePerUnit(e.target.value);
                setValidationError("");
                setErrorMessage("");
              }}
              disabled={createMutation.isPending}
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
              disabled={createMutation.isPending}
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
            disabled={createMutation.isPending}
          >
            ยกเลิก
          </button>

          <button
            type="button"
            className="btn border-0 bg-[#7566C7] text-white hover:bg-[#6356B8]"
            onClick={handleCreate}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                กำลังบันทึก...
              </>
            ) : (
              "สร้าง"
            )}
          </button>
        </div>
      </div>

      <button
        type="button"
        className="absolute inset-0 -z-10 cursor-default"
        aria-label="ปิด Popup"
        onClick={() => {
          if (!createMutation.isPending) {
            onClose();
          }
        }}
      />
    </div>,
    document.body,
  );
}
