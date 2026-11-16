import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PnlText } from "../components/investment/PnlText";
import type { AssetView } from "../types/investment";
import { summarizeMarket } from "./portfolioSummary";

const GREEN = "#1E8E5A";
const RED = "#CF3D6B";
const GRAY = "#5C6899";

// สร้าง AssetView จากข้อมูลที่ client parse จาก API (string -> number เหมือน investment.tsx)
function makeView(
  id: number,
  quantity: string,
  avgCost: string,
  server: { currentValue: string; unrealizedPnl: string } | null,
): AssetView {
  return {
    asset: { id } as unknown as AssetView["asset"],
    quantity: Number(quantity),
    avgCostPerUnit: Number(avgCost),
    // เหมือน investment.tsx: คูณแบบ float ฝั่ง client
    cost: Number(quantity) * Number(avgCost),
    buyCount: 1,
    sellCount: 0,
    lastTransactionDate: null,
    currentPrice: null,
    currentValue: server ? Number(server.currentValue) : null,
    unrealizedPnl: server ? Number(server.unrealizedPnl) : null,
    unrealizedPnlPercent: null,
    priceUnavailable: server === null,
  };
}

describe("summarizeMarket", () => {
  it("เท่าทุน (qty 0.1, avg 3) ปนกับ asset อื่น -> P&L รวม 0 ขึ้น ฿0.00 สีเทา ไม่ใช่ -฿0.00 สีแดง", () => {
    const views = [
      // bug เดิม: 0.1 * 3 = 0.30000000000000004 แต่ server ส่ง value "0.3" pnl "0"
      makeView(1, "0.1", "3", { currentValue: "0.3", unrealizedPnl: "0" }),
      // เท่าทุนอีกตัว: 0.2 * 3 = 0.6000000000000001
      makeView(2, "0.2", "3", { currentValue: "0.6", unrealizedPnl: "0" }),
      // ไม่มีราคา ต้องไม่ถูกนับ
      makeView(3, "1", "999", null),
    ];

    // สูตรเก่า (มูลค่ารวม - ต้นทุน float) ต้องผิดจริงใน scenario นี้
    const oldFormulaPnl =
      views[0].currentValue! + views[1].currentValue! - (views[0].cost + views[1].cost);
    expect(oldFormulaPnl).toBeLessThan(0);

    const summary = summarizeMarket(views);
    expect(summary).not.toBeNull();
    expect(summary!.totalUnrealizedPnl).toBe(0);
    expect(Object.is(summary!.totalUnrealizedPnl, -0)).toBe(false);
    expect(summary!.unpricedCount).toBe(1);

    const html = renderToStaticMarkup(
      <PnlText pnl={summary!.totalUnrealizedPnl} />,
    );
    expect(html).toContain("฿0.00");
    expect(html).not.toContain("-฿");
    expect(html).toContain(GRAY);
    expect(html).not.toContain(RED);
    expect(html).not.toContain(GREEN);
  });

  it("noise จาก parse Decimal string ถูกปัดทิ้ง", () => {
    const views = [
      makeView(1, "1", "1", { currentValue: "0.3", unrealizedPnl: "0.1" }),
      makeView(2, "1", "1", { currentValue: "0.6", unrealizedPnl: "0.2" }),
      makeView(3, "1", "1", { currentValue: "0.9", unrealizedPnl: "-0.3" }),
    ];
    // 0.1 + 0.2 + -0.3 = 5.55e-17 ถ้าไม่ปัด
    expect(0.1 + 0.2 + -0.3).toBeGreaterThan(0);
    expect(summarizeMarket(views)!.totalUnrealizedPnl).toBe(0);
  });

  it("กำไร/ขาดทุนจริงยังขึ้นสีเขียว/แดงตามเดิม", () => {
    const profit = summarizeMarket([
      makeView(1, "1", "100", { currentValue: "150.5", unrealizedPnl: "50.5" }),
    ])!;
    expect(profit.totalUnrealizedPnl).toBe(50.5);
    expect(renderToStaticMarkup(<PnlText pnl={profit.totalUnrealizedPnl} />)).toContain(GREEN);

    const loss = summarizeMarket([
      makeView(1, "1", "100", { currentValue: "80", unrealizedPnl: "-20" }),
    ])!;
    const lossHtml = renderToStaticMarkup(<PnlText pnl={loss.totalUnrealizedPnl} />);
    expect(lossHtml).toContain(RED);
    expect(lossHtml).toContain("-฿20.00");
  });

  it("ไม่รวม asset ที่ไม่มีราคา และนับจำนวนถูก", () => {
    const summary = summarizeMarket([
      makeView(1, "1", "1000", { currentValue: "1200", unrealizedPnl: "200" }),
      makeView(2, "1", "500", { currentValue: "450", unrealizedPnl: "-50" }),
      makeView(3, "1", "300", null),
      makeView(4, "1", "200", null),
    ]);
    expect(summary).toEqual({
      totalCurrentValue: 1650,
      totalUnrealizedPnl: 150,
      unpricedCount: 2,
    });
  });

  it("ไม่มี asset ไหนมีราคาเลย -> null", () => {
    expect(summarizeMarket([makeView(1, "1", "1", null)])).toBeNull();
  });
});
