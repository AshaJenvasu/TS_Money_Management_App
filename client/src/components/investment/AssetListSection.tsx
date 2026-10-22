import { Search } from "lucide-react";
import type { AssetView } from "../../types/investment";
import { AssetListItem } from "./AssetListItem";

interface AssetListSectionProps {
  assetViews: AssetView[];
  hasAnyAssets: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  expandedAssetIds: Set<string>;
  onToggleExpand: (assetId: string) => void;
  onShowHistoryOfAsset: (assetId: string) => void;
}

// ส่วน "สินทรัพย์ของฉัน" ค้นหา + list การ์ด asset ทั้งหมด
export function AssetListSection({
  assetViews,
  hasAnyAssets,
  query,
  onQueryChange,
  expandedAssetIds,
  onToggleExpand,
  onShowHistoryOfAsset,
}: AssetListSectionProps) {
  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">สินทรัพย์ของฉัน</h2>
      </div>

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#6E7BB3]" />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="ค้นหาสินทรัพย์ เช่น BTC"
          className="h-12 w-full rounded-2xl border border-[#BFD3F3] bg-white/90 pl-11 pr-4 text-sm focus:border-[#7566C7] focus:outline-none"
        />
      </div>

      {assetViews.length === 0 ? (
        <div className="rounded-2xl bg-white/70 p-6 text-center text-sm text-[#5C6899]">
          {hasAnyAssets
            ? `ไม่พบสินทรัพย์ที่ตรงกับ "${query.trim()}"`
            : "ยังไม่มีสินทรัพย์ในพอร์ต"}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {assetViews.map((view) => (
            <AssetListItem
              key={view.asset.id}
              view={view}
              isExpanded={expandedAssetIds.has(view.asset.id)}
              onToggleExpand={() => onToggleExpand(view.asset.id)}
              onShowHistory={() => onShowHistoryOfAsset(view.asset.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
