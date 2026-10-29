import { useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { Mail } from "lucide-react";
import { useUpdateEmailMutation } from "../../hooks/useUserQuery";

interface EditEmailDialogProps {
  currentEmail: string;
  onClose: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Dialog แก้ไข Email เรียก PUT /users/me/email ผ่าน useUpdateEmailMutation ต้องแนบ current password ด้วยเสมอ
export default function EditEmailDialog({
  currentEmail,
  onClose,
}: EditEmailDialogProps) {
  const [email, setEmail] = useState(currentEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [validationError, setValidationError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const updateMutation = useUpdateEmailMutation();

  const handleSubmit = () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      setValidationError("รูปแบบ Email ไม่ถูกต้อง");
      return;
    }

    if (trimmedEmail === currentEmail) {
      setValidationError("Email ใหม่ต้องไม่ซ้ำกับของเดิม");
      return;
    }

    if (!currentPassword) {
      setValidationError("กรุณากรอกรหัสผ่านปัจจุบันเพื่อยืนยัน");
      return;
    }

    setValidationError("");
    setErrorMessage("");

    updateMutation.mutate(
      { email: trimmedEmail, currentPassword },
      {
        onSuccess: onClose,
        onError: (error: unknown) => {
          if (axios.isAxiosError<{ message?: string }>(error)) {
            if (error.response?.status === 401) {
              setErrorMessage("รหัสผ่านปัจจุบันไม่ถูกต้อง");
              return;
            }
            if (error.response?.status === 409) {
              setErrorMessage("Email นี้มีคนใช้แล้ว");
              return;
            }
            setErrorMessage(
              error.response?.data?.message ??
                "แก้ไขไม่สำเร็จ กรุณาลองอีกครั้ง",
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
        aria-labelledby="edit-email-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#EAE5FF] text-[#7566C7]">
            <Mail size={24} />
          </div>
          <div>
            <h2
              id="edit-email-title"
              className="text-xl font-bold text-[#39365F]"
            >
              แก้ไข Email
            </h2>
            <p className="text-sm text-gray-500">
              ต้องยืนยันด้วยรหัสผ่านปัจจุบัน
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
                Email ใหม่
              </span>
              <input
                className="input input-bordered w-full bg-white text-[#39365F]"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setValidationError("");
                  setErrorMessage("");
                }}
                autoFocus
                disabled={updateMutation.isPending}
              />
            </label>

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
