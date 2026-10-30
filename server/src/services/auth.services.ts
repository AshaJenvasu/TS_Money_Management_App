import { sign } from "hono/jwt";
import { UserRepository } from "../repositories/user.repository.js";
import { prisma } from "../config/prisma.js";
import { PortfolioRepository } from "../repositories/portfolio.repository.js";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { PasswordResetTokenRepository } from "../repositories/password-reset-token.repository.js";
import { sendPasswordResetEmail } from "../utils/email.js";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing in environment variables (.env)");
}

// URL ของฝั่ง client ใช้ประกอบ reset link ที่จะส่งไปในอีเมล
const CLIENT_URL = process.env.CLIENT_URL;

if (!CLIENT_URL) {
  throw new Error("CLIENT_URL is missing in environment variables (.env)");
}

// ตั้งค่า rate limit: ขอ reset password ได้ไม่เกิน 3 ครั้งภายใน 15 นาที
const RATE_LIMIT_WINDOW_MINUTES = 15;
const RATE_LIMIT_MAX_ATTEMPTS = 3;
const RESET_TOKEN_EXPIRES_MINUTES = 30;

export class AuthService {
  // Logic สำหรับการ Register
  static async register(data: {
    email: string;
    username: string;
    password: string;
  }) {
    // 1. เรียกใช้ UserRepository
    const existingUser = await UserRepository.findByEmailOrUsername(
      data.email,
      data.username,
    );

    if (existingUser) {
      throw new Error("EMAIL_OR_USERNAME_EXISTS");
    }

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 3. สร้าง User ผ่าน UserRepository
    const newUser = await prisma.$transaction(async (tx) => {
      const newUser = await UserRepository.createUser(tx, {
        email: data.email,
        username: data.username,
        passwordHash: hashedPassword,
      });

      await PortfolioRepository.createPortfolio(tx, newUser.id);

      return newUser;
    });

    return {
      id: newUser.id.toString(),
      email: newUser.email,
      username: newUser.username,
    };
  }

  // Logic สำหรับการ Login
  static async login(data: {
    identifier: string;
    password: string;
    rememberMe: boolean;
  }) {
    // 1. ค้นหา User
    const user = await UserRepository.findByIdentifier(data.identifier);

    if (!user) {
      throw new Error("INVALID_CREDENTIALS");
    }

    // 2. Verify Password
    const isPasswordValid = await bcrypt.compare(
      data.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new Error("INVALID_CREDENTIALS");
    }

    // กำหนดอายุ Token: ติ๊ก Remember Me ให้ 30 วัน / ไม่ติ๊ก ให้ 1 วัน
    console.log("rememberMe:", data.rememberMe);

    const expiresInSeconds = data.rememberMe
      ? 60 * 60 * 24 * 30 // 30 วัน
      : 60 * 60 * 24; // 1 วัน

    // 3. Sign JWT Token
    const token = await sign(
      {
        id: user.id.toString(),
        email: user.email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
      },
      JWT_SECRET!,
    );

    // 4. Return User Information
    return {
      token,
      user: {
        id: user.id.toString(),
        username: user.username,
        email: user.email,
      },
    };
  }

  // Logic สำหรับขอ reset password — ไม่เปิดเผยว่า email มีอยู่จริงไหม กันการ enumerate user
  static async forgotPassword(email: string) {
    const user = await UserRepository.findByEmail(email);

    // ไม่เจอ user ก็จบเงียบๆ ไม่ throw error ไม่บอกอะไรเลย ให้ controller ตอบ success เหมือนกันทุกกรณี
    if (!user) {
      return;
    }

    // เช็ค rate limit จากประวัติคำขอย้อนหลังใน PasswordResetToken
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
    const recentAttempts =
      await PasswordResetTokenRepository.countRecentByUserId(user.id, since);

    if (recentAttempts >= RATE_LIMIT_MAX_ATTEMPTS) {
      throw new Error("TOO_MANY_REQUESTS");
    }

    // สุ่ม token ดิบด้วย crypto (256 บิต ปลอดภัยสูงมาก) แล้ว hash ด้วย SHA-256 ก่อนเก็บลง DB
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expiresAt = new Date(
      Date.now() + RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000,
    );

    await PasswordResetTokenRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    // ส่ง token ดิบ (ไม่ใช่ hash) ไปในลิงก์ เพราะ user ต้องเอามายืนยันตัวเองตอน reset
    const resetLink = `${CLIENT_URL}/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail(user.email, resetLink);
  }

  // Logic สำหรับตั้ง password ใหม่ด้วย reset token
  static async resetPassword(token: string, newPassword: string) {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const resetToken =
      await PasswordResetTokenRepository.findByTokenHash(tokenHash);

    if (!resetToken) {
      throw new Error("INVALID_TOKEN");
    }

    if (resetToken.usedAt) {
      throw new Error("TOKEN_ALREADY_USED");
    }

    if (resetToken.expiresAt < new Date()) {
      throw new Error("TOKEN_EXPIRED");
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // ต้องอัปเดต password และ mark token ว่าใช้แล้ว พร้อมกันแบบ atomic กันเอา token ไปใช้ซ้ำได้ถ้าขั้นใดขั้นหนึ่งล้มเหลวกลางคัน
    await prisma.$transaction(async (tx) => {
      await UserRepository.updatePasswordHash(
        resetToken.userId,
        newPasswordHash,
        tx,
      );
      await PasswordResetTokenRepository.markAsUsed(resetToken.id, tx);
    });
  }
}
