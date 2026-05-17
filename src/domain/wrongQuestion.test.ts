import { describe, expect, it } from "vitest";

import {
  STORAGE_KEY,
  createMockRecognition,
  createMockRegionCandidates,
  createRecordFromDraft,
  deleteRecord,
  deleteRegionCandidate,
} from "./wrongQuestion";

describe("wrongQuestion domain", () => {
  it("creates typed region candidates", () => {
    const candidates = createMockRegionCandidates();

    expect(candidates).toHaveLength(3);
    expect(candidates[0]).toMatchObject({
      id: "candidate-1",
      unit: "ratio",
      source: "ai_candidate",
    });
  });

  it("moves selection after deleting the selected region", () => {
    const candidates = createMockRegionCandidates();
    const result = deleteRegionCandidate(candidates, "candidate-2", "candidate-2");

    expect(result.regionCandidates.map((candidate) => candidate.id)).toEqual([
      "candidate-1",
      "candidate-3",
    ]);
    expect(result.selectedRegionId).toBe("candidate-3");
  });

  it("creates a reviewed record from a draft", () => {
    const selectedRegion = createMockRegionCandidates()[1];
    const draft = createMockRecognition({
      subject: "math",
      imageUri: "data:image/png;base64,original",
      selectedRegion,
      selectedRegionImageUri: "data:image/png;base64,region",
      now: "2026-05-17T08:00:00.000Z",
    });

    const record = createRecordFromDraft(draft, {
      id: "wq-fixed",
      now: "2026-05-17T09:00:00.000Z",
    });

    expect(record.id).toBe("wq-fixed");
    expect(record.appId).toBe("wrong_question_capture");
    expect(record.recognitionStatus).toBe("reviewed");
    expect(record.cleanupStatus).toBe("reviewed");
    expect(record.selectedRegionImageUri).toBe("data:image/png;base64,region");
    expect(record.modelTraces[0]).toMatchObject({
      provider: "mock",
      task: "region_detection",
    });
  });

  it("keeps immutable record deletion behavior", () => {
    const candidates = createMockRegionCandidates();
    const first = createRecordFromDraft(
      createMockRecognition({ selectedRegion: candidates[0] }),
      { id: "wq-first", now: "2026-05-17T08:00:00.000Z" },
    );
    const second = createRecordFromDraft(
      createMockRecognition({ selectedRegion: candidates[1] }),
      { id: "wq-second", now: "2026-05-17T09:00:00.000Z" },
    );

    const result = deleteRecord([first, second], "wq-first", "wq-first");

    expect(result.records).toHaveLength(1);
    expect(result.records[0].id).toBe("wq-second");
    expect(result.selectedRecordId).toBe("wq-second");
  });

  it("uses the v1 storage key", () => {
    expect(STORAGE_KEY).toBe("evocraft.wrongQuestion.records.v1");
  });
});
