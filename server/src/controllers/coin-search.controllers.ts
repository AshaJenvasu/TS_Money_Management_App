import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { ipRateLimit } from "../middlewares/rate-limit.middleware.js";
import { RATE_LIMITS } from "../config/rate-limits.js";
import { CoinSearchService } from "../services/coin-search.services.js";
import { logger } from "../utils/logger.js";

export const coinSearchController = new OpenAPIHono();

// ต้องลงทะเบียน controller นี้ก่อน assetController ใน index.ts ไม่งั้น /assets/{id} จะรับ "search-coins" ไปเป็น id
coinSearchController.use("/assets/search-coins", authMiddleware);
// rate limit หลัง auth: request ที่ไม่ผ่าน login ไม่ต้องเปลือง Redis
coinSearchController.use(
  "/assets/search-coins",
  ipRateLimit(RATE_LIMITS.searchCoins),
);

const searchCoinsRoute = createRoute({
  method: "get",
  path: "/assets/search-coins",
  tags: ["Asset"],
  summary: "Search coins on CoinGecko",
  description:
    "ค้นหาเหรียญจาก CoinGecko แบบ real-time เพื่อให้ผู้ใช้เลือกเหรียญที่ถูกต้อง (ได้ CoinGecko id ที่ไม่กำกวม)",
  request: {
    query: z.object({
      q: z.string().trim().min(1).max(50).openapi({ example: "bitcoin" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(
            z.object({ id: z.string(), symbol: z.string(), name: z.string() }),
          ),
        },
      },
      description: "รายการเหรียญที่ตรงกับคำค้นหา",
    },
    400: { description: "q ว่าง ไม่ได้ส่งมา หรือยาวเกิน 50 ตัวอักษร" },
    401: { description: "Unauthenticated" },
    429: { description: "ค้นหาบ่อยเกินไป (มี header Retry-After)" },
    502: { description: "CoinGecko ใช้งานไม่ได้ชั่วคราว" },
  },
});

coinSearchController.openapi(searchCoinsRoute, async (c) => {
  const { q } = c.req.valid("query");

  try {
    const coins = await CoinSearchService.search(q);
    return c.json(coins, 200);
  } catch (error) {
    logger.warn({ err: error }, "Failed to search coins on CoinGecko");
    return c.json({ message: "Coin search is temporarily unavailable" }, 502);
  }
});
