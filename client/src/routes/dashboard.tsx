import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "../stores/useAuthStore";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    const { token } = useAuthStore.getState();

    if (!token) {
      throw redirect({
        to: "/login",
      });
    }
  },

  component: DashboardPage,
});

// eslint-disable-next-line react-refresh/only-export-components
function DashboardPage() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold">📊 Dashboard (Mockup)</h1>
      <p className="mt-2 text-base-content/70">หน้านี้พร้อมใช้งานแล้ว!</p>
    </div>
  );
}
