import "@testing-library/jest-dom/vitest";
import { beforeEach } from "vitest";

const storage = createMemoryStorage();

Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: storage,
});

beforeEach(() => {
  storage.clear();
});

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}
