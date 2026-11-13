import { Redis } from "@upstash/redis";

// Upstash Redis (HTTP REST) อ่านค่า UPSTASH_REDIS_REST_URL และ UPSTASH_REDIS_REST_TOKEN จาก env
export const redis = Redis.fromEnv();
