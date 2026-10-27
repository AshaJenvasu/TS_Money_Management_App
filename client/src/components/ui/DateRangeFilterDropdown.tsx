import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import {
  getDateRangeForPreset,
  DATE_RANGE_PRESET_LABELS,
  type DateRange,
  type DateRangePresetKey,
} from "../../utils/dateRangePresets";

// ลำดับปุ่ม preset ที่จะโชว์ใน dropdown
const PRESET_ORDER: DateRangePresetKey[] = [
  "thisMonth",
  "lastMonth",
  "thisYear",
  "lastYear",
];

interface DateRangeFilterDropdownProps {
  defaultFilter?: DateRangePresetKey;
  onChange: (
    range: DateRange,
    filterKey: DateRangePresetKey | "custom",
  ) => void;
}

// Dropdown ตัวกรองช่วงวันที่ใช้ร่วมกันได้หลายหน้า จัดการ state ภายในตัวเองทั้งหมด หน้าแม่รับแค่ผลลัพธ์ผ่าน onChange
export default function DateRangeFilterDropdown({
  defaultFilter = "thisMonth",
  onChange,
}: DateRangeFilterDropdownProps) {
  const [activeFilter, setActiveFilter] = useState<
    DateRangePresetKey | "custom"
  >(defaultFilter);
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    getDateRangeForPreset(defaultFilter),
  );
  const [customFrom, setCustomFrom] = useState(dateRange.from);
  const [customTo, setCustomTo] = useState(dateRange.to);

  // ปิด dropdown ด้วยการ blur element ที่ focus อยู่ (DaisyUI dropdown เปิด/ปิดตาม focus-within)
  const closeDateFilterDropdown = () => {
    (document.activeElement as HTMLElement | null)?.blur();
  };

  const handleSelectPreset = (preset: DateRangePresetKey) => {
    const nextRange = getDateRangeForPreset(preset);
    setDateRange(nextRange);
    setActiveFilter(preset);
    closeDateFilterDropdown();
    onChange(nextRange, preset);
  };

  const isCustomRangeInvalid =
    !customFrom || !customTo || customFrom > customTo;

  const handleApplyCustomRange = () => {
    if (isCustomRangeInvalid) return;
    const nextRange = { from: customFrom, to: customTo };
    setDateRange(nextRange);
    setActiveFilter("custom");
    closeDateFilterDropdown();
    onChange(nextRange, "custom");
  };

  // ข้อความที่โชว์บนปุ่ม dropdown
  const filterButtonLabel =
    activeFilter === "custom"
      ? `${dateRange.from} ถึง ${dateRange.to}`
      : DATE_RANGE_PRESET_LABELS[activeFilter];

  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="flex items-center gap-1 rounded-full border border-[#7566C7]/30 bg-white px-3 py-2 text-xs font-semibold text-[#7566C7] shadow-sm"
      >
        <Calendar size={14} />
        {filterButtonLabel}
        <ChevronDown size={14} />
      </div>
      <div
        tabIndex={0}
        className="dropdown-content z-10 mt-2 w-72 rounded-2xl bg-white p-3 shadow-xl"
      >
        <ul className="menu menu-sm gap-1 p-0">
          {PRESET_ORDER.map((preset) => (
            <li key={preset}>
              <button
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={
                  activeFilter === preset
                    ? "active bg-[#7566C7]/10 text-[#7566C7]"
                    : ""
                }
              >
                {DATE_RANGE_PRESET_LABELS[preset]}
              </button>
            </li>
          ))}
        </ul>

        <div className="divider my-2" />

        <p className="mb-2 text-xs font-semibold text-[#8986A8]">
          กำหนดช่วงเอง
        </p>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customFrom}
            max={customTo || undefined}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="input input-sm input-bordered w-full border-[#D8D5F0] bg-white text-[#1F2A5C] [color-scheme:light]"
          />
          <span className="text-[#8986A8]">-</span>
          <input
            type="date"
            value={customTo}
            min={customFrom || undefined}
            onChange={(e) => setCustomTo(e.target.value)}
            className="input input-sm input-bordered w-full border-[#D8D5F0] bg-white text-[#1F2A5C] [color-scheme:light]"
          />
        </div>
        <button
          type="button"
          disabled={isCustomRangeInvalid}
          onClick={handleApplyCustomRange}
          className="btn btn-sm btn-block mt-2 border-none bg-[#7566C7] text-white disabled:opacity-40"
        >
          ใช้ช่วงนี้
        </button>
      </div>
    </div>
  );
}
