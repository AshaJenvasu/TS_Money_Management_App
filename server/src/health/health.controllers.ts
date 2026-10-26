import { OpenAPIHono } from "@hono/zod-openapi";
import { getServerHealthRoute, getDatabaseHealthRoute } from "./health.schema.js";
import { prisma } from "../config/prisma.js";

export const healthController = new OpenAPIHono();

// 1. Handler สำหรับ Check Server Health
healthController.openapi(getServerHealthRoute, (c) => {
  return c.json(
    {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
    200,
  );
});

// 2. Handler สำหรับ Check Database Health
healthController.openapi(getDatabaseHealthRoute, async (c) => {
  try {
    // ใช้ $queryRaw ยิง query เบาๆ เพื่อทดสอบว่า   DB ยังตอบสนองไหม
    await prisma.$queryRaw`SELECT 1`;

    return c.json(
      {
        status: "ok",
        database: "connected",
        timestamp: new Date().toISOString(),
      },
      200,
    );
  } catch (error) {
    return c.json(
      {
        status: "error",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});
