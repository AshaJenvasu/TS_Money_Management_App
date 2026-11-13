# Handoff: Real-time price + Redis (อัปเดตล่าสุด: 2026-11-12)

## เป้าหมาย
แสดง current price / current value / unrealized P&L ของ crypto holding ใน `GET /api/v1/portfolio` โดย cache ราคาใน Upstash Redis (cache-aside) ดู ADR: `docs/adr/ADR-0001-realtime-crypto-price-caching.md`

## Ticket (อยู่ใน `.scratch/real-time-price-redis/issues/`)
- `01-backend-price-provider-and-portfolio-enrich.md` — กำลังทำ (อยู่ขั้น RED)
- `02-frontend-investment-current-value-pnl.md` — รอ 01
- `03-backend-forgot-password-rate-limit.md` — รอ Upstash client จาก 01 (ทำขนานกับ 02 ได้)

## Decisions ที่ตกลงแล้ว
- Test seams: integration test ที่ `GET /api/v1/portfolio` ผ่าน `app.request` (DB จริง) mock เฉพาะ Redis และ CoinGecko
- ชื่อ field ใน response เป็น camelCase ตาม response เดิม: `currentPrice`, `currentValue`, `unrealizedPnl`, `unrealizedPnlPercent`, `priceUnavailable`
- สกุลเงิน USD; map `Asset.symbol` ไป CoinGecko ผ่าน param `symbols`
- เรียก CoinGecko ที่ `/coins/markets?vs_currency=usd&symbols=btc,eth` (ไม่ใช้ `/simple/price` เพราะ response ใช้ id เป็น key จับคู่กลับหา symbol ไม่ได้)
- Redis client อยู่ที่ `server/src/config/redis.ts` export ชื่อ `redis` (Upstash, method `get`, `set(key, value, { ex })`) — test mock โมดูลนี้ด้วย `vi.mock("../../config/redis")`
- ลำดับ AC (vertical slice, ทีละ test): AC1 → AC2 → AC3 → AC4 → AC5
- TTL 1-5 นาที; ไม่เพิ่ม column ใน `assets`

## สถานะปัจจุบัน
- เขียน test AC1 แล้ว: `server/src/tests/integration-tests/portfolio-price.test.ts` (BTC 0.5 หน่วย ต้นทุน 60,000 ราคา 72,000 → value 36,000, P&L +6,000, +20%)
- ยังไม่เคยเห็น test แดงด้วยเหตุผลที่ถูก: Postgres ที่ `localhost:5434` ต่อไม่ได้ (Docker Desktop ปิดอยู่) test ล้มที่ `beforeEach` ใน `src/tests/setup.ts` (`wallets.test.ts` เดิมก็ล้มครบ 23/23 ด้วยเหตุเดียวกัน)
- ยังไม่มีโค้ดจริง: ยังไม่ติดตั้ง `@upstash/redis`, ยังไม่มี `src/config/redis.ts`, ยังไม่มี PriceProvider, ยังไม่แก้ `PortfolioService.getPortfolio` (`server/src/services/portfolio.services.ts`)
- ไฟล์ทั้งหมดยังไม่ได้ commit

## อัปเดต 2026-11-13
- DB ใช้ได้แล้ว (Docker รันอยู่); แก้ `server/src/tests/helpers/auth.ts` ให้ใส่ `iat` ใน JWT (เพราะ `auth.middleware.ts` ปฏิเสธ token ที่ไม่มี `iat` ทำให้ test ที่ต้อง login ได้ 401 หมด)
- AC1 RED → GREEN เสร็จ: `portfolio-price.test.ts` ผ่าน (รันไฟล์เดียว) โค้ดที่เพิ่ม: `server/src/services/price.provider.ts` (interface `PriceProvider` + `CoinGeckoPriceProvider`), แก้ `portfolio.services.ts` (enrich + `buildValuation`), แก้ `portfolio.schema.ts`; ติดตั้ง `@upstash/redis` แล้ว
- ยังไม่มี `src/config/redis.ts` และยังไม่มี cache (ตั้งใจ: จะเพิ่มตอน AC2/AC3)
- ข้อควรระวัง: รัน integration test หลายไฟล์พร้อมกันจะชนกันเพราะแชร์ DB และ `cleanTestData` (เคยเจอ PrismaClientKnownRequestError) ให้รันทีละไฟล์; `wallets.test.ts` ล้ม 3/23 เมื่อรันเดี่ยว (เป็นของเดิม ยังไม่ได้ตรวจสาเหตุ)
- ถัดไป: AC2 (cache hit) — เขียน test แดงก่อน แล้วสร้าง `src/config/redis.ts` + cache-aside ใน provider

## อัปเดต AC2 (2026-11-13)
- AC2 RED → GREEN เสร็จ (`portfolio-price.test.ts` ผ่าน 2/2) เพิ่ม `server/src/config/redis.ts` (`Redis.fromEnv()`) และ `CachedPriceProvider` ใน `price.provider.ts` (key `price:usd:<SYMBOL>`, TTL 120 วินาที, cache รายตัว)
- `portfolio.services.ts` ใช้ `new CachedPriceProvider(new CoinGeckoPriceProvider())`
- ต้องตั้ง `UPSTASH_REDIS_REST_URL` และ `UPSTASH_REDIS_REST_TOKEN` ใน `server/.env` (ตอนนี้ยังไม่มี: import แล้วขึ้น warning ไม่ throw แต่เรียกจริงจะ error → AC4 ต้องรองรับกรณี Redis/CoinGecko ล้ม)
- `wallets.test.ts` ยังล้ม 3/23 เท่าเดิม ไม่ได้ผลจากงานนี้
- ถัดไป: AC3 (cache miss/expired → refetch และ TTL ใหม่)

## อัปเดต AC3 (2026-11-13)
- AC3 เสร็จ: test ผ่านทันทีโดยไม่ต้องเพิ่มโค้ด (cache-aside จาก AC2 ครอบคลุม) ตรวจแล้วด้วย mutation check: ลบ TTL ออกชั่วคราว test ล้ม (`expected 72000 to be 80000`) แล้วคืนโค้ดเดิม ผ่าน 3/3
- test ใช้ `vi.useFakeTimers({ toFake: ["Date"] })` เลื่อนเวลา 10 นาที; `afterEach` เรียก `vi.useRealTimers()`
- ถัดไป: AC4 (CoinGecko/Redis ล้มและไม่มี cache → 200, `currentPrice: null`, `priceUnavailable: true`) ซึ่งจะต้องแก้โค้ดจริง

## อัปเดต AC4 (2026-11-13)
- AC4 RED → GREEN เสร็จ (`portfolio-price.test.ts` ผ่าน 5/5): test 2 กรณี (fetch reject, HTTP 429) เดิมแดงที่ `expected 500 to be 200`
- โค้ด: `getPortfolio` ครอบ `priceProvider.getPrices` ด้วย try/catch (log ผ่าน `logger.warn`, ใช้ Map ว่างต่อ → `currentPrice: null`, `priceUnavailable: true`); `CoinGeckoPriceProvider` throw เมื่อ `!response.ok` และตั้ง timeout 5 วินาทีด้วย `AbortSignal.timeout` (ส่วน timeout จริงยังไม่มี test ตรง ๆ test จำลองด้วย fetch reject)
- try/catch ครอบ Redis ล้มด้วย (ยังไม่มี test แยกสำหรับ Redis error)
- ถัดไป: AC5 (stock → null/`priceUnavailable: true`)

## อัปเดต AC5 (2026-11-13) — ticket 01 ครบ AC1-AC5
- AC5 เสร็จ: test ผ่านทันทีโดยไม่เพิ่มโค้ด (filter เฉพาะ crypto ใน `getPortfolio` ครอบคลุมอยู่แล้ว) ตรวจด้วย mutation check: ถอด filter ออกชั่วคราว test ล้ม (`expected '72000' to be null`) แล้วคืนโค้ดเดิม ผ่าน 6/6
- test ใช้ stock ที่ symbol ตรงกับเหรียญ (`BTC`) เพื่อพิสูจน์ว่า stock ไม่ถูกส่งไปขอราคา crypto
- เหลือก่อนปิด ticket 01: ตั้ง `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` ใน `server/.env` (และ env บน Render), รัน biome (`bun run lint-format`), commit
- ถัดไป: ticket 02 (frontend) และ 03 (rate limit `/auth/forgot-password`) ทำขนานกันได้

## ขั้นตอนเดิม (ข้อ 1-4 เสร็จแล้ว)
1. เปิด Docker Desktop แล้วรัน `docker compose up -d postgres` ใน `server/`
2. รัน `npx vitest run src/tests/integration-tests/wallets.test.ts` ยืนยันว่า DB ใช้ได้ (ต้องเขียวเหมือนเดิม)
3. รัน `npx vitest run src/tests/integration-tests/portfolio-price.test.ts` ต้องแดงเพราะ response ไม่มี `currentPrice` (ไม่ใช่ error ของ DB หรือ setup) ถ้าแดงเพราะเหตุอื่นให้แก้ test ก่อน
4. GREEN AC1: `bun add @upstash/redis`, สร้าง `src/config/redis.ts`, PriceProvider (interface + CoinGecko impl), แก้ `getPortfolio` และ `GetPortfolioResponseSchema` ให้มี field ใหม่ — เขียนโค้ดขั้นต่ำให้ผ่านเท่านั้น
5. วนต่อ RED → GREEN สำหรับ AC2, AC3, AC4, AC5 ทีละข้อ (ใช้ skill `mattpocock-skills:tdd`)
6. จบ ticket 01 แล้วค่อยทำ 02 และ 03
- ต้องตั้ง env ใหม่ใน `server/.env` ตอนทำจริง: Upstash REST URL และ token (ยังไม่มี)
