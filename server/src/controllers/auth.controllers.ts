import { OpenAPIHono } from "@hono/zod-openapi";
import { AuthService } from "../services/auth.services.js";
import { createRoute } from "@hono/zod-openapi";
import {
  LoginBodySchema,
  LoginResponseSchema,
  RegisterBodySchema,
  RegisterResponseSchema,
} from "../schema/auth.schema.js";
import { setCookie, deleteCookie } from "hono/cookie";
import {
  ForgotPasswordBodySchema,
  ResetPasswordBodySchema,
} from "../schema/auth.schema.js";
import { z } from "zod";

export const authController = new OpenAPIHono();

//  OpenAPI Route Specification
export const registerRoute = createRoute({
  method: "post",
  path: "/auth/register",
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
  path: "/auth/login",
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

// OpenAPI Specification สำหรับ Logout
export const logoutRoute = createRoute({
  method: "post",
  path: "/auth/logout",
  tags: ["Auth"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
      description: "Logout successful",
    },
  },
});

// OpenAPI Route Specification สำหรับขอ reset password link
export const forgotPasswordRoute = createRoute({
  method: "post",
  path: "/auth/forgot-password",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: ForgotPasswordBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
      description: "Password reset email sent (if account exists)",
    },
    429: {
      description: "Too many reset requests, please try again later",
    },
  },
});

// OpenAPI Route Specification สำหรับตั้ง password ใหม่ด้วย reset token
export const resetPasswordRoute = createRoute({
  method: "post",
  path: "/auth/reset-password",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: ResetPasswordBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
      description: "Password reset successfully",
    },
    400: {
      description: "Invalid, expired, or already-used token",
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
    console.error("Register ERROR:", error);

    if (error.message === "EMAIL_OR_USERNAME_EXISTS") {
      return c.json({ message: "Email or Username already exists" }, 400);
    }
    throw error;
  }
});

// 2. Controller: loginUser
authController.openapi(loginRoute, async (c) => {
  const body = c.req.valid("json");

  try {
    const result = await AuthService.login(body);

    // 🔒 สั่งฝาก Token ลง Cookie
    setCookie(c, "auth_token", result.token, {
      httpOnly: true, // ป้องกัน JS อ่านค่า (กัน XSS)
      secure: process.env.NODE_ENV === "production", // ใช้ HTTPS ใน production
      sameSite: "Lax", // ป้องกัน CSRF
      path: "/",
      maxAge: body.rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24, // 30 วัน หรือ 1 วัน
    });
    return c.json(result, 200);
  } catch (error: any) {
    console.error("Login ERROR:", error);

    if (error.message === "INVALID_CREDENTIALS") {
      return c.json({ message: "Invalid credentials" }, 401);
    }
    throw error;
  }
});

// 3. Controller: logoutUser
authController.openapi(logoutRoute, (c) => {
  deleteCookie(c, "auth_token", {
    path: "/",
  });

  return c.json(
    {
      message: "Logout successful",
    },
    200,
  );
});

// 4. Controller: forgotPassword
authController.openapi(forgotPasswordRoute, async (c) => {
  const { email } = c.req.valid("json");

  try {
    await AuthService.forgotPassword(email);
  } catch (error: any) {
    if (error.message === "TOO_MANY_REQUESTS") {
      return c.json(
        { message: "ขอ reset password บ่อยเกินไป กรุณาลองใหม่ภายหลัง" },
        429,
      );
    }
    throw error;
  }

  // ตอบข้อความเดียวกันเสมอไม่ว่า email จะมีอยู่จริงในระบบหรือไม่ กัน user enumeration
  return c.json(
    {
      message:
        "ถ้า email นี้มีอยู่ในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปให้แล้ว",
    },
    200,
  );
});

// 5. Controller: resetPassword
authController.openapi(resetPasswordRoute, async (c) => {
  const { token, newPassword } = c.req.valid("json");

  try {
    await AuthService.resetPassword(token, newPassword);
  } catch (error: any) {
    if (
      error.message === "INVALID_TOKEN" ||
      error.message === "TOKEN_ALREADY_USED" ||
      error.message === "TOKEN_EXPIRED"
    ) {
      return c.json(
        { message: "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว" },
        400,
      );
    }
    throw error;
  }

  // ไม่ setCookie เลย ไม่ auto-login ตามที่ตกลงกันไว้ ให้ user กลับไป login เองด้วยรหัสผ่านใหม่
  return c.json(
    { message: "ตั้งรหัสผ่านใหม่สำเร็จ กรุณาเข้าสู่ระบบอีกครั้ง" },
    200,
  );
});
