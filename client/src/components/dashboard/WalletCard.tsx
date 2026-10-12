import { Wallet as WalletIcon, CircleAlert } from "lucide-react";
import { useWalletBalanceQuery } from "../../hooks/useWalletBalanceQuery";
import type { Wallet } from "../../services/wallet.services";

interface WalletCardProps {
  wallet: Wallet;
}

// แสดงข้อมูลและยอดเงินของ Wallet แต่ละใบ
export function WalletCard({ wallet }: WalletCardProps) {
  const { data, isPending, isError } = useWalletBalanceQuery(wallet.id);

  return (
    <div className="card border border-white/80 bg-white/70 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      <div className="card-body gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-[#EAE5FF] text-[#7566C7]">
            <WalletIcon size={21} strokeWidth={1.8} />
          </div>

          <span className="badge badge-sm border-0 bg-[#F5E8F5] text-[#9B6598]">
            Wallet
          </span>
        </div>

        <div>
          <h2 className="truncate font-semibold text-[#39365F]">
            {wallet.name}
          </h2>

          {isPending ? (
            <div className="mt-2 flex items-center gap-2 text-sm text-[#8986A8]">
              <span className="loading loading-spinner loading-xs" />
              กำลังโหลด...
            </div>
          ) : isError ? (
            <p className="mt-2 flex items-center gap-1 text-sm text-error">
              <CircleAlert size={15} />
              โหลดไม่สำเร็จ
            </p>
          ) : (
            <p className="mt-2 truncate text-xl font-bold tracking-tight text-[#6356B8]">
              ฿
              {Number(data.balance).toLocaleString("th-TH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
