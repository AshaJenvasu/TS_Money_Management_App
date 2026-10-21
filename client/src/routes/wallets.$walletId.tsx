import { createFileRoute, useNavigate } from "@tanstack/react-router";

// หน้ารายละเอียดกระเป๋าเงิน (placeholder รอต่อ UI จริงใน Phase 2)
function WalletDetailPage() {
  const { walletId } = Route.useParams();
  const navigate = useNavigate();

  return (
    <section className="min-h-screen bg-[#E9EAF8] p-6 text-[#1F2A5C]">
      <button
        type="button"
        onClick={() => navigate({ to: "/wallets" })}
        className="mb-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#7566C7] shadow-sm"
      >
        ← กลับไปหน้ากระเป๋าเงิน
      </button>

      <h1 className="text-2xl font-bold text-[#39365F]">
        Wallet Detail (placeholder)
      </h1>
      <p className="mt-2 text-[#716D98]">Wallet ID: {walletId}</p>
    </section>
  );
}

export const Route = createFileRoute("/wallets/$walletId")({
  component: WalletDetailPage,
});
