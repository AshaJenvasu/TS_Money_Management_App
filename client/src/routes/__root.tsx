/* eslint-disable react-refresh/only-export-components */
import {
  createRootRoute,
  Link,
  Outlet,
  useNavigate,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "../stores/useAuthStore";
import { useEffect, useState } from "react";
import { authService } from "../api/auth.services";
import { isAxiosError } from "axios";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Menu, X } from "lucide-react";

// 1. Instance ของ TanStack Query
export const queryClient = new QueryClient();

// Component หลักสำหรับ Root
function RootLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, token, logout, setAuth } = useAuthStore();
  const navigate = useNavigate();

  // ตรวจสอบการเข้าสู่ระบบ
  useEffect(() => {
    const verifyUser = async () => {
      if (!token) return;

      try {
        const data = await authService.getProfile();

        if (data.user) {
          setAuth(token, data.user);
        }
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

  useEffect(() => {
    if (token || user) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [token, user, navigate]);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout ERROR:", error);
    } finally {
      logout();
      navigate({ to: "/login" });
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-[#141A36] text-white">
        {/* Navbar สไตล์อนิเมะ เข้าธีม Money App */}

        <header className="sticky top-0 z-50 w-full border-b border-[#BFD3F3]/15 bg-[#141A36]">
          {/* Navbar */}
          <div className="flex h-[60px] items-center justify-between gap-3 px-3 sm:px-5 lg:px-7">
            {/* Logo */}
            <Link
              to={token || user ? "/dashboard" : "/login"}
              onClick={() => setIsMenuOpen(false)}
              className="flex shrink-0 items-center gap-2 no-underline"
            >
              <span className="text-xl">🗻</span>
              <span className="font-['Caveat',_'Mali',_cursive] text-xl font-bold tracking-wide text-white sm:text-2xl">
                MONEY APP
              </span>
            </Link>

            {/* Desktop Navigation */}
            {user || token ? (
              <div className="hidden items-center gap-3 md:flex">
                <nav className="flex items-center gap-2">
                  <Link
                    to="/dashboard"
                    activeProps={{
                      className: "bg-[#5568E0] text-white",
                    }}
                    inactiveProps={{
                      className:
                        "border border-[#5568E0]/50 text-[#BFD3F3] hover:bg-[#5568E0]/20",
                    }}
                    className="rounded-full px-4 py-2 text-sm font-semibold text-white no-underline transition hover:bg-[#6879F0]"
                  >
                    Dashboard
                  </Link>

                  <Link
                    to="/wallets"
                    activeProps={{
                      className: "bg-[#5568E0] text-white",
                    }}
                    inactiveProps={{
                      className:
                        "border border-[#5568E0]/50 text-[#BFD3F3] hover:bg-[#5568E0]/20",
                    }}
                    className="rounded-full px-4 py-2 text-sm font-semibold no-underline transition"
                  >
                    Wallets
                  </Link>

                  <button
                    onClick={() => alert("ยังไม่ได้ทำนะจ้ะ")}
                    className="cursor-pointer rounded-full border border-[#5568E0]/50 px-4 py-2 text-sm font-semibold text-[#BFD3F3] transition hover:bg-[#5568E0]/20"
                  >
                    Investment
                  </button>
                </nav>

                <div className="flex items-center gap-2 rounded-full border border-[#BFD3F3]/25 bg-[#1E2A66]/60 px-3.5 py-1.5 text-xs font-['Mali']">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#5568E0] text-white">
                    <svg
                      className="h-3.5 w-3.5 fill-current"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                  <span className="max-w-[150px] truncate font-semibold text-white">
                    {(user as { username?: string; email?: string })
                      ?.username ||
                      (user as { email?: string })?.email ||
                      "ผู้ใช้งาน"}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="cursor-pointer rounded-full border border-[#F0669A]/40 bg-[#F0669A]/20 px-3.5 py-1.5 text-xs font-semibold text-[#FFB3CD] transition hover:bg-[#F0669A] hover:text-white"
                >
                  ออกจากระบบ
                </button>
              </div>
            ) : (
              <nav className="hidden items-center gap-1 rounded-full border border-[#BFD3F3]/25 bg-[#1E2A66]/60 p-1 md:flex">
                <Link
                  to="/login"
                  activeProps={{
                    className:
                      "bg-[#5568E0] text-white shadow-[0_2px_10px_rgba(85,104,224,0.5)]",
                  }}
                  inactiveProps={{ className: "bg-transparent text-[#A9B8EA]" }}
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
                  inactiveProps={{ className: "bg-transparent text-[#A9B8EA]" }}
                  className="rounded-full px-4 py-1.5 font-['Mali'] text-xs font-semibold no-underline transition-all"
                >
                  สมัครสมาชิก
                </Link>
              </nav>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              aria-label={isMenuOpen ? "ปิดเมนู" : "เปิดเมนู"}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#BFD3F3]/20 text-[#BFD3F3] transition hover:bg-[#5568E0]/20 md:hidden"
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {/* Mobile Dropdown */}
          {isMenuOpen && (
            <div className="border-t border-[#BFD3F3]/15 bg-[#141A36] px-4 py-4 md:hidden">
              {user || token ? (
                <div className="flex flex-col gap-2">
                  <div className="mb-2 flex items-center gap-3 rounded-xl border border-[#BFD3F3]/20 bg-[#1E2A66]/60 p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#5568E0]">
                      <svg
                        className="h-4 w-4 fill-current text-white"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                    <span className="break-all text-sm font-semibold text-white">
                      {(user as { username?: string; email?: string })
                        ?.username ||
                        (user as { email?: string })?.email ||
                        "ผู้ใช้งาน"}
                    </span>
                  </div>

                  <Link
                    to="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-xl px-4 py-3 text-sm font-semibold text-white no-underline"
                    activeProps={{
                      className: "bg-[#5568E0] text-white",
                    }}
                    inactiveProps={{
                      className:
                        "border border-[#5568E0]/50 text-[#BFD3F3] hover:bg-[#5568E0]/20",
                    }}
                  >
                    Dashboard
                  </Link>

                  <Link
                    to="/wallets"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-xl border border-[#5568E0]/50 px-4 py-3 text-left text-sm font-semibold text-[#BFD3F3] no-underline transition hover:bg-[#5568E0]/20"
                    activeProps={{
                      className: "bg-[#5568E0] text-white",
                    }}
                    inactiveProps={{
                      className:
                        "border border-[#5568E0]/50 text-[#BFD3F3] hover:bg-[#5568E0]/20",
                    }}
                  >
                    Wallets
                  </Link>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      alert("ยังไม่ได้ทำนะจ้ะ");
                    }}
                    className="rounded-xl border border-[#5568E0]/50 px-4 py-3 text-left text-sm font-semibold text-[#BFD3F3]"
                  >
                    Investment
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      void handleLogout();
                    }}
                    className="mt-2 rounded-xl border border-[#F0669A]/40 bg-[#F0669A]/15 px-4 py-3 text-left text-sm font-semibold text-[#FFB3CD] transition hover:bg-[#F0669A] hover:text-white"
                  >
                    ออกจากระบบ
                  </button>
                </div>
              ) : (
                <nav className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-xl border border-[#5568E0]/50 px-4 py-3 text-sm font-semibold text-[#BFD3F3] no-underline"
                  >
                    เข้าสู่ระบบ
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-xl bg-[#F0669A] px-4 py-3 text-sm font-semibold text-white no-underline"
                  >
                    สมัครสมาชิก
                  </Link>
                </nav>
              )}
            </div>
          )}
        </header>

        {/* ส่วนแสดงผลเนื้อหาของแต่ละหน้า */}
        <main className="w-full">
          <Outlet />
        </main>
      </div>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

// 2. Root Route หลัก
export const Route = createRootRoute({
  component: RootLayout,
});
