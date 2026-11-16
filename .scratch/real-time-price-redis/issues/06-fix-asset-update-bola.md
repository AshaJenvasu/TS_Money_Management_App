# 06 — แก้ PUT /assets/:id: ไม่เช็ค ownership (BOLA) + กฎ "ห้ามแก้ asset ที่มีประวัติ" ไม่มีจริงฝั่ง backend

> **⚠️ ticket นี้เขียนย้อนหลังหลังงานเสร็จและ commit แล้ว (commit `70fe2dc`)** ไม่ใช่ spec ล่วงหน้าแบบ ticket 01–05 เนื้อหาด้านล่างบันทึกสิ่งที่เกิดขึ้นจริง ไม่ใช่แผนที่จะทำ

**Status:** เสร็จและ commit แล้ว (`70fe2dc`) test ของ ticket นี้ผ่าน 5/5
**Depends on:** 04 (มี field `coingecko_id` และ flow สร้าง asset)
**Blocks:** ไม่มี (แยก scope จากการเพิ่มช่องแก้ `coingecko_id` ซึ่งยังรอ confirm)

## ที่มา

พบโดยบังเอิญระหว่างตรวจ `client/src/components/investment/AssetEditDialog.tsx` เพื่อตอบคำถามว่า client รองรับการแก้ `coingecko_id` หรือไม่ (คำตอบ: ไม่รองรับ แก้ได้แค่ `name`) ระหว่างไล่ดู endpoint ที่ฟอร์มเรียกก็เจอ 2 บั๊กใน backend

## บั๊กที่เจอ

1. **ไม่เช็ค ownership (BOLA / OWASP API1)**
   - `AssetService.updateAsset(id, userId, data)` รับ `userId` แต่ไม่ได้ใช้
   - `prisma.asset.update({ where: { id } })` ใช้แค่ `id` → user ที่ล็อกอินอยู่เปลี่ยนชื่อ asset ของคนอื่นได้ถ้ารู้ id
   - `deleteAsset` เช็คเจ้าของอยู่แล้วผ่าน `findByIdAndUserId` เฉพาะ update ที่ตก
2. **กฎ "ห้ามแก้ asset ที่มีประวัติ" มีแค่ฝั่ง UI**
   - controller รอรับ error `CANNOT_UPDATE_ASSET_WITH_HOLDING` แต่ service ไม่เคย throw
   - `AssetEditDialog` ปิดปุ่มเมื่อ `buyCount + sellCount > 0` แต่ยิง API ตรงๆ ข้ามได้
   - description ของ route และ comment ใน client service บอกว่า backend ปฏิเสธให้ ซึ่งไม่เป็นความจริง

## การแก้

1. **Ownership**
   - หา asset ด้วย `id + userId` ไม่เจอหรือไม่ใช่เจ้าของ → throw `ASSET_NOT_FOUND` (404 `{"message":"Asset not found"}`) เหมือนที่ `deleteAsset` ตอบ จึงไม่ leak ว่า asset นั้นมีอยู่จริง
   - ตัว update ใช้ `where: { id, userId }` เป็นชั้นป้องกันสุดท้าย ถ้าไม่ตรงจะ throw P2025 ซึ่ง service map เป็น `ASSET_NOT_FOUND` เหมือนเดิม
2. **Business rule ฝั่ง backend**
   - นิยาม "มีประวัติ" = มี `PortfolioTransaction` อย่างน้อย 1 รายการของ asset นั้น (นับแม้ขายหมดแล้ว `quantity = 0`) ตรงกับ `buyCount + sellCount > 0` ที่ `AssetEditDialog` และ `AssetDeleteDialog` ใช้
   - มีประวัติ → throw `CANNOT_UPDATE_ASSET_WITH_HOLDING` → controller ตอบ 400
3. **กัน race**
   - หา asset + นับ transaction + update ทำใน `prisma.$transaction` เดียว (`AssetRepository.updateNameIfNoTransactions`)
   - `$transaction` เปล่าๆ ที่ READ COMMITTED ไม่พอ จึงล็อกแถว asset ด้วย `SELECT ... FOR UPDATE` ก่อนนับ
   - การ insert transaction ต้องถือ lock `FOR KEY SHARE` บนแถว asset จึงถูกบล็อกจนกว่า transaction ฝั่งแก้ชื่อจะ commit
4. **Wording**
   - เปลี่ยนข้อความตอบกลับจาก "Cannot update asset that has active holding" เป็น "Cannot update asset that has transaction history"
   - string `CANNOT_UPDATE_ASSET_WITH_HOLDING` ไม่เปลี่ยน เพราะเป็นแค่ error ภายในระหว่าง service กับ controller ไม่เคยส่งออกทาง wire และ frontend ไม่ได้ match string นี้ (ดูแค่ HTTP 400)
   - แก้ comment/description ที่ไม่ตรงความจริงใน `asset.controllers.ts`, `client/src/services/asset.services.ts`, `AssetEditDialog.tsx`

## Test

ไฟล์ `server/src/tests/integration-tests/asset-update.test.ts` (5 เคส) ทำแบบ TDD RED ก่อน

| เคส | ตรวจอะไร |
| --- | --- |
| A: user B แก้ asset ของ user A | 404 `Asset not found` เหมือน DELETE, ชื่อใน DB ไม่เปลี่ยน |
| B1: เจ้าของแก้ asset ที่ยังถืออยู่ (ซื้อ 10 ขาย 4) | 400, ชื่อไม่เปลี่ยน |
| B2: เจ้าของแก้ asset ที่ขายหมดแล้ว (ซื้อ 10 ขาย 10) | 400, ชื่อไม่เปลี่ยน (พิสูจน์ว่านิยามคือ transaction history ไม่ใช่ `quantity > 0`) |
| C: เจ้าของแก้ asset ที่ไม่มีประวัติ | 200 ตามเดิม (regression) |
| Race: transaction ที่ insert ค้างไว้ยังไม่ commit ระหว่างแก้ชื่อ | 400, ชื่อไม่เปลี่ยน |

- **ตอน RED:** A และ B (ทั้ง 2 variant) แดง (ได้ 200), C เขียว ก่อนเขียน fix
- **Mutation test ของ race test:** ถอด `FOR UPDATE` ออกชั่วคราว → race test แดง (ได้ 200 แทน 400) ใส่กลับ → เขียว ยืนยันว่า test จับ race จริงและ lock มีผล
- **ทั้งชุด server (`--no-file-parallelism`):** 82/88 ผ่าน ที่ fail คือ 6 ข้อใน `wallets.test.ts` (integration 3, unit 3) ซึ่งเป็นของเดิมและไม่เกี่ยวกับ asset; `tsc --noEmit` ไม่มี error ใหม่จากไฟล์ asset

## ช่องว่าง / สิ่งที่ยังไม่ได้ทำ

- ไม่มี test ที่ยิงเข้า path P2025 ของ `where: { id, userId }` โดยตรง เพราะ query ล็อกแถวด้วย `id + userId` ดักก่อนเสมอ ชั้นนี้เป็น defense-in-depth ที่เข้าไม่ถึงในทางปกติ
- ชื่อ error `CANNOT_UPDATE_ASSET_WITH_HOLDING` ยังใช้คำว่า "holding" ทั้งที่นิยามจริงคือ transaction history เปลี่ยนได้อิสระภายหลัง (เป็นแค่ identifier ภายใน)
- การแก้ `coingecko_id` / `symbol` หลังสร้าง asset ยังไม่มี (เลือกเหรียญผิดตอนสร้างแล้วต้องลบสร้างใหม่ ซึ่งลบแล้วประวัติหาย) เป็นคนละเรื่อง รอ confirm scope แยก

## Process improvement ที่เกิดจากเรื่องนี้

บั๊ก BOLA นี้หลุดมาถึงการตรวจแบบบังเอิญ เพราะไม่มีขั้นตอนเช็คความปลอดภัยของ endpoint ระหว่างทำ ticket จึงเพิ่มขั้น **OWASP API Security Top 10 check (2023)** เข้า `personal-sdlc` skill ให้เช็คทุก ticket ก่อนปิด โดยเทียบเฉพาะข้อที่เกี่ยวกับ endpoint นั้นจริง (API1 BOLA, API3 Property Level Authorization, API4 Resource Consumption, API5 Function Level Authorization) แทนการรอไปเจอทีเดียวตอน security review ท้ายฟีเจอร์
