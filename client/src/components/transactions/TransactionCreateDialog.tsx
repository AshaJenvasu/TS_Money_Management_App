import { useState } from "react";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";
import axios from "axios";
import type { Wallet } from "../../services/wallet.services";
import { useCreateTransactionMutation } from "../../hooks/useTransactionsQuery";

interface TransactionCreateDialogProps {
  wallets: Wallet[];
  onClose: () => void;
}

export default function TransactionCreateDialog({
  wallets,
  onClose,
}: TransactionCreateDialogProps) {
  const [walletId, setWalletId] = useState(wallets[0]?.id ?? "");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [errorMessage, setErrorMessage] = useState("");

  const createMutation = useCreateTransactionMutation();

  const handleSubmit = () => {
    const numericAmount = Number(amount);

    if (!walletId) {
      setErrorMessage("กรุณาเลือก Wallet");
      return;
    }

    if (
      !amount.trim() ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setErrorMessage("กรุณากรอกจำนวนเงินที่มากกว่า 0");
      return;
    }

    if (!date || Number.isNaN(Date.parse(`${date}T00:00:00.000Z`))) {
      setErrorMessage("กรุณาเลือกวันที่ให้ถูกต้อง");
      return;
    }

    // ส่งข้อมูลที่ตรวจสอบแล้วไปยัง API
    createMutation.mutate(
      {
        walletId,
        payload: {
          transaction_type: type,
          amount: String(numericAmount),
          note: note.trim() || null,
          transaction_date: `${date}T00:00:00.000Z`,
        },
      },
      {
        onSuccess: onClose,
        onError: (error: unknown) => {
          if (axios.isAxiosError<{ message?: string }>(error)) {
            setErrorMessage(
              error.response?.data?.message ??
                "สร้างรายการไม่สำเร็จ กรุณาลองอีกครั้ง",
            );
            return;
          }

          setErrorMessage("เกิดข้อผิดพลาดที่ไม่คาดคิด");
        },
      },
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-transaction-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#EAE5FF] text-[#7566C7]">
            <Plus size={24} />
          </div>
          <div>
            <h2
              id="create-transaction-title"
              className="text-xl font-bold text-[#39365F]"
            >
              เพิ่มธุรกรรม
            </h2>
            <p className="text-sm text-gray-500">บันทึกรายรับหรือรายจ่ายใหม่</p>
          </div>
        </div>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
        >
          <label className="form-control">
            <span className="label-text mb-2 font-medium text-[#39365F]">
              Wallet
            </span>
            <select
              className="select select-bordered w-full bg-white text-[#39365F]"
              value={walletId}
              onChange={(event) => setWalletId(event.target.value)}
              required
              disabled={createMutation.isPending}
            >
              <option value="" disabled>
                เลือก Wallet
              </option>
              {wallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.name}
                </option>
              ))}
            </select>
          </label>

          <label className="form-control">
            <span className="label-text mb-2 font-medium text-[#39365F]">
              ประเภทธุรกรรม
            </span>
            <select
              className="select select-bordered w-full bg-white text-[#39365F]"
              value={type}
              onChange={(event) =>
                setType(event.target.value as "income" | "expense")
              }
              disabled={createMutation.isPending}
            >
              <option value="income">รายรับ</option>
              <option value="expense">รายจ่าย</option>
            </select>
          </label>

          <label className="form-control">
            <span className="label-text mb-2 font-medium text-[#39365F]">
              จำนวนเงิน
            </span>
            <input
              className="input input-bordered w-full bg-white text-[#39365F]"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
              required
              disabled={createMutation.isPending}
            />
          </label>

          <label className="form-control">
            <span className="label-text mb-2 font-medium text-[#39365F]">
              หมายเหตุ
            </span>
            <input
              className="input input-bordered w-full bg-white text-[#39365F]"
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={500}
              placeholder="เพิ่มหมายเหตุ (ไม่บังคับ)"
              disabled={createMutation.isPending}
            />
          </label>

          <label className="form-control">
            <span className="label-text mb-2 font-medium text-[#39365F]">
              วันที่ทำธุรกรรม
            </span>
            <input
              className="input input-bordered w-full bg-white text-[#39365F]"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
              disabled={createMutation.isPending}
            />
          </label>

          {errorMessage && (
            <p role="alert" className="text-sm text-error">
              {errorMessage}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="btn"
              onClick={onClose}
              disabled={createMutation.isPending}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="btn border-0 bg-[#7566C7] text-white hover:bg-[#6356B8]"
              disabled={createMutation.isPending || wallets.length === 0}
            >
              {createMutation.isPending ? "กำลังบันทึก..." : "บันทึกธุรกรรม"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
