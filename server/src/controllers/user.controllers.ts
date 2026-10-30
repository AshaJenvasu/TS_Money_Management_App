import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  UserParamsSchema,
  UserResponseSchema,
  UpdateUsernameBodySchema,
  UpdateEmailBodySchema,
  UpdatePasswordBodySchema,
  DeleteAccountBodySchema,
} from "../schema/user.schema.js";
import { userProfileResponseSchema } from "../schema/auth.schema.js";
import { UserRepository } from "../repositories/user.repository.js";
import { UserService } from "../services/user.services.js";
import { sign } from "hono/jwt";
import { setCookie, deleteCookie } from "hono/cookie";

export const userController = new OpenAPIHono();

// ใช้เซ็น JWT ใหม่ตอน re-issue token หลังเปลี่ยน email (pattern เดียวกับ auth.services.ts)
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing in environment variables (.env)");
}

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

// Define OpenAPI Route สำหรับ GET /users/me
export const getProfileRoute = createRoute({
  method: "get",
  path: "/users/me",
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
    404: {
      description: "User not found (token still valid but user record is gone)",
    },
  },
});

// Define OpenAPI Route สำหรับ PUT /users/me/username
export const updateUsernameRoute = createRoute({
  method: "put",
  path: "/users/me/username",
  tags: ["User"],
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: UpdateUsernameBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: userProfileResponseSchema,
        },
      },
      description: "Update username successfully",
    },
    400: {
      description: "Invalid username format",
    },
    401: {
      description: "Unauthorized",
    },
    409: {
      description: "Username already taken",
    },
  },
});

// Define OpenAPI Route สำหรับ PUT /users/me/email
export const updateEmailRoute = createRoute({
  method: "put",
  path: "/users/me/email",
  tags: ["User"],
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: UpdateEmailBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: userProfileResponseSchema,
        },
      },
      description: "Update email successfully",
    },
    400: {
      description: "Invalid email format",
    },
    401: {
      description: "Unauthorized or current password incorrect",
    },
    404: {
      description: "User not found",
    },
    409: {
      description: "Email already taken",
    },
  },
});

// Define OpenAPI Route สำหรับ PUT /users/me/password
export const updatePasswordRoute = createRoute({
  method: "put",
  path: "/users/me/password",
  tags: ["User"],
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: UpdatePasswordBodySchema,
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
      description: "Update password successfully",
    },
    400: {
      description: "Invalid password format",
    },
    401: {
      description: "Unauthorized or current password incorrect",
    },
    404: {
      description: "User not found",
    },
  },
});

// Define OpenAPI Route สำหรับ DELETE /users/me
export const deleteAccountRoute = createRoute({
  method: "delete",
  path: "/users/me",
  tags: ["User"],
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: DeleteAccountBodySchema,
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
      description: "Delete account successfully",
    },
    401: {
      description: "Unauthorized or current password incorrect",
    },
    404: {
      description: "User not found",
    },
  },
});

userController.use("/users/me", authMiddleware);
userController.use("/users/me/*", authMiddleware);

// 1. Controller: getProfile
userController.openapi(getProfileRoute, async (c) => {
  const payload = c.get("jwtPayload") as { id: string; email: string };

  // ดึงข้อมูลสดจาก Database แทนการเชื่อค่าใน JWT เพื่อกัน username/email ค้างเก่า
  const user = await UserRepository.findById(BigInt(payload.id));

  if (!user) {
    return c.json({ message: "User not found" }, 404);
  }

  return c.json(
    {
      id: user.id.toString(),
      username: user.username,
      email: user.email,
    },
    200,
  );
});

// 2. Controller: updateUsername
userController.openapi(updateUsernameRoute, async (c) => {
  const payload = c.get("jwtPayload") as { id: string; email: string };
  const { username } = c.req.valid("json");

  try {
    // อัปเดต Username ผ่าน Service (เช็คซ้ำ + เขียนลง DB ให้แล้ว)
    const updatedUser = await UserService.updateUsername(
      BigInt(payload.id),
      username,
    );

    return c.json(
      {
        id: updatedUser.id.toString(),
        username: updatedUser.username,
        iat: Math.floor(Date.now() / 1000),
        email: updatedUser.email,
      },
      200,
    );
  } catch (error: any) {
    if (error.message === "USERNAME_TAKEN") {
      return c.json({ message: "Username already taken" }, 409);
    }
    throw error;
  }
});

// 3. Controller: updateEmail
userController.openapi(updateEmailRoute, async (c) => {
  const payload = c.get("jwtPayload") as {
    id: string;
    email: string;
    exp?: number;
  };
  const { email, currentPassword } = c.req.valid("json");

  try {
    // อัปเดต Email ผ่าน Service (เช็ค password + เช็คซ้ำ + เขียนลง DB ให้แล้ว)
    const updatedUser = await UserService.updateEmail(
      BigInt(payload.id),
      email,
      currentPassword,
    );

    // คำนวณเวลาที่เหลือของ token เดิม เพื่อคง session length ไว้เท่าเดิม ไม่ reset ให้ยาว/สั้นลงโดยไม่ตั้งใจ
    const remainingSeconds = payload.exp
      ? payload.exp - Math.floor(Date.now() / 1000)
      : 60 * 60 * 24; // fallback 1 วัน ถ้าไม่มี exp ใน payload
    const tokenMaxAge = Math.max(remainingSeconds, 60);

    // ออก JWT ใหม่ที่มี email ล่าสุด แทน token เดิมที่ email ค้างอยู่
    const newToken = await sign(
      {
        id: updatedUser.id.toString(),
        email: updatedUser.email,
        exp: Math.floor(Date.now() / 1000) + tokenMaxAge,
      },
      JWT_SECRET!,
    );

    setCookie(c, "auth_token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      path: "/",
      maxAge: tokenMaxAge,
    });

    return c.json(
      {
        id: updatedUser.id.toString(),
        username: updatedUser.username,
        email: updatedUser.email,
      },
      200,
    );
  } catch (error: any) {
    if (error.message === "USER_NOT_FOUND") {
      return c.json({ message: "User not found" }, 404);
    }
    if (error.message === "INVALID_PASSWORD") {
      return c.json({ message: "Current password is incorrect" }, 401);
    }
    if (error.message === "EMAIL_TAKEN") {
      return c.json({ message: "Email already taken" }, 409);
    }
    throw error;
  }
});

// 4. Controller: updatePassword
userController.openapi(updatePasswordRoute, async (c) => {
  const payload = c.get("jwtPayload") as { id: string; email: string };
  const { currentPassword, newPassword } = c.req.valid("json");

  try {
    // อัปเดต Password ผ่าน Service (เช็ค current password + hash ใหม่ + เขียนลง DB ให้แล้ว)
    await UserService.updatePassword(
      BigInt(payload.id),
      currentPassword,
      newPassword,
    );

    return c.json({ message: "Password updated successfully" }, 200);
  } catch (error: any) {
    if (error.message === "USER_NOT_FOUND") {
      return c.json({ message: "User not found" }, 404);
    }
    if (error.message === "INVALID_PASSWORD") {
      return c.json({ message: "Current password is incorrect" }, 401);
    }
    throw error;
  }
});

// 5. Controller: deleteAccount
userController.openapi(deleteAccountRoute, async (c) => {
  const payload = c.get("jwtPayload") as { id: string; email: string };
  const { currentPassword } = c.req.valid("json");

  try {
    await UserService.deleteAccount(BigInt(payload.id), currentPassword);

    deleteCookie(c, "auth_token", { path: "/" });

    return c.json({ message: "Account deleted successfully" }, 200);
  } catch (error: any) {
    if (error.message === "USER_NOT_FOUND") {
      return c.json({ message: "User not found" }, 404);
    }
    if (error.message === "INVALID_PASSWORD") {
      return c.json({ message: "Current password is incorrect" }, 401);
    }
    throw error;
  }
});
