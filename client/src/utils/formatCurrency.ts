// จัดรูปแบบจำนวนเงินตามมาตรฐานภาษาไทย
export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
