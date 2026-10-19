/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardSkeleton } from "../components/dashboard/DashboardSkeleton";
import { useAuthStore } from "../stores/useAuthStore";
import { useWalletsQuery } from "../hooks/useWalletsQuery";
import { useAllTransactionsQuery } from "../hooks/useTransactionsQuery";
import { WalletCard } from "../components/wallets/WalletCard";
import { PortfolioCard } from "../components/dashboard/PortfolioCard";
import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { walletService } from "../services/wallet.services";
import { Eye, EyeOff, WalletCards, Plus, PieChart } from "lucide-react";
import { DashboardScene } from "../components/dashboard/DashboardScene";
import { DashboardMascot } from "../components/dashboard/DashboardMascot";
import TransactionCard from "../components/transactions/TransactionCard";
import TransactionEditDialog from "../components/transactions/TransactionEditDialog";
import type { Transaction } from "../services/transaction.services";
import TransactionDeleteDialog from "../components/transactions/TransactionDeleteDialog";
import TransactionCreateDialog from "../components/transactions/TransactionCreateDialog";
import { Wallet as WalletIcon } from "lucide-react";
import { createPortal } from "react-dom";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "../utils/formatCurrency";

// หน้า Dashboard
export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    const { token } = useAuthStore.getState();

    if (!token) {
      throw redirect({ to: "/login" });
    }
  },
  component: DashboardPage,
});

// แสดงรายการ Wallet และสถานะของ API
function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [walletName, setWalletName] = useState("");
  const [validationError, setValidationError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  // ควบคุมการเปิดฟอร์มสร้างธุรกรรม
  const [isCreateTransactionOpen, setIsCreateTransactionOpen] = useState(false);
  // เก็บรายการธุรกรรมที่ผู้ใช้เลือกแก้ไข
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  // เก็บรายการธุรกรรมที่ผู้ใช้เลือกจะลบ
  const [deletingTransaction, setDeletingTransaction] =
    useState<Transaction | null>(null);

  // ควบคุมการเปิด-ปิด Popup
  const [isTransactionsOpen, setIsTransactionsOpen] = useState(false);

  // เก็บหน้าปัจจุบันของ Pagination
  const [transactionPage, setTransactionPage] = useState(1);

  // สร้าง Wallet
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
          error.response?.data?.message || "Failed to create wallet.",
        );
        return;
      }

      setErrorMessage("An unexpected error occurred.");
    },
  });
  const handleCreateWallet = () => {
    const name = walletName.trim();

    if (!name) {
      setValidationError("Wallet name is required");
      return;
    }

    if (name.length > 100) {
      setValidationError("Wallet name must not exceed 100 characters");
      return;
    }

    createMutation.mutate();
  };

  const {
    data: wallets,
    isPending,
    isError,
    error,
    refetch,
  } = useWalletsQuery();

  // ดึงยอดเงินของแต่ละ Wallet
  const balanceQueries = useQueries({
    queries: (wallets ?? []).map((wallet) => ({
      queryKey: ["wallets", wallet.id, "balance"],
      queryFn: () => walletService.getWalletBalance(wallet.id),
    })),
  });

  // คํานวณยอดเงินทั้งหมด
  const totalBalance = balanceQueries.reduce(
    (total, query) => total + Number(query.data?.balance ?? 0),
    0,
  );

  // สร้างรายการ Wallet
  const walletAllocations = (wallets ?? []).map((wallet, index) => {
    const balance = Number(balanceQueries[index]?.data?.balance ?? 0);

    return {
      id: wallet.id,
      name: wallet.name,
      balance,
      percentage: totalBalance > 0 ? (balance / totalBalance) * 100 : 0,
    };
  });

  // ตรวจสอบสถานะการโหลด
  const isBalancePending = balanceQueries.some((query) => query.isPending);
  const isBalanceError = balanceQueries.some((query) => query.isError);

  // ดึง Transaction ล่าสุด 5 รายการจากทุก Wallet
  const {
    data: transactionResponse,
    isPending: isRecentTransactionsPending,
    isError: isRecentTransactionsError,
  } = useAllTransactionsQuery(1, 5);

  const recentTransactions = transactionResponse?.data ?? [];

  // ดึง Transaction ตามหน้าที่เลือกใน Popup
  const {
    data: allTransactionsResponse,
    isPending: isTransactionsPending,
    isError: isTransactionsError,
  } = useAllTransactionsQuery(transactionPage, 5);

  if (isPending) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#E3D9F6] px-5">
        <div className="w-full max-w-sm rounded-[28px] bg-white p-8 text-center shadow-sm">
          <div className="mb-4 text-5xl">🥺</div>

          <h2 className="text-xl font-bold text-[#6D5A91]">
            โหลดข้อมูลไม่สำเร็จ
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {error.message || "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง"}
          </p>

          <button
            type="button"
            onClick={() => refetch()}
            className="btn mt-6 w-full rounded-full border-0 bg-[#AAA6EE] text-white hover:bg-[#918CE0]"
          >
            <span className="mr-2">↻</span>
            ลองอีกครั้ง
          </button>
        </div>
      </main>
    );
  }

  if (wallets.length === 0) {
    return <div className="p-8">ยังไม่มี Wallet 💰</div>;
  }

  return (
    <div className="min-h-screen bg-[#E9EAF8] px-0 py-0 sm:py-3">
      {/* กรอบหลักของ Dashboard */}
      <main className="relative isolate mx-auto min-h-screen w-full max-w-[480px] overflow-hidden rounded-none bg-[#E3D9F6] px-5 pb-10 pt-5 shadow-xl sm:min-h-[800px] sm:rounded-[32px]">
        <DashboardScene />
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.25em] text-[#7775A8]">
              PERSONAL FINANCE
            </p>
            <h1 className="text-2xl font-extrabold tracking-wide text-[#1F2A5C]">
              MONEY APP
            </h1>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-3 py-2 shadow-sm">
            <span className="text-lg">🌸</span>
            <span className="text-sm font-semibold text-[#39365F]">
              {user?.username ?? "User"}
            </span>
          </div>
        </header>
        {/* Greeting */}
        <section className="mt-8">
          <p className="text-sm font-medium text-[#7775A8]">
            YOUR FINANCIAL SPACE
          </p>

          <div className="mt-1 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold leading-tight text-[#252650]">
                สวัสดีจ้า {user?.username ?? "User"} 👋
              </h2>
              <p className="mt-2 text-sm text-[#68678F]">
                วันนี้มาดูแลการเงินกันนะ
              </p>
            </div>

            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-amber-100 text-3xl shadow-sm">
              ☀️
            </div>
          </div>
        </section>
        {/* Total Balance Card */}
        <section className="relative mt-7 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#7775E8] via-[#A18AE8] to-[#F0A9CF] p-6 text-white shadow-lg shadow-purple-200/60">
          <div className="absolute -right-8 -top-10 size-36 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 right-16 size-28 rounded-full bg-white/10" />
          <div className="absolute right-10 top-6 z-10 sm:right-6 md:right-22">
            <DashboardMascot />
          </div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white/85">
                ยอดเงินรวมทั้งหมด
              </p>

              <button
                type="button"
                className="btn btn-ghost btn-circle btn-sm text-white hover:bg-white/20 "
                onClick={() => setIsBalanceVisible((visible) => !visible)}
                aria-label={isBalanceVisible ? "ซ่อนยอดเงิน" : "แสดงยอดเงิน"}
              >
                {isBalanceVisible ? (
                  <Eye size={20} strokeWidth={1.8} />
                ) : (
                  <EyeOff size={20} strokeWidth={1.8} />
                )}
              </button>
            </div>

            <div className="mt-3 text-3xl font-extrabold tracking-tight">
              {isBalancePending
                ? "กำลังโหลด..."
                : isBalanceError
                  ? "โหลดข้อมูลไม่สำเร็จ"
                  : isBalanceVisible
                    ? `฿${formatCurrency(totalBalance)}`
                    : "฿ •••••••"}
            </div>

            <p className="mt-2 text-xs text-white/80">
              รวมยอดเงินจากทุก Wallet
            </p>

            <div className="mt-6 flex items-center justify-between border-t border-white/25 pt-4">
              <span className="text-sm text-white/85">จำนวน Wallet</span>
              <span className="font-bold">{wallets.length} ใบ</span>
            </div>
          </div>
        </section>
        {/* Wallet Allocation */}
        <section className="mt-5 rounded-[28px] border border-white/70 bg-white/65 p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-[#E9E3FF] text-[#7566C7]">
              <PieChart size={21} />
            </div>

            <div>
              <h2 className="font-bold text-[#39365F]">สัดส่วนเงินของฉัน</h2>
              <p className="text-xs text-[#8986A8]">
                เงินของคุณกระจายอยู่ที่ไหนบ้าง
              </p>
            </div>
          </div>

          {/* Single stacked progress bar */}
          <div className="flex h-4 w-full overflow-hidden rounded-full bg-[#E9E6F4]">
            {walletAllocations.map((wallet, index) => {
              const colors = [
                "bg-[#7566C7]",
                "bg-[#F08CB8]",
                "bg-[#70B8D8]",
                "bg-[#E9B96E]",
                "bg-[#7DBFA3]",
              ];

              return (
                wallet.percentage > 0 && (
                  <div
                    key={wallet.id}
                    className={`${colors[index % colors.length]} transition-all duration-500`}
                    style={{ width: `${wallet.percentage}%` }}
                    title={`${wallet.name}: ${wallet.percentage.toFixed(1)}%`}
                  />
                )
              );
            })}
          </div>

          {/* Wallet legend */}
          <div className="mt-4 flex flex-col gap-3">
            {walletAllocations.map((wallet, index) => {
              const colors = [
                "bg-[#7566C7]",
                "bg-[#F08CB8]",
                "bg-[#70B8D8]",
                "bg-[#E9B96E]",
                "bg-[#7DBFA3]",
              ];

              return (
                <div
                  key={wallet.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`size-3 shrink-0 rounded-full ${
                        colors[index % colors.length]
                      }`}
                    />
                    <span className="truncate text-sm font-medium text-[#39365F]">
                      {wallet.name}
                    </span>
                  </div>

                  <span className="shrink-0 text-sm font-bold text-[#7566C7]">
                    {wallet.percentage.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </section>
        {/* Wallet Cards จาก API จริง */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-white/70 text-[#7566C7] shadow-sm">
                <WalletCards size={22} strokeWidth={1.8} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#39365F]">
                  กระเป๋าเงินของฉัน
                </h2>
                <p className="text-xs text-[#8986A8]">
                  จัดการเงินในแต่ละกระเป๋า
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2">
              <button
                type="button"
                className="btn btn-sm rounded-full border-0 bg-[#7566C7] px-4 text-white shadow-sm hover:bg-[#6356B8]  disabled:bg-base-300 disabled:text-base-content/40
              disabled:cursor-not-allowed disabled:shadow-none"
                disabled={wallets.length >= 4}
                onClick={() => {
                  setWalletName("");
                  setValidationError("");
                  setErrorMessage("");
                  setIsCreateOpen(true);
                }}
              >
                <Plus size={16} />
                เพิ่มกระเป๋า
              </button>

              {/* {wallets.length >= 4 && (
                <p className="flex items-center gap-1 text-xs font-semibold text-[#991B1B]">
                  <Info size={14} />
                  เพิ่มกระเป๋าได้สูงสุด 4 ใบ
                </p>
              )} */}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {wallets.map((wallet) => (
              <WalletCard key={wallet.id} wallet={wallet} />
            ))}
          </div>
        </section>
        {/* Portfolio Section */}
        <section className="mt-5">
          <PortfolioCard />
        </section>
        {/* Recent Transactions */}
        <section className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#39365F]">รายการล่าสุด</h2>
              <p className="text-xs text-[#8986A8]">
                ความเคลื่อนไหวทางการเงินของคุณ
              </p>
            </div>

            <button
              type="button"
              className="text-sm font-semibold text-[#7566C7]"
              onClick={() => {
                setTransactionPage(1);
                setIsTransactionsOpen(true);
              }}
            >
              ดูทั้งหมด →
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {isRecentTransactionsPending ? (
              <div className="rounded-2xl bg-white/65 p-5 text-center text-sm text-[#8986A8]">
                กำลังโหลดรายการธุรกรรม...
              </div>
            ) : isRecentTransactionsError ? (
              <div className="rounded-2xl bg-white/65 p-5 text-center text-sm text-error">
                โหลดรายการธุรกรรมไม่สำเร็จ
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="rounded-2xl bg-white/65 p-5 text-center text-sm text-[#8986A8]">
                ยังไม่มีรายการธุรกรรม
              </div>
            ) : (
              recentTransactions.map((transaction) => {
                // ค้นหา Wallet ของ Transaction นี้
                const wallet = wallets.find(
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
        </section>

        {/* All Transactions Modal */}
        {isTransactionsOpen &&
          createPortal(
            <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 p-4">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="transactions-title"
                className="w-full max-w-lg rounded-3xl bg-[#F8F6FF] p-5 shadow-2xl"
              >
                {/* Header */}
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3
                      id="transactions-title"
                      className="text-xl font-bold text-[#39365F]"
                    >
                      รายการธุรกรรมทั้งหมด
                    </h3>
                    <p className="mt-1 text-xs text-[#8986A8]">
                      ประวัติรายรับและรายจ่ายของคุณ
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn btn-circle btn-sm border-0 bg-white text-[#7566C7]"
                    onClick={() => setIsTransactionsOpen(false)}
                    aria-label="ปิด Popup"
                  >
                    ✕
                  </button>
                </div>
                {/* Transaction List */}
                <div className="flex max-h-[55vh] flex-col gap-3 overflow-y-auto">
                  {isTransactionsPending ? (
                    <div className="p-5 text-center text-sm text-[#8986A8]">
                      กำลังโหลดรายการธุรกรรม...
                    </div>
                  ) : isTransactionsError ? (
                    <div className="p-5 text-center text-sm text-error">
                      โหลดรายการธุรกรรมไม่สำเร็จ
                    </div>
                  ) : allTransactionsResponse.data.length === 0 ? (
                    <div className="p-5 text-center text-sm text-[#8986A8]">
                      ยังไม่มีรายการธุรกรรม
                    </div>
                  ) : (
                    allTransactionsResponse.data.map((transaction) => {
                      // ค้นหา Wallet ที่เป็นเจ้าของ Transaction
                      const wallet = wallets.find(
                        (item) => item.id === transaction.wallet_id,
                      );

                      return (
                        <TransactionCard
                          key={transaction.id}
                          transaction={transaction}
                          walletName={wallet?.name ?? "Wallet"}
                          onEdit={(item) => setEditingTransaction(item)}
                          onDelete={(item) => setDeletingTransaction(item)}
                        />
                      );
                    })
                  )}
                </div>

                {/* Pagination */}
                <div className="mt-5 flex items-center justify-between border-t border-[#E9E3FF] pt-4">
                  <button
                    type="button"
                    className="btn btn-sm rounded-full border-0 bg-white text-[#7566C7] disabled:opacity-40"
                    disabled={transactionPage <= 1 || isTransactionsPending}
                    onClick={() => setTransactionPage((page) => page - 1)}
                  >
                    ← ก่อนหน้า
                  </button>

                  <span className="text-sm font-semibold text-[#39365F]">
                    หน้า{" "}
                    {allTransactionsResponse?.pagination.page ??
                      transactionPage}
                    {" / "}
                    {allTransactionsResponse?.pagination.totalPages ?? 1}
                    {/* เครื่องหมาย ?? เรียกว่า Nullish Coalescing Operatorความหมายคือ:
                        - ถ้าค่าทางซ้ายมีค่า ก็ใช้ค่านั้น
                        - ถ้าค่าทางซ้ายเป็น null หรือ undefined ให้ใช้ค่าทางขวาแทน */}
                  </span>

                  <button
                    type="button"
                    className="btn btn-sm rounded-full border-0 bg-[#7566C7] text-white disabled:opacity-40"
                    disabled={
                      isTransactionsPending ||
                      transactionPage >=
                        (allTransactionsResponse?.pagination.totalPages ?? 1)
                    }
                    onClick={() => setTransactionPage((page) => page + 1)}
                  >
                    ถัดไป →
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )}
        {/* Create Wallet Modal */}
        {isCreateOpen &&
          createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-wallet-title"
                className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
              >
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-[#EAE5FF] text-[#7566C7]">
                    <WalletIcon size={24} />
                  </div>

                  <div>
                    <h3
                      id="create-wallet-title"
                      className="text-xl font-bold text-[#39365F]"
                    >
                      สร้างกระเป๋าเงิน
                    </h3>
                    <p className="text-sm text-gray-500">
                      ตั้งชื่อกระเป๋าเงินของคุณ
                    </p>
                  </div>
                </div>

                <label className="form-control">
                  <span className="label-text mb-2 font-medium text-[#39365F]">
                    Wallet Name
                  </span>

                  <input
                    type="text"
                    className="input input-bordered w-full bg-white text-[#39365F] focus:border-[#7566C7] focus:outline-none"
                    placeholder="Enter wallet name"
                    value={walletName}
                    onChange={(e) => {
                      setWalletName(e.target.value);
                      setValidationError("");
                      setErrorMessage("");
                    }}
                    maxLength={100}
                    autoFocus
                    disabled={createMutation.isPending}
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
                    onClick={() => setIsCreateOpen(false)}
                    disabled={createMutation.isPending}
                  >
                    ยกเลิก
                  </button>

                  <button
                    type="button"
                    className="btn border-0 bg-[#7566C7] text-white hover:bg-[#6356B8]"
                    onClick={handleCreateWallet}
                    disabled={
                      !walletName.trim() ||
                      walletName.trim().length > 100 ||
                      createMutation.isPending ||
                      wallets.length >= 4
                    }
                  >
                    {createMutation.isPending ? (
                      <>
                        <span className="loading loading-spinner loading-sm" />
                        กำลังสร้าง...
                      </>
                    ) : (
                      "สร้างกระเป๋า"
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
                    setIsCreateOpen(false);
                  }
                }}
              />
            </div>,
            document.body,
          )}
        {/* เปิด Dialog สำหรับแก้ไขธุรกรรมที่เลือก */}
        {editingTransaction && (
          <TransactionEditDialog
            transaction={editingTransaction}
            wallets={wallets}
            onClose={() => setEditingTransaction(null)}
          />
        )}
        {/* เปิด Dialog ยืนยันการลบธุรกรรม */}
        {deletingTransaction && (
          <TransactionDeleteDialog
            transaction={deletingTransaction}
            walletName={
              wallets.find(
                (wallet) => wallet.id === deletingTransaction.wallet_id,
              )?.name ?? "ไม่พบ Wallet"
            }
            onClose={() => setDeletingTransaction(null)}
          />
        )}
        {/* ปุ่มเพิ่มธุรกรรมที่ติดอยู่กับหน้าจอ */}
        <button
          type="button"
          aria-label="เพิ่มธุรกรรม"
          title="เพิ่มธุรกรรม"
          onClick={() => setIsCreateTransactionOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-[#7566C7] text-white shadow-lg transition hover:scale-105 hover:bg-[#6356B8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7566C7]/40 sm:bottom-8 sm:right-8"
        >
          <Plus size={28} />
        </button>

        {/* แสดงฟอร์มสร้างธุรกรรมเมื่อกดปุ่มบวก */}
        {isCreateTransactionOpen && (
          <TransactionCreateDialog
            wallets={wallets}
            onClose={() => setIsCreateTransactionOpen(false)}
          />
        )}
      </main>
    </div>
  );
}
/*🧠 ทำไมถึงเขียนแบบนี้?
- wallets.map() วนสร้าง Card สำหรับ Wallet ทุกใบ
- wallet={wallet} ส่งข้อมูล Wallet แต่ละใบเข้าไปให้ WalletCard
- key={wallet.id} ช่วยให้ React ระบุ Card แต่ละใบได้ถูกต้อง
- WalletCard จะเรียก useWalletBalanceQuery(wallet.id) ของตัวเอง ทำให้แต่ละใบดึงยอดเงินแยกกัน */
