import { describe, expect, it } from "vitest";

import {
  createMockRecognition,
  createMockRegionCandidates,
  createRecordFromDraft,
} from "../../domain/wrongQuestion";
import { createInitialWrongQuestionState, wrongQuestionReducer } from "./wrongQuestionReducer";

describe("wrongQuestionReducer", () => {
  it("gates region selection behind image and privacy acknowledgement", () => {
    const initial = createInitialWrongQuestionState([]);

    const noImage = wrongQuestionReducer(initial, { type: "START_REGION_SELECTION" });
    expect(noImage.uploadError).toBe("请先选择一张错题照片。");

    const withImage = wrongQuestionReducer(initial, {
      type: "IMAGE_SELECTED",
      imageUri: "data:image/png;base64,original",
      fileName: "question.png",
      fileMeta: "1.2 MB",
    });
    const blocked = wrongQuestionReducer(withImage, { type: "START_REGION_SELECTION" });
    expect(blocked.uploadError).toBe("请先确认本地隐私说明。");
  });

  it("enters region selection when privacy is acknowledged", () => {
    const state = createInitialWrongQuestionState([]);
    const withImage = wrongQuestionReducer(state, {
      type: "IMAGE_SELECTED",
      imageUri: "data:image/png;base64,original",
      fileName: "question.png",
      fileMeta: "1.2 MB",
    });
    const acknowledged = wrongQuestionReducer(withImage, {
      type: "PRIVACY_ACKNOWLEDGED",
      acknowledged: true,
    });
    const selecting = wrongQuestionReducer(acknowledged, {
      type: "REGION_CANDIDATES_READY",
      candidates: createMockRegionCandidates(),
    });

    expect(selecting.screen).toBe("select-region");
    expect(selecting.selectedRegionId).toBe("candidate-2");
  });

  it("saves a reviewed draft at the top of the notebook", () => {
    const draft = createMockRecognition();
    const initialRecord = createRecordFromDraft(createMockRecognition(), {
      id: "wq-existing",
      now: "2026-05-17T08:00:00.000Z",
    });
    const state = {
      ...createInitialWrongQuestionState([initialRecord]),
      draft,
    };

    const saved = wrongQuestionReducer(state, {
      type: "RECORD_SAVED",
      record: createRecordFromDraft(draft, {
        id: "wq-new",
        now: "2026-05-17T09:00:00.000Z",
      }),
    });

    expect(saved.records.map((record) => record.id)).toEqual(["wq-new", "wq-existing"]);
    expect(saved.selectedRecordId).toBe("wq-new");
    expect(saved.screen).toBe("detail");
  });
});
