import type { Asset } from "../services/asset.services";

// ข้อมูล Asset หนึ่งตัวที่รวม holding + สรุปธุรกรรมแล้ว ใช้ส่งต่อระหว่าง component ของหน้า Investment
export interface AssetView {
  asset: Asset;
  quantity: number;
  avgCostPerUnit: number;
  cost: number;
  buyCount: number;
  sellCount: number;
  lastTransactionDate: string | null;
  // มูลค่าตลาดปัจจุบัน (บาท) เป็น null เมื่อไม่มีราคา เช่น CoinGecko ล่ม หรือเป็นหุ้น
  currentPrice: number | null;
  currentValue: number | null;
  unrealizedPnl: number | null;
  unrealizedPnlPercent: number | null;
  priceUnavailable: boolean;
}
