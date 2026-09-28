import axios from "axios";
import { useAuthStore } from "../stores/useAuthStore";

export const api = axios.create({
  baseURL: "http://localhost:3000/api/v1", // ปรับ URL ตาม Backend
  withCredentials: true, // สำคัญมาก! สำหรับให้ Cookie ติดไปด้วย
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
