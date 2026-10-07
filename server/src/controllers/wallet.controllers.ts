import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  WalletListResponseSchema,
  WalletCreateSchema,
  WalletResponseSchema,
  WalletParamsSchema,
  WalletUpdateSchema,
  WalletBalanceResponseSchema,
} from "../schema/wallet.schema";
import { WalletService } from "../services/wallet.services";

export const walletController = new OpenAPIHono();

//  OpenAPI Route Specification สำหรับ GET /api/v1/wallets
export const getWalletsRoute = createRoute({
  method: "get",
  path: "/api/v1/wallets",
  tags: ["Wallet"],
  security: [{ Bearer: [] }],

  responses: {
    200: {
      content: {
        "application/json": {
          schema: WalletListResponseSchema,
        },
      },
      description: "Retrieve user's wallets successfully",
    },

    401: {
      description: "Unauthorized",
    },
  },
});

//  OpenAPI Route Specification สำหรับ POST /api/v1/wallets
export const createWalletRoute = createRoute({
  method: "post",
  path: "/api/v1/wallets",
  tags: ["Wallet"],
  security: [{ Bearer: [] }],

  request: {
    body: {
      content: {
        "application/json": {
          schema: WalletCreateSchema,
        },
      },
    },
  },

  responses: {
    201: {
      content: {
        "application/json": {
          schema: WalletResponseSchema,
        },
      },
      description: "Wallet created successfully",
    },

    400: {
      description: "Invalid request body",
    },

    401: {
      description: "Unauthorized",
    },

    409: {
      description: "Wallet name already exists",
    },
  },
});

//  OpenAPI Route Specification สำหรับ GET /api/v1/wallets/{id}
export const getWalletRoute = createRoute({
  method: "get",
  path: "/api/v1/wallets/{id}",
  tags: ["Wallet"],
  security: [{ Bearer: [] }],

  request: {
    params: WalletParamsSchema,
  },

  responses: {
    200: {
      content: {
        "application/json": {
          schema: WalletResponseSchema,
        },
      },
      description: "Retrieve wallet successfully",
    },

    401: {
      description: "Unauthorized",
    },

    404: {
      description: "Wallet not found",
    },
  },
});

//  OpenAPI Route Specification สำหรับ PUT /api/v1/wallets/{id}
export const updateWalletRoute = createRoute({
  method: "put",
  path: "/api/v1/wallets/{id}",
  tags: ["Wallet"],
  security: [{ Bearer: [] }],

  request: {
    // รับ Wallet ID จาก URL และ name จาก Request Body
    params: WalletParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: WalletUpdateSchema,
        },
      },
    },
  },

  responses: {
    // แก้ไข Wallet สำเร็จ
    200: {
      content: {
        "application/json": {
          schema: WalletResponseSchema,
        },
      },
      description: "Wallet updated successfully",
    },

    // ไม่ได้ Login
    401: {
      description: "Unauthorized",
    },

    // ไม่พบ Wallet หรือไม่มีสิทธิ์เข้าถึง
    404: {
      description: "Wallet not found",
    },

    // ชื่อ Wallet ซ้ำ
    409: {
      description: "Wallet name already exists",
    },
  },
});

//  OpenAPI Route Specification สำหรับ DELETE /api/v1/wallets/{id}
export const deleteWalletRoute = createRoute({
  method: "delete",
  path: "/api/v1/wallets/{id}",
  tags: ["Wallet"],
  security: [{ Bearer: [] }],

  request: {
    // รับ Wallet ID จาก URL
    params: WalletParamsSchema,
  },

  responses: {
    // ลบ Wallet สำเร็จ
    204: {
      description: "Wallet deleted successfully",
    },

    // ไม่ได้ Login
    401: {
      description: "Unauthorized",
    },

    // ไม่พบ Wallet หรือไม่มีสิทธิ์เข้าถึง
    404: {
      description: "Wallet not found",
    },
  },
});

// กำหนดรายละเอียด OpenAPI สำหรับดูยอดเงินคงเหลือของ Wallet
export const getWalletBalanceRoute = createRoute({
  method: "get",
  path: "/api/v1/wallets/{id}/balance",
  tags: ["Wallet"],
  security: [{ Bearer: [] }],

  request: {
    // รับ Wallet ID จาก URL
    params: WalletParamsSchema,
  },

  responses: {
    // ดึงยอดเงินสำเร็จ
    200: {
      content: {
        "application/json": {
          schema: WalletBalanceResponseSchema,
        },
      },
      description: "Retrieve wallet balance successfully",
    },

    // ไม่ได้ Login
    401: {
      description: "Unauthorized",
    },

    // ไม่พบ Wallet หรือไม่มีสิทธิ์เข้าถึง
    404: {
      description: "Wallet not found",
    },
  },
});

// บังคับให้ทุก Route ใต้ /api/v1/wallets ต้องผ่าน Authentication
walletController.use("/api/v1/wallets/*", authMiddleware);

// 1. Controller: getWalletsRoute
walletController.openapi(getWalletsRoute, async (c) => {
  // ดึงข้อมูล User ปัจจุบันจาก JWT ที่ผ่าน authMiddleware มาแล้ว
  const payload = c.get("jwtPayload") as {
    id: string;
    email: string;
  };

  const userId = BigInt(payload.id);

  try {
    // เรียก Service เพื่อดึงข้อมูล Wallet
    const wallets = await WalletService.getWallets(userId);
    return c.json(wallets, 200);
  } catch (error: any) {
    console.error("Get Wallets Error:", error);
    return c.json({ message: "Internal Server Error" }, 500);
  }
});

// 2. Controller: createWalletRoute
walletController.openapi(createWalletRoute, async (c) => {
  // ดึง User ID ของผู้ที่ Login อยู่จาก JWT
  const payload = c.get("jwtPayload") as {
    id: string;
    email: string;
  };

  const userId = BigInt(payload.id);

  // ดึงข้อมูล name ที่ผ่าน Zod Validation แล้วจาก Request Body
  const { name } = c.req.valid("json");

  try {
    const newWallet = await WalletService.createWallet(userId, name);
    return c.json(newWallet, 201);
  } catch (error: any) {
    console.error("Create Wallet Error:", error);

    if (error.message === "WALLET_NAME_EXISTS") {
      return c.json({ message: "Wallet name already exists" }, 409);
    }
    return c.json({ message: "Internal Server Error" }, 500);
  }
});

// 3. Controller: getWalletRoute
walletController.openapi(getWalletRoute, async (c) => {
  try {
    // 1. ดึง User ID จาก JWT (ใส่ Optional Chaining ป้องกัน payload เป็น undefined)
    const payload = c.get("jwtPayload") as
      | { id: string; email: string }
      | undefined;

    if (!payload?.id) {
      return c.json({ message: "Unauthorized: Missing user payload" }, 401);
    }

    const userId = BigInt(payload.id);

    // 2. ดึง walletId จาก Param ที่ผ่าน Zod Validation แล้ว
    const { id: walletId } = c.req.valid("param");

    // 3. เรียก Service
    const wallet = await WalletService.getWalletById(walletId, userId);
    return c.json(wallet, 200);
  } catch (error: any) {
    console.error("Get Wallet By ID Error:", error);

    if (error.message === "WALLET_NOT_FOUND") {
      return c.json({ message: "Wallet not found" }, 404);
    }
    return c.json({ message: "Internal Server Error" }, 500);
  }
});

// 4. Controller: updateWalletRoute
walletController.openapi(updateWalletRoute, async (c) => {
  // ดึง User ID ของผู้ที่ Login อยู่จาก JWT
  const payload = c.get("jwtPayload") as {
    id: string;
    email: string;
  };

  const userId = BigInt(payload.id);

  // ดึง Wallet ID จาก URL และแปลงเป็น BigInt
  const { id: walletId } = c.req.valid("param");

  // ดึง name ที่ผ่าน Zod Validation แล้วจาก Request Body
  const { name } = c.req.valid("json");

  try {
    const updatedWallet = await WalletService.updateWallet(
      walletId,
      userId,
      name,
    );
    return c.json(updatedWallet, 200);
  } catch (error: any) {
    console.error("Update Wallet Error:", error);

    if (error.message === "WALLET_NOT_FOUND") {
      return c.json({ message: "Wallet not found" }, 404);
    }
    if (error.message === "WALLET_NAME_EXISTS") {
      return c.json({ message: "Wallet name already exists" }, 409);
    }
    return c.json({ message: "Internal Server Error" }, 500);
  }
});

// 5. Controller: deleteWalletRoute
walletController.openapi(deleteWalletRoute, async (c) => {
  // ดึง User ID ของผู้ที่ Login อยู่จาก JWT
  const payload = c.get("jwtPayload") as {
    id: string;
    email: string;
  };

  const userId = BigInt(payload.id);

  // ดึง Wallet ID จาก URL
  const { id: walletId } = c.req.valid("param");

  try {
    await WalletService.deleteWallet(walletId, userId);
    return c.body(null, 204);
  } catch (error: any) {
    console.error("Delete Wallet Error:", error);

    if (error.message === "WALLET_NOT_FOUND") {
      return c.json({ message: "Wallet not found" }, 404);
    }
    return c.json({ message: "Internal Server Error" }, 500);
  }
});

// 6. Controller: getWalletBalanceRoute
walletController.openapi(getWalletBalanceRoute, async (c) => {
  // ดึง User ID ของผู้ที่ Login อยู่จาก JWT
  const payload = c.get("jwtPayload") as {
    id: string;
    email: string;
  };

  const userId = BigInt(payload.id);

  // ดึง Wallet ID จาก URL
  const { id: walletId } = c.req.valid("param");

  try {
    const balanceResult = await WalletService.getWalletBalance(
      walletId,
      userId,
    );
    return c.json(balanceResult, 200);
  } catch (error: any) {
    console.error("Get Wallet Balance Error:", error);

    if (error.message === "WALLET_NOT_FOUND") {
      return c.json({ message: "Wallet not found" }, 404);
    }
    return c.json({ message: "Internal Server Error" }, 500);
  }
});
