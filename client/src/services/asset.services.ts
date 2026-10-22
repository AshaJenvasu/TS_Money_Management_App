import { api } from "../api/axios";

// ชนิดของสินทรัพย์ ตรงกับ Prisma enum AssetType
export type AssetType = "crypto" | "stock";

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  symbol: string;
  asset_type: AssetType;
  created_at: string;
  updated_at: string;
}

// สรุปยอดถือครองปัจจุบันของ Asset หนึ่งตัว
export interface AssetHoldingSummary {
  quantity: string;
  avg_cost_per_unit: string;
  total_cost: string;
}

export interface CreateAssetPayload {
  symbol: string;
  name: string;
  asset_type: AssetType;
}

// แก้ไขได้เฉพาะชื่อ symbol และ asset_type แก้ไม่ได้หลังสร้างแล้ว
export interface UpdateAssetPayload {
  name: string;
}

export const assetService = {
  // ดึงรายการ Asset ทั้งหมดของผู้ใช้ที่ login อยู่
  getAssets: async (): Promise<Asset[]> => {
    const response = await api.get<Asset[]>("/assets");
    return response.data;
  },

  // สร้าง Asset ใหม่ symbol/name ต้องไม่ซ้ำของผู้ใช้คนเดียวกัน
  createAsset: async (payload: CreateAssetPayload): Promise<Asset> => {
    const response = await api.post<Asset>("/assets", payload);
    return response.data;
  },

  // แก้ไขชื่อ Asset backend จะปฏิเสธถ้า Asset นี้มี holding ผูกอยู่แล้ว
  updateAsset: async (
    id: string,
    payload: UpdateAssetPayload,
  ): Promise<Asset> => {
    const response = await api.put<Asset>(`/assets/${id}`, payload);
    return response.data;
  },

  // ลบ Asset พร้อม cascade ลบ holding และ transaction ที่เกี่ยวข้องให้อัตโนมัติ
  deleteAsset: async (id: string): Promise<void> => {
    await api.delete(`/assets/${id}`);
  },

  // ดึงสรุปยอดถือครองปัจจุบันของ Asset ตัวเดียว
  getAssetHolding: async (id: string): Promise<AssetHoldingSummary> => {
    const response = await api.get<AssetHoldingSummary>(
      `/assets/${id}/holding`,
    );
    return response.data;
  },
};
