# 03 — Backend: per-IP rate limiting บน /auth/forgot-password

**Status:** implemented (test ผ่าน 4/4)
**Depends on:** 01 (เฉพาะ Upstash client)
**Parallel with:** 02
**ADR:** `docs/adr/ADR-0001-realtime-crypto-price-caching.md` (ข้อ 5)

## Scope

เพิ่ม rate limiting middleware ต่อ IP บน `/auth/forgot-password` โดยใช้ Upstash client ตัวเดียวกับ ticket 01 (คนละ business context กับ Portfolio, แชร์ infra เท่านั้น)

## Acceptance Criteria

- เริ่มที่ 3 ครั้ง / 15 นาที / IP (ปรับได้ตามการใช้งานจริง)
- เกินโควตา → ตอบ 429
- IP อื่นไม่ถูกนับรวม
- ค่า limit/window ตั้งผ่าน config ไม่ hard-code กระจายในโค้ด

## Open decisions

- ถ้า Upstash ล่ม: fail-open (ปล่อยผ่าน) หรือ fail-closed (บล็อก)
- วิธีอ่าน IP จริงหลัง Render proxy (`x-forwarded-for`)
