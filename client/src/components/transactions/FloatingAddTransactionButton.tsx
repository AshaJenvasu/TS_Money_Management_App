import { Plus } from "lucide-react";

interface FloatingAddTransactionButtonProps {
  onClick: () => void;
}

// แสดงปุ่มเพิ่มธุรกรรมแบบลอยที่ใช้ร่วมกันได้ทุกหน้า
export function FloatingAddTransactionButton({
  onClick,
}: FloatingAddTransactionButtonProps) {
  return (
    <button
      type="button"
      aria-label="เพิ่มธุรกรรม"
      title="เพิ่มธุรกรรม"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-[#7566C7] text-white shadow-lg transition hover:scale-105 hover:bg-[#6356B8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7566C7]/40 sm:bottom-8 sm:right-8"
    >
      <Plus size={28} />
    </button>
  );
}
