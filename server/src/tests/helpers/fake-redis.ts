// Fake ของ Upstash Redis สำหรับ test: in-memory รองรับ get/set(ex)/incr/expire(NX)/ttl ตามเวลาจริงของ Date.now
// (จึงใช้ vi.useFakeTimers({ toFake: ["Date"] }) เลื่อนเวลาเพื่อทดสอบการหมดอายุได้)
const store = new Map<string, { value: unknown; expiresAt: number | null }>();

export const fakeRedis = {
  store,
  // ตั้งเป็น true เพื่อจำลอง Redis ล่ม (ทุก command จะ throw)
  failing: false,
  // จำลองล่มเฉพาะบาง command (เช่น อ่านได้แต่เขียนไม่ได้) และเลือก error ที่ throw ได้
  // เช่น TypeError("fetch() URL is invalid") แบบที่ @upstash/redis ขว้างเมื่อ UPSTASH_REDIS_REST_URL ผิดรูปแบบ
  failingCommands: new Set<string>(),
  failureError: new Error("redis down") as Error,

  reset() {
    store.clear();
    fakeRedis.failing = false;
    fakeRedis.failingCommands.clear();
    fakeRedis.failureError = new Error("redis down");
  },

  client: {
    async get(key: string) {
      fakeRedis.assertUp("get");
      return fakeRedis.readLive(key)?.value ?? null;
    },

    async set(key: string, value: unknown, opts?: { ex?: number }) {
      fakeRedis.assertUp("set");
      store.set(key, {
        value,
        expiresAt: opts?.ex ? Date.now() + opts.ex * 1000 : null,
      });
      return "OK";
    },

    async incr(key: string) {
      fakeRedis.assertUp("incr");
      const entry = fakeRedis.readLive(key);
      if (!entry) {
        store.set(key, { value: 1, expiresAt: null });
        return 1;
      }
      entry.value = Number(entry.value) + 1;
      return entry.value as number;
    },

    // เหมือน Redis: key ที่ไม่มี (หรือหมดอายุแล้ว) จะถูกสร้างใหม่จาก 0 แบบไม่มีอายุ แล้วลดเป็น -1
    async decr(key: string) {
      fakeRedis.assertUp("decr");
      const entry = fakeRedis.readLive(key);
      if (!entry) {
        store.set(key, { value: -1, expiresAt: null });
        return -1;
      }
      entry.value = Number(entry.value) - 1;
      return entry.value as number;
    },

    async del(key: string) {
      fakeRedis.assertUp("del");
      return store.delete(key) ? 1 : 0;
    },

    async expire(key: string, seconds: number, option?: "NX") {
      fakeRedis.assertUp("expire");
      const entry = fakeRedis.readLive(key);
      if (!entry) return 0;
      if (option === "NX" && entry.expiresAt !== null) return 0;
      entry.expiresAt = Date.now() + seconds * 1000;
      return 1;
    },

    // ตรงกับ Redis: -2 = ไม่มี key, -1 = ไม่มีอายุ, ไม่งั้นคืนวินาทีที่เหลือ
    async ttl(key: string) {
      fakeRedis.assertUp("ttl");
      const entry = fakeRedis.readLive(key);
      if (!entry) return -2;
      if (entry.expiresAt === null) return -1;
      return Math.ceil((entry.expiresAt - Date.now()) / 1000);
    },
  },

  assertUp(command: string) {
    if (fakeRedis.failing || fakeRedis.failingCommands.has(command)) {
      throw fakeRedis.failureError;
    }
  },

  readLive(key: string) {
    const entry = store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt !== null && Date.now() >= entry.expiresAt) {
      store.delete(key);
      return undefined;
    }
    return entry;
  },
};
