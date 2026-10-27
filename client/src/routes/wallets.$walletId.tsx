/* eslint-disable react-refresh/only-export-components */
import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Wallet,
} from "lucide-react";
import { useWalletTransactionsQuery } from "../hooks/useTransactionsQuery";
import { useWalletQuery } from "../hooks/useWalletQuery";
import { useWalletBalanceQuery } from "../hooks/useWalletBalanceQuery";
import TransactionCard from "../components/transactions/TransactionCard";
import TransactionCreateDialog from "../components/transactions/TransactionCreateDialog";
import TransactionEditDialog from "../components/transactions/TransactionEditDialog";
import TransactionDeleteDialog from "../components/transactions/TransactionDeleteDialog";
import DateRangeFilterDropdown from "../components/ui/DateRangeFilterDropdown";
import WalletDetailScene from "../components/wallet-detail/WalletDetailScene";
import SakuraPetals from "../components/wallet-detail/SakuraPetals";
import PeekingCat from "../components/wallet-detail/PeekingCat";
import HeroDecor from "../components/wallet-detail/HeroDecor";
import type { Transaction } from "../services/transaction.services";
import { formatCurrency } from "../utils/formatCurrency";
import {
  getDateRangeForPreset,
  type DateRange,
} from "../utils/dateRangePresets";

const PAGE_SIZE = 10;

interface TransactionGroup {
  label: string;
  items: Transaction[];
}

// จัดกลุ่มรายการธุรกรรมตามวันที่ สมมติว่ารายการที่ได้มาเรียงจากใหม่ไปเก่าอยู่แล้ว
function groupTransactionsByDate(
  transactions: Transaction[],
): TransactionGroup[] {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

  const labelFor = (iso: string) => {
    const date = new Date(iso);
    if (isSameDay(date, today)) return "วันนี้";
    if (isSameDay(date, yesterday)) return "เมื่อวาน";
    return date.toLocaleDateString("th-TH", { day: "numeric", month: "long" });
  };

  const groups: TransactionGroup[] = [];
  for (const transaction of transactions) {
    const label = labelFor(transaction.transaction_date);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.label === label) {
      lastGroup.items.push(transaction);
    } else {
      groups.push({ label, items: [transaction] });
    }
  }
  return groups;
}

function WalletDetailPage() {
  // ชื่อ param ยังคือ walletId ตามชื่อไฟล์ route แต่ค่าจริงคือ publicId
  const { walletId: publicId } = Route.useParams();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] =
    useState<Transaction | null>(null);

  const [dateRange, setDateRange] = useState<DateRange>(() =>
    getDateRangeForPreset("thisMonth"),
  );

  // รับค่าช่วงวันที่ใหม่จาก DateRangeFilterDropdown แล้วรีเซ็ตหน้ากลับไปหน้า 1 เสมอ
  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    setPage(1);
  };

  const walletQuery = useWalletQuery(publicId);
  const wallet = walletQuery.data;

  const balanceQuery = useWalletBalanceQuery(wallet?.id ?? "");
  const transactionsQuery = useWalletTransactionsQuery(wallet?.id ?? "", {
    page,
    limit: PAGE_SIZE,
    from: dateRange.from,
    to: dateRange.to,
  });

  const transactions = transactionsQuery.data?.data ?? [];
  const pagination = transactionsQuery.data?.pagination;
  const groupedTransactions = groupTransactionsByDate(transactions);

  if (walletQuery.isLoading) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-[#E9EAF8]">
        <span className="loading loading-spinner loading-lg text-[#7566C7]" />
      </section>
    );
  }

  if (walletQuery.isError || !wallet) {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#E9EAF8] p-6 text-center">
        <p className="text-[#39365F]">
          ไม่พบ wallet ที่ต้องการ หรือคุณไม่มีสิทธิ์เข้าถึง
        </p>
        <button
          type="button"
          onClick={() => navigate({ to: "/wallets" })}
          className="rounded-full bg-[#7566C7] px-5 py-2 text-sm font-semibold text-white"
        >
          กลับไปหน้ากระเป๋าเงิน
        </button>
      </section>
    );
  }

  // แยกเครื่องหมายลบออกจากตัวเลขก่อนประกอบกับสัญลักษณ์บาท ป้องกัน "฿-1,000.00" ที่อ่านแปลก
  const balanceValue = Number(balanceQuery.data?.balance ?? 0);
  const isNegativeBalance = balanceValue < 0;
  const balanceDisplay = balanceQuery.isLoading
    ? "..."
    : `${isNegativeBalance ? "-" : ""}฿${formatCurrency(Math.abs(balanceValue))}`;

  return (
    <section className="relative z-0 min-h-screen overflow-hidden bg-[#E9EAF8] p-6 text-[#1F2A5C]">
      <WalletDetailScene />
      <SakuraPetals />
      <button
        type="button"
        onClick={() => navigate({ to: "/wallets" })}
        className="relative mb-4 flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#7566C7] shadow-sm"
      >
        <ArrowLeft size={16} />
        กลับไปหน้ากระเป๋าเงิน
      </button>
      <div className="relative mt-20">
        <PeekingCat />
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#7566C7] to-[#9B8FE0] p-6 text-white shadow-[0_26px_50px_-22px_rgba(70,60,160,0.65),inset_0_1px_0_rgba(255,255,255,0.35)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-10 -right-10 size-40 rounded-full bg-white/10 blur-2xl"
          />
          <HeroDecor />

          <div className="relative flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-white/20">
              <Wallet size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold">{wallet.name}</h1>
              <p className="text-sm text-white/70">ยอดเงินคงเหลือ</p>
            </div>
          </div>

          <p className="relative mt-6 text-3xl font-bold">{balanceDisplay}</p>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="relative mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-bold text-[#7566C7] shadow-md transition hover:shadow-lg active:scale-[0.99]"
          >
            <Plus size={18} />
            เพิ่มรายการ
          </button>
        </div>
      </div>
      <div className="relative mt-6 rounded-3xl bg-white/60 p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[#39365F]">รายการธุรกรรม</h2>

          <DateRangeFilterDropdown onChange={handleDateRangeChange} />
        </div>

        {transactionsQuery.isLoading ? (
          <p className="py-8 text-center text-[#8986A8]">กำลังโหลดรายการ...</p>
        ) : transactionsQuery.isError ? (
          <p className="py-8 text-center text-red-500">
            โหลดรายการธุรกรรมไม่สำเร็จ ลองใหม่อีกครั้งนะคะ
          </p>
        ) : transactions.length === 0 ? (
          <p className="py-8 text-center text-[#8986A8]">
            ยังไม่มีรายการธุรกรรมใน wallet นี้
          </p>
        ) : (
          <>
            {groupedTransactions.map((group) => (
              <div key={group.label}>
                <h3 className="mb-2 mt-4 text-xs font-semibold text-[#8986A8] first:mt-3">
                  {group.label}
                </h3>
                <div className="space-y-3">
                  {group.items.map((transaction) => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      walletName={wallet.name}
                      onEdit={setEditingTransaction}
                      onDelete={setDeletingTransaction}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* ปุ่มเปลี่ยนหน้า: ย้ายออกมานอก groupedTransactions.map() ให้โชว์แค่ครั้งเดียวท้ายรายการทั้งหมด */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="flex items-center gap-1 rounded-full border border-[#7566C7] px-3 py-2 text-sm font-semibold text-[#7566C7] disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  ก่อนหน้า
                </button>
                <span className="text-sm text-[#8986A8]">
                  หน้า {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex items-center gap-1 rounded-full border border-[#7566C7] px-3 py-2 text-sm font-semibold text-[#7566C7] disabled:opacity-40"
                >
                  ถัดไป
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
      {isCreateOpen && (
        <TransactionCreateDialog
          wallets={[wallet]}
          onClose={() => setIsCreateOpen(false)}
        />
      )}
      {editingTransaction && (
        <TransactionEditDialog
          transaction={editingTransaction}
          wallets={[wallet]}
          onClose={() => setEditingTransaction(null)}
        />
      )}
      {deletingTransaction && (
        <TransactionDeleteDialog
          transaction={deletingTransaction}
          walletName={wallet.name}
          onClose={() => setDeletingTransaction(null)}
        />
      )}
    </section>
  );
}

export const Route = createFileRoute("/wallets/$walletId")({
  component: WalletDetailPage,
});
