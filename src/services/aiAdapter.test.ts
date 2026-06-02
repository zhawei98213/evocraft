import { describe, expect, it, vi } from "vitest";

import { createMockRecognition, createMockRegionCandidates } from "../domain/wrongQuestion";
import { createDesktopAiAdapter } from "./desktopAiAdapter";
import { mockAiAdapter } from "./mockAiAdapter";

describe("mockAiAdapter", () => {
  it("returns selectable region candidates", async () => {
    const result = await mockAiAdapter.detectRegions({
      imageUri: "data:image/png;base64,original",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.candidates).toHaveLength(3);
    expect(result.candidates[1]).toMatchObject({
      id: "candidate-2",
      source: "ai_candidate",
    });
  });

  it("recognizes a confirmed region into a reviewed draft contract", async () => {
    const selectedRegion = createMockRegionCandidates()[1];
    const result = await mockAiAdapter.recognizeQuestion({
      subject: "math",
      imageUri: "data:image/png;base64,original",
      selectedRegion,
      selectedRegionImageUri: "data:image/png;base64,region",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.draft.subject).toBe("math");
    expect(result.draft.selectedRegion).toEqual(selectedRegion);
    expect(result.draft.reviewItems.some((item) => item.status === "需复核")).toBe(true);
    expect(result.draft.modelTraces.every((trace) => Boolean(trace.provider))).toBe(true);
    expect(result.draft.modelTraces.every((trace) => Boolean(trace.modelId))).toBe(true);
    expect(result.draft.correctAnswer).not.toContain("模型推理");
    expect(result.draft.modelTraces.map((trace) => trace.task)).toEqual([
      "region_detection",
      "ocr",
      "structure",
      "cleanup",
    ]);
  });

  it("returns a recoverable failure when the selected region image is missing", async () => {
    const selectedRegion = createMockRegionCandidates()[1];
    const result = await mockAiAdapter.recognizeQuestion({
      subject: "math",
      imageUri: "data:image/png;base64,original",
      selectedRegion,
      selectedRegionImageUri: "",
    });

    expect(result).toEqual({
      ok: false,
      reason: "region_image_missing",
      message: "题目区域截图生成失败，请重新确认区域。",
    });
  });

  it("returns recoverable failures for empty image input", async () => {
    const regionResult = await mockAiAdapter.detectRegions({ imageUri: "" });

    expect(regionResult).toEqual({
      ok: false,
      reason: "image_missing",
      message: "请先选择一张错题照片。",
    });
  });
});

describe("createDesktopAiAdapter", () => {
  it("delegates detectRegions and recognizeQuestion to the desktop bridge", async () => {
    const mockDraft = createMockRecognition();
    const regionInput = {
      imageUri: "data:image/png;base64,source",
    };
    const selectedRegion = createMockRegionCandidates()[0];
    const recognizeInput = {
      subject: "math" as const,
      imageUri: "data:image/png;base64,source",
      selectedRegion,
      selectedRegionImageUri: "data:image/png;base64,region",
    };
    const detectRegions = vi.fn(async () => ({
      ok: true as const,
      candidates: createMockRegionCandidates(),
    }));
    const recognizeQuestion = vi.fn(async () => ({
      ok: true as const,
      draft: mockDraft,
    }));
    const desktopAdapter = createDesktopAiAdapter({
      selectImage: async () => null,
      readImageAsDataUrl: async () => "data:image/png;base64,file",
      loadRecords: async () => [],
      saveRecords: async () => ({ ok: true as const }),
      clearRecords: async () => ({ ok: true as const }),
      getAiRuntimeStatus: async () => ({
        enabled: false,
        configured: false,
        provider: "qwen",
        model: "qwen-vl-ocr-latest",
        mode: "mock",
        message: "",
      }),
      detectRegions,
      recognizeQuestion,
    });

    const regionResult = await desktopAdapter.detectRegions(regionInput);
    const recognizeResult = await desktopAdapter.recognizeQuestion(recognizeInput);

    expect(regionResult).toEqual({
      ok: true,
      candidates: createMockRegionCandidates(),
    });
    expect(detectRegions).toHaveBeenCalledWith(regionInput);
    expect(recognizeResult).toEqual({
      ok: true,
      draft: mockDraft,
    });
    expect(recognizeQuestion).toHaveBeenCalledWith(recognizeInput);
  });
});
