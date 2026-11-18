import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";

// ทดสอบ migration 20261118100000_username_case_insensitive กับข้อมูลเก่า
//
// ไม่รัน SQL นี้กับตาราง users จริงใน DB: migration แก้ "ทุกแถว" จึงจะไปแก้ user อื่นที่ไม่ใช่ข้อมูล test
// ให้สร้าง schema ชั่วคราวที่มีตาราง users หน้าตาเดียวกัน (unique บน email/username แบบ case-sensitive เหมือนก่อน migrate)
// แล้วตั้ง search_path ให้ชี้ไป schema นั้นอย่างเดียว คำสั่ง `users` ใน migration จึงไปโดนตารางชั่วคราว และ drop ทิ้งหลังจบ
const MIGRATION_SQL = readFileSync(
  fileURLToPath(
    new URL(
      "../../../prisma/migrations/20261118100000_username_case_insensitive/migration.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);

const SCHEMA = `mig_test_${process.pid}_${Date.now()}`;

let client: pg.Client;

async function insertUser(id: number, email: string, username: string) {
  await client.query(
    "INSERT INTO users (id, email, username) VALUES ($1, $2, $3)",
    [id, email, username],
  );
}

async function allUsers() {
  const res = await client.query<{ id: string; email: string; username: string }>(
    "SELECT id::text, email, username FROM users ORDER BY id",
  );
  return res.rows;
}

async function hasUsernameLowerColumn() {
  const res = await client.query(
    "SELECT 1 FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'users' AND column_name = 'username_lower'",
    [SCHEMA],
  );
  return res.rowCount === 1;
}

describe("migration: email lowercase + case-insensitive username (username_lower)", () => {
  beforeEach(async () => {
    client = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    await client.query(`CREATE SCHEMA "${SCHEMA}"`);
    await client.query(`SET search_path TO "${SCHEMA}"`);
    await client.query(`
      CREATE TABLE users (
        id BIGINT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        username VARCHAR(50) NOT NULL UNIQUE
      )
    `);
  });

  afterEach(async () => {
    await client.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
    await client.end();
  });

  test("🔴 should lowercase emails, keep username case (only trim) and fill username_lower for existing rows", async () => {
    await insertUser(1, "John@Example.COM", "JohnDoe");
    await insertUser(2, "already@lower.com", "already_lower");
    await insertUser(3, "Mixed.Case@Example.com", " Padded_User ");

    await client.query(MIGRATION_SQL);

    expect(await allUsers()).toEqual([
      { id: "1", email: "john@example.com", username: "JohnDoe" },
      { id: "2", email: "already@lower.com", username: "already_lower" },
      { id: "3", email: "mixed.case@example.com", username: "Padded_User" },
    ]);

    const lower = await client.query<{ id: string; username_lower: string }>(
      "SELECT id::text, username_lower FROM users ORDER BY id",
    );
    expect(lower.rows).toEqual([
      { id: "1", username_lower: "johndoe" },
      { id: "2", username_lower: "already_lower" },
      { id: "3", username_lower: "padded_user" },
    ]);
  });

  test("🔴 should keep username_lower in sync automatically and make the DB reject case-only duplicates afterwards", async () => {
    await insertUser(1, "a@x.com", "Asha");
    await client.query(MIGRATION_SQL);

    // แถวใหม่หลัง migration: DB คำนวณ username_lower ให้เอง
    await insertUser(2, "b@x.com", "Bob");
    const row = await client.query("SELECT username_lower FROM users WHERE id = 2");
    expect(row.rows[0].username_lower).toBe("bob");

    // ชื่อที่ต่างกันแค่ตัวพิมพ์ ต้องชน unique index ที่ DB
    await expect(insertUser(3, "c@x.com", "ASHA")).rejects.toMatchObject({
      code: "23505",
      constraint: "users_username_lower_key",
    });
    // เปลี่ยนตัวพิมพ์ของตัวเองได้ (แถวเดิม) และ username_lower ตามให้
    await client.query("UPDATE users SET username = 'ASHA' WHERE id = 1");
    const updated = await client.query("SELECT username_lower FROM users WHERE id = 1");
    expect(updated.rows[0].username_lower).toBe("asha");
  });

  test("🔴 should be a no-op for already-normalized data and safe to run twice", async () => {
    await insertUser(1, "a@x.com", "Alpha");
    await insertUser(2, "b@x.com", "beta");

    await client.query(MIGRATION_SQL);
    await client.query(MIGRATION_SQL);

    expect(await allUsers()).toEqual([
      { id: "1", email: "a@x.com", username: "Alpha" },
      { id: "2", email: "b@x.com", username: "beta" },
    ]);
  });

  test("🔴 should FAIL loudly on colliding emails, name the accounts, and change nothing", async () => {
    await insertUser(1, "Dup@Example.com", "first_user");
    await insertUser(2, "dup@example.com", "second_user");
    await insertUser(3, "Other@Example.com", "third_user");

    await expect(client.query(MIGRATION_SQL)).rejects.toThrow(
      /EMAIL collisions:[\s\S]*dup@example\.com[\s\S]*id=1 email='Dup@Example\.com'[\s\S]*id=2 email='dup@example\.com'/,
    );

    // ห้ามแก้ข้อมูลครึ่งๆ กลางๆ: "Other@Example.com" ที่ไม่ได้ชนก็ต้องยังเป็นค่าเดิม ไม่มีบัญชีไหนถูกลบ/รวม และยังไม่มีคอลัมน์ใหม่
    expect(await allUsers()).toEqual([
      { id: "1", email: "Dup@Example.com", username: "first_user" },
      { id: "2", email: "dup@example.com", username: "second_user" },
      { id: "3", email: "Other@Example.com", username: "third_user" },
    ]);
    expect(await hasUsernameLowerColumn()).toBe(false);
  });

  test("🔴 should FAIL loudly on usernames that collide case-insensitively and name the accounts", async () => {
    await insertUser(1, "one@x.com", "SameName");
    await insertUser(2, "two@x.com", "samename");
    await insertUser(3, "three@x.com", "Unique_One");

    await expect(client.query(MIGRATION_SQL)).rejects.toThrow(
      /USERNAME collisions:[\s\S]*samename[\s\S]*id=1 username='SameName'[\s\S]*id=2 username='samename'/,
    );

    expect(await allUsers()).toEqual([
      { id: "1", email: "one@x.com", username: "SameName" },
      { id: "2", email: "two@x.com", username: "samename" },
      { id: "3", email: "three@x.com", username: "Unique_One" },
    ]);
    expect(await hasUsernameLowerColumn()).toBe(false);
  });

  test("🔴 should FAIL loudly when a username is only whitespace (would become empty after trim)", async () => {
    await insertUser(1, "blank@x.com", "   ");

    await expect(client.query(MIGRATION_SQL)).rejects.toThrow(
      /EMPTY usernames after trim:[\s\S]*id=1/,
    );
    expect(await allUsers()).toEqual([
      { id: "1", email: "blank@x.com", username: "   " },
    ]);
    expect(await hasUsernameLowerColumn()).toBe(false);
  });
});
