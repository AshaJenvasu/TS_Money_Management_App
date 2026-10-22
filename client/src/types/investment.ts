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
}
