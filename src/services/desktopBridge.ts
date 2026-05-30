import type { WrongQuestionRecord } from "../domain/wrongQuestion";
import type {
  AiAdapterFailure,
  AiRuntimeStatus,
  DetectRegionsInput,
  DetectRegionsSuccess,
  RecognizeQuestionInput,
  RecognizeQuestionSuccess,
} from "./aiAdapter";
import type { StorageFailure, StorageResult } from "./storage";

export interface EvoCraftDesktopApi {
  selectImage(): Promise<string | null>;
  readImageAsDataUrl(filePath: string): Promise<string>;
  loadRecords(): Promise<WrongQuestionRecord[]>;
  saveRecords(records: WrongQuestionRecord[]): Promise<StorageResult | StorageFailure>;
  clearRecords(): Promise<StorageResult | StorageFailure>;
  getAiRuntimeStatus?(): Promise<AiRuntimeStatus>;
  setExternalAiAuthorization?(acknowledged: boolean): Promise<{ ok: true }>;
  detectRegions?(input: DetectRegionsInput): Promise<DetectRegionsSuccess | AiAdapterFailure>;
  recognizeQuestion?(
    input: RecognizeQuestionInput,
  ): Promise<RecognizeQuestionSuccess | AiAdapterFailure>;
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
