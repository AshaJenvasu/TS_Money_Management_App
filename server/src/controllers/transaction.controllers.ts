import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { authMiddleware } from "../middlewares/auth.middleware";
import { TransactionService } from "../services/transaction.services";
import { TransactionType } from "@prisma/client";
import {
  WalletIdParamSchema,
  TransactionIdParamSchema,
  CreateTransactionBodySchema,
  UpdateTransactionBodySchema,
} from "../schema/transaction.schema";

export const transactionController = new OpenAPIHono();

// บังคับใช้ Auth Middleware สำหรับทุก Endpoints ใน Transaction Module
transactionController.use("/wallets/*", authMiddleware);

// ==========================================
// OpenAPI Route Specifications
// ==========================================

// 1. Spec สำหรับ GET /wallets/{walletId}/transactions
export const getTransactionsRoute = createRoute({
  method: "get",
  path: "/wallets/{walletId}/transactions",
  tags: ["Transaction"],
  security: [{ Bearer: [] }],
  request: {
    params: WalletIdParamSchema,
  },
  responses: {
    200: {
      description: "Retrieve transactions successfully",
    },
    404: {
      description: "Wallet not found",
    },
  },
});

// 2. Spec สำหรับ POST /wallets/{walletId}/transactions
export const createTransactionRoute = createRoute({
  method: "post",
  path: "/wallets/{walletId}/transactions",
  tags: ["Transaction"],
  security: [{ Bearer: [] }],
  request: {
    params: WalletIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: CreateTransactionBodySchema,
        },
      },
    },
  },
  responses: {
    201: { description: "Create transaction successfully" },
    400: { description: "Invalid request body or parameters" },
    401: { description: "Unauthorized - Missing or invalid token" },
    404: { description: "Wallet not found" },
  },
});

// 3. Spec สำหรับ PUT /wallets/{walletId}/transactions/{id}
export const updateTransactionRoute = createRoute({
  method: "put",
  path: "/wallets/{walletId}/transactions/{id}",
  tags: ["Transaction"],
  security: [{ Bearer: [] }],
  request: {
    params: TransactionIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateTransactionBodySchema,
        },
      },
    },
  },
  responses: {
    200: { description: "Update transaction successfully" },
    400: { description: "Invalid request body or parameters" },
    401: { description: "Unauthorized - Missing or invalid token" },
    404: { description: "Wallet or transaction not found" },
  },
});

// 4. Spec สำหรับ DELETE /wallets/{walletId}/transactions/{id}
export const deleteTransactionRoute = createRoute({
  method: "delete",
  path: "/wallets/{walletId}/transactions/{id}",
  tags: ["Transaction"],
  security: [{ Bearer: [] }],
  request: {
    params: TransactionIdParamSchema,
  },
  responses: {
    204: { description: "Delete transaction successfully" },
    400: { description: "Invalid parameters" },
    401: { description: "Unauthorized - Missing or invalid token" },
    404: { description: "Wallet or transaction not found" },
  },
});

// ==========================================
// Controller Handlers
// ==========================================

// 1. GET /wallets/:walletId/transactions
transactionController.openapi(getTransactionsRoute, async (c) => {
  // ดึง Parameter และ User ID จาก JWT Payload
  const { walletId } = c.req.valid("param");
  const payload = c.get("jwtPayload") as { id: string; email: string };
  const userId = BigInt(payload.id);

  try {
    // ดึงรายการธุรกรรมผ่าน Service
    const transactions = await TransactionService.getTransactions(
      BigInt(walletId),
      userId,
    );

    // แปลง BigInt, Decimal และ Date ให้เป็น String เพื่อความปลอดภัยใน JSON Response
    const result = transactions.map((t) => ({
      id: t.id.toString(),
      wallet_id: t.walletId.toString(),
      transaction_type: t.transactionType,
      amount: t.amount.toString(),
      note: t.note,
      transaction_date: t.transactionDate.toISOString(),
      created_at: t.createdAt.toISOString(),
    }));

    return c.json(result, 200);
  } catch (error: any) {
    // จัดการ Error กรณีไม่พบ Wallet
    if (error.message === "WALLET_NOT_FOUND") {
      return c.json({ message: "Wallet not found" }, 404);
    }
    throw error;
  }
});

// 2. POST /wallets/:walletId/transactions
transactionController.openapi(createTransactionRoute, async (c) => {
  // ดึงข้อมูล Request Body และ User ID
  const { walletId } = c.req.valid("param");
  const body = c.req.valid("json");
  const payload = c.get("jwtPayload") as { id: string; email: string };
  const userId = BigInt(payload.id);

  try {
    // บันทึกรายการธุรกรรมใหม่ผ่าน Service
    const createdTx = await TransactionService.createTransaction(
      BigInt(walletId),
      userId,
      {
        transactionType: body.transaction_type as TransactionType,
        amount: parseFloat(body.amount),
        note: body.note,
        transactionDate: new Date(body.transaction_date),
      },
    );

    // ส่งข้อมูลรายการที่สร้างเสร็จกลับไป
    return c.json(
      {
        id: createdTx.id.toString(),
        wallet_id: createdTx.walletId.toString(),
        transaction_type: createdTx.transactionType,
        amount: createdTx.amount.toString(),
        note: createdTx.note,
        transaction_date: createdTx.transactionDate.toISOString(),
        created_at: createdTx.createdAt.toISOString(),
      },
      201,
    );
  } catch (error: any) {
    console.error("CREATE_TRANSACTION_ERROR:", error);
    // จัดการ Error กรณีไม่พบ Wallet
    if (error.message === "WALLET_NOT_FOUND") {
      return c.json({ message: "Wallet not found" }, 404);
    }
    throw error;
  }
});

// 3. PUT /wallets/:walletId/transactions/:id
transactionController.openapi(updateTransactionRoute, async (c) => {
  // ดึง Parameters และ Request Body
  const { walletId, id } = c.req.valid("param");
  const body = c.req.valid("json");
  const payload = c.get("jwtPayload") as { id: string; email: string };
  const userId = BigInt(payload.id);

  try {
    // อัปเดตรายการธุรกรรมผ่าน Service
    const updatedTx = await TransactionService.updateTransaction(
      BigInt(id),
      BigInt(walletId),
      userId,
      {
        transactionType: body.transaction_type
          ? (body.transaction_type as TransactionType)
          : undefined,
        amount: body.amount ? parseFloat(body.amount) : undefined,
        note: body.note,
        transactionDate: body.transaction_date
          ? new Date(body.transaction_date)
          : undefined,
      },
    );

    // ส่งข้อมูลรายการที่อัปเดตแล้วกลับไป
    return c.json(
      {
        id: updatedTx.id.toString(),
        wallet_id: updatedTx.walletId.toString(),
        transaction_type: updatedTx.transactionType,
        amount: updatedTx.amount.toString(),
        note: updatedTx.note,
        transaction_date: updatedTx.transactionDate.toISOString(),
        updated_at: updatedTx.updatedAt.toISOString(),
      },
      200,
    );
  } catch (error: any) {
    // จัดการ Error แยกตามกรณี
    if (error.message === "WALLET_NOT_FOUND") {
      return c.json({ message: "Wallet not found" }, 404);
    }
    if (error.message === "TRANSACTION_NOT_FOUND") {
      return c.json({ message: "Transaction not found" }, 404);
    }
    throw error;
  }
});

// 4. DELETE /wallets/:walletId/transactions/:id
transactionController.openapi(deleteTransactionRoute, async (c) => {
  // ดึง Parameters และ User ID
  const { walletId, id } = c.req.valid("param");
  const payload = c.get("jwtPayload") as { id: string; email: string };
  const userId = BigInt(payload.id);

  try {
    // ลบรายการธุรกรรมผ่าน Service
    await TransactionService.deleteTransaction(
      BigInt(id),
      BigInt(walletId),
      userId,
    );

    // ส่ง HTTP Status 204 No Content กลับเมื่อทำรายการสำเร็จ
    return c.body(null, 204);
  } catch (error: any) {
    // จัดการ Error แยกตามกรณี
    if (error.message === "WALLET_NOT_FOUND") {
      return c.json({ message: "Wallet not found" }, 404);
    }
    if (error.message === "TRANSACTION_NOT_FOUND") {
      return c.json({ message: "Transaction not found" }, 404);
    }
    throw error;
  }
});
