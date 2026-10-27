// คำนวณช่วงวันที่ (YYYY-MM-DD) สำหรับ quick preset ของตัวกรองธุรกรรม

export type DateRangePresetKey =
  "thisMonth" | "lastMonth" | "thisYear" | "lastYear";

export interface DateRange {
  from: string;
  to: string;
}

// แปลง Date เป็น YYYY-MM-DD ตามเวลา local ของเครื่อง (ไม่ใช้ toISOString เพราะมันแปลงเป็น UTC ก่อน อาจเลื่อนวันผิดได้ถ้า timezone ไม่ตรง)
function toDateOnlyString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// คำนวณวันแรก/วันสุดท้ายของช่วงที่เลือก โดยใช้ trick "day: 0" ของ Date
// เช่น new Date(2026, 10, 0) จะได้วันสุดท้ายของเดือน 9 (ตุลาคม) อัตโนมัติ ไม่ต้องมานับว่าเดือนมี 28/30/31 วัน
export function getDateRangeForPreset(preset: DateRangePresetKey): DateRange {
  const now = new Date();

  switch (preset) {
    case "thisMonth": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from: toDateOnlyString(from), to: toDateOnlyString(to) };
    }
    case "lastMonth": {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: toDateOnlyString(from), to: toDateOnlyString(to) };
    }
    case "thisYear": {
      const from = new Date(now.getFullYear(), 0, 1);
      const to = new Date(now.getFullYear(), 11, 31);
      return { from: toDateOnlyString(from), to: toDateOnlyString(to) };
    }
    case "lastYear": {
      const from = new Date(now.getFullYear() - 1, 0, 1);
      const to = new Date(now.getFullYear() - 1, 11, 31);
      return { from: toDateOnlyString(from), to: toDateOnlyString(to) };
    }
  }
}

// ป้ายชื่อภาษาไทยของแต่ละ preset ไว้โชว์บนปุ่ม/dropdown
export const DATE_RANGE_PRESET_LABELS: Record<DateRangePresetKey, string> = {
  thisMonth: "เดือนนี้",
  lastMonth: "เดือนที่แล้ว",
  thisYear: "ปีนี้",
  lastYear: "ปีที่แล้ว",
};
