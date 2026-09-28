/* eslint-disable react-refresh/only-export-components */
import {
  createRootRoute,
  Link,
  Outlet,
  useNavigate,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "../stores/useAuthStore";
import { useEffect } from "react";
import { authService } from "../api/auth.services";
import { isAxiosError } from "axios";

// 1. Instance ของ TanStack Query
export const queryClient = new QueryClient();

// Component หลักสำหรับ Root
function RootLayout() {
  const { user, token, logout, setAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyUser = async () => {
      if (!token) return;

      try {
        const data = await authService.getProfile();

        setAuth(token, data.user);
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 401) {
          console.log("Token หมดอายุหรือไม่ถูกต้อง → Logout");
          logout();
        } else {
          console.error("VERIFY USER ERROR:", error);
        }
      }
    };

    verifyUser();
  }, [token, setAuth, logout]);

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  return (
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

          {/* ฝั่งขวา: เช็กสถานะการล็อกอิน */}
          {user || token ? (
            /* UI สำหรับผู้ใช้ที่ล็อกอินแล้ว */
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-[#BFD3F3]/25 bg-[#1E2A66]/60 px-3.5 py-1.5 text-xs font-['Mali']">
                {/* ไอคอนหัวคนสไตล์ SVG */}
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#5568E0] text-white">
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                <span className="font-semibold text-white">
                  {(user as { username?: string; email?: string })?.username ||
                    user?.email ||
                    "ผู้ใช้งาน"}
                </span>
              </div>

              {/* ปุ่ม Logout */}
              <button
                onClick={handleLogout}
                className="rounded-full bg-[#F0669A]/20 hover:bg-[#F0669A] border border-[#F0669A]/40 px-3.5 py-1.5 font-['Mali'] text-xs font-semibold text-[#FFB3CD] hover:text-white transition-all cursor-pointer"
              >
                ออกจากระบบ
              </button>
            </div>
          ) : (
            /* ปุ่มสลับ Login / Register ฝั่งขวา (เดิม) */
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
          )}
        </header>

        {/* ส่วนแสดงผลเนื้อหาของแต่ละหน้า */}
        <main className="w-full">
          <Outlet />
        </main>
      </div>
    </QueryClientProvider>
  );
}

// 2. Root Route หลัก
export const Route = createRootRoute({
  component: RootLayout,
});
