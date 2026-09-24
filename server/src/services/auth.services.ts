import { sign } from "hono/jwt";
import { UserRepository } from "../repositories/user.repository";

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
    // 1. เรียกใช้ UserRepository
    const existingUser = await UserRepository.findByEmailOrUsername(
      data.email,
      data.username,
    );

    if (existingUser) {
      throw new Error("EMAIL_OR_USERNAME_EXISTS");
    }

    // 2. Hash Password
    const hashedPassword = await Bun.password.hash(data.password);

    // 3. สร้าง User ผ่าน UserRepository
    const newUser = await UserRepository.createUser({
      email: data.email,
      username: data.username,
      passwordHash: hashedPassword,
    });

    return {
      id: newUser.id.toString(),
      email: newUser.email,
      username: newUser.username,
    };
  }

  // Logic สำหรับการ Login
  static async login(data: { identifier: string; password: string }) {
    // 1. เรียกใช้ UserRepository ค้นหา User
    const user = await UserRepository.findByIdentifier(data.identifier);

    if (!user) {
      throw new Error("INVALID_CREDENTIALS");
    }

    // 2. Verify Password
    const isPasswordValid = await Bun.password.verify(
      data.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new Error("INVALID_CREDENTIALS");
    }

    // 3. Sign JWT Token
    const token = await sign(
      {
        id: user.id.toString(),
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
      },
      JWT_SECRET!,
    );

    return { token };
  }
}
