// portfolio.controllers.ts
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import {
  GetPortfolioResponseSchema,
  CreatePortfolioTransactionSchema,
  CreatePortfolioTransactionResponseSchema,
  PortfolioTransactionErrorSchema,
  UpdatePortfolioTransactionSchema,
  UpdatePortfolioTransactionResponseSchema,
  UpdatePortfolioTransactionParamsSchema,
  DeletePortfolioTransactionParamsSchema,
  DeletePortfolioTransactionResponseSchema,
} from "../schema/portfolio.schema";
import { PortfolioService } from "../services/portfolio.services";

// กำหนด API สำหรับอ่านภาพรวมพอร์ต
const getPortfolioRoute = createRoute({
  method: "get",
  path: "/portfolio",
  tags: ["Portfolio"],
  responses: {
    200: {
      description: "ดึงภาพรวมพอร์ตสำเร็จ",
      content: {
        "application/json": {
          schema: GetPortfolioResponseSchema,
        },
      },
    },
    401: { description: "ไม่ได้เข้าสู่ระบบ" },
    500: { description: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
  },
});

// จัดการ Request และแปลง Business Error เป็น HTTP Response
export const portfolioController = new OpenAPIHono();

portfolioController.openapi(getPortfolioRoute, async (c) => {
  try {
    // อ่าน User ID จาก JWT Payload ที่ Middleware ตรวจสอบแล้ว
    const payload = c.get("jwtPayload") as { id: string };
    const userId = BigInt(payload.id);

    // เรียก Service เพื่อดึงภาพรวมพอร์ต
    const portfolio = await PortfolioService.getPortfolio(userId);

    // ส่งข้อมูลพอร์ตกลับให้ Client
    return c.json(portfolio, 200);
  } catch (error) {
    // ส่ง Error อื่นให้ Global Error Handler จัดการ
    throw error;
  }
});

// กำหนด API สำหรับสร้างธุรกรรมซื้อขายสินทรัพย์
const createPortfolioTransactionRoute = createRoute({
  method: "post",
  path: "/portfolio/transactions",
  tags: ["Portfolio"],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: CreatePortfolioTransactionSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "สร้างธุรกรรมสำเร็จ",
      content: {
        "application/json": {
          schema: CreatePortfolioTransactionResponseSchema,
        },
      },
    },
    400: {
      description: "ข้อมูล Request ไม่ถูกต้อง",
      content: {
        "application/json": {
          schema: PortfolioTransactionErrorSchema,
        },
      },
    },
    401: { description: "ไม่ได้เข้าสู่ระบบ" },
    404: {
      description: "ไม่พบ Portfolio หรือ Asset",
      content: {
        "application/json": {
          schema: PortfolioTransactionErrorSchema,
        },
      },
    },
    409: {
      description: "จำนวนสินทรัพย์ไม่เพียงพอ",
      content: {
        "application/json": {
          schema: PortfolioTransactionErrorSchema,
        },
      },
    },
    500: { description: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
  },
});

// เชื่อม Route เข้ากับ Service ผ่าน Controller
portfolioController.openapi(createPortfolioTransactionRoute, async (c) => {
  // อ่าน User ID จาก JWT Payload ที่ Middleware ตรวจสอบแล้ว
  const payload = c.get("jwtPayload") as { id: string };

  // รับ Request ที่ผ่านการตรวจสอบ Zod แล้ว
  const body = c.req.valid("json");

  try {
    // เรียก Service เพื่อประมวลผลธุรกรรม
    const result = await PortfolioService.createPortfolioTransaction({
      userId: BigInt(payload.id),
      assetId: BigInt(body.assetId),
      transaction_type: body.transaction_type,
      quantity: body.quantity,
      price_per_unit: body.price_per_unit,
      transaction_date: body.transaction_date,
    });

    // ส่งข้อมูลธุรกรรมและยอดถือครองกลับ
    return c.json(result, 201);
  } catch (error) {
    // แปลง Business Error เป็น HTTP Status ที่เหมาะสม
    const message = error instanceof Error ? error.message : "";

    if (message === "PORTFOLIO_NOT_FOUND") {
      return c.json({ message: "Portfolio not found" }, 404);
    }

    if (message === "ASSET_NOT_FOUND") {
      return c.json({ message: "Asset not found" }, 404);
    }

    if (message === "INSUFFICIENT_ASSET_QUANTITY") {
      return c.json({ message: "Insufficient asset quantity" }, 409);
    }

    // ส่ง Error ที่ไม่คาดคิดให้ Global Error Handler
    throw error;
  }
});

// กำหนด API สำหรับแก้ไขธุรกรรมของ Asset
const updatePortfolioTransactionRoute = createRoute({
  method: "put",
  path: "/assets/{id}/transactions/{transactionId}",
  tags: ["Portfolio"],

  request: {
    params: UpdatePortfolioTransactionParamsSchema,
    body: {
      required: true,
      content: {
        "application/json": {
          schema: UpdatePortfolioTransactionSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "แก้ไขธุรกรรมสำเร็จ",
      content: {
        "application/json": {
          schema: UpdatePortfolioTransactionResponseSchema,
        },
      },
    },
    400: {
      description: "ข้อมูล Request ไม่ถูกต้อง",
      content: {
        "application/json": {
          schema: PortfolioTransactionErrorSchema,
        },
      },
    },
    401: {
      description: "ไม่ได้เข้าสู่ระบบ",
    },
    404: {
      description: "ไม่พบ Portfolio, Asset หรือ Transaction",
      content: {
        "application/json": {
          schema: PortfolioTransactionErrorSchema,
        },
      },
    },
    409: {
      description: "จำนวนสินทรัพย์ไม่เพียงพอ",
      content: {
        "application/json": {
          schema: PortfolioTransactionErrorSchema,
        },
      },
    },
    500: {
      description: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
    },
  },
});

// เชื่อม Request เข้ากับ Service
portfolioController.openapi(updatePortfolioTransactionRoute, async (c) => {
  // อ่านตัวตนของผู้ใช้จาก JWT Middleware
  const payload = c.get("jwtPayload") as { id: string };

  // อ่าน Parameters และ Body ที่ผ่าน Zod Validation แล้ว
  const { id, transactionId } = c.req.valid("param");
  const body = c.req.valid("json");

  try {
    // เรียก Service เพื่อแก้ธุรกรรมและคำนวณ Holding ใหม่
    const result = await PortfolioService.updatePortfolioTransaction({
      userId: BigInt(payload.id),
      assetId: BigInt(id),
      transactionId: BigInt(transactionId),
      ...body,
    });

    // ส่งยอดถือครองที่คำนวณใหม่กลับให้ Client
    return c.json(result, 200);
  } catch (error) {
    // แปลง Business Error เป็น HTTP Status
    const message = error instanceof Error ? error.message : "";

    if (
      message === "PORTFOLIO_NOT_FOUND" ||
      message === "ASSET_NOT_FOUND" ||
      message === "PORTFOLIO_TRANSACTION_NOT_FOUND"
    ) {
      return c.json({ message: "Asset or transaction not found" }, 404);
    }

    if (message === "INSUFFICIENT_ASSET_QUANTITY") {
      return c.json({ message: "Insufficient asset quantity" }, 409);
    }

    // ส่ง Error ที่ไม่คาดคิดให้ Global Error Handler
    throw error;
  }
});

// กำหนด Route สำหรับลบธุรกรรมของ Asset
const deletePortfolioTransactionRoute = createRoute({
  method: "delete",
  path: "/assets/{id}/transactions/{transactionId}",
  tags: ["Portfolio"],
  request: {
    params: DeletePortfolioTransactionParamsSchema,
  },
  responses: {
    200: {
      description: "ลบธุรกรรมสำเร็จ",
      content: {
        "application/json": {
          schema: DeletePortfolioTransactionResponseSchema,
        },
      },
    },
    401: {
      description: "ไม่ได้เข้าสู่ระบบ",
    },
    404: {
      description: "ไม่พบ Portfolio, Asset หรือ Transaction",
      content: {
        "application/json": {
          schema: PortfolioTransactionErrorSchema,
        },
      },
    },
    409: {
      description: "ประวัติธุรกรรมที่เหลือมียอดขายเกินจำนวนที่ถือครอง",
      content: {
        "application/json": {
          schema: PortfolioTransactionErrorSchema,
        },
      },
    },
    500: {
      description: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
    },
  },
});

// เรียก Service เพื่อลบธุรกรรมและคำนวณยอดถือครองใหม่
portfolioController.openapi(deletePortfolioTransactionRoute, async (c) => {
  const payload = c.get("jwtPayload") as { id: string };
  const { id, transactionId } = c.req.valid("param");

  try {
    const result = await PortfolioService.deletePortfolioTransaction({
      userId: BigInt(payload.id),
      assetId: BigInt(id),
      transactionId: BigInt(transactionId),
    });

    return c.json(result, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    // แจ้งเมื่อไม่พบข้อมูลหรือไม่มีสิทธิ์เข้าถึง
    if (
      message === "PORTFOLIO_NOT_FOUND" ||
      message === "ASSET_NOT_FOUND" ||
      message === "PORTFOLIO_TRANSACTION_NOT_FOUND"
    ) {
      return c.json({ message: "Asset or transaction not found" }, 404);
    }

    // แจ้งเมื่อประวัติที่เหลือทำให้ยอดถือครองไม่เพียงพอ
    if (message === "INSUFFICIENT_ASSET_QUANTITY") {
      return c.json({ message: "Insufficient asset quantity" }, 409);
    }

    throw error;
  }
});
