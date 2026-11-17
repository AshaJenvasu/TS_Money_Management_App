# Handoff: Real-time price + Redis (อัปเดตล่าสุด: 2026-11-16)

## เป้าหมาย
แสดง current price / current value / unrealized P&L ของ crypto holding ใน `GET /api/v1/portfolio` โดย cache ราคาใน Upstash Redis (cache-aside) ดู ADR: `docs/adr/ADR-0001-realtime-crypto-price-caching.md`

## Ticket (อยู่ใน `.scratch/real-time-price-redis/issues/`)
- `01-backend-price-provider-and-portfolio-enrich.md` — เสร็จ AC1-AC5 + งานเพิ่ม (symbol regex, cache ผล "ไม่เจอ") commit แล้ว (ไฟล์ ticket ยังเขียน status เดิมว่า ready-for-agent)
- `02-frontend-investment-current-value-pnl.md` — เสร็จ commit แล้ว (รวมแก้ P&L รวมคลาดเคลื่อนจาก float + test ฝั่ง client, ดู "อัปเดต 2026-11-16") รอทดสอบบนเบราว์เซอร์
- `03-backend-forgot-password-rate-limit.md` — เสร็จ commit แล้ว (`ipRateLimit` ต่อ IP)
- `04-asset-identity-coingecko-id.md` — เสร็จทั้ง backend และฟอร์มสร้าง asset commit แล้ว
- `05-login-rate-limit.md` — เสร็จ commit แล้ว (ชั้น IP + ชั้น identifier, แก้ race เป็น increment-then-check)
- `06-fix-asset-update-bola.md` — เสร็จ commit แล้ว (`70fe2dc`) เป็น ticket ที่เขียนย้อนหลังหลังงานเสร็จ ไม่ใช่ spec ล่วงหน้า

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

## อัปเดต ticket 05 (2026-11-13) — login rate limit 2 ชั้น เสร็จ
- ชั้น IP: `authController.use("/auth/login", ipRateLimit(RATE_LIMITS.loginIp))` 10 ครั้ง/15 นาที/IP นับทุก request (key `ratelimit:login-ip:<ip>`)
- ชั้น identifier: `server/src/services/login-throttle.ts` (`LoginThrottle.getRetryAfterSeconds` เช็คก่อนตรวจรหัส จึงบล็อกแม้รหัสถูก, `recordFailure` เรียกเฉพาะ branch `INVALID_CREDENTIALS` ใน handler login) 5 ครั้งที่ล้มเหลว/15 นาที ใช้ Redis `incr` + `expire(..., "NX")`; key ใช้ `identifier` ที่ trim + ตัวพิมพ์เล็ก (ระบบ login รับ email หรือ username)
- 429 ทุกชั้นมี header `Retry-After` (วินาทีที่เหลือจาก `ttl`); `ipRateLimit` รับ `message` จาก config แล้ว (`config/rate-limits.ts` เก็บค่า limit และข้อความทั้งหมด)
- อ่าน IP ไม่ได้ → fail-open: ทำไปแล้วใน ticket 03 ได้ผลกับ login ด้วย (มี test ฝั่ง login)
- test: `login-rate-limit.test.ts` ผ่าน 11/11 (ใหม่), `helpers/fake-redis.ts` (ใหม่: get/set/incr/expire NX/ttl + flag `failing`), `forgot-password-rate-limit.test.ts` ย้ายมาใช้ fake กลางนี้ (ผ่าน 5/5); mutation check แล้วสำหรับ "login สำเร็จไม่นับ" และ "Redis ล่ม fail-open"
- ตรวจแล้ว: ไม่มี test เดิมใดเรียก `/auth/login` จึงไม่มีอะไรโดน rate limit ตัวเอง
- ข้อควรระวัง: (1) ผู้โจมตีล็อกบัญชีเหยื่อได้ด้วยการจงใจใส่รหัสผิด 5 ครั้ง (trade-off ของ limit ต่อบัญชี) (2) `x-forwarded-for` ค่าซ้ายสุดปลอมได้ ชั้น IP จึงเลี่ยงได้ แต่ชั้น identifier ไม่ขึ้นกับ IP (3) การนับ-เช็คไม่ atomic ยิงขนานพร้อมกันอาจเกิน limit เล็กน้อย (4) login ที่ password สั้นกว่า 6 ตัวติด validation 400 ไม่ถูกนับเป็นความล้มเหลว
- ยังไม่ได้ทำ: ทดสอบบนเบราว์เซอร์ + frontend แสดงข้อความเมื่อโดน 429 ที่หน้า login (ยังไม่ได้ตรวจว่า LoginForm จัดการ 429 อย่างไร)

## อัปเดต race condition ใน rate limiting (2026-11-13)
- ตรวจแล้ว: `ipRateLimit` เป็น increment-then-check อยู่แล้ว (ไม่มี race ไม่แก้; เรียก `expire(..., "NX")` ทุกครั้งแทนเฉพาะตอน `newCount === 1` เพื่อให้ตั้งอายุซ้ำได้ถ้าครั้งแรกล้ม) แต่ `LoginThrottle` เป็น check-then-increment จริง (get ก่อนตรวจรหัส incr หลังรหัสผิด) — RED: ยิงรหัสผิดพร้อมกัน 8 ครั้งถูกตรวจรหัสครบ 8 (limit 5)
- แก้เป็น increment-then-check: `LoginThrottle.beginAttempt` จอง slot ด้วย `incr` ก่อนตรวจรหัสเสมอ เทียบค่าที่คืนกับ limit ทันที; login สำเร็จหรือเกิด error ที่ไม่ใช่รหัสผิด เรียก `release` (`decr`, ลบ key ถ้าติดลบ) คืน slot; รหัสผิดไม่คืน slot (`recordFailure`/`getRetryAfterSeconds` เดิมถูกแทนที่)
- test ใหม่ (concurrency, `Promise.all`): login identifier 8 ขนาน → 401 เป๊ะ 5 และ 429 เป๊ะ 3; login IP 14 ขนาน → ผ่านเป๊ะ 10; forgot-password 6 ขนาน → ผ่านเป๊ะ 3 (ส่งอีเมล 3 ฉบับ); login: ผิด 4 + สำเร็จ 1 + ผิด 1 ถึงล็อก (พิสูจน์ว่า login สำเร็จไม่ค้างในตัวนับ) — `login-rate-limit` 14/14, `forgot-password-rate-limit` 6/6; mutation check: ทำ `ipRateLimit` เป็น check-then-increment แล้ว test forgot-password ขนานล้ม
- `helpers/fake-redis.ts` เพิ่ม `decr` และ `del`
- trade-off: attempt ที่กำลังตรวจรหัสพร้อมกันนับรวมใน limit ชั่วคราว ผู้ใช้จริงที่ login ซ้อน >5 ครั้งพร้อมกันบัญชีเดียวจะโดน 429 (ไม่น่าเกิดในการใช้งานจริง)
- ยังไม่มี test: กรณี key หมดอายุระหว่าง attempt แล้ว `release` (โค้ดกันค่าติดลบไว้แล้วแต่ยังไม่ได้พิสูจน์ด้วย test)

## อัปเดต 2026-11-16 — ticket 02 แก้ P&L รวม + ticket 06 เสร็จ
- ticket 02 (commit `29d1728`): ยอด P&L รวมใน `PortfolioSummaryCard` เคยคำนวณ `totalCurrentValue - Σ(quantity * avgCostPerUnit)` ด้วย float ฝั่ง client ทำให้เท่าทุนจริงได้ `-5.55e-17` แล้วสีขึ้นแดงและโชว์ `-฿0.00` แก้เป็นรวม `unrealizedPnl` ที่ server คำนวณด้วย Decimal แล้วปัดเป็นสตางค์ (`Math.round(x * 100) / 100 + 0`) ใน `client/src/utils/portfolioSummary.ts` (`summarizeMarket`, `investment.tsx` เรียกใช้)
- client ตอนนี้มี test framework แล้ว (ข้อความ "client ไม่มี test framework" ใน "อัปเดต ticket 02" ด้านบนล้าสมัย): เพิ่ม `vitest` + `client/vitest.config.ts` (แยกจาก `vite.config.ts`) + script `bun run test`; test `client/src/utils/portfolioSummary.test.tsx` ผ่าน 5/5 (เท่าทุนได้ `฿0.00` สีเทา, ปัด noise, เขียว/แดง, ไม่รวม asset ไม่มีราคา, ไม่มีราคาเลยได้ `null`)
- ticket 06 (commit `70fe2dc`): `PUT /assets/:id` เคยไม่เช็ค ownership (BOLA) และกฎ "ห้ามแก้ asset ที่มีประวัติ" มีแค่ฝั่ง UI แก้แล้ว: หา asset ด้วย `id + userId` (ไม่ใช่เจ้าของ → 404 `Asset not found` เหมือน DELETE), นิยาม "มีประวัติ" = มี `PortfolioTransaction` อย่างน้อย 1 รายการ (นับแม้ขายหมดแล้ว) → 400, เช็ค + update อยู่ใน `$transaction` เดียวพร้อม `SELECT ... FOR UPDATE` ล็อกแถว asset (`AssetRepository.updateNameIfNoTransactions`), ข้อความ 400 เป็น "Cannot update asset that has transaction history" (string error ภายใน `CANNOT_UPDATE_ASSET_WITH_HOLDING` ไม่เปลี่ยน)
- test `asset-update.test.ts` ผ่าน 5/5 (A: คนอื่นแก้ไม่ได้, B: มีประวัติ 2 variant ทั้งถืออยู่และขายหมด, C: ไม่มีประวัติแก้ได้, race: insert transaction ค้างไว้ระหว่างแก้ชื่อ) mutation check: ถอด `FOR UPDATE` แล้ว race test แดง (`expected 200 to be 400`) แล้วคืนโค้ด
- ทั้งชุด server รัน `--no-file-parallelism`: 82/88 ผ่าน fail 6 ข้อใน `wallets.test.ts` (integration 3 + unit 3) เป็นของเดิม ไม่เกี่ยวกับ asset (รันแบบ parallel จะพังมากกว่านี้เพราะแชร์ DB)
- ยังเหลือ: (1) ทดสอบหน้า Investment และหน้า login บนเบราว์เซอร์จริง (ต้องตั้ง `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`) รวมเช็คว่า LoginForm จัดการ 429 อย่างไร (2) ก่อน deploy โค้ด: migration ขึ้น production แล้ว (ดู "อัปเดต 2026-11-16 — migration ขึ้น production" ท้ายไฟล์) เหลือตรวจข้อมูลเดิมบน production (3) ตัดสินใจ scope แยก: flow แก้ `coingecko_id` ให้ asset เดิม (ตอนนี้ `PUT /assets/:id` แก้ได้แค่ชื่อ และ asset ที่มีประวัติแก้อะไรไม่ได้เลย ถ้าเลือกเหรียญผิดต้องลบสร้างใหม่ซึ่งประวัติหาย) (4) Quality Gate: grill-me, regression ทั้งหมด, E2E Playwright, code review, security review (5) สาเหตุที่ `wallets.test.ts` ล้ม 6 ข้อ (ไม่ได้ตรวจ: `tsc` ก็รายงาน `publicId` ขาดใน `wallets.test.ts`)

## อัปเดต 2026-11-16 — migration ขึ้น production (Neon) แล้ว
- รัน `bun run db:deploy:prod` (`dotenv -e .env.production -- bun prisma migrate deploy`) สำเร็จ: apply `20261113061422_add_asset_coingecko_id` (`ALTER TABLE "assets" ADD COLUMN "coingecko_id" VARCHAR(100)` nullable ไม่แตะข้อมูลเดิม) ตรวจซ้ำด้วย `migrate status` ได้ "Database schema is up to date!" (4/4 migration) ก่อนรันเช็คแล้วว่า production ค้างแค่ migration นี้ตัวเดียว
- ข้อควรระวัง: `bun run db:deploy` (ไม่มี `:prod`) อ่าน `server/.env` ซึ่งชี้ DB local `localhost:5434` ไม่ใช่ production ต้องใช้ `db:deploy:prod` เท่านั้น; `bunx dotenv ...` ใช้ได้ (`npx dotenv` ใช้ไม่ได้ในเครื่องนี้)
- ผลต่อ production: crypto asset เดิมจะมี `coingecko_id = null` ราคาขึ้น "ราคาไม่พร้อมใช้งาน" จนกว่าจะลบแล้วสร้างใหม่ (ยังไม่ได้ตรวจจำนวน asset บน production)
- ยังไม่ได้ deploy โค้ด server/client ชุดใหม่ขึ้น production; โค้ดเวอร์ชันเก่าที่รันอยู่ไม่พังเพราะ column ใหม่ nullable ก่อน deploy โค้ดต้องตั้ง `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` บน env ของ Render
- Prisma CLI แจ้งว่ามี major version ใหม่ (ไม่ได้อัปเกรด)

## อัปเดต 2026-11-17 — แก้ wallets.test.ts ล้ม 6 ข้อ (ปิดข้อ (5) ใน "ยังเหลือ" ด้านบน)
- commit `06fcad6` แยกจาก feature real-time price: เป็นบั๊กเก่าเดือน ต.ค. ไม่เกี่ยวกับ ticket 06 / `iat` ใน `helpers/auth.ts` (ตรวจแล้ว: ทั้ง 6 ข้อไม่มีข้อไหนได้ 401 และ `createTestUserWithToken` ไม่ตั้ง `passwordChangedAt` จึงไม่ชนกับเช็คใน `auth.middleware.ts`)
- สาเหตุ A (test ค้าง): `c1c561c` (2026-10-21) เปลี่ยน GET `/wallets/:id` ให้ใช้ `publicId` (uuid) แต่ unit test ยัง mock `findByIdAndUserId` (service เรียก `findByPublicIdAndUserId` แล้วเลยหลุดไปหา DB จริงได้ `INTERNAL_SERVER_ERROR`) และ integration test ยังยิง `/wallets/<id ตัวเลข>` จึงได้ 400 จาก `WalletPublicIdParamSchema` — แก้ test ให้ใช้ `publicId`/uuid สุ่ม และ assert `publicId` ใน body
- สาเหตุ B (บั๊กจริงใน production code): `496882f` (2026-10-15) ลบ `throw new Error("INTERNAL_SERVER_ERROR")` ท้าย `catch` ของ `WalletService.createWallet` ทำให้ error ที่ไม่ใช่ `WALLET_NAME_EXISTS`/`WALLET_LIMIT_REACHED` (เช่น DB ล่ม) ถูกกลืนแล้วคืน `undefined` — คืน throw แล้ว
- ผล: `wallets.test.ts` unit+integration 42/42; ทั้งชุด server `--no-file-parallelism` **88/88 ผ่านหมด** (ตัวเลข 82/88 ใน section 2026-11-16 ด้านบนล้าสมัยแล้ว)
- ข้อควรระวัง: ครั้งแรกที่รันพบว่า Docker Desktop/Postgres local (`localhost:5434`) ไม่ได้รัน ทำให้ทุก test พังที่ `cleanTestData()` ใน `setup.ts` (19/19 ใน unit wallets) — ต้องเปิด Postgres ก่อนรัน test เสมอ; `tsc` เคยรายงาน `publicId` ขาดใน `wallets.test.ts` ยังไม่ได้รัน `tsc` ซ้ำหลังแก้
- ยังเหลือเหมือนเดิม ยกเว้นข้อ (5) ที่ปิดแล้ว
