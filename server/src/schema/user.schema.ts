import {  z } from "@hono/zod-openapi";

// 1. นิยาม Zod Schema สำหรับ Request Params (รับ id จาก path)
export const UserParamsSchema = z.object({
  id: z.string().openapi({
    param: {
      name: "id",
      in: "path",
    },
    example: "usr_123",
  }),
});

// 2. นิยาม Zod Schema สำหรับ Response
export const UserResponseSchema = z.object({
  id: z.string().openapi({
    example: "usr_123",
  }),
  name: z.string().openapi({
    example: "John Doe",
  }),
  age: z.number().openapi({
    example: 25,
  }),
});

