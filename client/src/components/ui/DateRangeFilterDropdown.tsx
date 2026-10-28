import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronDown } from "lucide-react";
import {
  getDateRangeForPreset,
  DATE_RANGE_PRESET_LABELS,
  type DateRange,
  type DateRangePresetKey,
} from "../../utils/dateRangePresets";

// ลำดับปุ่ม preset ที่จะโชว์ใน panel
const PRESET_ORDER: DateRangePresetKey[] = [
  "thisMonth",
  "lastMonth",
  "thisYear",
  "lastYear",
];

const PANEL_WIDTH = 224; // ความกว้างสูงสุดที่อยากได้บนจอใหญ่ (ตรงกับ w-56)
const PANEL_MARGIN = 8; // ระยะห่างขั้นต่ำจากขอบจอ กันล้นซ้าย/ขวา/บน/ล่าง
const PANEL_GAP = 8; // ระยะห่างระหว่างปุ่ม trigger กับตัว panel
const MAX_PANEL_HEIGHT = 400; // เพดานความสูงสูงสุด ไม่ให้สูงเกินจำเป็นแม้จอใหญ่มากๆ

interface PanelPosition {
  left: number;
  width: number;
  maxHeight: number;
  top?: number;
  bottom?: number;
}

interface DateRangeFilterDropdownProps {
  defaultFilter?: DateRangePresetKey;
  onChange: (
    range: DateRange,
    filterKey: DateRangePresetKey | "custom",
  ) => void;
}

// Dropdown ตัวกรองช่วงวันที่ใช้ร่วมกันได้หลายหน้า เรนเดอร์ panel ผ่าน portal ไปที่ document.body
// เพื่อไม่ให้โดน overflow-hidden ของหน้าตัดทิ้ง (เหมือน pattern ที่ TransactionCreateDialog ใช้อยู่แล้ว)
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

  // เปิด/ปิด panel ต้องคุมเองแล้ว เพราะ portal ทำให้ panel หลุดจาก DOM tree เดิม
  const [isOpen, setIsOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState<PanelPosition>({
    left: 0,
    width: PANEL_WIDTH,
    maxHeight: MAX_PANEL_HEIGHT,
    top: 0,
  });
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // คำนวณตำแหน่ง/ความกว้าง/ความสูงของ panel จากพื้นที่ว่างจริงรอบปุ่ม trigger
  // เลือกเปิดด้านที่มีที่ว่างเยอะกว่าระหว่างบน-ล่าง แล้วจำกัดความสูงให้พอดีพื้นที่นั้นเป๊ะๆ
  const computePanelPosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();

    const width = Math.min(PANEL_WIDTH, window.innerWidth - PANEL_MARGIN * 2);
    const maxLeft = window.innerWidth - width - PANEL_MARGIN;
    const left = Math.min(maxLeft, Math.max(PANEL_MARGIN, rect.right - width));

    const spaceBelow =
      window.innerHeight - rect.bottom - PANEL_GAP - PANEL_MARGIN;
    const spaceAbove = rect.top - PANEL_GAP - PANEL_MARGIN;
    const openUpward = spaceBelow < spaceAbove;
    const availableSpace = openUpward ? spaceAbove : spaceBelow;

    setPanelPosition({
      left,
      width,
      maxHeight: Math.max(120, Math.min(MAX_PANEL_HEIGHT, availableSpace)),
      top: openUpward ? undefined : rect.bottom + PANEL_GAP,
      bottom: openUpward
        ? window.innerHeight - rect.top + PANEL_GAP
        : undefined,
    });
  };

  // ใช้ useLayoutEffect แทน useEffect เพราะต้องคำนวณตำแหน่งให้เสร็จ "ก่อน" เบราว์เซอร์วาดภาพ
  // ป้องกันไม่ให้เห็น panel โผล่ที่ตำแหน่ง default (มุมซ้ายบนจอ) แวบนึงก่อนขยับไปตำแหน่งจริง
  useLayoutEffect(() => {
    if (!isOpen) return;
    computePanelPosition();
  }, [isOpen]);

  // คำนวณตำแหน่งใหม่ตอน resize จอ (เช่น หมุนมือถือ) แทนที่จะปิด panel ทิ้งเฉยๆ
  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("resize", computePanelPosition);
    return () => window.removeEventListener("resize", computePanelPosition);
  }, [isOpen]);

  // ปิด panel เมื่อคลิกข้างนอกทั้งปุ่มและตัว panel เอง
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // ปิด panel เมื่อ scroll หน้า กันตำแหน่งเพี้ยนเพราะ panel ใช้ position: fixed
  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = () => setIsOpen(false);
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [isOpen]);

  const handleSelectPreset = (preset: DateRangePresetKey) => {
    const nextRange = getDateRangeForPreset(preset);
    setDateRange(nextRange);
    setActiveFilter(preset);
    setIsOpen(false);
    onChange(nextRange, preset);
  };

  const isCustomRangeInvalid =
    !customFrom || !customTo || customFrom > customTo;

  const handleApplyCustomRange = () => {
    if (isCustomRangeInvalid) return;
    const nextRange = { from: customFrom, to: customTo };
    setDateRange(nextRange);
    setActiveFilter("custom");
    setIsOpen(false);
    onChange(nextRange, "custom");
  };

  // ข้อความที่โชว์บนปุ่ม trigger
  const filterButtonLabel =
    activeFilter === "custom"
      ? `${dateRange.from} ถึง ${dateRange.to}`
      : DATE_RANGE_PRESET_LABELS[activeFilter];

  return (
    <>
      <div
        ref={triggerRef}
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-1 rounded-full border border-[#7566C7]/30 bg-white px-3 py-2 text-xs font-semibold text-[#7566C7] shadow-sm"
      >
        <Calendar size={14} />
        {filterButtonLabel}
        <ChevronDown size={14} />
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: "fixed",
              left: panelPosition.left,
              width: panelPosition.width,
              maxHeight: panelPosition.maxHeight,
              top: panelPosition.top,
              bottom: panelPosition.bottom,
            }}
            className="z-[9999] overflow-y-auto rounded-2xl bg-white p-2.5 shadow-xl"
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

            <div className="divider my-1.5" />

            <p className="mb-1.5 text-xs font-semibold text-[#8986A8]">
              กำหนดช่วงเอง
            </p>
            <div className="flex flex-col gap-1.5">
              <input
                type="date"
                value={customFrom}
                max={customTo || undefined}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="input input-sm input-bordered w-full border-[#D8D5F0] bg-white text-[#1F2A5C] [color-scheme:light]"
              />
              <span className="text-center text-xs text-[#8986A8]">ถึง</span>
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
              className="btn btn-sm btn-block mt-1.5 border-none bg-[#7566C7] text-white disabled:opacity-40"
            >
              ใช้ช่วงนี้
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
