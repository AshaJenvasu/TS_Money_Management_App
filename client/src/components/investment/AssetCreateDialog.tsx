import { useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Layers } from "lucide-react";
import { assetService, type AssetType } from "../../services/asset.services";

interface AssetCreateDialogProps {
  onClose: () => void;
}

// Dialog สร้าง Asset ใหม่ (symbol/name/ประเภท) เรียก POST /assets
export function AssetCreateDialog({ onClose }: AssetCreateDialogProps) {
  const queryClient = useQueryClient();

  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [assetType, setAssetType] = useState<AssetType>("crypto");
  const [validationError, setValidationError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      assetService.createAsset({
        symbol: symbol.trim().toUpperCase(),
        name: name.trim(),
        asset_type: assetType,
      }),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["assets"] });
      onClose();
    },

    onError: (error: unknown) => {
      if (axios.isAxiosError<{ message: string }>(error)) {
        if (error.response?.status === 409) {
          setErrorMessage("มีสินทรัพย์นี้อยู่แล้ว (ชื่อหรือ Symbol ซ้ำ)");
          return;
        }
        setErrorMessage(
          error.response?.data?.message || "สร้างสินทรัพย์ไม่สำเร็จ",
        );
        return;
      }
      setErrorMessage("เกิดข้อผิดพลาดที่ไม่คาดคิด");
    },
  });

  const handleCreate = () => {
    const trimmedSymbol = symbol.trim();
    const trimmedName = name.trim();

    if (!trimmedSymbol) {
      setValidationError("กรุณากรอก Symbol");
      return;
    }

    if (trimmedSymbol.length > 10) {
      setValidationError("Symbol ต้องไม่เกิน 10 ตัวอักษร");
      return;
    }

    if (!trimmedName) {
      setValidationError("กรุณากรอกชื่อสินทรัพย์");
      return;
    }

    if (trimmedName.length > 100) {
      setValidationError("ชื่อต้องไม่เกิน 100 ตัวอักษร");
      return;
    }

    setValidationError("");
    setErrorMessage("");
    createMutation.mutate();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-asset-title"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#EAE5FF] text-[#7566C7]">
            <Layers size={24} />
          </div>
          <div>
            <h3
              id="create-asset-title"
              className="text-xl font-bold text-[#39365F]"
            >
              เพิ่มสินทรัพย์
            </h3>
            <p className="text-sm text-gray-500">
              บันทึกสินทรัพย์ใหม่ที่จะติดตาม
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreate();
          }}
        >
          <div className="flex flex-col gap-4">
            <label className="form-control">
              <span className="label-text mb-2 font-medium text-[#39365F]">
                Symbol
              </span>
              <input
                type="text"
                className="input input-bordered w-full bg-white uppercase text-[#39365F] focus:border-[#7566C7] focus:outline-none"
                placeholder="เช่น BTC"
                value={symbol}
                onChange={(e) => {
                  setSymbol(e.target.value);
                  setValidationError("");
                  setErrorMessage("");
                }}
                maxLength={10}
                autoFocus
                disabled={createMutation.isPending}
              />
            </label>

            <label className="form-control">
              <span className="label-text mb-2 font-medium text-[#39365F]">
                Name
              </span>
              <input
                type="text"
                className="input input-bordered w-full bg-white text-[#39365F] focus:border-[#7566C7] focus:outline-none"
                placeholder="เช่น Bitcoin"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setValidationError("");
                  setErrorMessage("");
                }}
                maxLength={100}
                disabled={createMutation.isPending}
              />
            </label>

            <div className="form-control">
              <span className="label-text mb-2 font-medium text-[#39365F]">
                Type
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setAssetType("crypto")}
                  disabled={createMutation.isPending}
                  className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition ${
                    assetType === "crypto"
                      ? "border-[#7566C7] bg-[#EAE5FF] text-[#7566C7]"
                      : "border-gray-200 text-gray-500"
                  }`}
                >
                  Crypto
                </button>
                <button
                  type="button"
                  onClick={() => setAssetType("stock")}
                  disabled={createMutation.isPending}
                  className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition ${
                    assetType === "stock"
                      ? "border-[#7566C7] bg-[#EAE5FF] text-[#7566C7]"
                      : "border-gray-200 text-gray-500"
                  }`}
                >
                  Stock
                </button>
              </div>
            </div>

            {validationError && (
              <p className="text-sm text-error">{validationError}</p>
            )}
            {errorMessage && (
              <p className="text-sm text-error">{errorMessage}</p>
            )}
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              className="btn"
              onClick={onClose}
              disabled={createMutation.isPending}
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              className="btn border-0 bg-[#7566C7] text-white hover:bg-[#6356B8]"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  กำลังสร้าง...
                </>
              ) : (
                "สร้างสินทรัพย์"
              )}
            </button>
          </div>
        </form>
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
