# ADR-0002: ดึงราคาจริงจาก CoinGecko ผ่าน Redis cache (supersede "No real-time asset price fetching")

**Status:** Accepted
**Supersedes:** การตัดสินใจเดิม "No real-time asset price fetching — prices entered manually at buy/sell time"
**Amends:** ADR-0001 (ข้อ 1 ที่บอกว่า ADR เดิมยังไม่ถูกยกเลิก และข้อ 5 เรื่องใช้ Upstash instance เดียวทุก environment)

> หมายเหตุ: ไฟล์ ADR เดิมของการตัดสินใจ "No real-time asset price fetching" ไม่มีอยู่ใน repo นี้ (ไม่อยู่ใน `docs/adr/` และไม่พบใน git history) มีแค่ข้อความอ้างถึงใน ADR-0001 ข้อ 1 ADR นี้จึงบันทึกการยกเลิกการตัดสินใจนั้นโดยตรง

## Context

การตัดสินใจเดิมคือไม่ดึงราคาสินทรัพย์แบบ real-time: user กรอกราคาเองตอนซื้อ/ขาย ทำให้ระบบรู้แค่ต้นทุน (`avg_cost_per_unit`) ไม่รู้มูลค่าปัจจุบันหรือกำไร/ขาดทุนที่ยังไม่รับรู้ ADR-0001 เพิ่ม cache ราคาแบบ display-only แต่ยังระบุว่าการตัดสินใจเดิมไม่ถูกยกเลิก ตอนนี้ฟีเจอร์ถูกสร้างและทดสอบครบแล้ว (backend + หน้า Investment + E2E) ข้อความ "ไม่ดึงราคา real-time" จึงไม่ตรงกับระบบจริงอีกต่อไป

## Decision

1. **ดึงราคาปัจจุบันของ crypto จริงจาก CoinGecko** (`/coins/markets`, สกุล THB) แล้วแสดงใน `GET /api/v1/portfolio` เป็น `currentPrice`, `currentValue`, `unrealizedPnl`, `unrealizedPnlPercent`, `priceUnavailable` และในหน้า Investment ของ client
2. **ราคาที่ user กรอกตอนซื้อ/ขายยังเป็นต้นทุน** — ไม่ถูกแทนที่ด้วยราคาตลาด ราคาตลาดใช้แสดงมูลค่าปัจจุบันเท่านั้น และไม่ถูกเก็บลง Postgres (ยังเป็น cache-only ตาม ADR-0001)
3. **Cache-aside ผ่าน Redis**: key `price:thb:<coingeckoId>` TTL 120 วินาที, ผลที่ "ไม่เจอ" cache ไว้ 300 วินาที (`not-found`) ถ้าดึงราคาไม่ได้ ระบบยังตอบ portfolio ได้และตั้ง `priceUnavailable`
4. **Redis แยกตาม environment (ผ่าน REST API เหมือนกัน):**
   - **production:** Upstash Redis (HTTP REST) ตาม ADR-0001
   - **dev/test ในเครื่อง:** Redis local (`redis/redis-stack-server:6.2.6-v6`) คู่กับ `hiett/serverless-redis-http` (SRH) ใน `server/docker-compose.yml` ให้ `@upstash/redis` คุยผ่าน REST ได้เหมือน Upstash โค้ด server ไม่ต้องแก้ เปลี่ยนแค่ `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` ใน `server/.env`
   - SRH bind แค่ loopback (`127.0.0.1:8079:80`) และ Redis ไม่ publish port ออก host
5. **E2E ไม่ยอมรันกับ DB/Redis ที่ไม่ใช่ local:** guard ใน `client/e2e/investment-price.spec.ts` ตรวจ host ของ `DATABASE_URL` และ `UPSTASH_REDIS_REST_URL` เว้นแต่ตั้ง `E2E_ALLOW_SHARED_DATA=1`

## Why (เหตุผลที่เปลี่ยน)

- **ได้ค่าที่ผู้ใช้ต้องการ:** เห็นมูลค่าและกำไร/ขาดทุนปัจจุบัน ซึ่งราคาที่กรอกมือให้ไม่ได้
- **เหตุผลเดิมที่ไม่ดึงราคาไม่เป็นปัญหาแล้ว:** rate limit และความช้าของ API ภายนอกถูกลดด้วย cache TTL สั้น (ไม่ยิง CoinGecko ทุก request) และขอบเขตจำกัดแค่ crypto (stock ยังอยู่นอก scope)
- **แยก dev ออกจาก production:** Upstash free tier สร้างได้แค่ 1 database ทำให้ dev กับ production ใช้ตัวเดียวกัน E2E ที่ลบ cache key และตัวนับ rate limit ตอน dev จึงกระทบ production จริง Redis local + SRH แยกขาด และไม่ต้องแก้โค้ด

## Consequences

- dev ต้องเปิด `docker compose up -d postgres redis serverless-redis-http` (ใน `server/`) ก่อนรัน test/E2E ในเครื่อง; ห้ามใช้ `docker compose up` เฉยๆ เพราะจะ start service `server` ที่เข้าถึง `localhost` ของเครื่องไม่ได้
- SRH รับคำสั่งเป็น JSON body (POST) เท่านั้น ไม่รองรับ URL path แบบ `GET /del/<key>` เครื่องมือที่ยิง Redis REST ตรงๆ (เช่น helper ใน E2E spec) ต้องใช้ POST
- Redis local ไม่มี volume: ข้อมูลหายเมื่อ container ถูกลบ ไม่เป็นปัญหาเพราะเก็บแค่ cache และตัวนับ rate limit
- ความถูกต้องของราคาขึ้นกับ CoinGecko (ฟรี มี rate limit) และ cache อาจเก่าได้สูงสุด 120 วินาที
- image `hiett/serverless-redis-http:latest` ยังไม่ pin เวอร์ชัน (ใช้เฉพาะ dev)
- การเพิ่ม stock หรือสินทรัพย์ประเภทอื่นยังไม่อยู่ใน ADR นี้ ต้องเขียน ADR ใหม่
