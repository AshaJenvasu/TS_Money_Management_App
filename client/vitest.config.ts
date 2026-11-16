import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// แยกจาก vite.config.ts เพื่อไม่ให้ TanStackRouterVite ทำงานตอนรัน test
export default defineConfig({
  plugins: [react()],
  test: { environment: "node" },
});
