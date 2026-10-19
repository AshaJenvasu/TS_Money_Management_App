import { useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";

import {
  Wallet as WalletIcon,
  CircleAlert,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { useWalletBalanceQuery } from "../../hooks/useWalletBalanceQuery";
import type { Wallet } from "../../services/wallet.services";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { walletService } from "../../services/wallet.services";

interface WalletCardProps {
  wallet: Wallet;
}

// แสดงข้อมูลและยอดเงินของ Wallet แต่ละใบ
export function WalletCard({ wallet }: WalletCardProps) {
  // ดึงยอดเงินของ Wallet
  const { data, isPending, isError } = useWalletBalanceQuery(wallet.id);

  // สถานะการแสดงเมนู
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const queryClient = useQueryClient();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [walletName, setWalletName] = useState(wallet.name);
  const [errorMessage, setErrorMessage] = useState("");
  const [validationError, setValidationError] = useState("");

  // แก้ไขชื่อ Wallet
  const updateMutation = useMutation({
    mutationFn: () => walletService.updateWallet(wallet.id, walletName.trim()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["wallets"] });
      setIsEditOpen(false);
      setErrorMessage("");
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError<{ message: string }>(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.message;

        if (status === 409) {
          setValidationError("Wallet name already exists");
          setErrorMessage("");
          return;
        }

        if (status === 404) {
          setErrorMessage("Wallet not found");
          return;
        }

        setErrorMessage(
          message || "Failed to update wallet. Please try again.",
        );
        return;
      }

      setErrorMessage("An unexpected error occurred.");
    },
  });

  // ลบ Wallet
  const deleteMutation = useMutation({
    mutationFn: () => walletService.deleteWallet(wallet.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["wallets"] });
      setIsDeleteOpen(false);
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError<{ message: string }>(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.message;

        if (status === 404) {
          setErrorMessage("Wallet not found");
          return;
        }

        setErrorMessage(
          message || "Failed to delete wallet. Please try again.",
        );
        return;
      }

      setErrorMessage("An unexpected error occurred.");
    },
  });

  const handleUpdateWallet = () => {
    const name = walletName.trim();

    if (!name) {
      setValidationError("Wallet name is required");
      return;
    }

    if (name.length > 100) {
      setValidationError("Wallet name must not exceed 100 characters");
      return;
    }

    updateMutation.mutate();
  };

  return (
    <div className="card border border-white/80 bg-white/70 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      <div className="card-body gap-3 p-4">
        {/* แสดงรูปแบบของ Wallet */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-[#EAE5FF] text-[#7566C7]">
            <WalletIcon size={21} strokeWidth={1.8} />
          </div>

          <div className="flex items-center gap-2">
            <span className="badge badge-sm border-0 bg-[#F5E8F5] text-[#9B6598]">
              Wallet
            </span>
            {/*  แสดงชื่อ Wallet */}
            <div className="dropdown dropdown-end relative">
              <button
                type="button"
                onClick={() => {
                  console.log("Before:", isMenuOpen);
                  setIsMenuOpen((prev) => !prev);
                }}
                className="relative z-[9999] flex size-7 items-center justify-center rounded-lg bg-red-200"
              >
                <MoreVertical size={20} />
              </button>

              {isMenuOpen && (
                <ul className="menu absolute right-0 top-full z-50 mt-2 w-36 rounded-xl border border-[#EAE5FF] bg-white p-2 shadow-lg">
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setWalletName(wallet.name);
                        setErrorMessage("");
                        setIsMenuOpen(false);
                        setIsEditOpen(true);
                      }}
                      className="flex items-center gap-2 text-[#39365F]"
                    >
                      <Pencil size={16} />
                      Edit
                    </button>
                  </li>

                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage("");
                        setIsMenuOpen(false);
                        setIsDeleteOpen(true);
                      }}
                      className="flex items-center gap-2 text-error"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>
        <div>
          <h2 className="truncate font-semibold text-[#39365F]">
            {wallet.name}
          </h2>

          {isPending ? (
            <div className="mt-2 flex items-center gap-2 text-sm text-[#8986A8]">
              <span className="loading loading-spinner loading-xs" />
              กำลังโหลด...
            </div>
          ) : isError ? (
            <p className="mt-2 flex items-center gap-1 text-sm text-error">
              <CircleAlert size={15} />
              โหลดไม่สำเร็จ
            </p>
          ) : (
            <p className="mt-2 truncate text-xl font-bold tracking-tight text-[#6356B8]">
              ฿
              {Number(data.balance).toLocaleString("th-TH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          )}
        </div>
      </div>
      {/* Edit Popup */}
      {isEditOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl ">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-[#EAE5FF] text-[#7566C7] ">
                  <Pencil size={24} />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-[#39365F] mt-2">
                    แก้ไขกระเป๋าเงิน
                  </h3>
                  <p className="text-sm text-gray-500 mt-2">
                    เปลี่ยนชื่อกระเป๋าเงินของคุณ
                  </p>
                </div>
              </div>

              <label className="form-control mt-8">
                <span className="label-text mb-2 font-medium text-[#39365F]">
                  Wallet Name
                </span>

                <input
                  type="text"
                  className="input input-bordered w-full bg-white text-[#39365F] placeholder:text-gray-400 focus:border-[#7566C7] focus:outline-none mt-2"
                  placeholder="Enter wallet name"
                  value={walletName}
                  onChange={(e) => {
                    setWalletName(e.target.value);
                    setValidationError("");
                    setErrorMessage("");
                  }}
                  maxLength={100}
                  autoFocus
                />
                {validationError && (
                  <p className="mt-2 text-sm text-error">{validationError}</p>
                )}
              </label>

              {errorMessage && (
                <p className="mt-3 text-sm text-error">{errorMessage}</p>
              )}

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsEditOpen(false)}
                  disabled={updateMutation.isPending}
                >
                  ยกเลิก
                </button>

                <button
                  type="button"
                  className="btn border-0 bg-[#7566C7] text-white hover:bg-[#6356B8]"
                  disabled={
                    !walletName.trim() ||
                    walletName.trim() === wallet.name ||
                    updateMutation.isPending
                  }
                  onClick={handleUpdateWallet}
                >
                  {updateMutation.isPending
                    ? "Saving..."
                    : "บันทึกการเปลี่ยนแปลง"}
                </button>
              </div>
            </div>

            <button
              className="absolute inset-0 -z-10 cursor-default"
              aria-label="Close dialog"
              onClick={() => setIsEditOpen(false)}
            />
          </div>,
          document.body,
        )}

      {/* Delete Popup */}
      {isDeleteOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#39365F]">
                    ลบกระเป๋าเงิน
                  </h3>
                  <p className="text-sm text-gray-500">
                    เมื่อลบแล้วจะไม่สามารถกู้คืนได้
                  </p>
                </div>
              </div>

              <p className="py-6 text-gray-600">
                คุณแน่ใจหรือไม่ว่าต้องการลบ "{wallet.name}"?
                กระเป๋าเงินและรายการธุรกรรมทั้งหมดภายในจะถูกลบถาวร
                และไม่สามารถกู้คืนได้
              </p>

              {errorMessage && (
                <p className="mb-4 text-sm text-error">{errorMessage}</p>
              )}

              <div className="flex justify-end gap-3">
                <button
                  className="btn"
                  onClick={() => setIsDeleteOpen(false)}
                  disabled={deleteMutation.isPending}
                >
                  ยกเลิก
                </button>

                <button
                  className="btn btn-error"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate()}
                >
                  {deleteMutation.isPending ? "Deleting..." : "ยืนยันการลบ"}
                </button>
              </div>
            </div>

            <button
              className="absolute inset-0 -z-10 cursor-default"
              aria-label="Close dialog"
              onClick={() => setIsDeleteOpen(false)}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}
