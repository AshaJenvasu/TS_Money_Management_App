import { z } from "@hono/zod-openapi";

// 1. Request Params สำหรับ /wallets/:id
export const WalletParamsSchema = z.object({
  id: z.string().openapi({
    param: {
      name: "id",
      in: "path",
    },
    example: "1",
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
