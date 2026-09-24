import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { userController } from "./controllers/user.controllers";
import { healthController } from "./health/health.controllers";
import { authController } from "./controllers/auth.controllers";

const app = new OpenAPIHono();

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
