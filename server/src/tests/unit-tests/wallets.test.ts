import { describe, test, expect } from "vitest";

describe("Wallets", () => {
  // GET /wallets
  describe("GET /wallets", () => {
    // 1. เคสถูกต้อง
    test("should return user's wallets when userId is valid", () => {
      expect(false).toBe(true);
    });

    // 2. เคสไม่มี Auth
    test("should return 401 when unauthorized", () => {
      expect(false).toBe(true);
    });

    // 3. เคส JWT ไม่ถูกต้อง
    test("should return 401 when JWT is invalid", () => {
      expect(false).toBe(true);
    });

    // 4. เคสถูกต้องแต่ไม่มี Wallet
    test("should return 200 with empty array when user has no wallets", () => {
      expect(false).toBe(true);
    });

    // 5. เคสเกิด Server Error
    test("should return 500 when unexpected error occurs", () => {
      expect(false).toBe(true);
    });
  });
  // POST /wallets
  describe("POST /wallets", () => {
    // เคสสร้าง Wallet สำเร็จ
    test("should return 201 when wallet is created successfully", () => {
      expect(false).toBe(true);
    });

    // เคสไม่ได้ส่ง Auth Header
    test("should return 401 when unauthorized", () => {
      expect(false).toBe(true);
    });

    // เคส JWT ไม่ถูกต้อง
    test("should return 401 when JWT is invalid", () => {
      expect(false).toBe(true);
    });

    // เคสข้อมูลใน Request Body ไม่ถูกต้อง
    test("should return 400 when request body is invalid", () => {
      expect(false).toBe(true);
    });

    // เคสชื่อ Wallet ซ้ำในระบบ
    test("should return 409 when wallet name already exists", () => {
      expect(false).toBe(true);
    });

    // เคสเกิดข้อผิดพลาดไม่คาดคิดภายในเซิร์ฟเวอร์
    test("should return 500 when unexpected error occurs", () => {
      expect(false).toBe(true);
    });
  });
  // GET /wallets/:id
  describe("GET /wallets/:id", () => {
    // เคสดึงข้อมูล Wallet สำเร็จตาม ID
    test("should return 200 with wallet data when id and userId are valid", () => {
      expect(false).toBe(true);
    });

    // เคสไม่ได้ส่ง Auth Header
    test("should return 401 when unauthorized", () => {
      expect(false).toBe(true);
    });

    // เคส JWT ไม่ถูกต้อง
    test("should return 401 when JWT is invalid", () => {
      expect(false).toBe(true);
    });

    // เคสไม่พบ Wallet หรือไม่มีสิทธิ์เข้าถึงข้อมูล
    test("should return 404 when wallet is not found", () => {
      expect(false).toBe(true);
    });

    // เคสเกิดข้อผิดพลาดไม่คาดคิดภายในเซิร์ฟเวอร์
    test("should return 500 when unexpected error occurs", () => {
      expect(false).toBe(true);
    });
  });
  // PUT /wallets/:id
  describe("PUT /wallets/:id", () => {
    // เคสอัปเดต Wallet สำเร็จ
    test("should return 200 when wallet is updated successfully", () => {
      expect(false).toBe(true);
    });

    // เคสไม่ได้ส่ง Auth Header
    test("should return 401 when unauthorized", () => {
      expect(false).toBe(true);
    });

    // เคส JWT ไม่ถูกต้อง
    test("should return 401 when JWT is invalid", () => {
      expect(false).toBe(true);
    });

    // เคสส่ง Request Body ไม่ถูกต้อง
    test("should return 400 when request body is invalid", () => {
      expect(false).toBe(true);
    });

    // เคสไม่พบ Wallet หรือไม่มีสิทธิ์แก้ไข
    test("should return 404 when wallet is not found", () => {
      expect(false).toBe(true);
    });

    // เคสชื่อ Wallet ใหม่ไปซ้ำกับที่มีอยู่แล้ว
    test("should return 409 when wallet name already exists", () => {
      expect(false).toBe(true);
    });

    // เคสเกิดข้อผิดพลาดไม่คาดคิดภายในเซิร์ฟเวอร์
    test("should return 500 when unexpected error occurs", () => {
      expect(false).toBe(true);
    });
  });
  // DELETE /wallets/:id
  describe("Wallets", () => {
    describe("DELETE /wallets/:id", () => {
      // เคสลบ Wallet สำเร็จ
      test("should return 204 when wallet is deleted successfully", () => {
        expect(false).toBe(true);
      });

      // เคสไม่ได้ส่ง Auth Header
      test("should return 401 when unauthorized", () => {
        expect(false).toBe(true);
      });

      // เคส JWT ไม่ถูกต้อง
      test("should return 401 when JWT is invalid", () => {
        expect(false).toBe(true);
      });

      // เคสไม่พบ Wallet หรือไม่มีสิทธิ์ลบ
      test("should return 404 when wallet is not found", () => {
        expect(false).toBe(true);
      });

      // เคสเกิดข้อผิดพลาดไม่คาดคิดภายในเซิร์ฟเวอร์
      test("should return 500 when unexpected error occurs", () => {
        expect(false).toBe(true);
      });
    });
  });
  // GET /wallets/:id/balance
  describe("GET /wallets/:id/balance", () => {
    // เคสดึงและคำนวณยอดเงินคงเหลือสดสำเร็จ
    test("should return 200 with calculated balance when id and userId are valid", () => {
      expect(false).toBe(true);
    });

    // เคสไม่ได้ส่ง Auth Header
    test("should return 401 when unauthorized", () => {
      expect(false).toBe(true);
    });

    // เคส JWT ไม่ถูกต้อง
    test("should return 401 when JWT is invalid", () => {
      expect(false).toBe(true);
    });

    // เคสไม่พบ Wallet หรือไม่มีสิทธิ์เข้าถึงข้อมูล
    test("should return 404 when wallet is not found", () => {
      expect(false).toBe(true);
    });

    // เคสเกิดข้อผิดพลาดไม่คาดคิดภายในเซิร์ฟเวอร์
    test("should return 500 when unexpected error occurs", () => {
      expect(false).toBe(true);
    });
  });
});
