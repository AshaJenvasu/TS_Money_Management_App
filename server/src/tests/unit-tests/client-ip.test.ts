import { describe, test, expect } from "vitest";
import { getClientIp } from "../../middlewares/rate-limit.middleware";

describe("getClientIp", () => {
  test("🟢 reads the entry N positions from the right (N = trusted proxy hops)", () => {
    expect(getClientIp("203.0.113.9", 1)).toBe("203.0.113.9");
    expect(getClientIp("203.0.113.9, 10.0.0.1", 1)).toBe("10.0.0.1");
    expect(getClientIp("203.0.113.9, 10.0.0.1", 2)).toBe("203.0.113.9");
    expect(getClientIp("a, 203.0.113.9, 10.0.0.1, 10.0.0.2", 3)).toBe(
      "203.0.113.9",
    );
  });

  test("🔴 ignores entries the client prepended on the left (spoofing)", () => {
    expect(getClientIp("6.6.6.6, 203.0.113.9", 1)).toBe("203.0.113.9");
    expect(getClientIp("6.6.6.6, 7.7.7.7, 203.0.113.9", 1)).toBe(
      "203.0.113.9",
    );
    expect(getClientIp("6.6.6.6, 203.0.113.9, 10.0.0.1", 2)).toBe(
      "203.0.113.9",
    );
  });

  test("🟢 trims whitespace and skips empty entries", () => {
    expect(getClientIp(" 6.6.6.6 ,, 203.0.113.9 ", 1)).toBe("203.0.113.9");
  });

  test("🔴 returns null when the IP cannot be trusted or found", () => {
    expect(getClientIp(undefined, 1)).toBeNull();
    expect(getClientIp("", 1)).toBeNull();
    // ไม่ได้ตั้ง hop (0) = ไม่เชื่อ header เลย
    expect(getClientIp("203.0.113.9", 0)).toBeNull();
    // entry น้อยกว่าจำนวน proxy ที่ควรผ่านมา = ไม่ได้ผ่าน chain ที่คาดไว้
    expect(getClientIp("203.0.113.9", 2)).toBeNull();
  });
});
