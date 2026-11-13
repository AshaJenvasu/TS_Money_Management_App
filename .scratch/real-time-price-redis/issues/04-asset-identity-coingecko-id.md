# 04 — Asset identity: เปลี่ยนจาก ticker symbol เป็น CoinGecko coin id

**Status:** เสร็จ (backend + frontend ฟอร์มสร้าง asset) รอทดสอบบนเบราว์เซอร์
**Depends on:** 01
**Blocks:** 03 (ตามลำดับที่ตกลง), ปิด ticket 02 ให้สมบูรณ์ (ฟอร์มสร้าง asset ฝั่ง frontend)
**ADR:** `docs/adr/ADR-0001-realtime-crypto-price-caching.md`

## ปัญหา

ticker symbol ซ้ำกันได้ (เหรียญเล็กใช้ symbol เดียวกับเหรียญใหญ่) ทำให้ได้ราคาผิดเหรียญแบบเงียบ ๆ และ P&L ผิดโดยไม่มีสัญญาณเตือน

## เป้าหมาย

ผูก asset กับ CoinGecko id ที่ไม่กำกวม แทนการเดาจาก ticker symbol

## การเปลี่ยนแปลง

1. DB migration: เพิ่ม column `coingeckoId` (nullable, string) ใน `assets`
2. Backend ใหม่: `GET /assets/search-coins?q=...` proxy ไป CoinGecko `/search?query=...` แบบ real-time ทุกครั้ง (ไม่เก็บรายชื่อเหรียญในฐานข้อมูลเอง) คืน `{id, symbol, name}[]`
3. Asset creation flow: เปลี่ยนจากพิมพ์ symbol มือเป็นค้นหา + เลือกจาก dropdown (ใช้ endpoint ข้อ 2) บังคับมี `coingeckoId` เมื่อสร้าง asset ประเภท crypto; ยังเก็บ `symbol` เป็น display label
4. `price.provider.ts`: เปลี่ยนจาก `symbols=` เป็น `ids=` (ใช้ `coingeckoId`), cache key เป็น `price:thb:<coingeckoId>`
5. ข้อมูลเดิม: ตรวจแล้ว (2026-11-13) DB local มี asset เดียวคือ `BTC` ของ user ทดสอบ (`[TEST] Bitcoin`) ลบทิ้งได้ ไม่ต้องเขียน backfill; ก่อน deploy จริงให้ตรวจ DB production อีกครั้ง

## TDD plan (ทีละ slice)

1. RED: `GET /assets/search-coins` (mock CoinGecko `/search`) → GREEN
2. ตามด้วย: 401 ถ้าไม่ login, 400 ถ้า `q` ว่าง, CoinGecko ล้ม, `POST /assets` บังคับ `coingeckoId` สำหรับ crypto
3. ปรับ test เดิมของ price provider ให้ใช้ `ids=` แทน `symbols=`

## หมายเหตุสำหรับ implementation

- route `/assets/search-coins` ต้องลงทะเบียนก่อน `/assets/{id}` ไม่งั้น `{id}` จะรับ "search-coins" ไปก่อน
