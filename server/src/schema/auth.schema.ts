import { createRoute, z } from "@hono/zod-openapi";

// ==========================================
// 1. Register Schemas & Route
// ==========================================
export const RegisterBodySchema = z.object({
  email: z.string().email().openapi({ example: "user@example.com" }),
  username: z.string().min(1).openapi({ example: "johndoe" }),
  password: z.string().min(6).openapi({ example: "password123" }),
});

export const RegisterResponseSchema = z.object({
  id: z.string().openapi({ example: "1" }),
  email: z.string().email().openapi({ example: "user@example.com" }),
  username: z.string().openapi({ example: "johndoe" }),
});

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

// ==========================================
// 2. Login Schemas & Route
// ==========================================
export const LoginBodySchema = z.object({
  identifier: z.string().openapi({ example: "user@example.com" }),
  password: z.string().min(6).openapi({ example: "password123" }),
});

export const LoginResponseSchema = z.object({
  token: z.string().openapi({ example: "eyJhbGciOiJIUzI1NiIsIn..." }),
});

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

// ==========================================
// 3. Get Profile Schemas & Route
// ==========================================

export const userProfileResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
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
