import { defineConfig } from "vitest/config";

export default defineConfig({
  envDir: "./",
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["src/tests/setup.ts"],
    // secret จำลองระหว่าง Vercel กับ server: test ที่ต้องการให้ IP limit ทำงานต้องส่ง header นี้ด้วย (ดู helpers/proxy-headers.ts)
    env: { INTERNAL_PROXY_SECRET: "test-internal-proxy-secret" },
  },
});
