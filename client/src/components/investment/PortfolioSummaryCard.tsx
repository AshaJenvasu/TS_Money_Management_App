import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { AssetView } from "../../types/investment";
import { formatCurrency } from "../../utils/formatCurrency";

const DONUT_COLORS = [
  "#7566C7",
  "#F08CB8",
  "#70B8D8",
  "#E9B96E",
  "#7DBFA3",
  "#9B8AFB",
  "#E2779E",
];

interface PortfolioSummaryCardProps {
  totalCost: number;
  heldAssetViews: AssetView[];
}

// การ์ดสรุปต้นทุนรวมของพอร์ต พร้อม donut chart และ legend สัดส่วนตามสินทรัพย์
export function PortfolioSummaryCard({
  totalCost,
  heldAssetViews,
}: PortfolioSummaryCardProps) {
  return (
    <section className="mb-6 flex flex-wrap items-center gap-4 rounded-[26px] bg-white/90 p-5 shadow-sm">
      <div className="min-w-[150px] flex-1">
        <p className="text-sm font-medium text-[#5C6899]">ต้นทุนรวมของพอร์ต</p>
        <p className="mt-1 text-3xl font-extrabold">
          ฿{formatCurrency(totalCost)}
        </p>
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#EEF1FC] px-3 py-1 text-xs font-semibold text-[#7566C7]">
          {heldAssetViews.length} สินทรัพย์
        </span>
        <p className="mt-3 text-xs leading-relaxed text-[#5C6899]">
          คำนวณจากต้นทุนเฉลี่ยที่คุณบันทึก ไม่ใช่ราคาตลาดปัจจุบัน
        </p>
      </div>

      <div className="relative mx-auto size-40 shrink-0">
        {heldAssetViews.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={heldAssetViews}
                  dataKey="cost"
                  innerRadius={54}
                  outerRadius={76}
                  paddingAngle={heldAssetViews.length > 1 ? 2 : 0}
                  stroke="none"
                >
                  {heldAssetViews.map((view, index) => (
                    <Cell
                      key={view.asset.id}
                      fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-[#5C6899]">สัดส่วน</span>
              <span className="text-xs text-[#5C6899]">ตามต้นทุน</span>
            </div>
          </>
        ) : (
          <div className="flex size-full flex-col items-center justify-center rounded-full border-[14px] border-[#E6EAF8] text-center">
            <span className="text-xs text-[#5C6899]">ยังไม่มี</span>
            <span className="text-xs text-[#5C6899]">สินทรัพย์</span>
          </div>
        )}
      </div>

      {heldAssetViews.length > 0 && (
        <ul className="w-full border-t border-[#E6EAF8] pt-3">
          {heldAssetViews.map((view, index) => (
            <li
              key={view.asset.id}
              className="flex items-center justify-between gap-3 py-1.5"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-sm"
                  style={{
                    backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length],
                  }}
                />
                <span className="truncate text-sm font-semibold">
                  {view.asset.symbol}
                </span>
                <span className="truncate text-xs text-[#5C6899]">
                  {view.asset.name}
                </span>
              </div>
              <span className="shrink-0 text-xs font-bold text-[#7566C7]">
                {((view.cost / totalCost) * 100).toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
