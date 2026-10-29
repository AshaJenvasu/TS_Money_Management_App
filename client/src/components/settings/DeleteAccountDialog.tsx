import { useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { useNavigate } from "@tanstack/react-router";
import { TriangleAlert, Trash2 } from "lucide-react";
import { useDeleteAccountMutation } from "../../hooks/useUserQuery";

interface DeleteAccountDialogProps {
  currentUsername: string;
  onClose: () => void;
}

// Dialog ลบบัญชีถาวร เรียก DELETE /users/me ผ่าน useDeleteAccountMutation
// ต้องพิมพ์ username ซ้ำให้ตรงเป๊ะถึงจะกดปุ่มลบได้ (เช็คฝั่ง client เท่านั้น ตามที่ตกลงกันไว้)
export default function DeleteAccountDialog({
  currentUsername,
  onClose,
}: DeleteAccountDialogProps) {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [confirmUsername, setConfirmUsername] = useState("");
  const [validationError, setValidationError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const deleteMutation = useDeleteAccountMutation();

  const isConfirmTextValid = confirmUsername === currentUsername;

  const handleSubmit = () => {
    if (!currentPassword) {
      setValidationError("กรุณากรอกรหัสผ่านปัจจุบัน");
      return;
    }

    if (!isConfirmTextValid) {
      setValidationError(`กรุณาพิมพ์ "${currentUsername}" ให้ตรงเพื่อยืนยัน`);
      return;
    }

    setValidationError("");
    setErrorMessage("");

    deleteMutation.mutate(
      { currentPassword },
      {
        onSuccess: () => {
          // logout() ถูกเรียกไว้แล้วใน useDeleteAccountMutation เคลียร์ Zustand store
          navigate({ to: "/login" });
        },
        onError: (error: unknown) => {
          if (axios.isAxiosError<{ message?: string }>(error)) {
            if (error.response?.status === 401) {
              setErrorMessage("รหัสผ่านปัจจุบันไม่ถูกต้อง");
              return;
            }
            setErrorMessage(
              error.response?.data?.message ??
                "ลบบัญชีไม่สำเร็จ กรุณาลองอีกครั้ง",
            );
            return;
          }
          setErrorMessage("เกิดข้อผิดพลาดที่ไม่คาดคิด");
        },
      },
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <Trash2 size={24} />
          </div>
          <h2
            id="delete-account-title"
            className="text-xl font-bold text-[#39365F]"
          >
            ลบบัญชีถาวร
          </h2>
        </div>

        <div className="mb-4 flex gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <TriangleAlert size={18} className="mt-0.5 shrink-0" />
          <p>
            การลบบัญชีจะลบ Wallet, รายการธุรกรรม, พอร์ตการลงทุน และสินทรัพย์
            ทั้งหมดของคุณถาวร <strong>กู้คืนไม่ได้</strong>
          </p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
        >
          <div className="flex flex-col gap-4">
            <label className="form-control">
              <span className="label-text mb-2 font-medium text-[#39365F]">
                รหัสผ่านปัจจุบัน
              </span>
              <input
                className="input input-bordered w-full bg-white text-[#39365F]"
                type="password"
                value={currentPassword}
                onChange={(event) => {
                  setCurrentPassword(event.target.value);
                  setValidationError("");
                  setErrorMessage("");
                }}
                autoFocus
                disabled={deleteMutation.isPending}
              />
            </label>

            <label className="form-control">
              <span className="label-text mb-2 font-medium text-[#39365F]">
                พิมพ์ <span className="font-bold">{currentUsername}</span>{" "}
                เพื่อยืนยัน
              </span>
              <input
                className="input input-bordered w-full bg-white text-[#39365F]"
                type="text"
                value={confirmUsername}
                onChange={(event) => {
                  setConfirmUsername(event.target.value);
                  setValidationError("");
                  setErrorMessage("");
                }}
                disabled={deleteMutation.isPending}
              />
            </label>
          </div>

          {validationError && (
            <p role="alert" className="mt-2 text-sm text-error">
              {validationError}
            </p>
          )}
          {errorMessage && (
            <p role="alert" className="mt-2 text-sm text-error">
              {errorMessage}
            </p>
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
              type="submit"
              className="btn btn-error text-white"
              disabled={deleteMutation.isPending || !isConfirmTextValid}
            >
              {deleteMutation.isPending ? "กำลังลบ..." : "ลบบัญชีถาวร"}
            </button>
          </div>
        </form>
      </div>

      <button
        type="button"
        className="absolute inset-0 -z-10 cursor-default"
        aria-label="ปิดหน้าต่าง"
        onClick={() => {
          if (!deleteMutation.isPending) onClose();
        }}
      />
    </div>,
    document.body,
  );
}
