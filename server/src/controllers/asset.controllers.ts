import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { AssetService } from "../services/asset.services";
import { AssetType } from "@prisma/client";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  CreateAssetBodySchema,
  UpdateAssetBodySchema,
  AssetIdParamSchema,
  AssetResponseSchema,
  AssetListResponseSchema,
  AssetHoldingResponseSchema,
  ErrorResponseSchema,
} from "../schema/asset.schema";

export const assetController = new OpenAPIHono();

assetController.use("*", authMiddleware);

// ==========================================
// 1. GET /assets - ดึงรายการ Asset ของตัวเอง
// ==========================================
const getAssetsRoute = createRoute({
  method: "get",
  path: "/assets",
  tags: ["Asset"],
  summary: "Get user assets",
  description: "ดึงรายการ Asset ทั้งหมดที่เป็นของผู้ใช้งานที่กำลังล็อกอินอยู่",
  responses: {
    200: {
      content: { "application/json": { schema: AssetListResponseSchema } },
      description: "ดึงรายการ Asset ของตัวเองสำเร็จ",
    },
    401: {
      description:
        "Unauthenticated (ไม่ได้ส่ง JWT Token มา หรือ Token ไม่ถูกต้อง)",
    },
  },
});

assetController.openapi(getAssetsRoute, async (c) => {
  const payload = c.get("jwtPayload") as { id: string };
  const userId = BigInt(payload.id);

  const assets = await AssetService.getAssets(userId);

  if (!assets || assets.length === 0) {
    return c.json([], 200);
  }

  const formattedAssets = assets.map((asset) => ({
    id: asset.id.toString(),
    user_id: asset.userId.toString(),
    name: asset.name,
    symbol: asset.symbol,
    asset_type: asset.assetType,
    created_at: asset.createdAt.toISOString(),
    updated_at: asset.updatedAt.toISOString(),
  }));

  return c.json(formattedAssets, 200);
});

// ==========================================
// 2. POST /assets - สร้าง Asset ใหม่
// ==========================================
const createAssetRoute = createRoute({
  method: "post",
  path: "/assets",
  tags: ["Asset"],
  summary: "Create a new asset",
  description:
    "สร้าง Asset ใหม่สำหรับผู้ใช้งาน (Name และ Symbol ต้องไม่ซ้ำกับ Asset ที่มีอยู่แล้วของผู้ใช้คนเดียวกัน)",
  request: {
    body: {
      content: { "application/json": { schema: CreateAssetBodySchema } },
      description: "ข้อมูล Asset ที่ต้องการสร้าง (symbol, name, asset_type)",
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: AssetResponseSchema } },
      description: "สร้าง Asset สำเร็จ",
    },
    400: { description: "ข้อมูลที่ส่งมาไม่ถูกต้อง (Validation Error)" },
    401: { description: "Unauthenticated" },
    409: {
      description:
        "Conflict - Asset name หรือ Symbol นี้มีอยู่แล้วในระบบของผู้ใช้",
    },
  },
});

assetController.openapi(createAssetRoute, async (c) => {
  const payload = c.get("jwtPayload") as { id: string };
  const userId = BigInt(payload.id);
  const body = c.req.valid("json");

  try {
    const createdAsset = await AssetService.createAsset(userId, {
      symbol: body.symbol,
      name: body.name,
      assetType: body.asset_type as AssetType,
    });

    return c.json(
      {
        id: createdAsset.id.toString(),
        user_id: createdAsset.userId.toString(),
        name: createdAsset.name,
        symbol: createdAsset.symbol,
        asset_type: createdAsset.assetType,
        created_at: createdAsset.createdAt.toISOString(),
        updated_at: createdAsset.updatedAt.toISOString(),
      },
      201,
    );
  } catch (error: any) {
    if (error.message === "ASSET_ALREADY_EXISTS") {
      return c.json(
        {
          message: "Asset already exists",
        },
        409,
      );
    }

    throw error;
  }
});

// ==========================================
// 3. PUT /assets/:id - แก้ไขชื่อ Asset
// ==========================================
const updateAssetRoute = createRoute({
  method: "put",
  path: "/assets/{id}",
  tags: ["Asset"],
  summary: "Update asset name",
  description:
    "แก้ไขชื่อของ Asset โดยมีเงื่อนไขว่า **หาก Asset นี้มี Holding (ยอดถือครอง) ผูกอยู่จะไม่สามารถแก้ไขได้** และชื่อใหม่ต้องไม่ซ้ำกับ Asset อื่นของผู้ใช้",
  request: {
    params: AssetIdParamSchema,
    body: {
      content: { "application/json": { schema: UpdateAssetBodySchema } },
      description: "ชื่อ Asset ใหม่ที่ต้องการอัปเดต",
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: AssetResponseSchema } },
      description: "แก้ไขชื่อ Asset สำเร็จ",
    },
    400: {
      description:
        "Bad Request - มี Holding ผูกอยู่กับ Asset นี้แล้ว ห้ามแก้ไข",
    },
    401: { description: "Unauthenticated" },
    404: { description: "Not Found - ไม่พบ Asset ที่ระบุ" },
    409: {
      description:
        "Conflict - ชื่อ Asset ใหม่นี้ซ้ำกับ Asset อื่นในระบบของผู้ใช้",
    },
  },
});

assetController.openapi(updateAssetRoute, async (c) => {
  const payload = c.get("jwtPayload") as { id: string };
  const userId = BigInt(payload.id);

  const { id } = c.req.valid("param");
  const body = c.req.valid("json");

  try {
    const updatedAsset = await AssetService.updateAsset(BigInt(id), userId, {
      name: body.name,
    });

    return c.json(
      {
        id: updatedAsset.id.toString(),
        user_id: updatedAsset.userId.toString(),
        name: updatedAsset.name,
        symbol: updatedAsset.symbol,
        asset_type: updatedAsset.assetType,
        created_at: updatedAsset.createdAt.toISOString(),
        updated_at: updatedAsset.updatedAt.toISOString(),
      },
      200,
    );
  } catch (error: any) {
    if (error.message === "ASSET_NOT_FOUND") {
      return c.json({ message: "Asset not found" }, 404);
    }

    if (error.message === "CANNOT_UPDATE_ASSET_WITH_HOLDING") {
      return c.json(
        { message: "Cannot update asset that has active holding" },
        400,
      );
    }

    if (error.message === "ASSET_ALREADY_EXISTS") {
      return c.json({ message: "Asset name already exists" }, 409);
    }

    throw error;
  }
});

// ==========================================
// 4. DELETE /assets/:id - ลบ Asset
// ==========================================
const deleteAssetRoute = createRoute({
  method: "delete",
  path: "/assets/{id}",
  tags: ["Asset"],
  summary: "Delete an asset",
  description:
    "ลบ Asset ออกจากระบบ โดยจะทำการ Cascade ลบข้อมูล AssetHolding และ PortfolioTransaction ที่เกี่ยวข้องทั้งหมดออกให้อัตโนมัติ",
  request: {
    params: AssetIdParamSchema,
  },
  responses: {
    204: { description: "ลบ Asset สำเร็จ (No Content)" },
    401: { description: "Unauthenticated" },
    404: { description: "Not Found - ไม่พบ Asset ที่ระบุ" },
  },
});

assetController.openapi(deleteAssetRoute, async (c) => {
  const payload = c.get("jwtPayload") as { id: string };
  const userId = BigInt(payload.id);
  const { id } = c.req.valid("param");

  try {
    await AssetService.deleteAsset(BigInt(id), userId);
    return c.body(null, 204);
  } catch (error: any) {
    if (error.message === "ASSET_NOT_FOUND") {
      return c.json({ message: "Asset not found" }, 404);
    }
    throw error;
  }
});

// ==========================================
// 5. GET /assets/:id/holding - ดึงยอดถือครองปัจจุบัน
// ==========================================
const getAssetHoldingRoute = createRoute({
  method: "get",
  path: "/assets/{id}/holding",
  tags: ["Asset"],
  summary: "Get asset holding summary",
  description:
    "ดึงและคำนวณสรุปยอดถือครองปัจจุบันของ Asset นั้นๆ สรุปข้อมูล quantity, avg_cost_per_unit และ total_cost",
  request: {
    params: AssetIdParamSchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: AssetHoldingResponseSchema } },
      description: "ดึงข้อมูลยอดถือครองปัจจุบันสำเร็จ",
    },
    401: { description: "Unauthenticated" },
    404: { description: "Not Found - ไม่พบ Asset ที่ระบุ" },
  },
});

assetController.openapi(getAssetHoldingRoute, async (c) => {
  const payload = c.get("jwtPayload") as { id: string };
  const userId = BigInt(payload.id);
  const { id } = c.req.valid("param");

  try {
    const holdingSummary = await AssetService.getAssetHolding(
      BigInt(id),
      userId,
    );
    return c.json(holdingSummary, 200);
  } catch (error: any) {
    if (error.message === "ASSET_NOT_FOUND") {
      return c.json({ message: "Asset not found" }, 404);
    }
    throw error;
  }
});
