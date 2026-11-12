# 02 — Frontend: แสดง current price / value / unrealized P&L ในหน้า Investment

**Status:** blocked (รอ ticket 01)
**Depends on:** 01
**Parallel with:** 03
**ADR:** `docs/adr/ADR-0001-realtime-crypto-price-caching.md`

## Scope

แก้หน้า Investment (`client/src/routes/investment.tsx` และ components ใน `client/src/components/investment/`, `client/src/types/investment.ts`, `client/src/hooks/usePortfolioQuery.ts`) ให้แสดง:

- `current_price`, `current_value`, `unrealized_pnl`, `unrealized_pnl_percent`
- สีเขียว (กำไร) / แดง (ขาดทุน) ตามเครื่องหมายของ P&L
- loading state ระหว่างรอราคา
- state "ราคาไม่พร้อมใช้งาน" เมื่อ `price_unavailable: true` (รวมกรณี stock)

## Acceptance Criteria

- AC1: holding crypto ที่มีราคา → โชว์ราคาปัจจุบัน, มูลค่า, P&L พร้อมสีตามเครื่องหมาย
- AC4/AC5: `price_unavailable: true` → โชว์ "ราคาไม่พร้อมใช้งาน" แทนตัวเลข และหน้าไม่พัง
- มี loading state ระหว่าง fetch
