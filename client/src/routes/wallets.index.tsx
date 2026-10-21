import { createFileRoute } from "@tanstack/react-router";
import { useWalletsQuery } from "../hooks/useWalletsQuery";
import { WalletCard } from "../components/wallets/WalletCard";
import { Wallet as WalletIcon, Plus } from "lucide-react";
import { useState } from "react";
import { FloatingAddTransactionButton } from "../components/transactions/FloatingAddTransactionButton";
import TransactionCreateDialog from "../components/transactions/TransactionCreateDialog";
import { useAllTransactionsQuery } from "../hooks/useTransactionsQuery";
import TransactionCard from "../components/transactions/TransactionCard";
import TransactionEditDialog from "../components/transactions/TransactionEditDialog";
import TransactionDeleteDialog from "../components/transactions/TransactionDeleteDialog";
import type { Transaction } from "../services/transaction.services";
import { WalletsScene } from "../components/wallets/WalletsScene";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { walletService } from "../services/wallet.services";
import { createPortal } from "react-dom";

// แสดงรายการ Wallet ทั้งหมดของผู้ใช้
// eslint-disable-next-line react-refresh/only-export-components
function WalletsPage() {
  const { data: wallets, isPending, isError, refetch } = useWalletsQuery();

  // ควบคุมการเปิดและปิด Dialog เพิ่มธุรกรรม
  const [isCreateTransactionOpen, setIsCreateTransactionOpen] = useState(false);

  const queryClient = useQueryClient();

  // เก็บข้อมูลและสถานะของฟอร์มสร้างกระเป๋า
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [walletName, setWalletName] = useState("");
  const [validationError, setValidationError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  // เก็บธุรกรรมที่เลือกแก้ไขหรือลบ
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] =
    useState<Transaction | null>(null);

  // เก็บหน้าปัจจุบันของรายการธุรกรรม
  const [transactionPage, setTransactionPage] = useState(1);

  // ดึงธุรกรรม 5 รายการต่อหน้า จากทุก Wallet
  const {
    data: allTransactionsResponse,
    isPending: isTransactionsPending,
    isError: isTransactionsError,
  } = useAllTransactionsQuery(transactionPage, 5);

  // สร้างกระเป๋าและอัปเดตรายการหลังบันทึกสำเร็จ
  const createMutation = useMutation({
    mutationFn: () => walletService.createWallet(walletName.trim()),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["wallets"] });

      setIsCreateOpen(false);
      setWalletName("");
      setValidationError("");
      setErrorMessage("");
    },

    onError: (error: unknown) => {
      if (axios.isAxiosError<{ message: string }>(error)) {
        setErrorMessage(
          error.response?.data?.message || "สร้างกระเป๋าไม่สำเร็จ",
        );
        return;
      }

      setErrorMessage("เกิดข้อผิดพลาดที่ไม่คาดคิด");
    },
  });

  // ตรวจสอบชื่อก่อนส่งคำขอสร้างกระเป๋า
  const handleCreateWallet = () => {
    const name = walletName.trim();

    if (!name) {
      setValidationError("กรุณาระบุชื่อกระเป๋า");
      return;
    }

    if (name.length > 100) {
      setValidationError("ชื่อกระเป๋าต้องไม่เกิน 100 ตัวอักษร");
      return;
    }

    if ((wallets ?? []).length >= 4) {
      setErrorMessage("สร้างกระเป๋าได้สูงสุด 4 ใบ");
      return;
    }

    createMutation.mutate();
  };

  return (
    <section className="min-h-screen bg-[#E9EAF8] px-0 py-0 text-[#1F2A5C] sm:px-4 sm:py-4 lg:px-8">
      <div className="relative isolate mx-auto min-h-screen w-full max-w-6xl overflow-hidden bg-[#E3D9F6] px-4 pb-28 pt-5 sm:rounded-[32px] sm:px-6 lg:px-8">
        <WalletsScene className="-z-10" />
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#EAE5FF] text-[#7566C7]">
              <WalletIcon size={25} />
            </div>

            {/* แสดงหัวข้อและคำอธิบายของหน้ารวมกระเป๋าเงิน */}
            <header className="relative z-10 mb-8 pt-5">
              <div className="mb-5 flex items-center justify-between">
                <div className="rounded-full border border-white/70 bg-white/60 px-4 py-2 text-sm font-semibold text-[#7566C7] shadow-sm backdrop-blur">
                  My Money Space
                </div>

                <div className="flex size-11 items-center justify-center rounded-full border border-white/70 bg-white/60 text-[#7566C7] shadow-sm backdrop-blur">
                  <WalletIcon size={22} />
                </div>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-[#39365F] sm:text-4xl">
                กระเป๋าเงินของฉัน
              </h1>

              <p className="mt-2 max-w-sm text-sm leading-6 text-[#716D98] sm:text-base">
                ทุกเป้าหมายทางการเงิน เริ่มต้นได้จากกระเป๋าใบเล็ก ๆ ของเธอ
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[#716D98]">
                  {(wallets ?? []).length} จาก 4 กระเป๋า
                </p>

                <button
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#7566C7] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-purple-200/60 transition hover:-translate-y-0.5 hover:bg-[#6356B8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7566C7]/30 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isPending || isError || (wallets ?? []).length >= 4}
                  onClick={() => {
                    setWalletName("");
                    setValidationError("");
                    setErrorMessage("");
                    setIsCreateOpen(true);
                  }}
                >
                  <Plus size={18} />
                  สร้างกระเป๋า
                </button>
              </div>
            </header>
          </div>

          {/* สรุปจำนวนกระเป๋าเงินจากข้อมูลจริง */}
          {!isPending && !isError && (
            <div className="relative z-10 mb-6 flex items-center justify-between gap-4 rounded-3xl border border-white/70 bg-white/65 px-5 py-4 shadow-sm backdrop-blur-md">
              <div>
                <p className="text-sm font-medium text-[#716D98]">
                  กระเป๋าเงินทั้งหมด
                </p>
                <p className="mt-1 text-2xl font-bold text-[#39365F]">
                  {wallets.length}{" "}
                  <span className="text-base font-medium">ใบ</span>
                </p>
              </div>

              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAE5FF] text-[#7566C7]">
                <WalletIcon size={24} />
              </div>
            </div>
          )}
        </div>

        {isPending ? (
          <div className="relative z-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-3xl border border-white/70 bg-white/60 p-5 shadow-sm backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="size-12 animate-pulse rounded-2xl bg-[#DDD5F5]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 animate-pulse rounded-full bg-[#DDD5F5]" />
                    <div className="h-3 w-1/3 animate-pulse rounded-full bg-[#E9E3F8]" />
                  </div>
                </div>

                <div className="mt-6 h-7 w-1/2 animate-pulse rounded-full bg-[#DDD5F5]" />
                <div className="mt-3 h-3 w-3/4 animate-pulse rounded-full bg-[#E9E3F8]" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-red-200 bg-white p-6 text-center">
            <p className="font-medium text-error">
              โหลดรายการกระเป๋าเงินไม่สำเร็จ
            </p>
            <button
              type="button"
              className="btn btn-sm mt-4"
              onClick={() => void refetch()}
            >
              ลองอีกครั้ง
            </button>
          </div>
        ) : wallets.length === 0 ? (
          <div className="relative z-10 overflow-hidden rounded-[32px] border border-white/70 bg-white/65 px-6 py-12 text-center shadow-sm backdrop-blur-md sm:py-16">
            <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-[#E5E0FF] to-[#D9ECFA] text-[#7566C7] shadow-inner">
              <WalletIcon size={38} strokeWidth={1.7} />
            </div>

            <h2 className="text-xl font-bold text-[#39365F]">
              กระเป๋าใบแรกของเธออยู่ไหนเอ่ย?
            </h2>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#8986A8]">
              ยังไม่มีกระเป๋าเงินเลย ลองสร้างกระเป๋าใบแรกจากหน้า Dashboard
              แล้วกลับมาดูที่นี่ได้เลยนะ
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wallets.map((wallet) => (
              <WalletCard key={wallet.id} wallet={wallet} />
            ))}
          </div>
        )}
        {/* รายการธุรกรรมทั้งหมด */}
        <section className="relative z-10 mt-10">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-[#39365F]">
              รายการธุรกรรมทั้งหมด
            </h2>
            <p className="mt-1 text-sm text-[#716D98]">
              รวมความเคลื่อนไหวจากทุกกระเป๋าเงินของเธอ
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {isTransactionsPending ? (
              <div className="rounded-2xl border border-white/70 bg-white/60 p-6 text-center text-sm text-[#8986A8]">
                กำลังโหลดรายการธุรกรรม...
              </div>
            ) : isTransactionsError ? (
              <div className="rounded-2xl border border-red-200 bg-white/70 p-6 text-center">
                <p className="text-sm text-red-500">
                  โหลดรายการธุรกรรมไม่สำเร็จ
                </p>
              </div>
            ) : (allTransactionsResponse?.data ?? []).length === 0 ? (
              <div className="rounded-2xl border border-white/70 bg-white/60 p-8 text-center">
                <p className="font-semibold text-[#39365F]">
                  ยังไม่มีรายการธุรกรรม
                </p>
                <p className="mt-2 text-sm text-[#8986A8]">
                  เมื่อเธอเพิ่มรายรับหรือรายจ่าย รายการจะแสดงที่นี่
                </p>
              </div>
            ) : (
              allTransactionsResponse!.data.map((transaction) => {
                // ค้นหาชื่อ Wallet ที่เป็นเจ้าของธุรกรรม
                const wallet = wallets?.find(
                  (item) => item.id === transaction.wallet_id,
                );

                return (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    walletName={wallet?.name ?? "Wallet"}
                    showTodayLabel
                    onEdit={(item) => setEditingTransaction(item)}
                    onDelete={(item) => setDeletingTransaction(item)}
                  />
                );
              })
            )}
          </div>

          {/* ปุ่มเปลี่ยนหน้ารายการธุรกรรม */}
          {!isTransactionsPending &&
            !isTransactionsError &&
            allTransactionsResponse &&
            allTransactionsResponse.pagination.totalPages > 1 && (
              <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/60 p-3">
                <button
                  type="button"
                  disabled={transactionPage <= 1}
                  onClick={() =>
                    setTransactionPage((page) => Math.max(1, page - 1))
                  }
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#7566C7] transition hover:bg-[#EEEAFB] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← ก่อนหน้า
                </button>

                <span className="text-sm font-semibold text-[#39365F]">
                  หน้า {allTransactionsResponse.pagination.page} /{" "}
                  {allTransactionsResponse.pagination.totalPages}
                </span>

                <button
                  type="button"
                  disabled={
                    transactionPage >=
                    allTransactionsResponse.pagination.totalPages
                  }
                  onClick={() => setTransactionPage((page) => page + 1)}
                  className="rounded-full bg-[#7566C7] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#6356B8] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ถัดไป →
                </button>
              </div>
            )}

          {/* Dialog แก้ไขธุรกรรม */}
          {editingTransaction && (
            <TransactionEditDialog
              transaction={editingTransaction}
              wallets={wallets ?? []}
              onClose={() => setEditingTransaction(null)}
            />
          )}

          {/* Dialog ยืนยันการลบธุรกรรม */}
          {deletingTransaction && (
            <TransactionDeleteDialog
              transaction={deletingTransaction}
              walletName={
                wallets?.find(
                  (wallet) => wallet.id === deletingTransaction.wallet_id,
                )?.name ?? "ไม่พบ Wallet"
              }
              onClose={() => setDeletingTransaction(null)}
            />
          )}
        </section>
      </div>

      {/* ปุ่มลอยสำหรับเพิ่มธุรกรรม */}
      <FloatingAddTransactionButton
        onClick={() => setIsCreateTransactionOpen(true)}
      />

      {/* Dialog เพิ่มธุรกรรมที่เลือก Wallet ได้เอง */}
      {isCreateTransactionOpen && (
        <TransactionCreateDialog
          wallets={wallets ?? []}
          onClose={() => setIsCreateTransactionOpen(false)}
        />
      )}
      {/* Dialog สร้างกระเป๋าเงิน */}
      {isCreateOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#39365F]/40 p-4 backdrop-blur-sm">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-wallet-title"
              className="w-full max-w-md rounded-[28px] border border-white/70 bg-[#F8F6FF] p-6 shadow-2xl sm:p-8"
            >
              <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-[#EAE5FF] text-[#7566C7]">
                <WalletIcon size={28} />
              </div>

              <h2
                id="create-wallet-title"
                className="text-2xl font-bold text-[#39365F]"
              >
                สร้างกระเป๋าเงิน
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#716D98]">
                ตั้งชื่อกระเป๋าใบใหม่ เพื่อเริ่มจัดการเงินของเธอกัน
              </p>

              <form
                className="mt-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleCreateWallet();
                }}
              >
                <label
                  htmlFor="wallet-name"
                  className="mb-2 block text-sm font-semibold text-[#39365F]"
                >
                  ชื่อกระเป๋า
                </label>

                <input
                  id="wallet-name"
                  type="text"
                  value={walletName}
                  maxLength={100}
                  autoFocus
                  disabled={createMutation.isPending}
                  placeholder="เช่น เงินเก็บ, ค่าใช้จ่ายประจำวัน"
                  aria-invalid={Boolean(validationError)}
                  className="min-h-12 w-full rounded-2xl border border-[#D9D2F0] bg-white px-4 py-3 text-[#39365F] outline-none transition placeholder:text-[#AAA4C5] focus:border-[#9586DF] focus:ring-4 focus:ring-[#9586DF]/20 disabled:opacity-60"
                  onChange={(event) => {
                    setWalletName(event.target.value);
                    setValidationError("");
                    setErrorMessage("");
                  }}
                />

                {validationError && (
                  <p className="mt-2 text-sm text-red-500">{validationError}</p>
                )}

                {errorMessage && (
                  <p role="alert" className="mt-2 text-sm text-red-500">
                    {errorMessage}
                  </p>
                )}

                <p className="mt-2 text-right text-xs text-[#8986A8]">
                  {walletName.length}/100 ตัวอักษร
                </p>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={createMutation.isPending}
                    className="min-h-11 rounded-full border border-[#D9D2F0] px-5 py-3 text-sm font-semibold text-[#716D98] transition hover:bg-[#EEEAFB] disabled:opacity-50"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    ยกเลิก
                  </button>

                  <button
                    type="submit"
                    disabled={
                      createMutation.isPending ||
                      !walletName.trim() ||
                      (wallets ?? []).length >= 4
                    }
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#7566C7] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-purple-200/60 transition hover:bg-[#6356B8] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {createMutation.isPending ? (
                      <>
                        <span className="loading loading-spinner loading-sm" />
                        กำลังสร้าง...
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        สร้างกระเป๋า
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
}

export const Route = createFileRoute("/wallets/")({
  component: WalletsPage,
});
