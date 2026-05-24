import type { WrongQuestionRecord } from "../domain/wrongQuestion";
import type { StorageFailure, StorageResult } from "./storage";

export interface EvoCraftDesktopApi {
  selectImage(): Promise<string | null>;
  readImageAsDataUrl(filePath: string): Promise<string>;
  loadRecords(): Promise<WrongQuestionRecord[]>;
  saveRecords(records: WrongQuestionRecord[]): Promise<StorageResult | StorageFailure>;
  clearRecords(): Promise<StorageResult | StorageFailure>;
}

declare global {
  interface Window {
    evocraft?: EvoCraftDesktopApi;
  }
}

export function getDesktopBridge() {
  if (typeof window === "undefined") return null;

  return window.evocraft ?? null;
}
