import pino from "pino";

export const logger = pino({
  // กำหนดระดับ Log ขั้นต่ำที่จะให้แสดงผล (ถ้าไม่ระบุใน .env จะใช้ค่าเริ่มต้นเป็น 'info')
  level: process.env.LOG_LEVEL || "info",

  // 🔒 ซ่อนข้อมูล Sensitive ไม่ให้โผล่ใน Log
  redact: {
    paths: [
      // 1. Headers Level
      "req.headers.cookie", // ซ่อน Cookie
      "req.headers.authorization",
      "req.headers['set-cookie']", // ซ่อน Response Cookie

      // 2. Auth & Passwords
      "password",
      "*.password",
      "*.passwordHash",
      "*.confirmPassword",
      "*.oldPassword",
      "*.newPassword",

      // 3. Tokens & Keys
      "*.token",
      "*.accessToken",
      "*.refreshToken",
      "*.secret",
      "*.privateKey",
      "*.publicKey",
      "*set-cookie",
    ],
    censor: "[REDACTED]", // ข้อความที่จะขึ้นแทนค่าที่ถูกซ่อน
  },

  // ตั้งค่า Formatter สำหรับการแสดงผล Log
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          // ในช่วง Development ให้ใช้ pino-pretty เพื่อจัด Format Log ให้สวยงาม อ่านง่ายใน Terminal
          target: "pino-pretty",
          options: {
            colorize: true, // ใส่สีสันแยกตามความรุนแรงของ Log (เช่น error สีแดง, warn สีเหลือง)
            translateTime: "SYS:yyyy-mm-dd HH:MM:ss", // แปลงเวลาให้อยู่ใน Format อ่านง่ายตามเวลาเครื่อง
            ignore: "pid,hostname", // ซ่อน Process ID และ Hostname เพื่อลดความรกใน Terminal
          },
        }
      : undefined, // ใน Production ให้ปล่อยเป็น undefined เพื่อพ่น Log เป็น JSON เพียวๆ (เน้น Performance)
});
