// ค่า rate limit ต่อ IP ของแต่ละ endpoint ปรับได้ที่นี่ที่เดียว
export const RATE_LIMITS = {
  forgotPassword: {
    name: "forgot-password",
    maxRequests: 3,
    windowSeconds: 15 * 60,
  },
} as const;
