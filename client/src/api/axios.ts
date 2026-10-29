import axios from "axios";

export const api = axios.create({
  baseURL: "/api/v1", // ปรับ URL ตาม Backend
  withCredentials: true, // สำคัญมาก! สำหรับให้ Cookie ติดไปด้วย
  headers: {
    "Content-Type": "application/json",
  },
});
