import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// 1. สร้าง Instance ของ TanStack Query ขึ้นมาจัดการ Cache ข้อมูล
export const queryClient = new QueryClient();

// 2. สร้าง Root Route สำหรับโครงสร้างหลัก
export const Route = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-base-200 text-base-content">
        {/* Navbar แถบเมนูด้านบนจาก DaisyUI */}
        <div className="navbar bg-base-100 shadow-md px-4">
          <div className="flex-1">
            <Link to="/" className="btn btn-ghost text-xl">
              💰 Money App
            </Link>
          </div>
          <div className="flex-none gap-2">
            <Link to="/login" className="btn btn-primary btn-sm">
              Login
            </Link>
            <Link to="/register" className="btn btn-outline btn-sm">
              Register
            </Link>
          </div>
        </div>

        {/* ส่วนแสดงผลเนื้อหาของแต่ละหน้าตาม Routing */}
        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </QueryClientProvider>
  ),
});
