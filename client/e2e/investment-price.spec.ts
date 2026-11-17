import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Flow หลักของฟีเจอร์ Real-time price + Redis:
// login -> หน้า Investment -> เห็นราคาและมูลค่าปัจจุบันของ crypto ที่ดึงจาก CoinGecko ผ่าน cache ใน Redis จริง
//
// สร้าง user ใหม่ในแต่ละรอบผ่าน API (ไม่ seed ล่วงหน้า): ไม่ต้องพึ่ง seed script/ข้อมูลที่ค้างใน DB, รันซ้ำได้เรื่อยๆ
// และลบ user ทิ้งตอนจบ (อีเมลขึ้นต้น test_ เพื่อให้ cleanTestData ของ vitest ลบให้ด้วยถ้ารอบไหนค้าง)
// ส่วนราคาต้องมาจาก CoinGecko และ Redis จริง ไม่ mock: ถ้าเน็ตหรือ CoinGecko มีปัญหา test นี้จะล้ม

const PASSWORD = "E2e-Password-123!";
const COIN_ID = "bitcoin";
const PRICE_CACHE_KEY = `price:thb:${COIN_ID}`;
const PRICE_CACHE_TTL_SECONDS = 120;

// อ่าน UPSTASH_* จาก server/.env ให้ test ตรวจ key ใน Redis ตรงๆ (ไม่พิมพ์ค่าลงที่ไหน)
function readUpstashConfig(): { url: string; token: string } | null {
  const envFile = fileURLToPath(new URL("../../server/.env", import.meta.url));
  if (!existsSync(envFile)) return null;
  const values = new Map<string, string>();
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (match) values.set(match[1], match[2].replace(/^["']|["']$/g, ""));
  }
  const url = values.get("UPSTASH_REDIS_REST_URL");
  const token = values.get("UPSTASH_REDIS_REST_TOKEN");
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
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
  const upstash_ = readUpstashConfig();
  expect(
    upstash_,
    "server/.env ต้องมี UPSTASH_REDIS_REST_URL และ UPSTASH_REDIS_REST_TOKEN",
  ).not.toBeNull();
  const redisConfig = upstash_!;

  const unique = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const email = `test_e2e_${unique}@example.com`;
  const username = `test_e2e_${unique}`;

  // ลบราคา BTC ที่ค้างใน cache ก่อน เพื่อให้ราคาที่เห็นมาจากการดึง CoinGecko จริงรอบนี้แล้วถูกเก็บลง Redis
  await upstash(redisConfig, `del/${encodeURIComponent(PRICE_CACHE_KEY)}`);

  // 1) Arrange ผ่าน API: สมัคร, login, สร้าง asset crypto (มี coingecko_id) และซื้อ 0.5 BTC
  const register = await request.post("/api/v1/auth/register", {
    data: { email, username, password: PASSWORD },
  });
  expect(register.status()).toBe(201);

  try {
    const apiLogin = await request.post("/api/v1/auth/login", {
      data: { identifier: email, password: PASSWORD, rememberMe: false },
    });
    expect(apiLogin.status()).toBe(200);

    const assetResponse = await request.post("/api/v1/assets", {
      data: {
        symbol: "BTC",
        name: "Bitcoin",
        asset_type: "crypto",
        coingecko_id: COIN_ID,
      },
    });
    expect(assetResponse.status()).toBe(201);
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
    expect(buy.status()).toBe(201);

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

    // 4) Assert ที่ Redis จริง: key ราคาถูกเขียนโดย server (ตอนที่เราลบทิ้งไว้ก่อนเริ่ม) ค่าตรงกับที่ UI แสดง และมี TTL ตาม cache
    const cachedPrice = Number(
      await upstash(redisConfig, `get/${encodeURIComponent(PRICE_CACHE_KEY)}`),
    );
    expect(Number.isFinite(cachedPrice)).toBe(true);
    // UI ปัดทศนิยม 2 ตำแหน่ง
    expect(Math.abs(cachedPrice - displayedPrice)).toBeLessThan(0.01);

    const ttl = Number(
      await upstash(redisConfig, `ttl/${encodeURIComponent(PRICE_CACHE_KEY)}`),
    );
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(PRICE_CACHE_TTL_SECONDS);

    // 5) มูลค่ารวมของ 0.5 BTC ต้องสอดคล้องกับราคาที่แสดง (ผ่าน API เส้นเดียวกับที่หน้าเว็บใช้)
    const portfolio = await request.get("/api/v1/portfolio");
    expect(portfolio.status()).toBe(200);
    const body = (await portfolio.json()) as {
      holdings: Array<{
        currentPrice: string | null;
        currentValue: string | null;
        priceUnavailable: boolean;
      }>;
    };
    const holding = body.holdings[0];
    expect(holding.priceUnavailable).toBe(false);
    expect(Number(holding.currentPrice)).toBeCloseTo(cachedPrice, 2);
    expect(Number(holding.currentValue)).toBeCloseTo(cachedPrice * 0.5, 2);
  } finally {
    // ลบ user ทิ้งเสมอ (cascade ลบ asset/portfolio) ไม่ให้ข้อมูลทดสอบสะสมใน DB
    await request.delete("/api/v1/users/me", {
      data: { currentPassword: PASSWORD },
    });
  }
});
