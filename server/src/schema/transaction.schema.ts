import { z } from "@hono/zod-openapi";

// Parameter Schema สำหรับ Route ที่มี walletId
export const WalletIdParamSchema = z.object({
  walletId: z.string().openapi({ example: "1", description: "ID ของ Wallet" }),
});

// Parameter Schema สำหรับ Route ที่มีทั้ง walletId และ transaction id
export const TransactionIdParamSchema = z.object({
  walletId: z.string().openapi({ example: "1", description: "ID ของ Wallet" }),
  id: z.string().openapi({ example: "100", description: "ID ของ Transaction" }),
});

// Request Body Schema สำหรับสร้าง Transaction ใหม่
export const CreateTransactionBodySchema = z.object({
  transaction_type: z
    .enum(["income", "expense"])
    .openapi({ example: "expense" }),
  // รับยอดเงินเป็น string รูปแบบตัวเลขทศนิยม เพื่อป้องกัน floating-point precision ใน JS
  amount: z
    .string()
    .regex(
      /^\d+(\.\d{1,2})?$/,
      "จำนวนเงินต้องเป็นตัวเลขทศนิยมไม่เกิน 2 ตำแหน่ง",
    )
    .openapi({ example: "150.50" }),
  note: z.string().nullish().openapi({ example: "ซื้อกาแฟสด" }),
  transaction_date: z
    .string()
    .datetime()
    .openapi({ example: "2026-10-07T10:00:00Z" }),
});

// Request Body Schema สำหรับอัปเดต Transaction
export const UpdateTransactionBodySchema = z.object({
  transaction_type: z.enum(["income", "expense"]).optional(),
  amount: z.string().optional(),
  note: z.string().nullish(),

  // แปลง "" ให้กลายเป็น undefined ก่อนโดนตรวจ .datetime()
  transaction_date: z
    .preprocess(
      (val) => (val === "" ? undefined : val), //แปลง "" เป็น undefined
      z.string().datetime().optional(),
    )
    .openapi({ example: "2026-10-07T10:00:00Z" }),
});
// Query Schema สำหรับกำหนดหน้าที่ต้องการและจำนวนรายการ
export const TransactionPaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).openapi({
    example: 1,
    description: "หน้าที่ต้องการดึงข้อมูล",
  }),
  limit: z.coerce.number().int().min(1).max(100).default(10).openapi({
    example: 10,
    description: "จำนวนรายการต่อหน้า",
  }),
});

// Query Schema สำหรับกรองตามช่วงวันที่ ต่อยอดจาก Pagination Schema เดิม (ไม่เขียน page/limit ซ้ำ)
export const TransactionDateFilterQuerySchema =
  TransactionPaginationQuerySchema.extend({
    from: z.string().date().optional().openapi({
      example: "2026-10-01",
      description: "วันที่เริ่มต้น (YYYY-MM-DD)",
    }),
    to: z.string().date().optional().openapi({
      example: "2026-10-31",
      description: "วันที่สิ้นสุด (YYYY-MM-DD)",
    }),
  }).refine((data) => !data.from || !data.to || data.from <= data.to, {
    message: "from ต้องไม่อยู่หลัง to",
    path: ["from"],
  });
