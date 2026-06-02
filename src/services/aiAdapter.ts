import type { RegionCandidate, Subject, WrongQuestionDraft } from "../domain/wrongQuestion";

export type AiAdapterFailureReason =
  | "image_missing"
  | "region_missing"
  | "region_image_missing"
  | "region_detection_failed"
  | "recognition_failed"
  | "real_ai_disabled"
  | "external_ai_not_authorized"
  | "region_image_unsupported"
  | "provider_not_configured"
  | "provider_request_failed"
  | "provider_response_invalid";

export interface AiAdapterFailure {
  ok: false;
  reason: AiAdapterFailureReason;
  message: string;
  retryable?: boolean;
}

export interface AiRuntimeStatus {
  enabled: boolean;
  configured: boolean;
  provider: string;
  model: string;
  mode: "mock" | "real";
  message: string;
}

export interface AiRuntimeConfigurationInput {
  apiKey: string;
  model: string;
}

export type AiRuntimeConfigurationResult =
  | { ok: true; status: AiRuntimeStatus }
  | { ok: false; message: string; status?: AiRuntimeStatus };

export interface DetectRegionsInput {
  imageUri: string;
}

export interface DetectRegionsSuccess {
  ok: true;
  candidates: RegionCandidate[];
}

export interface RecognizeQuestionInput {
  subject: Subject | "auto";
  imageUri: string;
  selectedRegion: RegionCandidate;
  selectedRegionImageUri: string;
}

export interface RecognizeQuestionSuccess {
  ok: true;
  draft: WrongQuestionDraft;
}

export interface AiAdapter {
  detectRegions(input: DetectRegionsInput): Promise<DetectRegionsSuccess | AiAdapterFailure>;
  recognizeQuestion(
    input: RecognizeQuestionInput,
  ): Promise<RecognizeQuestionSuccess | AiAdapterFailure>;
}
