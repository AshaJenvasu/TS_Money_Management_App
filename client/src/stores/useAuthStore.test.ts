import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const STORAGE_KEY = "auth-storage";

// localStorage จำลองแบบ in-memory (test รันใน environment node ที่ไม่มี localStorage)
function stubLocalStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
  // zustand persist ข้ามการเก็บลง storage เมื่อไม่มี window (ถือว่า SSR) และอ่านผ่าน window.localStorage
  vi.stubGlobal("window", { localStorage: storage });
  vi.stubGlobal("localStorage", storage);
  return data;
}

// โหลด store ใหม่ทุกครั้ง เพื่อให้ persist อ่าน localStorage ที่จำลองไว้ตอนสร้าง store
async function loadStore() {
  vi.resetModules();
  return (await import("./useAuthStore")).useAuthStore;
}

describe("useAuthStore persistence", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("never writes a token to localStorage after login", async () => {
    const data = stubLocalStorage();
    const store = await loadStore();

    store.getState().setAuth({ id: "1", email: "a@example.com" });

    const stored = JSON.parse(data.get(STORAGE_KEY) ?? "{}");
    expect(stored.state).toEqual({ user: { id: "1", email: "a@example.com" } });
    expect(JSON.stringify(stored)).not.toContain("token");
  });

  it("drops the JWT that older versions saved in localStorage, keeping the user", async () => {
    const data = stubLocalStorage({
      [STORAGE_KEY]: JSON.stringify({
        state: { token: "eyJ.old.jwt", user: { id: "7", username: "old" } },
        version: 0,
      }),
    });

    const store = await loadStore();

    expect(store.getState().user).toEqual({ id: "7", username: "old" });
    expect("token" in store.getState()).toBe(false);
    // เขียนทับ localStorage ด้วยเวอร์ชันใหม่ที่ไม่มี token แล้ว
    const stored = JSON.parse(data.get(STORAGE_KEY) ?? "{}");
    expect(stored.version).toBe(1);
    expect(JSON.stringify(stored)).not.toContain("eyJ.old.jwt");
  });

  it("clears the user on logout", async () => {
    const data = stubLocalStorage();
    const store = await loadStore();
    store.getState().setAuth({ id: "1" });

    store.getState().logout();

    expect(store.getState().user).toBeNull();
    expect(JSON.parse(data.get(STORAGE_KEY) ?? "{}").state.user).toBeNull();
  });
});
