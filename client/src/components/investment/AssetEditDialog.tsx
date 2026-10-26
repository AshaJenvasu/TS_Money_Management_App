import { useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { assetService } from "../../services/asset.services";
import type { AssetView } from "../../types/investment";

interface AssetEditDialogProps {
  assetView: AssetView;
  onClose: () => void;
}

// Dialog แก้ไขชื่อ Asset เรียก PUT /assets/:id — symbol/type แก้ไม่ได้ตามที่ backend กำหนด
export function AssetEditDialog({ assetView, onClose }: AssetEditDialogProps) {
  const queryClient = useQueryClient();
  const { asset, buyCount, sellCount } = assetView;

  // มีประวัติซื้อขายแล้ว ห้ามแก้ไขชื่อ (เดาจากข้อมูลที่มี เงื่อนไขจริงอยู่ที่ backend)
  const hasTransactionHistory = buyCount + sellCount > 0;

  const [name, setName] = useState(asset.name);
  const [validationError, setValidationError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const updateMutation = useMutation({
    mutationFn: () => assetService.updateAsset(asset.id, { name: name.trim() }),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["assets"] });
      onClose();
    },

    onError: (error: unknown) => {
      if (axios.isAxiosError<{ message: string }>(error)) {
        if (error.response?.status === 400) {
          setErrorMessage("แก้ไขไม่ได้ เพราะสินทรัพย์นี้มีประวัติซื้อขายแล้ว");
          return;
        }
        if (error.response?.status === 409) {
          setErrorMessage("มีสินทรัพย์ชื่อนี้อยู่แล้ว");
          return;
        }
        if (error.response?.status === 404) {
          setErrorMessage("ไม่พบสินทรัพย์นี้แล้ว");
          return;
        }
        setErrorMessage(error.response?.data?.message || "แก้ไขไม่สำเร็จ");
        return;
      }
      setErrorMessage("เกิดข้อผิดพลาดที่ไม่คาดคิด");
    },
  });

  const handleUpdate = () => {
    const trimmedName = name.trim();

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
    updateMutation.mutate();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-asset-title"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#EAE5FF] text-[#7566C7]">
            <Pencil size={22} />
          </div>
          <div>
            <h3
              id="edit-asset-title"
              className="text-xl font-bold text-[#39365F]"
            >
              แก้ไขสินทรัพย์
            </h3>
            <p className="text-sm text-gray-500">
              {asset.symbol} · {asset.name}
            </p>
          </div>
        </div>

        {hasTransactionHistory && (
          <p className="mb-4 rounded-xl bg-[#FFE3EC] px-3 py-2 text-sm font-semibold text-[#CF3D6B]">
            ถ้ามีข้อมูลการซื้อขายแล้วห้ามแก้
          </p>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleUpdate();
          }}
        >
          <div className="flex flex-col gap-4">
            <label className="form-control">
              <span className="label-text mb-2 font-medium text-[#39365F]">
                Symbol
              </span>
              <input
                type="text"
                className="input input-bordered w-full bg-gray-100 text-[#39365F]"
                value={asset.symbol}
                disabled
              />
            </label>

            <label className="form-control">
              <span className="label-text mb-2 font-medium text-[#39365F]">
                Name
              </span>
              <input
                type="text"
                className="input input-bordered w-full bg-white text-[#39365F] focus:border-[#7566C7] focus:outline-none"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setValidationError("");
                  setErrorMessage("");
                }}
                maxLength={100}
                autoFocus
                disabled={hasTransactionHistory || updateMutation.isPending}
              />
            </label>

            <label className="form-control">
              <span className="label-text mb-2 font-medium text-[#39365F]">
                Type
              </span>
              <input
                type="text"
                className="input input-bordered w-full bg-gray-100 text-[#39365F]"
                value={asset.asset_type === "stock" ? "Stock" : "Crypto"}
                disabled
              />
            </label>

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
              disabled={updateMutation.isPending}
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              className="btn border-0 bg-[#7566C7] text-white hover:bg-[#6356B8]"

              disabled={hasTransactionHistory || updateMutation.isPending}
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
        </form>
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
