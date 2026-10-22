import { ChevronDown } from "lucide-react";
import type { PortfolioTransactionListItem } from "../../services/portfolio.services";
import { formatCurrency } from "../../utils/formatCurrency";

function formatQuantity(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 8 });
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  });
}

interface TransactionHistorySectionProps {
  transactions: PortfolioTransactionListItem[];
  visibleCount: number;
  onShowMore: () => void;
  filterSymbol: string | null;
  onClearFilter: () => void;
}

// ส่วน "ประวัติการซื้อขาย" พร้อม filter ตาม asset และ pagination แบบ "ดูเพิ่มเติม"
export function TransactionHistorySection({
  transactions,
  visibleCount,
  onShowMore,
  filterSymbol,
  onClearFilter,
}: TransactionHistorySectionProps) {
  const visibleTransactions = transactions.slice(0, visibleCount);

  return (
    <section id="investment-history">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">ประวัติการซื้อขาย</h2>
        {filterSymbol && (
          <button
            type="button"
            onClick={onClearFilter}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#1F2A5C] shadow-sm"
          >
            {filterSymbol} ✕
          </button>
        )}
      </div>

      <div className="rounded-2xl bg-white/90 shadow-sm">
        {visibleTransactions.length === 0 ? (
          <p className="p-6 text-center text-sm text-[#5C6899]">
            ยังไม่มีรายการซื้อขาย
          </p>
        ) : (
          <ul className="divide-y divide-[#E6EAF8] px-4">
            {visibleTransactions.map((transaction) => {
              const isBuy = transaction.transactionType === "buy";
              return (
                <li
                  key={transaction.transactionId}
                  className="flex items-center gap-3 py-3"
                >
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                      isBuy
                        ? "bg-[#DDF5EA] text-[#14775A]"
                        : "bg-[#FFE3EC] text-[#CF3D6B]"
                    }`}
                  >
                    {isBuy ? "+" : "−"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-bold ${isBuy ? "text-[#14775A]" : "text-[#CF3D6B]"}`}
                    >
                      {isBuy ? "ซื้อ" : "ขาย"} {transaction.symbol}
                    </p>
                    <p className="text-xs text-[#5C6899]">
                      {formatQuantity(Number(transaction.quantity))} × ฿
                      {formatCurrency(Number(transaction.pricePerUnit))} ·{" "}
                      {formatShortDate(transaction.transactionDate)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold">
                    ฿
                    {formatCurrency(
                      Number(transaction.quantity) *
                        Number(transaction.pricePerUnit),
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex justify-center p-3">
          {transactions.length > visibleCount ? (
            <button
              type="button"
              onClick={onShowMore}
              className="flex w-full items-center justify-center gap-1 rounded-xl border border-[#BFD3F3] py-2.5 text-sm font-semibold text-[#7566C7]"
            >
              ดูเพิ่มเติม
              <ChevronDown size={16} />
            </button>
          ) : (
            transactions.length > 0 && (
              <p className="py-1 text-xs text-[#5C6899]">
                แสดงครบทุกรายการแล้ว
              </p>
            )
          )}
        </div>
      </div>
    </section>
  );
}
