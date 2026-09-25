import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

// eslint-disable-next-line react-refresh/only-export-components
function DashboardPage() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold">📊 Dashboard (Mockup)</h1>
      <p className="mt-2 text-base-content/70">หน้านี้พร้อมใช้งานแล้วค่ะ!</p>
    </div>
  );
}
