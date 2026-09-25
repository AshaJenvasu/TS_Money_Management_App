import { OpenAPIHono } from "@hono/zod-openapi";
import { AuthService } from "../services/auth.services";
import { createRoute } from "@hono/zod-openapi";
import {
  LoginBodySchema,
  LoginResponseSchema,
  RegisterBodySchema,
  RegisterResponseSchema,
} from "../schema/auth.schema";

export const authController = new OpenAPIHono();

//  OpenAPI Route Specification
export const registerRoute = createRoute({
  method: "post",
  path: "/api/v1/auth/register",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: RegisterBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: RegisterResponseSchema,
        },
      },
      description: "User registered successfully",
    },
    400: {
      description: "Invalid input / Email or Username already exists",
    },
  },
});

//  OpenAPI Route Specification
export const loginRoute = createRoute({
  method: "post",
  path: "/api/v1/auth/login",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: LoginBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: LoginResponseSchema,
        },
      },
      description: "Login successful",
    },
    401: {
      description: "Invalid credentials",
    },
  },
});

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
