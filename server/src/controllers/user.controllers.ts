import { OpenAPIHono } from "@hono/zod-openapi";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createRoute } from "@hono/zod-openapi";
import { UserParamsSchema, UserResponseSchema } from "../schema/user.schema";
import { userProfileResponseSchema } from "../schema/auth.schema";

export const userController = new OpenAPIHono();

//  OpenAPI Route Specification
export const getUserRoute = createRoute({
  method: "get",
  path: "/users/{id}",
  tags: ["User"],
  request: {
    params: UserParamsSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UserResponseSchema,
        },
      },
      description: "Retrieve the user successfully",
    },
  },
});

// Define OpenAPI Route สำหรับ GET /api/v1/users/me
export const getProfileRoute = createRoute({
  method: "get",
  path: "/api/v1/users/me",
  tags: ["User"],
  security: [{ Bearer: [] }], // กำหนดใน OpenAPI Docs ว่าต้องส่ง Bearer Token
  responses: {
    200: {
      content: {
        "application/json": {
          schema: userProfileResponseSchema,
        },
      },
      description: "Get current user profile successfully",
    },
    401: {
      description: "Unauthorized",
    },
  },
});

userController.use("/api/v1/users/me", authMiddleware);

userController.openapi(getProfileRoute, async (c) => {
  const payload = c.get("jwtPayload") as { id: string; email: string };

  return c.json(
    {
      id: payload.id,
      email: payload.email,
    },
    200,
  );
});
