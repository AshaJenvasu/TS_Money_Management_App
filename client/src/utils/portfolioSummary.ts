import type { AssetView } from "../types/investment";

export interface MarketSummary {
  totalCurrentValue: number;
  totalUnrealizedPnl: number;
  // จำนวนสินทรัพย์ที่ถืออยู่แต่ไม่มีราคา (ไม่นับรวมในมูลค่าตลาดและกำไร/ขาดทุน)
  unpricedCount: number;
}

// ปัดเป็นสตางค์ และกัน -0 ไม่ให้หลุดเข้า PnlText
const roundToSatang = (value: number): number =>
  Math.round(value * 100) / 100 + 0;

// สรุปมูลค่าตลาดรวมเฉพาะสินทรัพย์ที่มีราคา
// P&L รวมใช้ผลรวมของ unrealizedPnl ที่ server คำนวณด้วย Decimal ไม่คูณ quantity * avgCost ซ้ำฝั่ง client
// เพราะ float ทำให้เท่าทุนจริงได้ค่าเศษ เช่น -5.55e-17 แล้วสีขึ้นแดงผิด
export function summarizeMarket(heldAssetViews: AssetView[]): MarketSummary | null {
  const pricedViews = heldAssetViews.filter(
    (view) => view.currentValue !== null && view.unrealizedPnl !== null,
  );
  if (pricedViews.length === 0) return null;

  const totalCurrentValue = pricedViews.reduce(
    (sum, view) => sum + (view.currentValue ?? 0),
    0,
  );
  const totalUnrealizedPnl = pricedViews.reduce(
    (sum, view) => sum + (view.unrealizedPnl ?? 0),
    0,
  );

  return {
    totalCurrentValue: roundToSatang(totalCurrentValue),
    totalUnrealizedPnl: roundToSatang(totalUnrealizedPnl),
    unpricedCount: heldAssetViews.length - pricedViews.length,
  };
}
