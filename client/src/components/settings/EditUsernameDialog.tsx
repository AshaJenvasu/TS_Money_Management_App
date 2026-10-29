import { useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { Pencil } from "lucide-react";
import { useUpdateUsernameMutation } from "../../hooks/useUserQuery";

interface EditUsernameDialogProps {
  currentUsername: string;
  onClose: () => void;
}

const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

// Dialog แก้ไข Username เรียก PUT /users/me/username ผ่าน useUpdateUsernameMutation
export default function EditUsernameDialog({
  currentUsername,
  onClose,
}: EditUsernameDialogProps) {
  const [username, setUsername] = useState(currentUsername);
  const [validationError, setValidationError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const updateMutation = useUpdateUsernameMutation();

  const handleSubmit = () => {
    const trimmed = username.trim();

    if (trimmed.length < 3 || trimmed.length > 20) {
      setValidationError("Username ต้องมีความยาว 3-20 ตัวอักษร");
      return;
    }

    if (!USERNAME_REGEX.test(trimmed)) {
      setValidationError(
        "Username ใช้ได้แค่ตัวอักษรอังกฤษ ตัวเลข และเครื่องหมาย _ กับ -",
      );
      return;
    }

    if (trimmed === currentUsername) {
      setValidationError("Username ใหม่ต้องไม่ซ้ำกับของเดิม");
      return;
    }

    setValidationError("");
    setErrorMessage("");

    updateMutation.mutate(
      { username: trimmed },
      {
        onSuccess: onClose,
        onError: (error: unknown) => {
          if (axios.isAxiosError<{ message?: string }>(error)) {
            if (error.response?.status === 409) {
              setErrorMessage("Username นี้มีคนใช้แล้ว");
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
        aria-labelledby="edit-username-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#EAE5FF] text-[#7566C7]">
            <Pencil size={24} />
          </div>
          <div>
            <h2
              id="edit-username-title"
              className="text-xl font-bold text-[#39365F]"
            >
              แก้ไข Username
            </h2>
            <p className="text-sm text-gray-500">เปลี่ยนชื่อผู้ใช้ของคุณ</p>
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
        >
          <label className="form-control">
            <span className="label-text mb-2 font-medium text-[#39365F]">
              Username
            </span>
            <input
              className="input input-bordered w-full bg-white text-[#39365F]"
              type="text"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setValidationError("");
                setErrorMessage("");
              }}
              maxLength={20}
              autoFocus
              disabled={updateMutation.isPending}
            />
          </label>

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
