import { describe, test, expect } from "vitest";
import app from "../../index";
import { prisma } from "../helpers/reset-db";
import { createTestUserWithToken } from "../helpers/auth";

describe("Wallets Integration Tests", () => {
  // -------------------------------------------------------------------
  // 📁 Sub-Describe 1: GET /api/v1/wallets (getWallets)
  // -------------------------------------------------------------------
  describe("GET /api/v1/wallets", () => {
    test("🟢 Happy Path: should return list of wallets belonging to the authenticated user", async () => {
      // Arrange: 1. สร้าง User A พร้อม Token
      const { testUser: userA, authHeader: authHeaderA } =
        await createTestUserWithToken();

      // Arrange: 2. สร้าง Wallet ของ User A จำนวน 2 อัน
      await prisma.wallet.createMany({
        data: [
          { userId: userA.id, name: "[TEST] User A - Cash Wallet" },
          { userId: userA.id, name: "[TEST] User A - Savings Wallet" },
        ],
      });

      // Arrange: 3. สร้าง User B พร้อม Wallet เพื่อทดสอบว่าข้อมูลไม่รั่วข้าม User (Data Isolation)
      const { testUser: userB } = await createTestUserWithToken();
      await prisma.wallet.create({
        data: { userId: userB.id, name: "[TEST] User B - Secret Wallet" },
      });

      // Act: ยิง GET โดยใช้ Token ของ User A
      const res = await app.request("/api/v1/wallets", {
        method: "GET",
        headers: {
          ...authHeaderA,
        },
      });

      const body = await res.json();

      // Assert: Status 200 OK
      expect(res.status).toBe(200);

      // Assert: เช็กว่าได้ Array ของ Wallet ความยาวเท่ากับ 2
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(2);

      // Assert: เช็กว่ามีเฉพาะ Wallet ของ User A เท่านั้น (ไม่มีของ User B หลุดมา)
      const walletNames = body.map((w: { name: string }) => w.name);
      expect(walletNames).toContain("[TEST] User A - Cash Wallet");
      expect(walletNames).toContain("[TEST] User A - Savings Wallet");
      expect(walletNames).not.toContain("[TEST] User B - Secret Wallet");
    });

    test("🔴 Sad Path: should return 401 Unauthorized when auth_token cookie is missing", async () => {
      // Act: ยิง GET โดยไม่แนบ Cookie auth_token
      const res = await app.request("/api/v1/wallets", {
        method: "GET",
      });

      // Assert
      expect(res.status).toBe(401);
    });

    test("🔴 Sad Path: should return 401 Unauthorized when token is invalid or expired", async () => {
      // Act: ยิง GET โดยแนบ Token มั่วๆ / หมดอายุ
      const res = await app.request("/api/v1/wallets", {
        method: "GET",
        headers: {
          Cookie: "auth_token=invalid_expired_token_12345",
        },
      });

      // Assert
      expect(res.status).toBe(401);
    });
  });
  // -------------------------------------------------------------------
  // 📁 Sub-Describe 2: POST /api/v1/wallets (createWallet)
  // -------------------------------------------------------------------
  describe("POST /api/v1/wallets", () => {
    test("🟢 Happy Path: should create a new wallet in DB and return 201 Created", async () => {
      // Arrange: ดึง User + Auth Cookie จาก Helper
      const { authHeader } = await createTestUserWithToken();
      const payload = { name: "[TEST] Main Wallet" };

      // Act
      const res = await app.request("/api/v1/wallets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader, // 👈 แนบ Cookie auth_token เข้าไป
        },
        body: JSON.stringify(payload),
      });

      const body = await res.json();

      // Assert 1: เช็ก status code
      expect(res.status).toBe(201);

      // Assert 2: เช็กว่า Response Body คืน Wallet Object กลับมาตรงๆ
      expect(body).toMatchObject({
        name: "[TEST] Main Wallet",
      });
      expect(body).toHaveProperty("id");

      // Assert 3: เช็กใน DB ว่ามี Wallet นี้อยู่จริง
      const walletInDb = await prisma.wallet.findFirst({
        where: { name: "[TEST] Main Wallet" },
      });
      expect(walletInDb).not.toBeNull();
    });

    test("🔴 Sad Path: should return 400 Bad Request when name is missing or empty", async () => {
      // Arrange
      const { authHeader } = await createTestUserWithToken();
      const invalidPayload = { name: "" };

      // Act
      const res = await app.request("/api/v1/wallets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader, // 👈 แนบ Cookie auth_token เข้าไปด้วย
        },
        body: JSON.stringify(invalidPayload),
      });

      // Assert
      expect(res.status).toBe(400);
    });

    test("🔴 Sad Path: should return 409 Conflict when wallet name already exists", async () => {
      // Arrange
      const { testUser, authHeader } = await createTestUserWithToken();

      // สร้าง Wallet ชื่อซ้ำให้ User คนนี้ก่อน
      await prisma.wallet.create({
        data: {
          userId: testUser.id,
          name: "[TEST] Duplicate Wallet",
        },
      });

      const duplicatePayload = { name: "[TEST] Duplicate Wallet" };

      // Act
      const res = await app.request("/api/v1/wallets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader, // 👈 แนบ Cookie auth_token
        },
        body: JSON.stringify(duplicatePayload),
      });

      // Assert
      expect(res.status).toBe(409);
    });
  });
  // -------------------------------------------------------------------
  // 📁 Sub-Describe 3: GET /api/v1/wallets/:id (getWalletById)
  // -------------------------------------------------------------------
  describe("GET /api/v1/wallets/:id", () => {
    test("🟢 Happy Path: should return wallet details when requesting own wallet ID", async () => {
      // Arrange
      const { testUser: userA, authHeader: authHeaderA } =
        await createTestUserWithToken();
      const targetWallet = await prisma.wallet.create({
        data: {
          userId: userA.id,
          name: "[TEST] User A - Personal Wallet",
        },
      });

      // Act: ใส่ .toString() ให้ targetWallet.id ชัดเจน
      const res = await app.request(
        `/api/v1/wallets/${targetWallet.id.toString()}`,
        {
          method: "GET",
          headers: { ...authHeaderA },
        },
      );

      const body = await res.json();

      // Assert
      expect(res.status).toBe(200);
      expect(body).toMatchObject({
        name: "[TEST] User A - Personal Wallet",
      });
    });

    test("🔴 Sad Path: should return 401 Unauthorized when no auth token provided", async () => {
      const res = await app.request("/api/v1/wallets/1", {
        method: "GET",
      });
      expect(res.status).toBe(401);
    });

    test("🔴 Sad Path: should return 404 Not Found when wallet ID does not exist", async () => {
      const { authHeader } = await createTestUserWithToken();
      const nonExistentId = "999999"; // ตัวเลข BigInt Valid ที่ไม่มีใน DB

      const res = await app.request(`/api/v1/wallets/${nonExistentId}`, {
        method: "GET",
        headers: { ...authHeader },
      });

      expect(res.status).toBe(404);
    });

    test("🔴 Sad Path: should return 404 Not Found when accessing another user's wallet", async () => {
      const { testUser: userA } = await createTestUserWithToken();
      const userAWallet = await prisma.wallet.create({
        data: {
          userId: userA.id,
          name: "[TEST] User A - Secret Wallet",
        },
      });

      const { authHeader: authHeaderB } = await createTestUserWithToken();

      // Act: ใส่ .toString() ให้ wallet ID ของ User A
      const res = await app.request(
        `/api/v1/wallets/${userAWallet.id.toString()}`,
        {
          method: "GET",
          headers: { ...authHeaderB },
        },
      );

      expect(res.status).toBe(404);
    });
  });
  // -------------------------------------------------------------------
  // 📁 Sub-Describe 4: PUT /api/v1/wallets/:id (updateWallet)
  // -------------------------------------------------------------------
  describe("PUT /api/v1/wallets/:id", () => {
    test("🟢 Happy Path: should update wallet name successfully when requesting own wallet ID", async () => {
      // Arrange: 1. สร้าง User A พร้อม Token และ Wallet ตั้งต้น
      const { testUser: userA, authHeader: authHeaderA } =
        await createTestUserWithToken();
      const targetWallet = await prisma.wallet.create({
        data: {
          userId: userA.id,
          name: "[TEST] User A - Old Wallet Name",
        },
      });

      const updatePayload = {
        name: "[TEST] User A - Updated Wallet Name",
      };

      // Act: ยิง PUT /api/v1/wallets/:id
      const res = await app.request(
        `/api/v1/wallets/${targetWallet.id.toString()}`,
        {
          method: "PUT",
          headers: {
            ...authHeaderA,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatePayload),
        },
      );

      const body = await res.json();

      // Assert 1: HTTP Status Code 200 OK
      expect(res.status).toBe(200);

      // Assert 2: Response body สะท้อนชื่อใหม่
      expect(body).toMatchObject({
        id: targetWallet.id.toString(),
        name: "[TEST] User A - Updated Wallet Name",
      });

      // Assert 3: ตรวจสอบข้อมูลใน DB จริงว่าเปลี่ยนแล้ว
      const updatedWalletInDb = await prisma.wallet.findUnique({
        where: { id: targetWallet.id },
      });
      expect(updatedWalletInDb?.name).toBe(
        "[TEST] User A - Updated Wallet Name",
      );
    });

    test("🔴 Sad Path: should return 400 Bad Request when request body is invalid", async () => {
      // Arrange
      const { testUser, authHeader } = await createTestUserWithToken();
      const targetWallet = await prisma.wallet.create({
        data: {
          userId: testUser.id,
          name: "[TEST] Valid Wallet",
        },
      });

      // Act: ส่ง body ที่ name เป็น string ว่าง (ผิด Zod validation schema)
      const res = await app.request(
        `/api/v1/wallets/${targetWallet.id.toString()}`,
        {
          method: "PUT",
          headers: {
            ...authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: "" }),
        },
      );

      // Assert
      expect(res.status).toBe(400);
    });

    test("🔴 Sad Path: should return 401 Unauthorized when no auth token provided", async () => {
      // Act
      const res = await app.request("/api/v1/wallets/1", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "Unauthorized Update" }),
      });

      // Assert
      expect(res.status).toBe(401);
    });

    test("🔴 Sad Path: should return 404 Not Found when wallet ID does not exist", async () => {
      // Arrange
      const { authHeader } = await createTestUserWithToken();
      const nonExistentId = "999999";

      // Act
      const res = await app.request(`/api/v1/wallets/${nonExistentId}`, {
        method: "PUT",
        headers: {
          ...authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "[TEST] Ghost Wallet" }),
      });

      // Assert
      expect(res.status).toBe(404);
    });

    test("🔴 Sad Path: should return 404 Not Found when attempting to update another user's wallet", async () => {
      // Arrange: 1. สร้าง User A พร้อม Wallet
      const { testUser: userA } = await createTestUserWithToken();
      const userAWallet = await prisma.wallet.create({
        data: {
          userId: userA.id,
          name: "[TEST] User A - Private Wallet",
        },
      });

      // Arrange: 2. สร้าง User B ( attacker )
      const { authHeader: authHeaderB } = await createTestUserWithToken();

      // Act: User B พยายามแก้ Wallet ของ User A
      const res = await app.request(
        `/api/v1/wallets/${userAWallet.id.toString()}`,
        {
          method: "PUT",
          headers: {
            ...authHeaderB,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: "[TEST] Hacked Wallet Name" }),
        },
      );

      // Assert: Service จะหาไม่เจอเพราะติด userId filter แล้วตอบ 404
      expect(res.status).toBe(404);

      // Assert Extra: เช็กใน DB ว่าชื่อของ User A ไม่ถูกเปลี่ยนจริง
      const originalWalletInDb = await prisma.wallet.findUnique({
        where: { id: userAWallet.id },
      });
      expect(originalWalletInDb?.name).toBe("[TEST] User A - Private Wallet");
    });
  });
  // -------------------------------------------------------------------
  // 📁 Sub-Describe 5: DELETE /api/v1/wallets/:id (deleteWallet)
  // -------------------------------------------------------------------
  describe("DELETE /api/v1/wallets/:id", () => {
    test("🟢 Happy Path: should delete wallet successfully when requesting own wallet ID", async () => {
      // Arrange: 1. สร้าง User A พร้อม Token และ Wallet ที่จะถูกลบ
      const { testUser: userA, authHeader: authHeaderA } =
        await createTestUserWithToken();
      const targetWallet = await prisma.wallet.create({
        data: {
          userId: userA.id,
          name: "[TEST] User A - Wallet To Delete",
        },
      });

      // Act: ยิง DELETE /api/v1/wallets/:id
      const res = await app.request(
        `/api/v1/wallets/${targetWallet.id.toString()}`,
        {
          method: "DELETE",
          headers: {
            ...authHeaderA,
          },
        },
      );

      // Assert 1: HTTP Status Code (ขึ้นอยู่กับ Controller คืน 200 พร้อม msg หรือ 204 No Content)
      expect([204]).toContain(res.status);

      // Assert 2: ยืนยันว่าข้อมูลใน Database ถูกลบออกไปแล้วจริงๆ
      const deletedWalletInDb = await prisma.wallet.findUnique({
        where: { id: targetWallet.id },
      });
      expect(deletedWalletInDb).toBeNull();
    });

    test("🔴 Sad Path: should return 401 Unauthorized when no auth token provided", async () => {
      // Act
      const res = await app.request("/api/v1/wallets/1", {
        method: "DELETE",
      });

      // Assert
      expect(res.status).toBe(401);
    });

    test("🔴 Sad Path: should return 404 Not Found when wallet ID does not exist", async () => {
      // Arrange
      const { authHeader } = await createTestUserWithToken();
      const nonExistentId = "999999";

      // Act
      const res = await app.request(`/api/v1/wallets/${nonExistentId}`, {
        method: "DELETE",
        headers: {
          ...authHeader,
        },
      });

      // Assert
      expect(res.status).toBe(404);
    });

    test("🔴 Sad Path: should return 404 Not Found when attempting to delete another user's wallet", async () => {
      // Arrange: 1. สร้าง User A พร้อม Wallet
      const { testUser: userA } = await createTestUserWithToken();
      const userAWallet = await prisma.wallet.create({
        data: {
          userId: userA.id,
          name: "[TEST] User A - Protected Wallet",
        },
      });

      // Arrange: 2. สร้าง User B ( attacker )
      const { authHeader: authHeaderB } = await createTestUserWithToken();

      // Act: User B พยายามลบ Wallet ของ User A
      const res = await app.request(
        `/api/v1/wallets/${userAWallet.id.toString()}`,
        {
          method: "DELETE",
          headers: {
            ...authHeaderB,
          },
        },
      );

      // Assert 1: ตอบกลับ 404 Not Found
      expect(res.status).toBe(404);

      // Assert 2: ข้อมูล Wallet ของ User A ใน DB ต้องยังคงอยู่ (ไม่ถูกลบจริง)
      const walletStillExistsInDb = await prisma.wallet.findUnique({
        where: { id: userAWallet.id },
      });
      expect(walletStillExistsInDb).not.toBeNull();
    });
  });
  // -------------------------------------------------------------------
  // 📁 Sub-Describe 6: GET /api/v1/wallets/:id/balance (getWalletBalance)
  // -------------------------------------------------------------------
  describe("GET /api/v1/wallets/:id/balance", () => {
    test("🟢 Happy Path: should return correct wallet balance when requesting own wallet ID", async () => {
      // Arrange: 1. สร้าง User A พร้อม Token และ Wallet
      const { testUser: userA, authHeader: authHeaderA } =
        await createTestUserWithToken();
      const targetWallet = await prisma.wallet.create({
        data: {
          userId: userA.id,
          name: "[TEST] User A - Primary Wallet",
        },
      });

      // Act: ยิง GET /api/v1/wallets/:id/balance
      const res = await app.request(
        `/api/v1/wallets/${targetWallet.id.toString()}/balance`,
        {
          method: "GET",
          headers: {
            ...authHeaderA,
          },
        },
      );

      const body = await res.json();

      // Assert
      expect(res.status).toBe(200);
      expect(body).toHaveProperty("balance");
    });

    test("🔴 Sad Path: should return 401 Unauthorized when no auth token provided", async () => {
      // Act
      const res = await app.request("/api/v1/wallets/1/balance", {
        method: "GET",
      });

      // Assert
      expect(res.status).toBe(401);
    });

    test("🔴 Sad Path: should return 404 Not Found when wallet ID does not exist", async () => {
      // Arrange
      const { authHeader } = await createTestUserWithToken();
      const nonExistentId = "999999";

      // Act
      const res = await app.request(
        `/api/v1/wallets/${nonExistentId}/balance`,
        {
          method: "GET",
          headers: {
            ...authHeader,
          },
        },
      );

      // Assert
      expect(res.status).toBe(404);
    });

    test("🔴 Sad Path: should return 404 Not Found when attempting to access another user's wallet balance", async () => {
      // Arrange: 1. สร้าง User A พร้อม Wallet
      const { testUser: userA } = await createTestUserWithToken();
      const userAWallet = await prisma.wallet.create({
        data: {
          userId: userA.id,
          name: "[TEST] User A - Secret Savings",
        },
      });

      // Arrange: 2. สร้าง User B ( attacker )
      const { authHeader: authHeaderB } = await createTestUserWithToken();

      // Act: User B พยายามส่อง Balance ของ User A
      const res = await app.request(
        `/api/v1/wallets/${userAWallet.id.toString()}/balance`,
        {
          method: "GET",
          headers: {
            ...authHeaderB,
          },
        },
      );

      // Assert: ต้องมองไม่เจอ (404)
      expect(res.status).toBe(404);
    });
  });
});
