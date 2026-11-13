# 05 — Login rate limiting: ชั้น IP + ชั้น email (OWASP ASVS)

**Status:** implemented (test ผ่าน 11/11)
**Depends on:** 03 (`ipRateLimit`, fake Redis ใน test)
**ADR:** `docs/adr/ADR-0001-realtime-crypto-price-caching.md` (ข้อ 5: ใช้ Upstash instance เดียวกัน)

## เหตุผล

OWASP ASVS เตือนไม่ให้พึ่ง IP-based rate limit อย่างเดียว เพราะหลายคนอาจใช้ IP ร่วมกัน (NAT/office WiFi) ต้องมีชั้นที่สองที่ไม่ขึ้นกับ IP

## Layer 1: IP (reuse `ipRateLimit` ของ ticket 03)

- ผูกกับ `/auth/login`, Redis key แยก namespace (`ratelimit:login-ip:<ip>`)
- นับทุก request (สำเร็จหรือไม่) — 10 ครั้ง / 15 นาที / IP

## Layer 2: email (ใหม่)

- Redis `incr` + `expire(..., "NX")` key ตาม identifier ที่ส่งมา (ปรับเป็นตัวพิมพ์เล็กและ trim) — ระบบ login รับ `identifier` ซึ่งเป็น email หรือ username
- นับเฉพาะ login ที่ล้มเหลว (เพิ่ม counter เฉพาะ branch `INVALID_CREDENTIALS`); login สำเร็จไม่นับ
- 5 ครั้งที่ล้มเหลว / 15 นาที / identifier; ครั้งที่ 6 ได้ 429 แม้รหัสถูก
- Redis ล่ม → fail-open + log warning

## แก้เพิ่ม

- อ่าน IP ไม่ได้ → fail-open (ทำไปแล้วใน ticket 03 ที่ middleware กลาง ได้ผลทั้ง login และ forgot-password)
- 429 ทุกชั้นใส่ header `Retry-After` (วินาที)

## ต้องเช็ค

- test เดิมของ `/auth/login`: ตรวจแล้ว ไม่มี test ใดใน `server/src/tests` เรียก `/auth/login` จึงไม่มีอะไรโดน rate limit ตัวเอง

## TDD

RED ก่อนทุกเคส ไฟล์ `server/src/tests/integration-tests/login-rate-limit.test.ts`
