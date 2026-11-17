import { describe, test, expect } from "vitest";
import { getClientIp } from "../../middlewares/rate-limit.middleware";

describe("getClientIp (x-vercel-forwarded-for)", () => {
  test("🟢 returns the IPv4 or IPv6 address from the header", () => {
    expect(getClientIp("203.0.113.9")).toBe("203.0.113.9");
    expect(getClientIp("2001:db8::1")).toBe("2001:db8::1");
  });

  test("🟢 trims surrounding whitespace", () => {
    expect(getClientIp("  203.0.113.9 ")).toBe("203.0.113.9");
  });

  test("🔴 returns null when the header is missing or empty", () => {
    expect(getClientIp(undefined)).toBeNull();
    expect(getClientIp("")).toBeNull();
    expect(getClientIp("   ")).toBeNull();
  });

  test.each([
    ["not an IP", "not-an-ip"],
    ["a list of addresses", "6.6.6.6, 203.0.113.9"],
    ["an address with a port", "203.0.113.9:8080"],
    ["a very long string", "a".repeat(500)],
  ])("🔴 returns null when the value is %s", (_name, value) => {
    expect(getClientIp(value)).toBeNull();
  });
});
