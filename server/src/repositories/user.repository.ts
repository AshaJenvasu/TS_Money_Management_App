import { prisma } from "../config/prisma";
import { Prisma } from "@prisma/client";


export class UserRepository {
  // ค้นหา User จาก Email หรือ Username
  static async findByEmailOrUsername(email: string, username: string) {
    return await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });
  }

  // ค้นหา User จาก Identifier (Email หรือ Username) สำหรับ Login
  static async findByIdentifier(identifier: string) {
    return await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });
  }

  // สร้าง User ใหม่ลง Database
  static async createUser(
    tx: Prisma.TransactionClient,
    data: {
      email: string;
      username: string;
      passwordHash: string;
    },
  ) {
    return await tx.user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash: data.passwordHash,
      },
    });
  }
}
