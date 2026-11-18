import { defineConfig, devices } from "@playwright/test";

// E2E รันกับ dev server local (ไม่ใช่ production): backend (Bun, :3000) + frontend (Vite, :5173)
// Vite proxy /api ไป backend อยู่แล้ว (vite.config.ts) จึงยิงผ่าน baseURL ของ frontend ทั้ง UI และ API
// ต้องมี Postgres (docker compose up -d postgres) และ server/.env ที่ตั้ง UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
// (หรือส่งเป็น env ของ process ก็ได้ — process.env มาก่อนไฟล์)
// Safety: test จะไม่รันถ้า DATABASE_URL ไม่ใช่ host local เว้นแต่ตั้ง E2E_ALLOW_SHARED_DATA=1 (ดู e2e/investment-price.spec.ts)
export default defineConfig({
  testDir: "./e2e",
  // ใช้ DB เดียวกับ dev จึงรันทีละ test
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 20_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "bun run src/index.ts",
      cwd: "../server",
      url: "http://localhost:3000/api/v1/health/server",
      // ถ้า dev server เปิดอยู่แล้วให้ใช้ตัวเดิม
      // ข้อควรระวัง: ตัวนับ rate limit ของ server (login ต่อ IP/identifier ฯลฯ) ค้างข้ามรอบ จึงรันซ้ำถี่ๆ อาจได้ 429
      // test จะแจ้ง 429 พร้อม Retry-After ให้ชัด; แก้โดยรอหรือ restart backend ไม่ต้องแก้ rate limit ฝั่ง server
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: "npx vite --port 5173 --strictPort",
      url: "http://localhost:5173",
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});
