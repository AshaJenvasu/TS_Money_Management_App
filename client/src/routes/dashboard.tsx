/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "../stores/useAuthStore";
import { useWalletsQuery } from "../hooks/useWalletsQuery";
import { useTransactionsQuery } from "../hooks/useTransactionsQuery";
import { WalletCard } from "../components/dashboard/WalletCard";
import { PortfolioCard } from "../components/dashboard/PortfolioCard";
import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { walletService } from "../services/wallet.services";
import { Eye, EyeOff, WalletCards, Plus, PieChart } from "lucide-react";
import { DashboardScene } from "../components/dashboard/DashboardScene";
import { DashboardMascot } from "../components/dashboard/DashboardMascot";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    const { token } = useAuthStore.getState();

    if (!token) {
      throw redirect({ to: "/login" });
    }
  },
  component: DashboardPage,
});

// แสดงรายการ Wallet และสถานะของ API
function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  const { data: wallets, isPending, isError, error } = useWalletsQuery();

  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  // ดึงยอดเงินของแต่ละ Wallet
  const balanceQueries = useQueries({
    queries: (wallets ?? []).map((wallet) => ({
      queryKey: ["wallets", wallet.id, "balance"],
      queryFn: () => walletService.getWalletBalance(wallet.id),
    })),
  });

  // คํานวณยอดเงินทั้งหมด
  const totalBalance = balanceQueries.reduce(
    (total, query) => total + Number(query.data?.balance ?? 0),
    0,
  );

  // สร้างรายการ Wallet
  const walletAllocations = (wallets ?? []).map((wallet, index) => {
    const balance = Number(balanceQueries[index]?.data?.balance ?? 0);

    return {
      id: wallet.id,
      name: wallet.name,
      balance,
      percentage: totalBalance > 0 ? (balance / totalBalance) * 100 : 0,
    };
  });

  // ตรวจสอบสถานะการโหลด
  const isBalancePending = balanceQueries.some((query) => query.isPending);

  // ดึงรายการ Transaction
  const transactionQueries = useTransactionsQuery(
    wallets?.map((wallet) => wallet.id) ?? [],
  );

  // ดึง 5 รายการ Transaction ล่าสุด
  const recentTransactions = transactionQueries
    .flatMap((query) => query.data ?? [])
    .sort(
      (a, b) =>
        new Date(b.transaction_date).getTime() -
        new Date(a.transaction_date).getTime(),
    )
    .slice(0, 5);

  // คํานวณยอดเงินทั้งหมด
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

  if (isPending) {
    return <div className="p-8">กำลังโหลด Wallet...</div>;
  }

  if (isError) {
    return (
      <div className="p-8 text-error">
        โหลด Wallet ไม่สำเร็จ: {error.message}
      </div>
    );
  }

  if (wallets.length === 0) {
    return <div className="p-8">ยังไม่มี Wallet 💰</div>;
  }

  return (
    <div className="min-h-screen bg-[#E9EAF8] px-0 py-0 sm:py-3">
      {/* กรอบหลักของ Dashboard */}
      <main className="relative isolate mx-auto min-h-screen w-full max-w-[480px] overflow-hidden rounded-none bg-[#E3D9F6] px-5 pb-10 pt-5 shadow-xl sm:min-h-[800px] sm:rounded-[32px]">
        <DashboardScene />
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.25em] text-[#7775A8]">
              PERSONAL FINANCE
            </p>
            <h1 className="text-2xl font-extrabold tracking-wide text-[#1F2A5C]">
              MONEY APP
            </h1>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-3 py-2 shadow-sm">
            <span className="text-lg">🌸</span>
            <span className="text-sm font-semibold text-[#39365F]">
              {user?.username ?? "User"}
            </span>
          </div>
        </header>

        {/* Greeting */}
        <section className="mt-8">
          <p className="text-sm font-medium text-[#7775A8]">
            YOUR FINANCIAL SPACE
          </p>

          <div className="mt-1 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold leading-tight text-[#252650]">
                สวัสดีจ้า {user?.username ?? "User"} 👋
              </h2>
              <p className="mt-2 text-sm text-[#68678F]">
                วันนี้มาดูแลการเงินกันนะ
              </p>
            </div>

            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-amber-100 text-3xl shadow-sm">
              ☀️
            </div>
          </div>
        </section>

        {/* Total Balance Card */}
        <section className="relative mt-7 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#7775E8] via-[#A18AE8] to-[#F0A9CF] p-6 text-white shadow-lg shadow-purple-200/60">
          <div className="absolute -right-8 -top-10 size-36 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 right-16 size-28 rounded-full bg-white/10" />
          <div className="absolute right-22 top-6 z-10">
            <DashboardMascot />
          </div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white/85">
                ยอดเงินรวมทั้งหมด
              </p>

              <button
                type="button"
                className="btn btn-ghost btn-circle btn-sm text-white hover:bg-white/20"
                onClick={() => setIsBalanceVisible((visible) => !visible)}
                aria-label={isBalanceVisible ? "ซ่อนยอดเงิน" : "แสดงยอดเงิน"}
              >
                {isBalanceVisible ? (
                  <Eye size={20} strokeWidth={1.8} />
                ) : (
                  <EyeOff size={20} strokeWidth={1.8} />
                )}
              </button>
            </div>

            <div className="mt-3 text-3xl font-extrabold tracking-tight">
              {isBalancePending
                ? "กำลังโหลด..."
                : isBalanceVisible
                  ? `฿${formatCurrency(totalBalance)}`
                  : "฿ •••••••"}
            </div>

            <p className="mt-2 text-xs text-white/80">
              รวมยอดเงินจากทุก Wallet
            </p>

            <div className="mt-6 flex items-center justify-between border-t border-white/25 pt-4">
              <span className="text-sm text-white/85">จำนวน Wallet</span>
              <span className="font-bold">{wallets.length} ใบ</span>
            </div>
          </div>
        </section>

        {/* Wallet Allocation */}
        <section className="mt-5 rounded-[28px] border border-white/70 bg-white/65 p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-[#E9E3FF] text-[#7566C7]">
              <PieChart size={21} />
            </div>

            <div>
              <h2 className="font-bold text-[#39365F]">สัดส่วนเงินของฉัน</h2>
              <p className="text-xs text-[#8986A8]">
                เงินของคุณกระจายอยู่ที่ไหนบ้าง
              </p>
            </div>
          </div>

          {/* Single stacked progress bar */}
          <div className="flex h-4 w-full overflow-hidden rounded-full bg-[#E9E6F4]">
            {walletAllocations.map((wallet, index) => {
              const colors = [
                "bg-[#7566C7]",
                "bg-[#F08CB8]",
                "bg-[#70B8D8]",
                "bg-[#E9B96E]",
                "bg-[#7DBFA3]",
              ];

              return (
                wallet.percentage > 0 && (
                  <div
                    key={wallet.id}
                    className={`${colors[index % colors.length]} transition-all duration-500`}
                    style={{ width: `${wallet.percentage}%` }}
                    title={`${wallet.name}: ${wallet.percentage.toFixed(1)}%`}
                  />
                )
              );
            })}
          </div>

          {/* Wallet legend */}
          <div className="mt-4 flex flex-col gap-3">
            {walletAllocations.map((wallet, index) => {
              const colors = [
                "bg-[#7566C7]",
                "bg-[#F08CB8]",
                "bg-[#70B8D8]",
                "bg-[#E9B96E]",
                "bg-[#7DBFA3]",
              ];

              return (
                <div
                  key={wallet.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`size-3 shrink-0 rounded-full ${
                        colors[index % colors.length]
                      }`}
                    />
                    <span className="truncate text-sm font-medium text-[#39365F]">
                      {wallet.name}
                    </span>
                  </div>

                  <span className="shrink-0 text-sm font-bold text-[#7566C7]">
                    {wallet.percentage.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Wallet Cards จาก API จริง */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-white/70 text-[#7566C7] shadow-sm">
                <WalletCards size={22} strokeWidth={1.8} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#39365F]">
                  กระเป๋าเงินของฉัน
                </h2>
                <p className="text-xs text-[#8986A8]">
                  จัดการเงินในแต่ละกระเป๋า
                </p>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-sm rounded-full border-0 bg-[#7566C7] px-4 text-white shadow-sm hover:bg-[#6356B8]"
              onClick={() => {
                // TODO: เชื่อมไปหน้า Create Wallet
              }}
            >
              <Plus size={16} />
              เพิ่มกระเป๋า
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {wallets.map((wallet) => (
              <WalletCard key={wallet.id} wallet={wallet} />
            ))}
          </div>
        </section>

        {/* Portfolio Section */}
        <section className="mt-5">
          <PortfolioCard />
        </section>

        {/* Recent Transactions */}
        <section className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#39365F]">รายการล่าสุด</h2>
              <p className="text-xs text-[#8986A8]">
                ความเคลื่อนไหวทางการเงินของคุณ
              </p>
            </div>

            <button
              type="button"
              className="text-sm font-semibold text-[#7566C7]"
              onClick={() => {
                // TODO: เชื่อมไปหน้ารายการ Transactions ทั้งหมด
              }}
            >
              ดูทั้งหมด →
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {recentTransactions.length === 0 ? (
              <div className="rounded-2xl bg-white/65 p-5 text-center text-sm text-[#8986A8]">
                ยังไม่มีรายการธุรกรรม
              </div>
            ) : (
              recentTransactions.map((transaction) => {
                const wallet = wallets.find(
                  (item) => item.id === transaction.wallet_id,
                );

                const isIncome = transaction.transaction_type === "income";

                const date = new Date(transaction.transaction_date);
                const isToday =
                  date.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                          isIncome
                            ? "bg-[#E2F5E9] text-[#399568]"
                            : "bg-[#FCE7EF] text-[#D85D8B]"
                        }`}
                      >
                        {isIncome ? "+" : "−"}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#39365F]">
                          {transaction.note || "รายการธุรกรรม"}
                        </p>
                        <p className="mt-1 text-xs text-[#8986A8]">
                          {wallet?.name ?? "Wallet"} ·{" "}
                          {isToday
                            ? "วันนี้"
                            : date.toLocaleDateString("th-TH", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                        </p>
                      </div>
                    </div>

                    <p
                      className={`shrink-0 text-sm font-bold ${
                        isIncome ? "text-[#399568]" : "text-[#D85D8B]"
                      }`}
                    >
                      {isIncome ? "+" : "−"}฿
                      {formatCurrency(Number(transaction.amount))}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
/*🧠 ทำไมถึงเขียนแบบนี้?
- wallets.map() วนสร้าง Card สำหรับ Wallet ทุกใบ
- wallet={wallet} ส่งข้อมูล Wallet แต่ละใบเข้าไปให้ WalletCard
- key={wallet.id} ช่วยให้ React ระบุ Card แต่ละใบได้ถูกต้อง
- WalletCard จะเรียก useWalletBalanceQuery(wallet.id) ของตัวเอง ทำให้แต่ละใบดึงยอดเงินแยกกัน */
