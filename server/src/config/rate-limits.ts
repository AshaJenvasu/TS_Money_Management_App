// ค่า rate limit ของแต่ละ endpoint ปรับได้ที่นี่ที่เดียว
export const RATE_LIMITS = {
  // ต่อ IP นับทุก request
  forgotPassword: {
    name: "forgot-password",
    message: "ขอ reset password บ่อยเกินไป กรุณาลองใหม่ภายหลัง",
    maxRequests: 3,
    windowSeconds: 15 * 60,
  },
  // ต่อ IP นับทุก request (สำเร็จหรือไม่) ใช้ร่วมกับ loginEmail เป็น 2 ชั้นตาม OWASP ASVS
  loginIp: {
    name: "login-ip",
    message: "พยายามเข้าสู่ระบบบ่อยเกินไป กรุณาลองใหม่ภายหลัง",
    maxRequests: 10,
    windowSeconds: 15 * 60,
  },
  // ต่อ identifier (email/username) นับเฉพาะ login ที่ล้มเหลว เข้มกว่า IP เพราะเจาะจงบัญชีเดียว
  loginEmail: {
    name: "login-email",
    message: "ล้มเหลวหลายครั้งเกินไป กรุณาลองใหม่ภายหลัง",
    maxFailures: 5,
    windowSeconds: 15 * 60,
  },
} as const;
