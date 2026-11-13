import { formatCurrency } from "../../utils/formatCurrency";

interface PnlTextProps {
  pnl: number;
  percent?: number | null;
  className?: string;
}

// แสดงกำไร/ขาดทุน: เขียวเมื่อกำไร แดงเมื่อขาดทุน เทาเมื่อเท่าทุน พร้อมเครื่องหมาย +/-
export function PnlText({ pnl, percent, className = "" }: PnlTextProps) {
  const color =
    pnl > 0 ? "text-[#1E8E5A]" : pnl < 0 ? "text-[#CF3D6B]" : "text-[#5C6899]";
  const sign = pnl > 0 ? "+" : pnl < 0 ? "-" : "";

  return (
    <span className={`${color} ${className}`}>
      {sign}฿{formatCurrency(Math.abs(pnl))}
      {percent != null && (
        <>
          {" "}
          ({sign}
          {Math.abs(percent).toFixed(2)}%)
        </>
      )}
    </span>
  );
}
