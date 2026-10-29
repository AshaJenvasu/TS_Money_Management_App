import { useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { Lock } from "lucide-react";
import { useUpdatePasswordMutation } from "../../hooks/useUserQuery";

interface ChangePasswordDialogProps {
  onClose: () => void;
}

const PASSWORD_RULES: { test: (value: string) => boolean; message: string }[] =
  [
    { test: (v) => v.length >= 8, message: "อย่างน้อย 8 ตัวอักษร" },
    { test: (v) => /[A-Z]/.test(v), message: "ตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว" },
    { test: (v) => /[a-z]/.test(v), message: "ตัวพิมพ์เล็กอย่างน้อย 1 ตัว" },
    { test: (v) => /[0-9]/.test(v), message: "ตัวเลขอย่างน้อย 1 ตัว" },
    {
      test: (v) => /[^A-Za-z0-9]/.test(v),
      message: "อักขระพิเศษอย่างน้อย 1 ตัว",
    },
  ];

// Dialog เปลี่ยน Password เรียก PUT /users/me/password ผ่าน useUpdatePasswordMutation
export default function ChangePasswordDialog({
  onClose,
}: ChangePasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const updateMutation = useUpdatePasswordMutation();

  const handleSubmit = () => {
    if (!currentPassword) {
      setValidationError("กรุณากรอกรหัสผ่านปัจจุบัน");
      return;
    }

    // เช็คกฎความแข็งแรงของ newPassword ทีละข้อ เหมือนกับ UpdatePasswordBodySchema ฝั่ง backend
    const failedRule = PASSWORD_RULES.find((rule) => !rule.test(newPassword));
    if (failedRule) {
      setValidationError(`รหัสผ่านใหม่ต้องมี${failedRule.message}`);
      return;
    }

    if (newPassword === currentPassword) {
      setValidationError("รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม");
      return;
    }

    if (newPassword !== confirmPassword) {
      setValidationError("ยืนยันรหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }

    setValidationError("");
    setErrorMessage("");

    updateMutation.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: onClose,
        onError: (error: unknown) => {
          if (axios.isAxiosError<{ message?: string }>(error)) {
            if (error.response?.status === 401) {
              setErrorMessage("รหัสผ่านปัจจุบันไม่ถูกต้อง");
              return;
            }
            setErrorMessage(
              error.response?.data?.message ??
                "เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาลองอีกครั้ง",
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
        aria-labelledby="change-password-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#EAE5FF] text-[#7566C7]">
            <Lock size={24} />
          </div>
          <div>
            <h2
              id="change-password-title"
              className="text-xl font-bold text-[#39365F]"
            >
              เปลี่ยนรหัสผ่าน
            </h2>
            <p className="text-sm text-gray-500">
              ตั้งรหัสผ่านใหม่ให้บัญชีของคุณ
            </p>
          </div>
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
                disabled={updateMutation.isPending}
              />
            </label>

            <label className="form-control">
              <span className="label-text mb-2 font-medium text-[#39365F]">
                รหัสผ่านใหม่
              </span>
              <input
                className="input input-bordered w-full bg-white text-[#39365F]"
                type="password"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                  setValidationError("");
                  setErrorMessage("");
                }}
                disabled={updateMutation.isPending}
              />
              <span className="mt-1 text-xs text-gray-500">
                ต้องมีอย่างน้อย 8 ตัวอักษร ผสมพิมพ์ใหญ่-เล็ก ตัวเลข
                และอักขระพิเศษ
              </span>
            </label>

            <label className="form-control">
              <span className="label-text mb-2 font-medium text-[#39365F]">
                ยืนยันรหัสผ่านใหม่
              </span>
              <input
                className="input input-bordered w-full bg-white text-[#39365F]"
                type="password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setValidationError("");
                  setErrorMessage("");
                }}
                disabled={updateMutation.isPending}
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
              disabled={updateMutation.isPending}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="btn border-0 bg-[#7566C7] text-white hover:bg-[#6356B8]"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>

      <button
        type="button"
        className="absolute inset-0 -z-10 cursor-default"
        aria-label="ปิดหน้าต่างแก้ไข"
        onClick={() => {
          if (!updateMutation.isPending) onClose();
        }}
      />
    </div>,
    document.body,
  );
}
