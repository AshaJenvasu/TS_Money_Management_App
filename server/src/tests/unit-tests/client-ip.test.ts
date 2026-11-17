import { describe, test, expect } from "vitest";
import { getClientIp } from "../../middlewares/rate-limit.middleware";

const SECRET = "shared-secret-value";

describe("getClientIp (x-vercel-forwarded-for + shared secret)", () => {
  test("🟢 returns the IPv4 or IPv6 address when the secret matches", () => {
    expect(
      getClientIp(
        { vercelForwardedFor: "203.0.113.9", internalProxySecret: SECRET },
        SECRET,
      ),
    ).toBe("203.0.113.9");
    expect(
      getClientIp(
        { vercelForwardedFor: "2001:db8::1", internalProxySecret: SECRET },
        SECRET,
      ),
    ).toBe("2001:db8::1");
  });

  test("🟢 trims whitespace around the IP", () => {
    expect(
      getClientIp(
        { vercelForwardedFor: "  203.0.113.9 ", internalProxySecret: SECRET },
        SECRET,
      ),
    ).toBe("203.0.113.9");
  });

  test.each([
    ["missing", undefined],
    ["empty", ""],
    ["wrong", "wrong-secret"],
    ["a prefix of the real secret", SECRET.slice(0, 5)],
    ["the real secret plus extra characters", `${SECRET}x`],
  ])("🔴 returns null when the secret header is %s", (_name, provided) => {
    expect(
      getClientIp(
        { vercelForwardedFor: "203.0.113.9", internalProxySecret: provided },
        SECRET,
      ),
    ).toBeNull();
  });

  test.each([
    ["not set", undefined],
    ["empty", ""],
  ])(
    "🔴 returns null when the server's own secret is %s, even if the header is sent",
    (_name, expected) => {
      expect(
        getClientIp(
          { vercelForwardedFor: "203.0.113.9", internalProxySecret: "" },
          expected,
        ),
      ).toBeNull();
      expect(
        getClientIp(
          { vercelForwardedFor: "203.0.113.9", internalProxySecret: SECRET },
          expected,
        ),
      ).toBeNull();
    },
  );

  test("🔴 returns null when the secret matches but the IP header is missing or empty", () => {
    expect(getClientIp({ internalProxySecret: SECRET }, SECRET)).toBeNull();
    expect(
      getClientIp(
        { vercelForwardedFor: "   ", internalProxySecret: SECRET },
        SECRET,
      ),
    ).toBeNull();
  });

  test.each([
    ["not an IP", "not-an-ip"],
    ["a list of addresses", "6.6.6.6, 203.0.113.9"],
    ["an address with a port", "203.0.113.9:8080"],
    ["a very long string", "a".repeat(500)],
  ])("🔴 returns null when the IP value is %s", (_name, value) => {
    expect(
      getClientIp(
        { vercelForwardedFor: value, internalProxySecret: SECRET },
        SECRET,
      ),
    ).toBeNull();
  });
});
