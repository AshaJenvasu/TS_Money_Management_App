import { expect, test, type APIResponse } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Flow หลักของฟีเจอร์ Real-time price + Redis:
// login -> หน้า Investment -> เห็นราคาและมูลค่าปัจจุบันของ crypto ที่ดึงจาก CoinGecko ผ่าน cache ใน Redis จริง
//
// สร้าง user ใหม่ในแต่ละรอบผ่าน API (ไม่ seed ล่วงหน้า): ไม่ต้องพึ่ง seed script/ข้อมูลที่ค้างใน DB, รันซ้ำได้เรื่อยๆ
// และลบ user ทิ้งตอนจบ (อีเมลขึ้นต้น test_ เพื่อให้ cleanTestData ของ vitest ลบให้ด้วยถ้ารอบไหนค้าง)
// ส่วนราคาต้องมาจาก CoinGecko และ Redis จริง ไม่ mock: ถ้าเน็ตหรือ CoinGecko มีปัญหา test นี้จะล้ม
//
// Safety: test นี้ลบ key ใน Redis และสร้าง/ลบ user จริง จึงไม่ยอมรันถ้า DATABASE_URL ไม่ใช่ host local
// เว้นแต่ตั้ง E2E_ALLOW_SHARED_DATA=1 (ดู assertSafeToRun ด้านล่าง)

// ต้องตรงกับ server/src/services/price.provider.ts: key = `price:${PRICE_CURRENCY}:${coingeckoId}` และ PRICE_CACHE_TTL_SECONDS
// ไม่ import จาก server ตรงๆ เพราะโมดูลนั้นต่อ Redis ตอน import และ client ไม่ควรผูก build กับ package server
// ถ้าแก้ key/TTL ที่ server ให้แก้สองค่านี้ตรงนี้ที่เดียวตาม
const PRICE_CURRENCY = "thb";
const PRICE_CACHE_TTL_SECONDS = 120;

const PASSWORD = "E2e-Password-123!";
const COIN_ID = "bitcoin";
const PRICE_CACHE_KEY = `price:${PRICE_CURRENCY}:${COIN_ID}`;

const ALLOW_SHARED_DATA_FLAG = "E2E_ALLOW_SHARED_DATA";
const LOCAL_DB_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

type GetEnv = (name: string) => string | undefined;

// parser รองรับ `export KEY=...`, ค่าที่ครอบด้วย "..." หรือ '...' และ comment ท้ายบรรทัด (` # ...`)
function parseEnvFile(text: string): Map<string, string> {
  const values = new Map<string, string>();
  for (const line of text.split(/\r?\n/)) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    const raw = match[2].trim();
    const quoted = /^(["'])(.*?)\1/.exec(raw);
    // ค่าที่ครอบ quote ใช้เฉพาะข้างใน quote (ทิ้ง comment หลัง quote ปิด); ค่าไม่มี quote ตัด comment ที่ขึ้นต้นด้วย " #"
    values.set(match[1], quoted ? quoted[2] : raw.replace(/(^|\s)#.*$/, "").trim());
  }
  return values;
}

// process.env มาก่อน (Bun ก็ให้ env จริงชนะ .env ของ server) แล้วค่อย fallback ไฟล์ server/.env
function loadServerEnv(): GetEnv {
  const envFile = fileURLToPath(new URL("../../server/.env", import.meta.url));
  const fileValues = existsSync(envFile)
    ? parseEnvFile(readFileSync(envFile, "utf8"))
    : new Map<string, string>();
  return (name) => process.env[name] || fileValues.get(name) || undefined;
}

function readUpstashConfig(getEnv: GetEnv): { url: string; token: string } | null {
  const url = getEnv("UPSTASH_REDIS_REST_URL");
  const token = getEnv("UPSTASH_REDIS_REST_TOKEN");
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

// โยน error ถ้า DB ไม่ใช่ local และไม่ได้ opt-in (ไม่พิมพ์ DATABASE_URL เพราะมี credential)
function assertSafeToRun(getEnv: GetEnv): void {
  if (getEnv(ALLOW_SHARED_DATA_FLAG) === "1") return;
  const databaseUrl = getEnv("DATABASE_URL");
  let host: string | null;
  try {
    host = databaseUrl ? new URL(databaseUrl).hostname : null;
  } catch {
    host = null;
  }
  if (host === null || !LOCAL_DB_HOSTS.has(host)) {
    throw new Error(
      `E2E ปฏิเสธที่จะรัน: DATABASE_URL ไม่ใช่ host local (host: ${host ?? "ไม่พบ/อ่านไม่ได้"}). ` +
        `test นี้สร้าง/ลบ user และลบ key ${PRICE_CACHE_KEY} ใน Redis จริง ` +
        `ถ้าแน่ใจว่ายอมให้ทำกับ DB และ Upstash ชุดนี้ ให้ตั้ง ${ALLOW_SHARED_DATA_FLAG}=1`,
    );
  }
}

// 429 มาจาก rate limit ของ server (reuseExistingServer ใน playwright.config.ts ทำให้ตัวนับค้างข้ามรอบได้)
function expectStatus(response: APIResponse, expected: number, step: string): void {
  const status = response.status();
  const hint =
    status === 429
      ? ` (โดน rate limit: รอตาม Retry-After=${response.headers()["retry-after"] ?? "ไม่ระบุ"} วินาที หรือ restart backend เพื่อล้างตัวนับ แล้วรันใหม่)`
      : "";
  expect(status, `${step}: ต้องได้ ${expected} แต่ได้ ${status}${hint}`).toBe(expected);
}

async function upstash(
  config: { url: string; token: string },
  command: string,
): Promise<unknown> {
  const response = await fetch(`${config.url}/${command}`, {
    headers: { Authorization: `Bearer ${config.token}` },
  });
  expect(response.ok, `Upstash ${command.split("/")[0]} failed`).toBe(true);
  return ((await response.json()) as { result: unknown }).result;
}

test("login -> Investment page shows the live crypto price served through the Redis cache", async ({
  page,
  request,
}) => {
  const getEnv = loadServerEnv();
  assertSafeToRun(getEnv);

  const redisConfig = readUpstashConfig(getEnv);
  expect(
    redisConfig,
    "ต้องมี UPSTASH_REDIS_REST_URL และ UPSTASH_REDIS_REST_TOKEN ใน process.env หรือ server/.env",
  ).not.toBeNull();
  const redis = redisConfig!;

  const unique = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const email = `test_e2e_${unique}@example.com`;
  const username = `test_e2e_${unique}`;

  // ลบราคา BTC ที่ค้างใน cache ก่อน เพื่อให้ราคาที่เห็นมาจากการดึง CoinGecko จริงรอบนี้แล้วถูกเก็บลง Redis
  await upstash(redis, `del/${encodeURIComponent(PRICE_CACHE_KEY)}`);

  // register อยู่ใน try เพื่อให้ finally ลบ user เสมอแม้ register/expect ล้ม (ถ้ายังไม่ได้ login การลบไม่ทำอะไร)
  try {
    // 1) Arrange ผ่าน API: สมัคร, login, สร้าง asset crypto (มี coingecko_id) และซื้อ 0.5 BTC
    const register = await request.post("/api/v1/auth/register", {
      data: { email, username, password: PASSWORD },
    });
    expectStatus(register, 201, "register");

    const apiLogin = await request.post("/api/v1/auth/login", {
      data: { identifier: email, password: PASSWORD, rememberMe: false },
    });
    expectStatus(apiLogin, 200, "login (API)");

    const assetResponse = await request.post("/api/v1/assets", {
      data: {
        symbol: "BTC",
        name: "Bitcoin",
        asset_type: "crypto",
        coingecko_id: COIN_ID,
      },
    });
    expectStatus(assetResponse, 201, "create asset");
    const asset = (await assetResponse.json()) as { id: string };

    const buy = await request.post("/api/v1/portfolio/transactions", {
      data: {
        assetId: asset.id,
        transaction_type: "buy",
        quantity: "0.5",
        price_per_unit: "1000000",
        transaction_date: new Date().toISOString(),
      },
    });
    expectStatus(buy, 201, "buy transaction");

    // 2) Act ผ่าน UI จริง: login แล้วเข้าหน้า Investment จากเมนู
    // LoginForm เรียก alert() ตอน login สำเร็จ: ปิด dialog อัตโนมัติ
    page.on("dialog", (dialog) => void dialog.accept());

    await page.goto("/login");
    await page.getByPlaceholder("Email หรือ Username").fill(email);
    await page.getByPlaceholder("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole("link", { name: "Investment" }).first().click();
    await expect(page).toHaveURL(/\/investment/);

    // 3) Assert ที่ UI: การ์ดของ BTC แสดงมูลค่าปัจจุบันพร้อมราคาต่อหน่วย ไม่ใช่ "ราคาไม่พร้อมใช้งาน"
    await expect(page.getByText("BTC", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("มูลค่าปัจจุบัน")).toBeVisible();
    await expect(page.getByText("ราคาไม่พร้อมใช้งาน")).toHaveCount(0);
    await expect(page.getByText("ยังไม่มีข้อมูลราคาปัจจุบัน")).toHaveCount(0);

    const priceLabel = await page
      .getByText(/\(฿[\d,]+(?:\.\d+)?\/หน่วย\)/)
      .first()
      .textContent();
    const displayedPrice = Number(
      /฿([\d,]+(?:\.\d+)?)\/หน่วย/.exec(priceLabel ?? "")?.[1]?.replace(/,/g, ""),
    );
    expect(displayedPrice).toBeGreaterThan(0);

    // 4) ราคาที่ UI แสดงต้องตรงกับ API เส้นเดียวกับที่หน้าเว็บใช้ (ไม่เทียบกับค่าใน Redis ตรงๆ
    // เพราะ cache หมดอายุ/ถูกเขียนทับระหว่างทางได้ ทำให้ assertion เสี่ยงล้มแบบสุ่ม)
    const portfolio = await request.get("/api/v1/portfolio");
    expectStatus(portfolio, 200, "GET portfolio");
    const body = (await portfolio.json()) as {
      holdings: Array<{
        currentPrice: string | null;
        currentValue: string | null;
        priceUnavailable: boolean;
      }>;
    };
    const holding = body.holdings[0];
    expect(holding.priceUnavailable).toBe(false);
    const apiPrice = Number(holding.currentPrice);
    expect(apiPrice).toBeGreaterThan(0);
    // UI ปัดทศนิยม 2 ตำแหน่ง
    expect(Math.abs(displayedPrice - apiPrice)).toBeLessThan(0.01);
    expect(Number(holding.currentValue)).toBeCloseTo(apiPrice * 0.5, 2);

    // 5) Assert ที่ Redis จริง: key ราคาถูก server เขียน (เราลบทิ้งไว้ก่อนเริ่ม) และมี TTL ตาม cache
    // ตรวจแค่ว่า key มีอยู่และ TTL อยู่ในช่วง ไม่เทียบค่ากับ UI
    const exists = Number(
      await upstash(redis, `exists/${encodeURIComponent(PRICE_CACHE_KEY)}`),
    );
    expect(exists, `key ${PRICE_CACHE_KEY} ต้องถูก server เขียนลง Redis`).toBe(1);

    const ttl = Number(
      await upstash(redis, `ttl/${encodeURIComponent(PRICE_CACHE_KEY)}`),
    );
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(PRICE_CACHE_TTL_SECONDS);
  } finally {
    // ลบ user ทิ้งเสมอ (cascade ลบ asset/portfolio) ไม่ให้ข้อมูลทดสอบสะสมใน DB
    await request.delete("/api/v1/users/me", {
      data: { currentPassword: PASSWORD },
    });
  }
});
