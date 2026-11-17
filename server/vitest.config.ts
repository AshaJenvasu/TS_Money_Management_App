import { defineConfig } from "vitest/config";

export default defineConfig({
  envDir: "./",
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["src/tests/setup.ts"],
    // test ส่ง x-forwarded-for ทีละ 1 ค่า จำลอง proxy ที่เชื่อถือได้ 1 hop (test ที่ทดสอบ hop อื่นจะตั้งทับเอง)
    env: { TRUSTED_PROXY_HOPS: "1" },
  },
});
