import { createFileRoute } from "@tanstack/react-router";
import { useWalletsQuery } from "../hooks/useWalletsQuery";
import { WalletCard } from "../components/wallets/WalletCard";
import { Wallet as WalletIcon } from "lucide-react";
import { useState } from "react";
import { FloatingAddTransactionButton } from "../components/transactions/FloatingAddTransactionButton";
import TransactionCreateDialog from "../components/transactions/TransactionCreateDialog";
import { WalletsScene } from "../components/wallets/WalletsScene";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { walletService } from "../services/wallet.services";

// แสดงรายการ Wallet ทั้งหมดของผู้ใช้
// eslint-disable-next-line react-refresh/only-export-components
function WalletsPage() {
  const { data: wallets, isPending, isError, refetch } = useWalletsQuery();

  // ควบคุมการเปิดและปิด Dialog เพิ่มธุรกรรม
  const [isCreateTransactionOpen, setIsCreateTransactionOpen] = useState(false);

  const queryClient = useQueryClient();

  // เก็บข้อมูลและสถานะของฟอร์มสร้างกระเป๋า
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [walletName, setWalletName] = useState("");
  const [validationError, setValidationError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // สร้างกระเป๋าและอัปเดตรายการหลังบันทึกสำเร็จ
  const createMutation = useMutation({
    mutationFn: () => walletService.createWallet(walletName.trim()),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["wallets"] });

      setIsCreateOpen(false);
      setWalletName("");
      setValidationError("");
      setErrorMessage("");
    },

    onError: (error: unknown) => {
      if (axios.isAxiosError<{ message: string }>(error)) {
        setErrorMessage(
          error.response?.data?.message || "สร้างกระเป๋าไม่สำเร็จ",
        );
        return;
      }

      setErrorMessage("เกิดข้อผิดพลาดที่ไม่คาดคิด");
    },
  });

  // ตรวจสอบชื่อก่อนส่งคำขอสร้างกระเป๋า
  const handleCreateWallet = () => {
    const name = walletName.trim();

    if (!name) {
      setValidationError("กรุณาระบุชื่อกระเป๋า");
      return;
    }

    if (name.length > 100) {
      setValidationError("ชื่อกระเป๋าต้องไม่เกิน 100 ตัวอักษร");
      return;
    }

    if ((wallets ?? []).length >= 4) {
      setErrorMessage("สร้างกระเป๋าได้สูงสุด 4 ใบ");
      return;
    }

    createMutation.mutate();
  };

  return (
    <section className="min-h-screen bg-[#E9EAF8] px-0 py-0 text-[#1F2A5C] sm:px-4 sm:py-4 lg:px-8">
      <div className="relative isolate mx-auto min-h-screen w-full max-w-6xl overflow-hidden bg-[#E3D9F6] px-4 pb-28 pt-5 sm:rounded-[32px] sm:px-6 lg:px-8">
        <WalletsScene className="-z-10" />
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#EAE5FF] text-[#7566C7]">
              <WalletIcon size={25} />
            </div>

            {/* แสดงหัวข้อและคำอธิบายของหน้ารวมกระเป๋าเงิน */}
            <header className="relative z-10 mb-8 pt-5">
              <div className="mb-5 flex items-center justify-between">
                <div className="rounded-full border border-white/70 bg-white/60 px-4 py-2 text-sm font-semibold text-[#7566C7] shadow-sm backdrop-blur">
                  My Money Space
                </div>

                <div className="flex size-11 items-center justify-center rounded-full border border-white/70 bg-white/60 text-[#7566C7] shadow-sm backdrop-blur">
                  <WalletIcon size={22} />
                </div>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-[#39365F] sm:text-4xl">
                กระเป๋าเงินของฉัน
              </h1>

              <p className="mt-2 max-w-sm text-sm leading-6 text-[#716D98] sm:text-base">
                ทุกเป้าหมายทางการเงิน เริ่มต้นได้จากกระเป๋าใบเล็ก ๆ ของเธอ
              </p>
            </header>
          </div>

          {/* สรุปจำนวนกระเป๋าเงินจากข้อมูลจริง */}
          {!isPending && !isError && (
            <div className="relative z-10 mb-6 flex items-center justify-between gap-4 rounded-3xl border border-white/70 bg-white/65 px-5 py-4 shadow-sm backdrop-blur-md">
              <div>
                <p className="text-sm font-medium text-[#716D98]">
                  กระเป๋าเงินทั้งหมด
                </p>
                <p className="mt-1 text-2xl font-bold text-[#39365F]">
                  {wallets.length}{" "}
                  <span className="text-base font-medium">ใบ</span>
                </p>
              </div>

              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAE5FF] text-[#7566C7]">
                <WalletIcon size={24} />
              </div>
            </div>
          )}
        </div>

        {isPending ? (
          <div className="relative z-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-3xl border border-white/70 bg-white/60 p-5 shadow-sm backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="size-12 animate-pulse rounded-2xl bg-[#DDD5F5]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 animate-pulse rounded-full bg-[#DDD5F5]" />
                    <div className="h-3 w-1/3 animate-pulse rounded-full bg-[#E9E3F8]" />
                  </div>
                </div>

                <div className="mt-6 h-7 w-1/2 animate-pulse rounded-full bg-[#DDD5F5]" />
                <div className="mt-3 h-3 w-3/4 animate-pulse rounded-full bg-[#E9E3F8]" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-red-200 bg-white p-6 text-center">
            <p className="font-medium text-error">
              โหลดรายการกระเป๋าเงินไม่สำเร็จ
            </p>
            <button
              type="button"
              className="btn btn-sm mt-4"
              onClick={() => void refetch()}
            >
              ลองอีกครั้ง
            </button>
          </div>
        ) : wallets.length === 0 ? (
          <div className="relative z-10 overflow-hidden rounded-[32px] border border-white/70 bg-white/65 px-6 py-12 text-center shadow-sm backdrop-blur-md sm:py-16">
            <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-[#E5E0FF] to-[#D9ECFA] text-[#7566C7] shadow-inner">
              <WalletIcon size={38} strokeWidth={1.7} />
            </div>

            <h2 className="text-xl font-bold text-[#39365F]">
              กระเป๋าใบแรกของเธออยู่ไหนเอ่ย?
            </h2>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#8986A8]">
              ยังไม่มีกระเป๋าเงินเลย ลองสร้างกระเป๋าใบแรกจากหน้า Dashboard
              แล้วกลับมาดูที่นี่ได้เลยนะ
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wallets.map((wallet) => (
              <WalletCard key={wallet.id} wallet={wallet} />
            ))}
          </div>
        )}
      </div>

      {/* ปุ่มลอยสำหรับเพิ่มธุรกรรม */}
      <FloatingAddTransactionButton
        onClick={() => setIsCreateTransactionOpen(true)}
      />

      {/* Dialog เพิ่มธุรกรรมที่เลือก Wallet ได้เอง */}
      {isCreateTransactionOpen && (
        <TransactionCreateDialog
          wallets={wallets ?? []}
          onClose={() => setIsCreateTransactionOpen(false)}
        />
      )}
    </section>
  );
}

export const Route = createFileRoute("/wallets")({
  component: WalletsPage,
});
