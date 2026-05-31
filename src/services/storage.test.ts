import { describe, expect, it } from "vitest";

import { createMockRecognition, createRecordFromDraft } from "../domain/wrongQuestion";
import { createLocalStorageRecordStore } from "./storage";

describe("createLocalStorageRecordStore", () => {
  it("saves and loads records", async () => {
    const storage = createMemoryStorage();
    const store = createLocalStorageRecordStore(storage);
    const record = createRecordFromDraft(createMockRecognition(), {
      id: "wq-storage",
      now: "2026-05-17T08:00:00.000Z",
    });

    await expect(store.save([record])).resolves.toEqual({ ok: true });
    await expect(store.load()).resolves.toEqual([record]);
  });

  it("returns a recoverable write failure", async () => {
    const store = createLocalStorageRecordStore({
      getItem: () => null,
      setItem: () => {
        throw new Error("quota exceeded");
      },
      removeItem: () => undefined,
    });

    await expect(store.save([])).resolves.toEqual({
      ok: false,
      reason: "storage_write_failed",
    });
  });

  it("clears records", async () => {
    const storage = createMemoryStorage();
    const store = createLocalStorageRecordStore(storage);
    const record = createRecordFromDraft(createMockRecognition(), {
      id: "wq-clear",
      now: "2026-05-17T08:00:00.000Z",
    });

    await store.save([record]);

    await expect(store.clear()).resolves.toEqual({ ok: true });
    await expect(store.load()).resolves.toEqual([]);
  });
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
