import { useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, TriangleAlert } from "lucide-react";
import { assetService } from "../../services/asset.services";
import type { AssetView } from "../../types/investment";

interface AssetDeleteDialogProps {
  assetView: AssetView;
  onClose: () => void;
  onDeleted: (assetId: string) => void;
}

// Dialog ยืนยันการลบ Asset เรียก DELETE /assets/:id
// Backend cascade ลบ holding และประวัติธุรกรรมทั้งหมดให้อัตโนมัติ ลบแล้วย้อนกลับไม่ได้
export function AssetDeleteDialog({
  assetView,
  onClose,
  onDeleted,
}: AssetDeleteDialogProps) {
  const queryClient = useQueryClient();
  const { asset, buyCount, sellCount, quantity } = assetView;
  const transactionCount = buyCount + sellCount;

  const [errorMessage, setErrorMessage] = useState("");

  const deleteMutation = useMutation({
    mutationFn: () => assetService.deleteAsset(asset.id),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["assets"] });
      await queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      onDeleted(asset.id);
      onClose();
    },

    onError: (error: unknown) => {
      if (axios.isAxiosError<{ message: string }>(error)) {
        if (error.response?.status === 404) {
          setErrorMessage("ไม่พบสินทรัพย์นี้แล้ว");
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
        aria-labelledby="delete-asset-title"
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#FFE3EC] text-[#CF3D6B]">
            <Trash2 size={22} />
          </div>
          <h3
            id="delete-asset-title"
            className="text-xl font-bold text-[#39365F]"
          >
            ลบ {asset.symbol}?
          </h3>
        </div>

        <p className="text-sm text-gray-600">
          ลบสินทรัพย์ <span className="font-semibold">{asset.name}</span>{" "}
          ออกจากพอร์ตถาวร แก้ไขทีหลังไม่ได้
        </p>

        {transactionCount > 0 && (
          <div className="mt-3 flex gap-2 rounded-xl bg-[#FFE3EC] px-3 py-2.5 text-sm text-[#CF3D6B]">
            <TriangleAlert size={18} className="mt-0.5 shrink-0" />
            <p>
              Asset นี้มีประวัติธุรกรรม {transactionCount} รายการ
              {quantity > 0 && ` และยังถืออยู่ ${quantity} ${asset.symbol}`} —
              ลบแล้วประวัติทั้งหมดจะหายไปด้วย
            </p>
          </div>
        )}

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
              "ลบสินทรัพย์"
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
