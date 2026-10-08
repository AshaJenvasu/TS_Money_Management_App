import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { logger } from "../utils/logger";

/**
 * Global Error Handler Middleware สำหรับดักจับ Unhandled Error ทั้งหมดใน Application
 */

//c ย่อมาจาก Context Object มันคือวัตถุศูนย์รวมข้อมูลทั้งหมดของ HTTP Request นั้นๆ ที่วิ่งเข้ามาใน Server
export const globalErrorHandler = (err: Error, c: Context) => {
  // 1. กรณีเป็น HTTPException ที่ตั้งใจ throw ออกมาจาก Hono หรือ Middleware อื่นๆ
  if (err instanceof HTTPException) {
    logger.warn(
      {
        path: c.req.path,
        method: c.req.method,
        status: err.status,
        message: err.message,
      },
      `HTTP Exception: ${err.message}`,
    );
    return err.getResponse();
  }

  // 2. กรณีเป็น Unhandled / Unexpected Exception (เช่น Prisma Error, Null Pointer, Runtime Crash)
  logger.error(
    {
      path: c.req.path,
      method: c.req.method,
      message: err.message,
      stack: err.stack, // แสดง ว่าโค้ดพังที่ไฟล์ไหน บรรทัดไหน
    },
    "Unhandled Internal Server Error",
  );

  // ตอบกลับ Client ด้วย Format มาตรฐาน 500
  return c.json({
    message: err.message,
  });
};
