import { STORAGE_KEY, type WrongQuestionRecord } from "../domain/wrongQuestion";

export type StorageFailureReason =
  | "storage_unavailable"
  | "storage_read_failed"
  | "storage_write_failed"
  | "storage_clear_failed";

export interface StorageResult {
  ok: true;
}

export interface StorageFailure {
  ok: false;
  reason: StorageFailureReason;
}

export interface RecordStore {
  load(): Promise<WrongQuestionRecord[]>;
  save(records: WrongQuestionRecord[]): Promise<StorageResult | StorageFailure>;
  clear(): Promise<StorageResult | StorageFailure>;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function createLocalStorageRecordStore(storage: StorageLike | undefined): RecordStore {
  return {
    async load() {
      if (!storage) return [];

      try {
        const raw = storage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as WrongQuestionRecord[]) : [];
      } catch {
        return [];
      }
    },

    async save(records) {
      if (!storage) return { ok: false, reason: "storage_unavailable" };

      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(records));
        return { ok: true };
      } catch {
        return { ok: false, reason: "storage_write_failed" };
      }
    },

    async clear() {
      if (!storage) return { ok: false, reason: "storage_unavailable" };

      try {
        storage.removeItem(STORAGE_KEY);
        return { ok: true };
      } catch {
        return { ok: false, reason: "storage_clear_failed" };
      }
    },
  };
}
