import { z } from "@hono/zod-openapi";

// Enum สำหรับ AssetType ให้ตรงตาม Prisma Schema
export const AssetTypeSchema = z.enum(["crypto", "stock"]);

// 1. Schema สำหรับ Body ตอนสร้าง Asset (POST /assets)
export const CreateAssetBodySchema = z
  .object({
    // symbol เป็นแค่ชื่อแสดงผล รับเฉพาะ A-Z a-z 0-9 (ไม่รับ comma/ช่องว่าง ที่เสี่ยงปนค่าตอนส่งต่อ)
    symbol: z
      .string()
      .regex(/^[A-Za-z0-9]{1,10}$/, "symbol must be 1-10 letters or digits")
      .openapi({ example: "BTC" }),
    name: z.string().min(1).max(100).openapi({ example: "Bitcoin" }),
    asset_type: AssetTypeSchema.openapi({ example: "crypto" }),
    coingecko_id: z
      .string()
      .min(1)
      .max(100)
      .optional()
      .openapi({
        example: "bitcoin",
        description: "CoinGecko coin id (ได้จาก GET /assets/search-coins) บังคับเมื่อ asset_type เป็น crypto",
      }),
  })
  .refine((body) => body.asset_type !== "crypto" || !!body.coingecko_id, {
    message: "coingecko_id is required for crypto assets",
    path: ["coingecko_id"],
  });

// 2. Schema สำหรับ Body ตอนอัปเดต Asset (PUT /assets/:id)
export const UpdateAssetBodySchema = z.object({
  name: z.string().min(1).max(100).openapi({ example: "Bitcoin Core" }),
});

// 3. Schema สำหรับ Params (URL Parameter :id)
export const AssetIdParamSchema = z.object({
  id: z.string().openapi({ example: "1" }),
});

// 4. Schema สำหรับ Response Asset ทั่วไป
export const AssetResponseSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string(),
  symbol: z.string(),
  asset_type: AssetTypeSchema,
  coingecko_id: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

// 5. Schema สำหรับ Response รายการ Assets (GET /assets)
export const AssetListResponseSchema = z.array(AssetResponseSchema);

// 6. Schema สำหรับ Response ยอดถือครอง (GET /assets/:id/holding)
export const AssetHoldingResponseSchema = z.object({
  quantity: z.string().openapi({ example: "1.50000000" }),
  avg_cost_per_unit: z.string().openapi({ example: "65000.00000000" }),
  total_cost: z.string().openapi({ example: "97500.00000000" }),
});

// 7. Schema สำหรับ Error Response
export const ErrorResponseSchema = z.object({
  message: z.string(),
});
