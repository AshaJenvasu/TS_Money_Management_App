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

// ==========================================
// 3. Get Profile Schemas & Route
// ==========================================

export const userProfileResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
});
