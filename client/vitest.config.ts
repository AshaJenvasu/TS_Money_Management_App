import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// แยกจาก vite.config.ts เพื่อไม่ให้ TanStackRouterVite ทำงานตอนรัน test
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    // e2e/ เป็นของ Playwright (npm run e2e) ห้าม vitest หยิบไปรัน
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
