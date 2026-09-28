import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// 1. Instance ของ TanStack Query
export const queryClient = new QueryClient();

// 2. Root Route หลัก
export const Route = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-[#141A36] text-white">
        {/* Navbar สไตล์อนิเมะ เข้าธีม Money App */}
        <header className="sticky top-0 z-50 flex h-[60px] w-full items-center justify-between border-b border-[#BFD3F3]/15 bg-[#141A36] px-7">
          {/* โลโก้ฝั่งซ้าย */}
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <span className="text-xl">🗻</span>
            <span className="font-['Caveat',_'Mali',_cursive] text-2xl font-bold tracking-wide text-white">
              MONEY APP
            </span>
          </Link>

          {/* ปุ่มสลับ Login / Register ฝั่งขวา */}
          <nav className="flex items-center gap-1 rounded-full border border-[#BFD3F3]/25 bg-[#1E2A66]/60 p-1">
            <Link
              to="/login"
              activeProps={{
                className:
                  "bg-[#5568E0] text-white shadow-[0_2px_10px_rgba(85,104,224,0.5)]",
              }}
              inactiveProps={{
                className: "bg-transparent text-[#A9B8EA]",
              }}
              className="rounded-full px-4 py-1.5 font-['Mali'] text-xs font-semibold no-underline transition-all"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              to="/register"
              activeProps={{
                className:
                  "bg-[#F0669A] text-white shadow-[0_2px_10px_rgba(240,102,154,0.5)]",
              }}
              inactiveProps={{
                className: "bg-transparent text-[#A9B8EA]",
              }}
              className="rounded-full px-4 py-1.5 font-['Mali'] text-xs font-semibold no-underline transition-all"
            >
              สมัครสมาชิก
            </Link>
          </nav>
        </header>

        {/* ส่วนแสดงผลเนื้อหาของแต่ละหน้า */}
        <main className="w-full">
          <Outlet />
        </main>
      </div>
    </QueryClientProvider>
  ),
});
