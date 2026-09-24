import { sign } from "hono/jwt";
import { prisma } from "../config/prisma";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing in environment variables (.env)");
}

export class AuthService {
  // Logic สำหรับการ Register
  static async register(data: {
    email: string;
    username: string;
    password: string;
  }) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
    });

    if (existingUser) {
      throw new Error("EMAIL_OR_USERNAME_EXISTS");
    }

    const hashedPassword = await Bun.password.hash(data.password);

    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash: hashedPassword,
      },
    });

    return {
      id: newUser.id.toString(),
      email: newUser.email,
      username: newUser.username,
    };
  }

  // Logic สำหรับการ Login
  static async login(data: { identifier: string; password: string }) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.identifier }, { username: data.identifier }],
      },
    });

    if (!user) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const isPasswordValid = await Bun.password.verify(
      data.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const token = await sign(
      {
        id: user.id.toString(),
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // หมดอายุใน 24 ชั่วโมง
      },
      JWT_SECRET!,
    );

    return { token };
  }
}
