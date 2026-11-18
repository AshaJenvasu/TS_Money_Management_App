-- 1) email: เก็บเป็นตัวพิมพ์เล็กเสมอ (server normalize ให้ตอนรับค่า ดู normalizedEmailSchema ใน src/schema/auth.schema.ts)
-- 2) username: "เก็บตัวพิมพ์ตามที่ user ตั้ง" (แค่ตัดช่องว่างหัวท้าย) แต่ "เทียบ/กันซ้ำแบบไม่สนตัวพิมพ์"
--    ด้วยคอลัมน์ username_lower = lower(username) ที่ DB คำนวณให้เอง (generated column) + unique index
--    ทำให้ DB กันซ้ำแบบไม่สนตัวพิมพ์ได้แม้สมัคร/เปลี่ยนชื่อพร้อมกัน
--
-- ถ้ามี 2 บัญชีขึ้นไปที่ชนกันแบบไม่สนตัวพิมพ์ (email หรือ username เช่น "Asha" กับ "asha") หรือ username ว่างหลัง trim
-- migration นี้จะ FAIL ดังๆ พร้อมรายชื่อ id/ค่าของบัญชีที่ชนกัน โดยยังไม่แก้ข้อมูลใดๆ
-- ห้าม merge หรือลบบัญชีให้อัตโนมัติ: ให้ตัดสินใจเองว่าจะจัดการบัญชีที่ชนกันอย่างไร แล้วค่อยรัน migration ใหม่
-- การเช็คอยู่ก่อนคำสั่งแก้ข้อมูลเสมอ และไฟล์นี้รันเป็นก้อนเดียว จึงไม่มีกรณีที่ข้อมูลถูกแก้ไปครึ่งเดียว
-- (เขียนให้รันซ้ำได้: ใช้ IF NOT EXISTS กับคอลัมน์/index)

DO $$
DECLARE
  email_conflicts text;
  username_conflicts text;
  empty_usernames text;
BEGIN
  SELECT string_agg(format('%s => [%s]', key, accounts), E'\n' ORDER BY key)
    INTO email_conflicts
  FROM (
    SELECT lower(btrim(email)) AS key,
           string_agg(format('id=%s email=%L', id, email), ', ' ORDER BY id) AS accounts
    FROM users
    GROUP BY lower(btrim(email))
    HAVING count(*) > 1
  ) c;

  SELECT string_agg(format('%s => [%s]', key, accounts), E'\n' ORDER BY key)
    INTO username_conflicts
  FROM (
    SELECT lower(btrim(username)) AS key,
           string_agg(format('id=%s username=%L', id, username), ', ' ORDER BY id) AS accounts
    FROM users
    GROUP BY lower(btrim(username))
    HAVING count(*) > 1
  ) c;

  -- username ที่มีแต่ช่องว่างจะกลายเป็นสตริงว่างหลัง trim ซึ่งใช้ login ไม่ได้
  SELECT string_agg(format('id=%s username=%L', id, username), ', ' ORDER BY id)
    INTO empty_usernames
  FROM users
  WHERE btrim(username) = '';

  IF email_conflicts IS NOT NULL OR username_conflicts IS NOT NULL OR empty_usernames IS NOT NULL THEN
    RAISE EXCEPTION E'Cannot normalize users: found accounts that would collide (case-insensitive) or become empty. No data was changed. Resolve these manually, then re-run the migration.\nEMAIL collisions:\n%\nUSERNAME collisions:\n%\nEMPTY usernames after trim:\n%',
      coalesce(email_conflicts, '(none)'),
      coalesce(username_conflicts, '(none)'),
      coalesce(empty_usernames, '(none)');
  END IF;
END $$;

UPDATE users
SET email = lower(btrim(email))
WHERE email <> lower(btrim(email));

-- username: ตัดแค่ช่องว่างหัวท้าย ไม่แตะตัวพิมพ์
UPDATE users
SET username = btrim(username)
WHERE username <> btrim(username);

-- type เป็น text เพราะ lower() คืน text (Prisma map String? เป็น text เหมือนกัน จึงไม่เกิด schema drift)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS username_lower text GENERATED ALWAYS AS (lower(username)) STORED;

-- ชื่อ index ตามที่ Prisma ตั้งให้ @unique ของ field usernameLower (users_username_lower_key)
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_key ON users (username_lower);
