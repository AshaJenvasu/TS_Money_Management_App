/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from "@tanstack/react-router";
import { ChartNoAxesCombined, CircleAlert } from "lucide-react";
import { usePortfolioQuery } from "../hooks/usePortfolioQuery";

// หน้า Investment แสดงรายการสินทรัพย์ที่ถืออยู่ทั้งหมด อ่านอย่างเดียวในเวอร์ชันนี้
function InvestmentPage() {
  const { data, isPending, isError, refetch } = usePortfolioQuery();
  const holdings = data?.holdings ?? [];

  const totalCost = holdings.reduce(
    (total, holding) =>
      total + Number(holding.quantity) * Number(holding.avgCostPerUnit),
    0,
  );

  return (
    <div className="min-h-screen bg-[#E9EAF8] px-5 py-6 text-[#1F2A5C] sm:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-6 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[#EAE5FF] text-[#7566C7]">
            <ChartNoAxesCombined size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#39365F]">
              พอร์ตการลงทุนของฉัน
            </h1>
            <p className="text-sm text-[#8986A8]">
              สินทรัพย์ทั้งหมดที่คุณถืออยู่
            </p>
          </div>
        </header>

        {isPending ? (
          <div className="flex items-center gap-2 rounded-3xl bg-white/70 p-6 text-sm text-[#8986A8]">
            <span className="loading loading-spinner loading-sm" />
            กำลังโหลดข้อมูลพอร์ต...
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl bg-white/70 p-6 text-center text-sm text-error">
            <CircleAlert size={22} />
            โหลดข้อมูลพอร์ตไม่สำเร็จ
            <button
              type="button"
              onClick={() => refetch()}
              className="btn btn-sm rounded-full border-0 bg-[#7566C7] text-white"
            >
              ลองอีกครั้ง
            </button>
          </div>
        ) : (
          <>
            <section className="mb-6 rounded-3xl bg-gradient-to-br from-[#7775E8] via-[#A18AE8] to-[#F0A9CF] p-6 text-white shadow-lg">
              <p className="text-sm text-white/85">ต้นทุนรวมทั้งหมด</p>
              <p className="mt-2 text-3xl font-extrabold">
                ฿
                {totalCost.toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="mt-2 text-xs text-white/80">
                จาก {holdings.length} สินทรัพย์
              </p>
            </section>

            {holdings.length === 0 ? (
              <div className="rounded-3xl bg-white/70 p-8 text-center text-sm text-[#8986A8]">
                ยังไม่มีสินทรัพย์ในพอร์ต
              </div>
            ) : (
              <section className="flex flex-col gap-3">
                {holdings.map((holding) => {
                  const cost =
                    Number(holding.quantity) * Number(holding.avgCostPerUnit);
                  return (
                    <div
                      key={holding.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/80 p-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#EAE5FF] text-xs font-bold text-[#7566C7]">
                          {holding.asset.symbol.slice(0, 4)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[#39365F]">
                            {holding.asset.name}
                          </p>
                          <p className="mt-1 text-xs text-[#8986A8]">
                            {holding.asset.symbol} · {holding.asset.assetType} ·
                            จำนวน {holding.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-[#39365F]">
                          ฿
                          {cost.toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-xs text-[#8986A8]">
                          เฉลี่ย ฿
                          {Number(holding.avgCostPerUnit).toLocaleString(
                            "th-TH",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                          /หน่วย
                        </p>
                      </div>
                    </div>
                  );
                })}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/investment")({
  component: InvestmentPage,
});
