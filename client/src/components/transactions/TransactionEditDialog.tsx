import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Pencil } from "lucide-react";
import axios from "axios";
import type { Transaction } from "../../services/transaction.services";
import type { Wallet } from "../../services/wallet.services";
import { useUpdateTransactionMutation } from "../../hooks/useTransactionsQuery";

interface TransactionEditDialogProps {
  transaction: Transaction;
  wallets: Wallet[];
  onClose: () => void;
}

export default function TransactionEditDialog({
  transaction,
  wallets,
  onClose,
}: TransactionEditDialogProps) {
  // เตรียมข้อมูลเริ่มต้นจากรายการที่เลือก
  const [type, setType] = useState<"income" | "expense">(
    transaction.transaction_type,
  );
  const [amount, setAmount] = useState(transaction.amount);
  const [note, setNote] = useState(transaction.note ?? "");
  const [date, setDate] = useState(transaction.transaction_date.slice(0, 10));
  const [errorMessage, setErrorMessage] = useState("");

  const updateMutation = useUpdateTransactionMutation();

  // ล้าง Error เมื่อผู้ใช้แก้ไขข้อมูล
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setErrorMessage("");
  }, [type, amount, note, date]);

  const handleSubmit = () => {
    const numericAmount = Number(amount);

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

    // ส่งวันที่แบบ UTC เพื่อป้องกันวันที่คลาดเคลื่อนจาก timezone
    updateMutation.mutate(
      {
        walletId: transaction.wallet_id,
        transactionId: transaction.id,
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
                "แก้ไขรายการไม่สำเร็จ กรุณาลองอีกครั้ง",
            );
            return;
          }

          setErrorMessage("เกิดข้อผิดพลาดที่ไม่คาดคิด");
        },
      },
    );
  };

  const currentWallet = wallets.find(
    (wallet) => wallet.id === transaction.wallet_id,
  );

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-transaction-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#EAE5FF] text-[#7566C7]">
            <Pencil size={24} />
          </div>
          <div>
            <h2
              id="edit-transaction-title"
              className="text-xl font-bold text-[#39365F]"
            >
              แก้ไขรายการธุรกรรม
            </h2>
            <p className="text-sm text-gray-500">
              เปลี่ยนรายละเอียดรายรับหรือรายจ่าย
            </p>
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
              จำนวนเงิน
            </span>
            <input
              className="input input-bordered w-full bg-white text-[#39365F]"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
              disabled={updateMutation.isPending}
            />
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
              disabled={updateMutation.isPending}
            >
              <option value="income">รายรับ</option>
              <option value="expense">รายจ่าย</option>
            </select>
          </label>

          <label className="form-control">
            <span className="label-text mb-2 font-medium text-[#39365F]">
              Wallet
            </span>
            <input
              className="input input-bordered w-full bg-gray-100 text-[#39365F]"
              type="text"
              value={currentWallet?.name ?? "ไม่พบ Wallet"}
              readOnly
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
              disabled={updateMutation.isPending}
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
              disabled={updateMutation.isPending}
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
              disabled={updateMutation.isPending}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="btn border-0 bg-[#7566C7] text-white hover:bg-[#6356B8]"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending
                ? "กำลังบันทึก..."
                : "บันทึกการเปลี่ยนแปลง"}
            </button>
          </div>
        </form>
      </div>

      <button
        type="button"
        className="absolute inset-0 -z-10 cursor-default"
        aria-label="ปิดหน้าต่างแก้ไข"
        onClick={() => {
          if (!updateMutation.isPending) onClose();
        }}
      />
    </div>,
    document.body,
  );
}
