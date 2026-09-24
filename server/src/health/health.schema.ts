import { createRoute, z } from "@hono/zod-openapi";
import { decode } from "hono/jwt"

// 1. Schema สำหรับ Server Health Response
export const ServerHealthResponseSchema = z.object({
  status: z.string().openapi({ example: "ok" }),
  uptime: z.number().openapi({ example: 123.45 }),
  timestamp: z.string().openapi({ example: "2026-09-24T10:00:00.000Z" }),
});

// 2. Schema สำหรับ Database Health Response
export const DatabaseHealthResponseSchema = z.object({
  status: z.string().openapi({ example: "ok" }),
  database: z.string().openapi({ example: "connected" }),
  timestamp: z.string().openapi({ example: "2026-09-24T10:00:00.000Z" }),
});

// 3. Schema สำหรับ Case ที่ Database มีปัญหา (Error 500)
export const ErrorHealthResponseSchema = z.object({
  status: z.string().openapi({ example: "error" }),
  database: z.string().openapi({ example: "disconnected" }),
  error: z.string().openapi({ example: "Database connection failed" }),
});

// 4. OpenAPI Spec - Check Server Health Route
export const getServerHealthRoute = createRoute({
  method: "get",
  path: "/health/server",
  tags: ["Health Check"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ServerHealthResponseSchema,
        },
      },
      description: "Server is healthy and running",
    },
  },
});

// 5. OpenAPI Spec - Check Database Health Route
export const getDatabaseHealthRoute = createRoute({
  method: "get",
  path: "/health/db",
  tags: ["Health Check"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: DatabaseHealthResponseSchema,
        },
      },
      description: "Database connection is healthy",
    },
    500: {
      content: {
        "application/json": {
          schema: ErrorHealthResponseSchema,
        },
      },
      description: "Database connection failed",
    },
  },
});
