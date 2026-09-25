import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import "./index.css";

// ดึง Route Tree ที่ TanStack Router Plugin แอบสร้างให้อัตโนมัติ
import { routeTree } from "./routeTree.gen";

// สร้างตัวแปร Router Instance
const router = createRouter({ routeTree });

// Register type ของ router เพื่อความ Type-Safe เวลาใช้ Link หรือ Navigate
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
