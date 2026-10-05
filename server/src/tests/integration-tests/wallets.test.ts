import { describe, test, expect } from "vitest";
// อิมพอร์ต app ของ hono ที่เราวางแผนจะเขียนในอนาคต
import app from "../../index";

// การทดสอบการเรียกใช้ API GET /wallets
describe("Integration Test: GET /wallets", () => {
  // เคสถูกต้อง ดึงข้อมูลกระเป๋าเงินสำเร็จตามรหัสผู้ใช้
  test("1. ควรคืนค่า 200 พร้อมรายการ Wallet ของ User เมื่อส่ง JWT ถูกต้อง", async () => {
    // ยิง request จริงผ่าน app.request ของ Hono
    const res = await app.request("/wallets", {
      method: "GET",
      headers: {
        Authorization: "Bearer valid_token_here",
      },
    });

    expect(res.status).toBe(200);
  });

  // เคสผู้ใช้งานไม่ได้ส่งโทเค็นระบุตัวตน
  test("2. ควรคืนค่า 401 Unauthorized เมื่อไม่มีการส่ง Header Authorization", async () => {
    const res = await app.request("/wallets", {
      method: "GET",
    });

    expect(res.status).toBe(401);
  });

  // เคสการยืนยันตัวตนด้วยโทเค็นไม่ถูกต้อง
  test("3. ควรคืนค่า 401 Unauthorized เมื่อส่ง JWT ไม่ถูกต้องหรือหมดอายุ", async () => {
    const res = await app.request("/wallets", {
      method: "GET",
      headers: {
        Authorization: "Bearer invalid_token",
      },
    });

    expect(res.status).toBe(401);
  });

  // เคสถูกต้องแต่ไม่พบข้อมูลกระเป๋าเงินในระบบ
  test("4. ควรคืนค่า 200 พร้อมอาร์เรย์ว่าง เมื่อผู้ใช้ยังไม่มี Wallet ในฐานข้อมูล", async () => {
    const res = await app.request("/wallets", {
      method: "GET",
      headers: {
        Authorization: "Bearer user_with_no_wallet_token",
      },
    });

    expect(res.status).toBe(200);
  });

  // เคสเกิดข้อผิดพลาดไม่คาดคิดจากระบบหรือฐานข้อมูล
  test("5. ควรคืนค่า 500 Server Error เมื่อระบบเกิดข้อผิดพลาดภายใน", async () => {
    const res = await app.request("/wallets", {
      method: "GET",
      headers: {
        Authorization: "Bearer cause_error_token",
      },
    });

    expect(res.status).toBe(500);
  });
});
// การทดสอบการเรียกใช้ API POST /wallets
describe("Integration Test: POST /wallets", () => {
  // เคสสร้าง Wallet สำเร็จเมื่อส่งข้อมูลครบถ้วนพร้อม JWT
  test("1. ควรคืนค่า 201 พร้อมข้อความสำเร็จ เมื่อสร้าง Wallet สำเร็จ", async () => {
    const res = await app.request("/wallets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid_token_here",
      },
      body: JSON.stringify({ name: "Savings" }),
    });

    expect(res.status).toBe(201);
  });

  // เคสไม่ได้ส่ง Header Authorization
  test("2. ควรคืนค่า 401 Unauthorized เมื่อไม่มีการส่ง Header Authorization", async () => {
    const res = await app.request("/wallets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "Savings" }),
    });

    expect(res.status).toBe(401);
  });

  // เคสส่ง JWT ไม่ถูกต้องหรือหมดอายุ
  test("3. ควรคืนค่า 401 Unauthorized เมื่อส่ง JWT ไม่ถูกต้อง", async () => {
    const res = await app.request("/wallets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer invalid_token",
      },
      body: JSON.stringify({ name: "Savings" }),
    });

    expect(res.status).toBe(401);
  });

  // เคสส่ง Request Body ไม่ถูกต้องตาม Zod Schema
  test("4. ควรคืนค่า 400 Bad Request เมื่อส่ง Request Body 不ถูกต้องหรือลืมส่งชื่อ", async () => {
    const res = await app.request("/wallets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid_token_here",
      },
      body: JSON.stringify({ name: "" }),
    });

    expect(res.status).toBe(400);
  });

  // เคสตั้งชื่อ Wallet ซ้ำกับที่มีอยู่แล้วในระบบของผู้ใช้
  test("5. ควรคืนค่า 409 Conflict เมื่อสร้าง Wallet ด้วยชื่อที่ซ้ำเดิม", async () => {
    const res = await app.request("/wallets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid_token_here",
      },
      body: JSON.stringify({ name: "Duplicate Wallet Name" }),
    });

    expect(res.status).toBe(409);
  });

  // เคสเกิดข้อผิดพลาดไม่คาดคิดภายในระบบหรือฐานข้อมูล
  test("6. ควรคืนค่า 500 Internal Error เมื่อเกิดข้อผิดพลาดในเซิร์ฟเวอร์", async () => {
    const res = await app.request("/wallets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer cause_error_token",
      },
      body: JSON.stringify({ name: "Trigger Error" }),
    });

    expect(res.status).toBe(500);
  });
});
// การทดสอบ API GET /wallets/:id
describe("Integration Test: GET /wallets/:id", () => {
  // เคสดึงข้อมูล Wallet สำเร็จเมื่อส่ง ID และ JWT ถูกต้อง
  test("1. ควรคืนค่า 200 พร้อมข้อมูล Wallet เมื่อส่ง ID และ JWT ถูกต้อง", async () => {
    const res = await app.request("/wallets/1", {
      method: "GET",
      headers: {
        Authorization: "Bearer valid_token_here",
      },
    });

    expect(res.status).toBe(200);
  });

  // เคสไม่ได้ส่ง Header Authorization
  test("2. ควรคืนค่า 401 Unauthorized เมื่อไม่มีการส่ง Header Authorization", async () => {
    const res = await app.request("/wallets/1", {
      method: "GET",
    });

    expect(res.status).toBe(401);
  });

  // เคสส่ง JWT ไม่ถูกต้องหรือหมดอายุ
  test("3. ควรคืนค่า 401 Unauthorized เมื่อส่ง JWT ไม่ถูกต้อง", async () => {
    const res = await app.request("/wallets/1", {
      method: "GET",
      headers: {
        Authorization: "Bearer invalid_token",
      },
    });

    expect(res.status).toBe(401);
  });

  // เคสไม่พบ Wallet หรือไม่มีสิทธิ์เข้าถึงข้อมูลกระเป๋านั้น
  test("4. ควรคืนค่า 404 Not Found เมื่อไม่พบ ID หรือเป็นของ User อื่น", async () => {
    const res = await app.request("/wallets/999999", {
      method: "GET",
      headers: {
        Authorization: "Bearer valid_token_here",
      },
    });

    expect(res.status).toBe(404);
  });

  // เคสเกิดข้อผิดพลาดไม่คาดคิดภายในระบบหรือฐานข้อมูล
  test("5. ควรคืนค่า 500 Internal Error เมื่อเกิดข้อผิดพลาดในเซิร์ฟเวอร์", async () => {
    const res = await app.request("/wallets/1", {
      method: "GET",
      headers: {
        Authorization: "Bearer cause_error_token",
      },
    });

    expect(res.status).toBe(500);
  });
});
// การทดสอบ API PUT /wallets/:id
describe("Integration Test: PUT /wallets/:id", () => {
  // เคสแก้ไขข้อมูล Wallet สำเร็จเมื่อส่งข้อมูลครบถ้วนพร้อม JWT
  test("1. ควรคืนค่า 200 พร้อมข้อความสำเร็จ เมื่ออัปเดต Wallet สำเร็จ", async () => {
    const res = await app.request("/wallets/1", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid_token_here",
      },
      body: JSON.stringify({ name: "Updated Wallet Name" }),
    });

    expect(res.status).toBe(200);
  });

  // เคสไม่ได้ส่ง Header Authorization
  test("2. ควรคืนค่า 401 Unauthorized เมื่อไม่มีการส่ง Header Authorization", async () => {
    const res = await app.request("/wallets/1", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "Updated Wallet Name" }),
    });

    expect(res.status).toBe(401);
  });

  // เคสส่ง JWT ไม่ถูกต้องหรือหมดอายุ
  test("3. ควรคืนค่า 401 Unauthorized เมื่อส่ง JWT ไม่ถูกต้อง", async () => {
    const res = await app.request("/wallets/1", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer invalid_token",
      },
      body: JSON.stringify({ name: "Updated Wallet Name" }),
    });

    expect(res.status).toBe(401);
  });

  // เคสส่ง Request Body ไม่ถูกต้อง
  test("4. ควรคืนค่า 400 Bad Request เมื่อส่ง Request Body 不ถูกต้องหรือชื่อว่างเปล่า", async () => {
    const res = await app.request("/wallets/1", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid_token_here",
      },
      body: JSON.stringify({ name: "" }),
    });

    expect(res.status).toBe(400);
  });

  // เคสไม่พบ Wallet หรือเป็นของ User คนอื่น
  test("5. ควรคืนค่า 404 Not Found เมื่อไม่พบ ID หรือไม่มีสิทธิ์เข้าถึง", async () => {
    const res = await app.request("/wallets/999999", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid_token_here",
      },
      body: JSON.stringify({ name: "Updated Wallet Name" }),
    });

    expect(res.status).toBe(404);
  });

  // เคสแก้ไขชื่อไปซ้ำกับ Wallet อื่นที่มีอยู่แล้ว
  test("6. ควรคืนค่า 409 Conflict เมื่อตั้งชื่อใหม่ซ้ำกับ Wallet เดิมที่มีอยู่", async () => {
    const res = await app.request("/wallets/1", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid_token_here",
      },
      body: JSON.stringify({ name: "Duplicate Wallet Name" }),
    });

    expect(res.status).toBe(409);
  });

  // เคสเกิดข้อผิดพลาดไม่คาดคิดภายในระบบหรือฐานข้อมูล
  test("7. ควรคืนค่า 500 Internal Error เมื่อเกิดข้อผิดพลาดในเซิร์ฟเวอร์", async () => {
    const res = await app.request("/wallets/1", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer cause_error_token",
      },
      body: JSON.stringify({ name: "Trigger Error" }),
    });

    expect(res.status).toBe(500);
  });
});
// การทดสอบ API DELETE /wallets/:id
describe("Integration Test: DELETE /wallets/:id", () => {
  // เคสลบข้อมูล Wallet สำเร็จเมื่อส่ง ID และ JWT ถูกต้อง
  test("1. ควรคืนค่า 204 No Content เมื่อลบ Wallet สำเร็จ", async () => {
    const res = await app.request("/wallets/1", {
      method: "DELETE",
      headers: {
        Authorization: "Bearer valid_token_here",
      },
    });

    expect(res.status).toBe(204);
  });

  // เคสไม่ได้ส่ง Header Authorization
  test("2. ควรคืนค่า 401 Unauthorized เมื่อไม่มีการส่ง Header Authorization", async () => {
    const res = await app.request("/wallets/1", {
      method: "DELETE",
    });

    expect(res.status).toBe(401);
  });

  // เคสส่ง JWT ไม่ถูกต้องหรือหมดอายุ
  test("3. ควรคืนค่า 401 Unauthorized เมื่อส่ง JWT ไม่ถูกต้อง", async () => {
    const res = await app.request("/wallets/1", {
      method: "DELETE",
      headers: {
        Authorization: "Bearer invalid_token",
      },
    });

    expect(res.status).toBe(401);
  });

  // เคสไม่พบ Wallet หรือเป็นของ User คนอื่น
  test("4. ควรคืนค่า 404 Not Found เมื่อไม่พบ ID หรือไม่มีสิทธิ์เข้าถึง", async () => {
    const res = await app.request("/wallets/999999", {
      method: "DELETE",
      headers: {
        Authorization: "Bearer valid_token_here",
      },
    });

    expect(res.status).toBe(404);
  });

  // เคสเกิดข้อผิดพลาดไม่คาดคิดภายในระบบหรือฐานข้อมูล
  test("5. ควรคืนค่า 500 Internal Error เมื่อเกิดข้อผิดพลาดในเซิร์ฟเวอร์", async () => {
    const res = await app.request("/wallets/1", {
      method: "DELETE",
      headers: {
        Authorization: "Bearer cause_error_token",
      },
    });

    expect(res.status).toBe(500);
  });
});
// การทดสอบ API GET /wallets/:id/balance
describe("Integration Test: GET /wallets/:id/balance", () => {
  // เคสดึงข้อมูล Balance สดสำเร็จเมื่อส่ง ID และ JWT ถูกต้อง
  test("1. ควรคืนค่า 200 พร้อมยอดเงินคำนวณสด { wallet_id, balance }", async () => {
    const res = await app.request("/wallets/1/balance", {
      method: "GET",
      headers: {
        Authorization: "Bearer valid_token_here",
      },
    });

    expect(res.status).toBe(200);
  });

  // เคสไม่ได้ส่ง Header Authorization
  test("2. ควรคืนค่า 401 Unauthorized เมื่อไม่มีการส่ง Header Authorization", async () => {
    const res = await app.request("/wallets/1/balance", {
      method: "GET",
    });

    expect(res.status).toBe(401);
  });

  // เคสส่ง JWT ไม่ถูกต้องหรือหมดอายุ
  test("3. ควรคืนค่า 401 Unauthorized เมื่อส่ง JWT ไม่ถูกต้อง", async () => {
    const res = await app.request("/wallets/1/balance", {
      method: "GET",
      headers: {
        Authorization: "Bearer invalid_token",
      },
    });

    expect(res.status).toBe(401);
  });

  // เคสไม่พบ Wallet หรือไม่มีสิทธิ์เข้าถึงข้อมูลกระเป๋านั้น
  test("4. ควรคืนค่า 404 Not Found เมื่อไม่พบ ID หรือเป็นของ User อื่น", async () => {
    const res = await app.request("/wallets/999999/balance", {
      method: "GET",
      headers: {
        Authorization: "Bearer valid_token_here",
      },
    });

    expect(res.status).toBe(404);
  });

  // เคสเกิดข้อผิดพลาดไม่คาดคิดภายในระบบหรือฐานข้อมูล
  test("5. ควรคืนค่า 500 Internal Error เมื่อเกิดข้อผิดพลาดในเซิร์ฟเวอร์", async () => {
    const res = await app.request("/wallets/1/balance", {
      method: "GET",
      headers: {
        Authorization: "Bearer cause_error_token",
      },
    });

    expect(res.status).toBe(500);
  });
});
