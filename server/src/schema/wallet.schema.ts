import { z } from "@hono/zod-openapi";

// 1. Request Params สำหรับ /wallets/:id

//zod แปลงstring เป็น bigintได้

export const WalletParamsSchema = z.object({
  id: z.coerce.bigint().openapi({
    param: {
      name: "id",
      in: "path",
    },
    example: "1",
  }),
});

// Request Param สำหรับ GET /wallets/:publicId (ใช้เฉพาะ route ดู wallet เดี่ยว)
export const WalletPublicIdParamSchema = z.object({
  publicId: z
    .string()
    .uuid()
    .openapi({
      param: {
        name: "publicId",
        in: "path",
      },
      example: "550e8400-e29b-41d4-a716-446655440000",
    }),
});

// 2. Request Body สำหรับ POST /wallets
export const WalletCreateSchema = z.object({
  name: z.string().trim().min(1).max(100).openapi({
    example: "Main Wallet",
  }),
});

// 3. Request Body สำหรับ PUT /wallets/:id
export const WalletUpdateSchema = z.object({
  name: z.string().trim().min(1).max(100).openapi({
    example: "Updated Wallet",
  }),
});

// 4. Response Schema
export const WalletResponseSchema = z.object({
  id: z.string().openapi({
    example: "1",
  }),

  publicId: z.string().uuid().openapi({
    example: "550e8400-e29b-41d4-a716-446655440000",
  }),

  name: z.string().openapi({
    example: "Main Wallet",
  }),

  createdAt: z.string().datetime().openapi({
    example: "2026-09-30T10:00:00.000Z",
  }),

  updatedAt: z.string().datetime().openapi({
    example: "2026-09-30T10:00:00.000Z",
  }),
});

// 5. Response Schema
export const WalletBalanceResponseSchema = z.object({
  balance: z.string().openapi({
    example: "15000.50",
  }),
});

export const WalletListResponseSchema = z.array(WalletResponseSchema);
