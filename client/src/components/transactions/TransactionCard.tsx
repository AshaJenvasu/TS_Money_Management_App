import { useState } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import type { Transaction } from "../../services/transaction.services";
import { formatCurrency } from "../../utils/formatCurrency";

interface TransactionCardProps {
  transaction: Transaction;
  walletName: string;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  showTodayLabel?: boolean;
}

export default function TransactionCard({
  transaction,
  walletName,
  onEdit,
  onDelete,
  showTodayLabel = false,
}: TransactionCardProps) {
  // ควบคุมการเปิดและปิดเมนูของรายการนี้
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // เตรียมข้อมูลสำหรับแสดงประเภทรายการและวันที่
  const isIncome = transaction.transaction_type === "income";
  const date = new Date(transaction.transaction_date);

  // ตรวจสอบว่ารายการเกิดขึ้นในวันนี้หรือไม่
  const isToday = date.toDateString() === new Date().toDateString();

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/80 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
            isIncome
              ? "bg-[#E2F5E9] text-[#399568]"
              : "bg-[#FCE7EF] text-[#D85D8B]"
          }`}
        >
          {isIncome ? "+" : "−"}
        </div>

        <div className="min-w-0">
          <p className="truncate font-semibold text-[#39365F]">
            {transaction.note || "รายการธุรกรรม"}
          </p>
          <p className="mt-1 text-xs text-[#8986A8]">
            {walletName || "Wallet"} ·{" "}
            {showTodayLabel && isToday
              ? "วันนี้"
              : date.toLocaleDateString("th-TH", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <p
          className={`text-sm font-bold ${
            isIncome ? "text-[#399568]" : "text-[#D85D8B]"
          }`}
        >
          {isIncome ? "+" : "−"}฿{formatCurrency(Number(transaction.amount))}
        </p>

        <div className="relative">
          <button
            type="button"
            aria-label="ตัวเลือก Transaction"
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
            className="rounded-lg p-2 text-[#8986A8] hover:bg-[#F1EFFA]"
          >
            <MoreVertical size={18} />
          </button>

          {isMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full z-20 mt-1 w-36 rounded-xl border border-gray-100 bg-white p-1 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsMenuOpen(false);
                  onEdit(transaction);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#39365F] hover:bg-[#F1EFFA]"
              >
                <Pencil size={15} />
                แก้ไข
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsMenuOpen(false);
                  onDelete(transaction);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 size={15} />
                ลบ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
