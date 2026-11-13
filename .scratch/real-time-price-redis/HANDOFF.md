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
- สกุลเงิน THB (เปลี่ยนจาก USD เมื่อ 2026-11-13 เพราะ UI แสดง ฿ และ user กรอกต้นทุนเป็นบาท); map `Asset.symbol` ไป CoinGecko ผ่าน param `symbols`
- เรียก CoinGecko ที่ `/coins/markets?vs_currency=thb&symbols=btc,eth` (ไม่ใช้ `/simple/price` เพราะ response ใช้ id เป็น key จับคู่กลับหา symbol ไม่ได้)
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
- AC2 RED → GREEN เสร็จ (`portfolio-price.test.ts` ผ่าน 2/2) เพิ่ม `server/src/config/redis.ts` (`Redis.fromEnv()`) และ `CachedPriceProvider` ใน `price.provider.ts` (key `price:thb:<SYMBOL>`, TTL 120 วินาที, cache รายตัว)
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

## อัปเดต ticket 02 (2026-11-13)
- เปลี่ยนสกุลเงินราคาเป็น THB ที่ `server/src/services/price.provider.ts` (`PRICE_CURRENCY = "thb"`, cache key `price:thb:<SYMBOL>`) เพราะ UI แสดง ฿; server test ผ่าน 6/6
- ฝั่ง client (ยังไม่ได้ commit): `services/portfolio.services.ts` (field ใหม่), `types/investment.ts` (`AssetView` เพิ่ม field ราคา), `routes/investment.tsx` (map field + คำนวณ `marketSummary` เฉพาะสินทรัพย์ที่มีราคา), `components/investment/PnlText.tsx` (ใหม่: เขียว/แดง/เทา), `AssetListItem.tsx` (แถวมูลค่าปัจจุบัน + P&L หรือ "ราคาไม่พร้อมใช้งาน"), `PortfolioSummaryCard.tsx` (มูลค่าตลาดรวม + P&L รวม + หมายเหตุล่าช้าได้ถึง 2 นาที)
- `tsc -b` ผ่าน; eslint ไม่มี error (warning 4 ข้อของเดิมใน `investment.tsx`)
- client ไม่มี test framework จึงยังไม่มี test; ยังไม่ได้ลองบนเบราว์เซอร์ (ต้องตั้ง Upstash env ก่อน)
- loading state: ใช้ spinner เต็มหน้าเดิม (ราคาอยู่ใน query `portfolio` เดียวกัน)
- ถัดไป: ticket 03 (rate limit `/auth/forgot-password`)

## อัปเดตแผน (2026-11-13) — เจอช่องโหว่ symbol ชนกัน
ลำดับใหม่: **ticket 04 → งานเพิ่มใน ticket 01 → ticket 03 → Quality Gate**
- ticket 04 (ไฟล์ `issues/04-asset-identity-coingecko-id.md`): เพิ่ม `Asset.coingeckoId`, endpoint `GET /assets/search-coins?q=`, บังคับ id เมื่อสร้าง crypto asset, `price.provider.ts` ใช้ `ids=` และ cache key `price:thb:<coingeckoId>`
- งานเพิ่มใน ticket 01: regex `^[A-Za-z0-9]{1,10}$` ที่ symbol, cache ผล "ไม่เจอ" ~5 นาที
- ตรวจ DB local แล้ว: มี asset เดียวคือ BTC ของ user ทดสอบ ลบได้ ไม่ต้อง backfill (production ต้องตรวจก่อน deploy)
- ticket 02 (frontend) ยังต้องแก้ฟอร์มสร้าง asset ให้ค้นหา+เลือกเหรียญ (`AssetCreateDialog.tsx`)
- สถานะ ticket 04: เริ่มขั้น RED ของ `GET /assets/search-coins` (`server/src/tests/integration-tests/asset-search-coins.test.ts`)

## อัปเดต ticket 04 — ฝั่ง backend เสร็จ (2026-11-13)
- migration `server/prisma/migrations/20261113061422_add_asset_coingecko_id` (เพิ่ม `assets.coingecko_id` VARCHAR(100) nullable) apply บน DB local แล้ว; ก่อน deploy ต้องรัน `bun run db:deploy` และตรวจข้อมูลเดิมบน production (asset crypto เดิมจะได้ราคา null จนกว่าจะมี `coingecko_id`)
- `GET /api/v1/assets/search-coins?q=` (ไฟล์ใหม่ `controllers/coin-search.controllers.ts`, `services/coin-search.services.ts`; ต้องลงทะเบียนก่อน `assetController` ใน `index.ts`): 200 คืน `{id, symbol, name}[]`, 400 ถ้า `q` ว่าง, 401 ถ้าไม่ login, 502 ถ้า CoinGecko ล้ม — test `asset-search-coins.test.ts` ผ่าน 6/6
- `POST /api/v1/assets`: รับ `coingecko_id` (บังคับเมื่อ `asset_type` เป็น crypto, stock เป็น null ได้) response ของ asset ทุก endpoint มี `coingecko_id` — test `asset-create.test.ts` ผ่าน 3/3
- `price.provider.ts` ใช้ `ids=` และ cache key `price:thb:<coingeckoId>`; `getPortfolio` ขอราคาเฉพาะ crypto ที่มี `coingeckoId` — `portfolio-price.test.ts` ผ่าน 8/8 (เพิ่ม test symbol ชนกัน และ asset crypto เดิมที่ไม่มี id)
- ยังเหลือ: (1) frontend `AssetCreateDialog.tsx` ค้นหา+เลือกเหรียญ และส่ง `coingecko_id` (2) ticket 01 งานเพิ่ม: regex symbol `^[A-Za-z0-9]{1,10}$` + cache ผล "ไม่เจอ" ~5 นาที (3) ticket 03
- ข้อควรระวัง: รัน integration test ทีละไฟล์ (แชร์ DB)

## อัปเดต (2026-11-13) — ticket 04 frontend + งานเพิ่มใน ticket 01 เสร็จ
- ฟอร์มสร้าง asset (`client/src/components/investment/AssetCreateDialog.tsx`): ประเภท crypto ต้องค้นหา (หน่วง 300ms) และเลือกเหรียญจากรายการ ส่ง `coingecko_id` ไป `POST /assets`; symbol/name เติมอัตโนมัติและแก้ได้; symbol รับเฉพาะ A-Z a-z 0-9 ไม่เกิน 10 ตัว; stock ยังพิมพ์เองได้ ไม่ต้องมี id
- ไฟล์ client ใหม่/แก้: `hooks/useCoinSearchQuery.ts` (ใหม่), `services/asset.services.ts` (`searchCoins`, `coingecko_id`); `tsc -b` และ eslint ผ่าน
- ticket 01 งานเพิ่ม: symbol ต้องตรง `^[A-Za-z0-9]{1,10}$` (test 3 กรณี), cache ผล "ไม่เจอ" 5 นาที (`NOT_FOUND_MARKER` ใน `price.provider.ts`) — `portfolio-price.test.ts` ผ่าน 9/9, `asset-create.test.ts` 6/6, `asset-search-coins.test.ts` 6/6 (รันทีละไฟล์)
- ยังเหลือ: ทดสอบหน้า Investment บนเบราว์เซอร์จริง (ต้องตั้ง `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`), ticket 03 (rate limit `/auth/forgot-password`), Quality Gate (grill-me, regression ทั้งหมด, E2E Playwright, code review, security review)
- ข้อสังเกต: asset crypto ที่สร้างก่อนมี `coingecko_id` จะได้ราคา null จนกว่าจะสร้างใหม่ (ยังไม่มี flow แก้ id ให้ asset เดิม: `PUT /assets/:id` แก้ได้แค่ชื่อ)

## อัปเดต ticket 03 (2026-11-13) — rate limit ต่อ IP เสร็จ
- โค้ด: `server/src/middlewares/rate-limit.middleware.ts` (`ipRateLimit`: fixed window ด้วย Redis `incr` + `expire(..., "NX")`), `server/src/config/rate-limits.ts` (3 ครั้ง / 15 นาที ต่อ IP แก้ที่นี่ที่เดียว), ผูกที่ `auth.controllers.ts` ก่อน route `/auth/forgot-password`
- ตัดสินใจ (ผมเลือกค่า Recommended ให้เองเพราะผู้ใช้ปิดหน้าต่างคำถาม ถ้าไม่เห็นด้วยแก้ได้): **fail-open** เมื่อ Redis ล่ม และอ่าน IP จาก **ค่าซ้ายสุดของ `x-forwarded-for`** (fallback `x-real-ip`; ถ้าไม่มีทั้งสองข้ามด่านนี้)
- ข้อควรระวัง: ค่าซ้ายสุดผู้ใช้ปลอม header เองเพื่อเลี่ยง limit ได้ (ยังมี limit ต่อ email ใน DB 3 ครั้ง/15 นาทีเป็นด่านสอง); ยังไม่ได้ตรวจว่า Render มี proxy กี่ชั้น; ถ้าอ่าน IP ไม่ได้ (ไม่มีทั้ง `x-forwarded-for` และ `x-real-ip`) จะ fail-open: ข้าม limit ของ request นั้นและ log warning (แก้เมื่อ 2026-11-13 ตามที่ผู้ใช้สั่ง; test 5/5)
- test `forgot-password-rate-limit.test.ts` ผ่าน 4/4: 3 ครั้งแรก 200 / ครั้งที่ 4 เป็น 429 และไม่ส่งอีเมล, IP อื่นไม่นับรวม, หมด 15 นาทีใช้ได้อีก, Redis ล่มยังผ่าน (mutation check แล้ว)
- ยังไม่ได้ test: ค่า config โดยตรง (ตรวจผ่านพฤติกรรมของค่าเริ่มต้น 3/15 นาที)
- ถัดไป: ทดสอบบนเบราว์เซอร์/Scalar, Quality Gate (grill-me, regression ทั้งหมด, E2E Playwright, code review, security review), commit
