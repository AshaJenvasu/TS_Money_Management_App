import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCKOUT_SECONDS,
  FALLBACK_LOCKOUT_MESSAGE,
  formatLockoutDuration,
  parseRetryAfterSeconds,
  readLockoutMessage,
} from "./loginLockout";

describe("parseRetryAfterSeconds", () => {
  it("อ่านค่าวินาทีจาก header", () => {
    expect(parseRetryAfterSeconds("42")).toBe(42);
  });

  it("fallback เป็น 900 เมื่อไม่มี header", () => {
    expect(parseRetryAfterSeconds(undefined)).toBe(DEFAULT_LOCKOUT_SECONDS);
    expect(DEFAULT_LOCKOUT_SECONDS).toBe(900);
  });

  it("fallback เมื่อ parse ไม่ได้หรือไม่ใช่จำนวนบวก", () => {
    expect(parseRetryAfterSeconds("abc")).toBe(900);
    expect(parseRetryAfterSeconds("")).toBe(900);
    expect(parseRetryAfterSeconds("0")).toBe(900);
    expect(parseRetryAfterSeconds("-5")).toBe(900);
  });
});

describe("readLockoutMessage", () => {
  it("ใช้ message จาก backend", () => {
    expect(readLockoutMessage({ message: "ล้มเหลวหลายครั้งเกินไป" })).toBe(
      "ล้มเหลวหลายครั้งเกินไป",
    );
  });

  it("ใช้ข้อความสำรองเมื่อไม่มี message", () => {
    expect(readLockoutMessage(undefined)).toBe(FALLBACK_LOCKOUT_MESSAGE);
    expect(readLockoutMessage({})).toBe(FALLBACK_LOCKOUT_MESSAGE);
    expect(readLockoutMessage({ message: "  " })).toBe(
      FALLBACK_LOCKOUT_MESSAGE,
    );
    expect(readLockoutMessage({ message: 42 })).toBe(FALLBACK_LOCKOUT_MESSAGE);
  });
});

describe("formatLockoutDuration", () => {
  it("แสดงเป็นวินาที/นาที ตามความยาว", () => {
    expect(formatLockoutDuration(42)).toBe("42 วินาที");
    expect(formatLockoutDuration(180)).toBe("3 นาที");
    expect(formatLockoutDuration(899)).toBe("14 นาที 59 วินาที");
  });
});
