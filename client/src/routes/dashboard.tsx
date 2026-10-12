/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "../stores/useAuthStore";
import { useWalletsQuery } from "../hooks/useWalletsQuery";

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
  const { data: wallets, isPending, isError, error } = useWalletsQuery();

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
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold">💰 My Wallets</h1>

      <div className="grid gap-4">
        {wallets.map((wallet) => (
          <div key={wallet.id} className="rounded-xl border p-4">
            <h2 className="font-semibold">{wallet.name}</h2>
            <p className="text-sm opacity-60">Wallet ID: {wallet.id}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
