import { OpenAPIHono } from "@hono/zod-openapi";
import { getProfileRoute } from "../schema/auth.schema";
import { authMiddleware } from "../middlewares/auth.middleware";

export const userController = new OpenAPIHono();

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
