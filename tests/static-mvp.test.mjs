import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "app/index.html",
  "app/styles.css",
  "app/main.js",
  "app/state.js",
];

for (const file of requiredFiles) {
  assert.ok(existsSync(file), `${file} should exist for the static MVP`);
}

const html = readFileSync("app/index.html", "utf8");
const main = readFileSync("app/main.js", "utf8");
const css = readFileSync("app/styles.css", "utf8");
for (const marker of [
  "data-screen=\"hub\"",
  "data-screen=\"upload\"",
  "data-screen=\"select-region\"",
  "data-screen=\"review\"",
  "data-screen=\"records\"",
  "data-screen=\"detail\"",
  "id=\"image-input\"",
  "id=\"privacy-consent\"",
  "id=\"region-canvas-image\"",
  "id=\"region-overlay\"",
  "id=\"region-candidate-list\"",
  "id=\"region-error\"",
  "id=\"records-list\"",
  "id=\"save-error\"",
  "data-action=\"start-region-selection\"",
  "data-action=\"confirm-region\"",
  "data-action=\"manual-region\"",
  "data-action=\"go-records\"",
  "data-action=\"delete-record\"",
  "data-action=\"clear-records\"",
]) {
  assert.ok(html.includes(marker), `index.html should include ${marker}`);
}

assert.ok(main.includes("delete-region"), "main.js should render delete-region controls");
assert.ok(main.includes("privacyAcknowledged"), "main.js should gate processing behind privacy acknowledgement");
assert.ok(main.includes("storageStatus"), "main.js should surface local storage success and failure states");
assert.ok(
  css.includes(".records-list .record-open") &&
    css.includes("grid-template-columns: 148px minmax(0, 1fr) auto;"),
  "records list should keep image, text, and open affordance inside the record-open grid",
);

const state = await import("../app/state.js");

const candidates = state.createMockRegionCandidates();
assert.equal(candidates.length, 3);
assert.equal(candidates[0].unit, "ratio");
assert.equal(candidates[0].source, "ai_candidate");
assert.ok(candidates[0].width > 0);
assert.ok(candidates[0].height > 0);

const deletedCurrent = state.deleteRegionCandidate(candidates, "candidate-2", "candidate-2");
assert.equal(deletedCurrent.regionCandidates.length, 2);
assert.equal(deletedCurrent.selectedRegionId, "candidate-3");

const deletedLast = state.deleteRegionCandidate(deletedCurrent.regionCandidates, "candidate-3", "candidate-3");
assert.equal(deletedLast.regionCandidates.length, 1);
assert.equal(deletedLast.selectedRegionId, "candidate-1");

const deletedAll = state.deleteRegionCandidate(deletedLast.regionCandidates, "candidate-1", "candidate-1");
assert.deepEqual(deletedAll.regionCandidates, []);
assert.equal(deletedAll.selectedRegionId, null);

const deleteUnselected = state.deleteRegionCandidate(candidates, "candidate-1", "candidate-2");
assert.equal(deleteUnselected.regionCandidates.length, 2);
assert.equal(deleteUnselected.selectedRegionId, "candidate-2");

const draft = state.createMockRecognition({
  subject: "math",
  imageUri: "data:image/png;base64,seed",
  selectedRegion: candidates[1],
  selectedRegionImageUri: "data:image/png;base64,region",
});

assert.equal(draft.appId, "wrong_question_capture");
assert.equal(draft.subject, "math");
assert.equal(draft.recognitionStatus, "needs_review");
assert.equal(draft.cleanupStatus, "needs_review");
assert.ok(draft.questionText.includes("如图"));
assert.ok(draft.cleanedQuestionImageUri.startsWith("data:image/svg+xml"));
assert.deepEqual(draft.selectedRegion, candidates[1]);
assert.equal(draft.selectedRegionImageUri, "data:image/png;base64,region");
assert.equal(draft.modelTraces[0].provider, "mock");
assert.equal(draft.modelTraces[0].task, "region_detection");
assert.equal(draft.modelTraces[1].task, "ocr");

const record = state.createRecordFromDraft(draft, {
  title: "一次函数图像与坐标综合题",
  now: "2026-05-10T08:00:00.000Z",
});
const englishDraft = state.createMockRecognition({
  subject: "english",
  imageUri: "data:image/png;base64,seed-2",
  selectedRegion: candidates[0],
  selectedRegionImageUri: "data:image/png;base64,region-2",
});
const secondRecord = state.createRecordFromDraft(englishDraft, {
  id: "wq-second",
  now: "2026-05-11T08:00:00.000Z",
});

assert.equal(record.appId, "wrong_question_capture");
assert.equal(record.title, "一次函数图像与坐标综合题");
assert.equal(record.createdAt, "2026-05-10T08:00:00.000Z");
assert.equal(record.updatedAt, "2026-05-10T08:00:00.000Z");
assert.equal(record.recognitionStatus, "reviewed");
assert.equal(record.cleanupStatus, "reviewed");
assert.ok(record.originalImageUri);
assert.ok(record.cleanedQuestionImageUri);
assert.deepEqual(record.selectedRegion, candidates[1]);
assert.equal(record.selectedRegionImageUri, "data:image/png;base64,region");
assert.ok(Array.isArray(record.modelTraces));

const deleteSelected = state.deleteRecord([record, secondRecord], record.id, record.id);
assert.equal(deleteSelected.records.length, 1);
assert.equal(deleteSelected.records[0].id, "wq-second");
assert.equal(deleteSelected.selectedRecordId, "wq-second");

const deleteUnselectedRecord = state.deleteRecord([record, secondRecord], record.id, secondRecord.id);
assert.equal(deleteUnselectedRecord.records.length, 1);
assert.equal(deleteUnselectedRecord.selectedRecordId, "wq-second");

const deleteOnlyRecord = state.deleteRecord([record], record.id, record.id);
assert.deepEqual(deleteOnlyRecord.records, []);
assert.equal(deleteOnlyRecord.selectedRecordId, null);

const deleteMissingRecord = state.deleteRecord([record], "missing", record.id);
assert.equal(deleteMissingRecord.records.length, 1);
assert.notEqual(deleteMissingRecord.records[0], record);
assert.equal(deleteMissingRecord.selectedRecordId, record.id);

const memoryStorage = createMemoryStorage();
const persistResult = state.persistRecords([record], memoryStorage);
assert.deepEqual(persistResult, { ok: true });
assert.equal(JSON.parse(memoryStorage.getItem(state.STORAGE_KEY)).length, 1);

const failingStorage = {
  setItem() {
    throw new Error("quota exceeded");
  },
};
const failingPersist = state.persistRecords([record], failingStorage);
assert.equal(failingPersist.ok, false);
assert.equal(failingPersist.reason, "storage_write_failed");

const clearResult = state.clearStoredRecords(memoryStorage);
assert.deepEqual(clearResult, { ok: true });
assert.equal(memoryStorage.getItem(state.STORAGE_KEY), null);

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}
