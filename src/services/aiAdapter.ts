import type { RegionCandidate, Subject, WrongQuestionDraft } from "../domain/wrongQuestion";

export type AiAdapterFailureReason =
  | "image_missing"
  | "region_missing"
  | "region_detection_failed"
  | "recognition_failed";

export interface AiAdapterFailure {
  ok: false;
  reason: AiAdapterFailureReason;
  message: string;
}

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
