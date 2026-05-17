import { describe, expect, it } from "vitest";

import { createMockRegionCandidates } from "../domain/wrongQuestion";
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
    expect(result.draft.modelTraces.map((trace) => trace.task)).toEqual([
      "region_detection",
      "ocr",
      "structure",
      "cleanup",
    ]);
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
