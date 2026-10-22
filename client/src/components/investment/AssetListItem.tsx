import { ChevronDown } from "lucide-react";
import type { AssetView } from "../../types/investment";
import { formatCurrency } from "../../utils/formatCurrency";

const ASSET_TYPE_LABEL: Record<string, string> = {
  crypto: "คริปโต",
  stock: "หุ้น",
};

function formatQuantity(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 8 });
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  });
}

interface AssetListItemProps {
  view: AssetView;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onShowHistory: () => void;
}

// การ์ดสินทรัพย์หนึ่งตัวใน list "สินทรัพย์ของฉัน" พร้อมส่วนขยายดูรายละเอียดเพิ่มเติม
export function AssetListItem({
  view,
  isExpanded,
  onToggleExpand,
  onShowHistory,
}: AssetListItemProps) {
  return (
    <li className="rounded-2xl bg-white/90 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF1FC] text-sm font-bold text-[#7566C7]">
          {view.asset.symbol.slice(0, 3)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold">{view.asset.symbol}</span>
            <span className="rounded-full bg-[#EEF1FC] px-2 py-0.5 text-[11px] font-medium text-[#5C6899]">
              {ASSET_TYPE_LABEL[view.asset.asset_type] ?? view.asset.asset_type}
            </span>
          </div>
          <p className="truncate text-xs text-[#5C6899]">{view.asset.name}</p>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <dt className="text-[11px] text-[#5C6899]">ถืออยู่</dt>
          <dd className="mt-0.5 text-sm font-bold">
            {formatQuantity(view.quantity)} {view.asset.symbol}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-[#5C6899]">ต้นทุนเฉลี่ย</dt>
          <dd className="mt-0.5 text-sm font-bold">
            {view.quantity > 0
              ? `฿${formatCurrency(view.avgCostPerUnit)}`
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-[#5C6899]">ต้นทุนรวม</dt>
          <dd className="mt-0.5 text-sm font-bold">
            ฿{formatCurrency(view.cost)}
          </dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={onToggleExpand}
        className="mt-2 flex items-center gap-1 text-xs font-semibold text-[#7566C7]"
      >
        ดูเพิ่มเติม
        <ChevronDown
          size={14}
          className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      {isExpanded && (
        <div className="mt-2 flex flex-col gap-1.5 rounded-xl bg-[#F3F5FD] p-3 text-xs">
          <div className="flex justify-between">
            <span className="text-[#5C6899]">ซื้อสะสม</span>
            <span className="font-semibold">{view.buyCount} ครั้ง</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#5C6899]">ขายไปแล้ว</span>
            <span className="font-semibold">{view.sellCount} ครั้ง</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#5C6899]">รายการล่าสุด</span>
            <span className="font-semibold">
              {view.lastTransactionDate
                ? formatShortDate(view.lastTransactionDate)
                : "—"}
            </span>
          </div>
          <button
            type="button"
            onClick={onShowHistory}
            className="mt-1 self-start rounded-full border border-[#BFD3F3] px-3 py-1 font-semibold text-[#7566C7]"
          >
            ดูรายการของ {view.asset.symbol}
          </button>
        </div>
      )}
    </li>
  );
}
