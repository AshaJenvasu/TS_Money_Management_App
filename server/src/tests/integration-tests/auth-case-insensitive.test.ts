import { describe, test, expect, vi, beforeEach } from "vitest";
import app from "../../index";
import { prisma } from "../helpers/reset-db";
import { fakeRedis } from "../helpers/fake-redis";

// Redis (Upstash) เป็น external boundary: ใช้ in-memory fake ร่วมกับ test อื่น (rate limit ของ login ใช้ Redis)
vi.mock("../../config/redis", async () => ({
  redis: (await import("../helpers/fake-redis")).fakeRedis.client,
}));

const PASSWORD = "Correct-Password-123!";

let counter = 0;

// ค่าที่ไม่ซ้ำกันในแต่ละ test; email ขึ้นต้น test_ (ตัวเล็ก) เพราะ cleanTestData ลบ user ตาม email ที่ขึ้นต้น test_
// ซึ่งใช้ได้เพราะ server บันทึก email เป็นตัวพิมพ์เล็กเสมอ
function uniqueParts() {
  counter += 1;
  const unique = `${Date.now()}_${counter}`;
  return {
    email: `test_case_${unique}@example.com`,
    // username ต้องยาวไม่เกิน 20 ตัวอักษร (กฎของ PUT /users/me/username ที่ใช้ใน test ด้านล่าง)
    username: `cu_${Date.now() % 1e9}_${counter}`,
  };
}

function register(body: { email: string; username: string; password?: string }) {
  return app.request("/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: PASSWORD, ...body }),
  });
}

function login(identifier: string, password = PASSWORD) {
  return app.request("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password, rememberMe: false }),
  });
}

// Email: เก็บเป็นตัวพิมพ์เล็ก (normalize ที่ Zod) | Username: เก็บตัวพิมพ์ตามที่ user ตั้ง แต่เทียบ/กันซ้ำแบบไม่สนตัวพิมพ์
describe("Email is stored lowercase; Username keeps its case but is matched case-insensitively", () => {
  beforeEach(() => {
    fakeRedis.reset();
  });

  describe("register then login with different casing", () => {
    test("🔴 should store email in lowercase but keep the username exactly as typed (only trimmed)", async () => {
      const { email, username } = uniqueParts();
      const typedUsername = username.replace("cu_", "Cu_");

      const res = await register({
        email: email.toUpperCase().replace("TEST_CASE_", "Test_Case_"),
        username: `  ${typedUsername}  `,
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.email).toBe(email);
      expect(body.username).toBe(typedUsername);

      const row = await prisma.user.findUnique({ where: { email } });
      expect(row?.username).toBe(typedUsername);
      // คอลัมน์ที่ DB คำนวณให้ ใช้เทียบแบบไม่สนตัวพิมพ์
      expect(row?.usernameLower).toBe(typedUsername.toLowerCase());
    });

    test("🔴 should login with the email typed in a different case than at registration", async () => {
      const { email, username } = uniqueParts();
      const reg = await register({
        email: email.replace("test_case_", "Test_Case_").replace("@example.com", "@Example.COM"),
        username,
      });
      expect(reg.status).toBe(201);

      for (const identifier of [
        email,
        email.toUpperCase(),
        `Test_Case_${email.slice("test_case_".length)}`,
        `  ${email.toUpperCase()}  `,
      ]) {
        const res = await login(identifier);
        expect(res.status, `login with "${identifier}"`).toBe(200);
        const body = await res.json();
        expect(body.user.email).toBe(email);
      }
    });

    test("🔴 should login with the username typed in a different case than at registration, and return the stored case", async () => {
      const { email, username } = uniqueParts();
      const stored = username.replace("cu_", "Cu_");
      const reg = await register({ email, username: stored });
      expect(reg.status).toBe(201);

      for (const identifier of [stored, stored.toLowerCase(), stored.toUpperCase(), ` ${stored.toLowerCase()} `]) {
        const res = await login(identifier);
        expect(res.status, `login with "${identifier}"`).toBe(200);
        expect((await res.json()).user.username).toBe(stored);
      }
    });

    test("🔴 should still reject a wrong password regardless of identifier casing", async () => {
      const { email, username } = uniqueParts();
      await register({ email, username });

      const res = await login(email.toUpperCase(), "Wrong-Password-123!");
      expect(res.status).toBe(401);
    });
  });

  describe("duplicate register that differs only by case", () => {
    test("🔴 should reject a second register with the same email in different case with a readable 400", async () => {
      const { email, username } = uniqueParts();
      expect((await register({ email, username })).status).toBe(201);

      const other = uniqueParts();
      const res = await register({
        email: email.toUpperCase(),
        username: other.username,
      });

      expect(res.status).toBe(400);
      expect((await res.json()).message).toBe("Email or Username already exists");
    });

    test("🔴 should reject a second register with the same username in different case with a readable 400", async () => {
      const { email, username } = uniqueParts();
      expect((await register({ email, username: username.replace("cu_", "Cu_") })).status).toBe(201);

      const other = uniqueParts();
      const res = await register({
        email: other.email,
        username: username.toUpperCase(),
      });

      expect(res.status).toBe(400);
      expect((await res.json()).message).toBe("Email or Username already exists");
    });

    test("🔴 should answer 400 (never 500 / raw DB error) when two registers race on the same email", async () => {
      const { email, username } = uniqueParts();
      const other = uniqueParts();

      const [first, second] = await Promise.all([
        register({ email, username }),
        register({ email: email.toUpperCase(), username: other.username }),
      ]);

      expect([first.status, second.status].sort()).toEqual([201, 400]);
      const loser = first.status === 400 ? first : second;
      expect((await loser.json()).message).toBe("Email or Username already exists");
      expect(await prisma.user.count({ where: { email } })).toBe(1);
    });

    test("🔴 should answer 400 (never 500 / raw DB error) when two registers race on the same username in different case", async () => {
      const { email, username } = uniqueParts();
      const other = uniqueParts();

      const [first, second] = await Promise.all([
        register({ email, username }),
        register({ email: other.email, username: username.toUpperCase() }),
      ]);

      expect([first.status, second.status].sort()).toEqual([201, 400]);
      const loser = first.status === 400 ? first : second;
      expect((await loser.json()).message).toBe("Email or Username already exists");
      expect(await prisma.user.count({ where: { usernameLower: username.toLowerCase() } })).toBe(1);
    });

    test("🔴 should be enforced by the DB itself: two usernames differing only by case cannot both be inserted", async () => {
      const a = uniqueParts();
      const b = uniqueParts();
      await prisma.user.create({
        data: { email: a.email, username: "DbGuard_User", passwordHash: "x" },
      });

      await expect(
        prisma.user.create({
          data: { email: b.email, username: "dbguard_user", passwordHash: "x" },
        }),
      ).rejects.toMatchObject({ code: "P2002" });
    });
  });

  describe("changing email / username keeps the same rules", () => {
    async function registerAndLogin() {
      const { email, username } = uniqueParts();
      expect((await register({ email, username })).status).toBe(201);
      const res = await login(email);
      const { token } = await res.json();
      return { email, username, cookie: `auth_token=${token}` };
    }

    function put(path: string, cookie: string, body: unknown) {
      return app.request(`/api/v1/users/me/${path}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify(body),
      });
    }

    test("🔴 should store a new email in lowercase", async () => {
      const user = await registerAndLogin();
      const newEmail = `test_case_new_${Date.now()}@example.com`;

      const res = await put("email", user.cookie, {
        email: newEmail.toUpperCase(),
        currentPassword: PASSWORD,
      });

      expect(res.status).toBe(200);
      expect((await res.json()).email).toBe(newEmail);
    });

    test("🔴 should reject changing email to one that exists in a different case with 409", async () => {
      const taken = await registerAndLogin();
      const user = await registerAndLogin();

      const res = await put("email", user.cookie, {
        email: taken.email.toUpperCase(),
        currentPassword: PASSWORD,
      });

      expect(res.status).toBe(409);
      expect((await res.json()).message).toBe("Email already taken");
    });

    test("🔴 should reject changing username to one that exists in a different case with 409", async () => {
      const taken = await registerAndLogin();
      const user = await registerAndLogin();

      const res = await put("username", user.cookie, {
        username: taken.username.toUpperCase(),
      });

      expect(res.status).toBe(409);
      expect((await res.json()).message).toBe("Username already taken");
    });

    test("🔴 should keep the case the user typed when changing username", async () => {
      const user = await registerAndLogin();
      const typed = `New_${Date.now() % 1e9}`;

      const res = await put("username", user.cookie, { username: ` ${typed} ` });

      expect(res.status).toBe(200);
      expect((await res.json()).username).toBe(typed);
      // login ด้วยตัวพิมพ์ไหนก็เจอบัญชีเดิม
      expect((await login(typed.toUpperCase())).status).toBe(200);
    });

    test("🔴 should allow a user to change only the casing of their own username", async () => {
      const user = await registerAndLogin();

      const res = await put("username", user.cookie, {
        username: user.username.toUpperCase(),
      });

      expect(res.status).toBe(200);
      expect((await res.json()).username).toBe(user.username.toUpperCase());
    });
  });
});
