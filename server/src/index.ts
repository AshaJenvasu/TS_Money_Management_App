import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { userController } from "./controllers/user.controllers";
import { healthController } from "./health/health.controllers";
import { authController } from "./controllers/auth.controllers";
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

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

// Controllers ทั้งหมดของ App หลัก
app.route("/", userController);
app.route("/", healthController);
app.route("/", authController);

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

export default app;
