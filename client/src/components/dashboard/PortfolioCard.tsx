import { ChartNoAxesCombined, CircleAlert } from "lucide-react";
import { usePortfolioQuery } from "../../hooks/usePortfolioQuery";
import { useNavigate } from "@tanstack/react-router";

export function PortfolioCard() {
  const navigate = useNavigate();
  const { data, isPending, isError } = usePortfolioQuery();

  const holdings = data?.holdings ?? [];

  const totalCost = holdings.reduce(
    (total, holding) =>
      total + Number(holding.quantity) * Number(holding.avgCostPerUnit),
    0,
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate({ to: "/investment" })}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          navigate({ to: "/investment" });
        }
      }}
      className="card cursor-pointer border border-white/80 bg-white/70 shadow-sm transition hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7566C7]"
    >
      <div className="card-body gap-4 p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-[#EAE5FF] text-[#7566C7]">
            <ChartNoAxesCombined size={23} />
          </div>

          <div>
            <h2 className="font-semibold text-[#39365F]">
              พอร์ตการลงทุนของฉัน
            </h2>
            <p className="text-sm text-[#8986A8]">ภาพรวมสินทรัพย์ที่ถืออยู่</p>
          </div>
        </div>

        {isPending ? (
          <div className="flex items-center gap-2 text-sm text-[#8986A8]">
            <span className="loading loading-spinner loading-sm" />
            กำลังโหลดข้อมูลพอร์ต...
          </div>
        ) : isError ? (
          <p className="flex items-center gap-2 text-sm text-error">
            <CircleAlert size={17} />
            โหลดข้อมูลพอร์ตไม่สำเร็จ
          </p>
        ) : (
          <>
            <div>
              <p className="text-sm text-[#8986A8]">ต้นทุนรวม</p>
              <p className="mt-1 text-2xl font-bold text-[#6356B8]">
                ฿
                {totalCost.toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-[#EAE5FF] pt-3">
              <span className="text-sm text-[#8986A8]">
                จำนวนสินทรัพย์ที่ถือ
              </span>
              <span className="font-semibold text-[#39365F]">
                {holdings.length} รายการ
              </span>
            </div>

            {holdings.length === 0 && (
              <p className="text-sm text-[#8986A8]">ยังไม่มีสินทรัพย์ในพอร์ต</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
