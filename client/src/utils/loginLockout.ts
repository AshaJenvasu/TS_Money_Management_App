// ถ้าอ่าน Retry-After ไม่ได้ ใช้ทั้งหน้าต่าง rate limit ของ server (15 นาที)
export const DEFAULT_LOCKOUT_SECONDS = 900;

// ข้อความสำรองเมื่อ 429 ไม่มี message มากับ response
export const FALLBACK_LOCKOUT_MESSAGE =
  "พยายามเข้าสู่ระบบบ่อยเกินไปนะ รอสักครู่แล้วลองใหม่น้า";

// แปลงค่า header Retry-After (วินาที) เป็นตัวเลข ถ้าไม่มี/อ่านไม่ได้/ไม่ใช่จำนวนบวก ใช้ค่า fallback
export function parseRetryAfterSeconds(value: unknown): number {
  if (typeof value !== "string") return DEFAULT_LOCKOUT_SECONDS;
  const seconds = Number.parseInt(value, 10);
  return Number.isFinite(seconds) && seconds > 0
    ? seconds
    : DEFAULT_LOCKOUT_SECONDS;
}

// ดึง message จาก body ของ 429 ถ้าไม่มีใช้ข้อความสำรอง
export function readLockoutMessage(data: unknown): string {
  if (typeof data === "object" && data !== null && "message" in data) {
    const { message } = data as { message: unknown };
    if (typeof message === "string" && message.trim()) return message;
  }
  return FALLBACK_LOCKOUT_MESSAGE;
}

// แสดงเวลาที่เหลือ เช่น "42 วินาที", "3 นาที", "14 นาที 59 วินาที"
export function formatLockoutDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds} วินาที`;
  if (seconds === 0) return `${minutes} นาที`;
  return `${minutes} นาที ${seconds} วินาที`;
}
