import { z } from "@hono/zod-openapi";

// ตรวจสอบว่า String เป็นเลขทศนิยมบวกและมีทศนิยมไม่เกิน 8 ตำแหน่ง
const positiveDecimalSchema = z
  .string()
  .regex(/^\d+(\.\d{1,8})?$/, "Invalid decimal format")
  .refine((value) => /[1-9]/.test(value), {
    message: "Value must be greater than 0",
  });

export const PortfolioHoldingItemSchema = z.object({
  id: z.string(),
  portfolioId: z.string(),
  assetId: z.string(),
  quantity: z.string(),
  avgCostPerUnit: z.string(),
  asset: z.object({
    id: z.string(),
    name: z.string(),
    symbol: z.string(),
    assetType: z.string(),
  }),
});

export const GetPortfolioResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  holdings: z.array(PortfolioHoldingItemSchema),
});

// ตรวจสอบข้อมูลที่ Client ส่งมาเพื่อสร้าง Portfolio Transaction
export const CreatePortfolioTransactionSchema = z.object({
  assetId: z
    .string()
    .regex(/^[1-9]\d*$/, "assetId must be a positive integer")
    .openapi({
      example: "1",
      description: "ID ของสินทรัพย์ที่ต้องการซื้อหรือขาย",
    }),

  transaction_type: z.enum(["buy", "sell"]).openapi({
    example: "buy",
    description: "ประเภทธุรกรรม: buy = ซื้อ, sell = ขาย",
  }),

  quantity: positiveDecimalSchema.openapi({
    example: "0.5",
    description: "จำนวนสินทรัพย์ที่ซื้อหรือขาย ต้องมากกว่า 0",
  }),

  price_per_unit: positiveDecimalSchema.openapi({
    example: "95000.00",
    description: "ราคาต่อหน่วย ต้องมากกว่า 0",
  }),

  transaction_date: z.string().datetime().openapi({
    example: "2026-10-09T10:00:00.000Z",
    description: "วันที่และเวลาทำธุรกรรมในรูปแบบ ISO 8601",
  }),
});

// กำหนดรูปแบบ Response หลังสร้างธุรกรรมสำเร็จ
export const CreatePortfolioTransactionResponseSchema = z.object({
  transaction: z.object({
    id: z.string(),
    portfolioId: z.string(),
    assetId: z.string(),
    transaction_type: z.enum(["buy", "sell"]),
    quantity: z.string(),
    price_per_unit: z.string(),
    transaction_date: z.string(),
  }),
  holding: z.object({
    id: z.string(),
    assetId: z.string(),
    quantity: z.string(),
    avgCostPerUnit: z.string(),
  }),
});

// กำหนดรูปแบบ Error Response
export const PortfolioTransactionErrorSchema = z.object({
  message: z.string(),
});

// ตรวจสอบข้อมูลที่ Client ส่งมาเพื่อแก้ไข Portfolio Transaction
export const UpdatePortfolioTransactionSchema = z
  .object({
    transaction_type: z.enum(["buy", "sell"]).optional().openapi({
      example: "buy",
      description: "ประเภทธุรกรรม: buy = ซื้อ, sell = ขาย",
    }),

    quantity: positiveDecimalSchema.optional().openapi({
      example: "0.75",
      description: "จำนวนสินทรัพย์ ต้องมากกว่า 0",
    }),

    price_per_unit: positiveDecimalSchema.optional().openapi({
      example: "96000.00",
      description: "ราคาต่อหน่วย ต้องมากกว่า 0",
    }),

    transaction_date: z.string().datetime().optional().openapi({
      example: "2026-10-09T10:00:00.000Z",
      description: "วันที่และเวลาทำธุรกรรมในรูปแบบ ISO 8601",
    }),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field must be provided",
  });

// กำหนดรูปแบบ Response หลังแก้ไขธุรกรรมสำเร็จ
export const UpdatePortfolioTransactionResponseSchema = z.object({
  transactionId: z.string(),
  assetId: z.string(),
  quantity: z.string(),
  avgCostPerUnit: z.string(),
});

// ตรวจสอบ ID ของ Asset และ Transaction จาก URL
export const UpdatePortfolioTransactionParamsSchema = z.object({
  id: z.string().regex(/^[1-9]\d*$/),
  transactionId: z.string().regex(/^[1-9]\d*$/),
});

// ตรวจสอบ ID ของ Asset และ Transaction จาก URL
export const DeletePortfolioTransactionParamsSchema = z.object({
  id: z
    .string()
    .regex(/^[1-9]\d*$/)
    .openapi({
      example: "1",
      description: "ID ของ Asset",
    }),
  transactionId: z
    .string()
    .regex(/^[1-9]\d*$/)
    .openapi({
      example: "10",
      description: "ID ของธุรกรรมที่ต้องการลบ",
    }),
});

// กำหนดรูปแบบ Response หลังลบธุรกรรมสำเร็จ
export const DeletePortfolioTransactionResponseSchema = z.object({
  message: z.string(),
  transactionId: z.string(),
  assetId: z.string(),
  quantity: z.string(),
  avgCostPerUnit: z.string(),
});
