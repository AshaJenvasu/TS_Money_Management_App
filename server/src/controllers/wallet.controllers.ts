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
walletController.use("/api/v1/wallets", authMiddleware);

// 1. Controller: getWalletsRoute
walletController.openapi(getWalletsRoute, async (c) => {
  // ดึงข้อมูล User ปัจจุบันจาก JWT ที่ผ่าน authMiddleware มาแล้ว
  const payload = c.get("jwtPayload") as {
    id: string;
    email: string;
  };

  // แปลง User ID จาก String ใน JWT เป็น BigInt สำหรับใช้ Query Database
  const userId = BigInt(payload.id);

  // TODO: นำ userId ไปเรียก Service ในขั้นถัดไป
  return c.json([], 200);
});

// 2. Controller: createWalletRoute
walletController.openapi(createWalletRoute, async (c) => {
  // ดึง User ID ของผู้ที่ Login อยู่จาก JWT
  const payload = c.get("jwtPayload") as {
    id: string;
    email: string;
  };

  // แปลง User ID จาก String เป็น BigInt สำหรับใช้กับ Prisma
  const userId = BigInt(payload.id);

  // ดึงข้อมูล name ที่ผ่าน Zod Validation แล้วจาก Request Body
  const { name } = c.req.valid("json");

  // TODO: เรียก Service เพื่อสร้าง Wallet
  return c.json(
    {
      id: "",
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    201,
  );
});

// 3. Controller: getWalletRoute
walletController.openapi(getWalletRoute, async (c) => {
  // ดึง User ID ของผู้ที่ Login อยู่จาก JWT
  const payload = c.get("jwtPayload") as {
    id: string;
    email: string;
  };

  // แปลง User ID จาก String เป็น BigInt สำหรับใช้กับ Prisma
  const userId = BigInt(payload.id);

  // ดึง Wallet ID จาก URL และแปลงเป็น BigInt
  const { id } = c.req.valid("param");
  const walletId = BigInt(id);

  // TODO: เรียก Service เพื่อดึง Wallet
  return c.json(
    {
      id: id,
      name: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    200,
  );
});

// 4. Controller: updateWalletRoute
walletController.openapi(updateWalletRoute, async (c) => {
  // ดึง User ID ของผู้ที่ Login อยู่จาก JWT
  const payload = c.get("jwtPayload") as {
    id: string;
    email: string;
  };

  // แปลง User ID จาก String ใน JWT เป็น BigInt
  const userId = BigInt(payload.id);

  // ดึง Wallet ID จาก URL และแปลงเป็น BigInt
  const { id } = c.req.valid("param");
  const walletId = BigInt(id);

  // ดึง name ที่ผ่าน Zod Validation แล้วจาก Request Body
  const { name } = c.req.valid("json");

  // TODO: ส่ง userId, walletId และ name ให้ Service จัดการต่อ

  // Temporary Response เพราะตอนนี้ยังไม่ได้ต่อ Service
  return c.json(
    {
      id,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    200,
  );
});

// 5. Controller: deleteWalletRoute
walletController.openapi(deleteWalletRoute, async (c) => {
  // ดึง User ID ของผู้ที่ Login อยู่จาก JWT
  const payload = c.get("jwtPayload") as {
    id: string;
    email: string;
  };

  // แปลง User ID จาก String ใน JWT เป็น BigInt
  const userId = BigInt(payload.id);

  // ดึง Wallet ID จาก URL และแปลงเป็น BigInt
  const { id } = c.req.valid("param");
  const walletId = BigInt(id);

  // TODO: ส่ง userId และ walletId ให้ Service จัดการต่อ

  // Temporary Response เพราะตอนนี้ยังไม่ได้ต่อ Service
  return c.body(null, 204);
});

// 6. Controller: getWalletBalanceRoute
walletController.openapi(getWalletBalanceRoute, async (c) => {
  // ดึง User ID ของผู้ที่ Login อยู่จาก JWT
  const payload = c.get("jwtPayload") as {
    id: string;
    email: string;
  };

  // แปลง User ID จาก String ใน JWT เป็น BigInt
  const userId = BigInt(payload.id);

  // ดึง Wallet ID จาก URL และแปลงเป็น BigInt
  const { id } = c.req.valid("param");
  const walletId = BigInt(id);

  // TODO: ส่ง userId และ walletId ให้ Service คำนวณ Balance

  // Temporary Response เพราะตอนนี้ยังไม่ได้ต่อ Service
  return c.json(
    {
      balance: "0.00",
    },
    200,
  );
});
