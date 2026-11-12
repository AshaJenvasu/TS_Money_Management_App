# ADR-0001: Real-time Crypto Price Caching ผ่าน Upstash Redis

**Status:** Accepted

## Context

ต้องการแสดง "มูลค่าปัจจุบัน" ของ portfolio แทนการใช้แค่ `avg_cost_per_unit` ที่กรอกมือ แต่การยิง external price API ทุกครั้งที่ user เปิดหน้าเสี่ยงโดน rate limit และช้า

## Decision

1. **Cache-only ไม่เก็บลง Postgres** — ราคาที่ fetch มาเก็บไว้ที่ Redis เท่านั้น (TTL 1-5 นาที) ไม่เพิ่ม column ใน `assets` table ADR เดิม "No real-time asset price fetching" ยังไม่ถูกยกเลิก แค่เสริมว่าตอนนี้มี ephemeral display-only cache
2. **Upstash Redis (HTTP REST API) แทน TCP Redis มาตรฐาน** — Render free tier บล็อก outbound TCP port ที่ไม่ใช่ web-standard (ยืนยันแล้วจากเคส SMTP port ตอนทำ email) Upstash ต่อผ่าน HTTPS จึงไม่เจอปัญหาเดียวกัน
3. **Crypto เท่านั้นในรอบนี้ ผ่าน CoinGecko** (ฟรี ไม่ต้อง API key) — stock ตัดออกจาก scope เพราะ API ฟรีมี rate limit ต่ำเกินจะใช้งานจริง จะแยกเป็น Epic ถัดไป
4. **On-demand cache-aside pattern** — เช็ค Redis ก่อนเสมอ, miss/expired ค่อยยิง CoinGecko แล้ว cache ทับ ไม่ทำ scheduled background job (ยังไม่คุ้มความซับซ้อนสำหรับ traffic ระดับนี้)
5. **Reuse Upstash instance เดียวกัน** สำหรับ per-IP rate limiting บน `/auth/forgot-password` ด้วย (คนละ business concern จาก Auth Context แต่ใช้ infra ร่วมกันได้)
