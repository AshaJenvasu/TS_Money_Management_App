import { INTERNAL_PROXY_SECRET_HEADER } from "../../middlewares/rate-limit.middleware";

// header ที่ Vercel แปะมาตอน proxy request ไปยัง server: IP ของผู้ใช้ + secret ที่ยืนยันว่า request ผ่าน Vercel จริง
// (ค่า secret ตรงกับ env INTERNAL_PROXY_SECRET ที่ตั้งใน vitest.config.ts)
export function proxyHeaders(ip: string): Record<string, string> {
  return {
    "x-vercel-forwarded-for": ip,
    [INTERNAL_PROXY_SECRET_HEADER]: process.env.INTERNAL_PROXY_SECRET as string,
  };
}
