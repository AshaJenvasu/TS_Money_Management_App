import { prisma } from "../config/prisma";
import { Prisma } from "@prisma/client";

export class PortfolioRepository {
  static async createPortfolio(tx: Prisma.TransactionClient, userId: bigint) {
    return await tx.portfolio.create({
      data: {
        userId,
      },
    });
  }
}
