import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite(), // ใส่ไว้ก่อน react()
    react(),
  ],
  server: {
    // ตอน dev ให้ request ที่ขึ้นต้นด้วย /api ถูกส่งไป backend local แทน
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
