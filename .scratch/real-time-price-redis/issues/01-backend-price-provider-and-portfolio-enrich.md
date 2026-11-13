# 01 — Backend: Upstash client + CoinGecko PriceProvider + enrich GET /portfolio

**Status:** ready-for-agent (รอยืนยัน seams ก่อนเขียน test)
**Depends on:** —
**Blocks:** 02, 03
**ADR:** `docs/adr/ADR-0001-realtime-crypto-price-caching.md`

## User Story

As a ผู้ใช้ที่มี investment wallet
I want เห็นมูลค่าปัจจุบันของ crypto asset ที่ถืออยู่ (ไม่ใช่แค่ avg cost ที่กรอกมือ)
So that รู้กำไร/ขาดทุนที่ยังไม่รับรู้ (unrealized P&L) แบบใกล้เคียง real-time

## Scope

- Upstash Redis client (HTTP REST) — ใช้ร่วมกับ ticket 03
- `PriceProvider` interface + CoinGecko implementation
- แก้ `PortfolioService.getPortfolio` (`server/src/services/portfolio.services.ts`) ให้ enrich แต่ละ holding
- ไม่เพิ่ม column ใน `assets` table (cache อยู่ที่ Redis เท่านั้น, TTL 1-5 นาที)

## Acceptance Criteria

- **AC1 Happy path:** holding เป็น crypto → `GET /portfolio` มี `current_price`, `current_value` (quantity × current_price), `unrealized_pnl`, `unrealized_pnl_percent`
- **AC2 Cache hit:** ราคาอยู่ใน cache และยังไม่หมด TTL → ตอบจาก cache ไม่ยิง CoinGecko ซ้ำ
- **AC3 Cache miss/expired:** ไม่มี cache หรือหมดอายุ → ยิง CoinGecko → cache ผลลัพธ์ใหม่ (TTL ใหม่) → ตอบกลับ
- **AC4 CoinGecko ล้ม/timeout และไม่มี cache เก่า:** ตอบ 200 (ไม่ใช่ 500), `current_price` เป็น `null`, มี `price_unavailable: true`
- **AC5 Stock (out of scope):** `current_price`/`unrealized_pnl` เป็น `null` ใช้ path เดียวกับ AC4

## TDD plan

เขียน test ของ `GET /portfolio` ก่อน (mock CoinGecko + mock Redis) ให้แดง แล้วเขียนโค้ดขั้นต่ำให้เขียว ทีละ AC (vertical slice): AC1 → AC2 → AC3 → AC4 → AC5

## Open decisions (ต้องปิดก่อนเริ่ม RED)

- seams ที่จะ test
- ชื่อ field: snake_case (ตาม AC) หรือ camelCase (ตาม response เดิม เช่น `avgCostPerUnit`)
- สกุลเงินของราคา (`vs_currency`) และวิธี map `Asset.symbol` → CoinGecko (ตอนนี้ `Asset` มีแค่ `symbol` VarChar(10))

## งานเพิ่มเล็กน้อย (ตกลงเมื่อ 2026-11-13, ทำหลัง ticket 04)

1. `asset.schema.ts`: จำกัด `symbol` ด้วย regex `^[A-Za-z0-9]{1,10}$` (ปิดช่องโหว่ symbol ที่มีเครื่องหมายจุลภาค)
2. `price.provider.ts`: cache ผล "ไม่เจอ" ด้วย TTL สั้น (~5 นาที) กันยิง CoinGecko ซ้ำเมื่อ id ไม่เจอ (เช่นเหรียญถูก delist)
