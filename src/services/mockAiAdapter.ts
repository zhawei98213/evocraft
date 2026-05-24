import {
  createMockRecognition,
  createMockRegionCandidates,
  type Subject,
} from "../domain/wrongQuestion";
import type { AiAdapter } from "./aiAdapter";

function normalizeSubject(subject: Subject | "auto"): Subject {
  return subject === "auto" ? "math" : subject;
}

export const mockAiAdapter: AiAdapter = {
  async detectRegions(input) {
    if (!input.imageUri) {
      return {
        ok: false,
        reason: "image_missing",
        message: "请先选择一张错题照片。",
      };
    }

    return {
      ok: true,
      candidates: createMockRegionCandidates(),
    };
  },

  async recognizeQuestion(input) {
    if (!input.imageUri) {
      return {
        ok: false,
        reason: "image_missing",
        message: "请先选择一张错题照片。",
      };
    }

    if (!input.selectedRegion) {
      return {
        ok: false,
        reason: "region_missing",
        message: "请先选择或手动画出一道题目区域。",
      };
    }

    if (!input.selectedRegionImageUri) {
      return {
        ok: false,
        reason: "region_image_missing",
        message: "题目区域截图生成失败，请重新确认区域。",
      };
    }

    return {
      ok: true,
      draft: createMockRecognition({
        subject: normalizeSubject(input.subject),
        imageUri: input.imageUri,
        selectedRegion: input.selectedRegion,
        selectedRegionImageUri: input.selectedRegionImageUri,
      }),
    };
  },
};
