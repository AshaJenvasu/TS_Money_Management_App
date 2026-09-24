import { OpenAPIHono } from "@hono/zod-openapi";
import { registerRoute, loginRoute } from "../schema/auth.schema";
import { AuthService } from "../services/auth.services";

export const authController = new OpenAPIHono();

// 1. Controller: registerUser
authController.openapi(registerRoute, async (c) => {
  const body = c.req.valid("json");

  try {
    const result = await AuthService.register(body);
    return c.json(result, 201);
  } catch (error: any) {
    if (error.message === "EMAIL_OR_USERNAME_EXISTS") {
      return c.json({ message: "Email or Username already exists" }, 400);
    }
    return c.json({ message: "Internal Server Error" }, 500);
  }
});

// 2. Controller: loginUser
authController.openapi(loginRoute, async (c) => {
  const body = c.req.valid("json");

  try {
    const result = await AuthService.login(body);
    return c.json(result, 200);
  } catch (error: any) {
    if (error.message === "INVALID_CREDENTIALS") {
      return c.json({ message: "Invalid credentials" }, 401);
    }
    return c.json({ message: "Internal Server Error" }, 500);
  }
});
