import { describe, test, expect, beforeEach, vi } from "vitest";
import bcrypt from "bcryptjs";
import { AuthService, DUMMY_PASSWORD_HASH } from "../../services/auth.services";
import { UserRepository } from "../../repositories/user.repository";

describe("AuthService.login - timing leak", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("🔴 should still run bcrypt.compare against the dummy hash when the user does not exist", async () => {
    vi.spyOn(UserRepository, "findByIdentifier").mockResolvedValue(null);
    const compareSpy = vi.spyOn(bcrypt, "compare");

    await expect(
      AuthService.login({
        identifier: "nobody@example.com",
        password: "whatever-password",
        rememberMe: false,
      }),
    ).rejects.toThrow("INVALID_CREDENTIALS");

    expect(compareSpy).toHaveBeenCalledTimes(1);
    expect(compareSpy).toHaveBeenCalledWith(
      "whatever-password",
      DUMMY_PASSWORD_HASH,
    );
  });

  test("🔴 should use bcrypt cost 10 for the dummy hash, same as real password hashes", () => {
    expect(bcrypt.getRounds(DUMMY_PASSWORD_HASH)).toBe(10);
  });

  test("🔴 should take comparable time for unknown and known users (no early return)", async () => {
    const realHash = await bcrypt.hash("correct-password-123", 10);
    const findSpy = vi.spyOn(UserRepository, "findByIdentifier");
    const login = () =>
      AuthService.login({
        identifier: "x",
        password: "wrong-password-123",
        rememberMe: false,
      }).catch(() => {});

    const timeIt = async () => {
      const start = performance.now();
      await login();
      return performance.now() - start;
    };

    findSpy.mockResolvedValue(null);
    const unknownMs = await timeIt();

    findSpy.mockResolvedValue({
      id: 1n,
      email: "x@example.com",
      username: "x",
      passwordHash: realHash,
    } as Awaited<ReturnType<typeof UserRepository.findByIdentifier>>);
    const knownMs = await timeIt();

    // bcrypt cost 10 ใช้เวลาหลักสิบ ms ขึ้นไป ถ้า early return จะเหลือไม่ถึง 1-2 ms
    expect(unknownMs).toBeGreaterThan(knownMs * 0.5);
  });
});
