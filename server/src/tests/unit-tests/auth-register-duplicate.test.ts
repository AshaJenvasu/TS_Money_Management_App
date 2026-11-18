import { describe, test, expect, beforeEach, vi } from "vitest";
import { AuthService } from "../../services/auth.services";
import { UserRepository } from "../../repositories/user.repository";
import { prisma } from "../../config/prisma";

describe("AuthService.register - unique constraint race", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("🔴 should map a DB unique-constraint error (P2002) to EMAIL_OR_USERNAME_EXISTS instead of leaking it", async () => {
    // จำลองสองคำขอที่ผ่านการเช็คซ้ำพร้อมกัน แล้วตัวหลังชน unique constraint ตอนสร้างจริง
    vi.spyOn(UserRepository, "findByEmailOrUsername").mockResolvedValue(null);
    vi.spyOn(prisma, "$transaction").mockRejectedValue(
      Object.assign(new Error("Unique constraint failed"), { code: "P2002" }),
    );

    await expect(
      AuthService.register({
        email: "race@example.com",
        username: "race_user",
        password: "Password123!",
      }),
    ).rejects.toThrow("EMAIL_OR_USERNAME_EXISTS");
  });

  test("🔴 should rethrow other DB errors unchanged", async () => {
    vi.spyOn(UserRepository, "findByEmailOrUsername").mockResolvedValue(null);
    vi.spyOn(prisma, "$transaction").mockRejectedValue(new Error("connection lost"));

    await expect(
      AuthService.register({
        email: "x@example.com",
        username: "x_user",
        password: "Password123!",
      }),
    ).rejects.toThrow("connection lost");
  });
});
