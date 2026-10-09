import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { pinoLogger } from "hono-pino";
import { logger } from "./utils/logger";
import { globalErrorHandler } from "./middlewares/error.middleware";

import { userController } from "./controllers/user.controllers";
import { healthController } from "./health/health.controllers";
import { authController } from "./controllers/auth.controllers";
import { walletController } from "./controllers/wallet.controllers";
import { transactionController } from "./controllers/transaction.controllers";
import { assetController } from "./controllers/asset.controllers";
import { portfolioController } from "./controllers/portfolio.controllers";
import { cors } from "hono/cors";

const app = new OpenAPIHono();

// ตั้งค่า CORS Middleware เปิดทางให้ Frontend ยิงเข้ามาได้
app.use(
  "*",
  cors({
    origin: "http://localhost:5173", // URL ของฝั่ง Frontend
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true, // เปิดให้รับ-ส่ง Cookie / Credentials
  }),
);

// ใช้ pinoLogger ดักจับและ Log ทุก HTTP Request/Response ที่ยิงเข้ามา
app.use(
  "*",
  pinoLogger({
    pino: logger, // ส่ง logger instance ของเราเข้าไปใช้งาน
  }),
);

// ตั้งค่า Global Error Handler Middleware
app.onError(globalErrorHandler);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

// Scalar API Reference
app.route(
  "/scalar",
  Scalar.serve({
    document: () =>
      app.getOpenAPI31Document({
        openapi: "3.1.0",
        info: {
          title: "My API Documentation",
          version: "1.0.0",
          description: "API Documentation powered by Hono OpenAPI & Scalar",
        },
      }),
  }),
);

// Controllers ทั้งหมดของ App หลัก
app.route("/", userController);
app.route("/", healthController);
app.route("/", authController);
app.route("/", walletController);
app.route("/", transactionController);
app.route("/", assetController);
app.route("/", portfolioController);

export default app;
