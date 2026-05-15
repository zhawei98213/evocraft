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
for (const marker of [
  "data-screen=\"hub\"",
  "data-screen=\"upload\"",
  "data-screen=\"select-region\"",
  "data-screen=\"review\"",
  "data-screen=\"records\"",
  "data-screen=\"detail\"",
  "id=\"image-input\"",
  "id=\"region-canvas-image\"",
  "id=\"region-overlay\"",
  "id=\"region-candidate-list\"",
  "id=\"records-list\"",
  "data-action=\"start-region-selection\"",
  "data-action=\"confirm-region\"",
  "data-action=\"manual-region\"",
  "data-action=\"go-records\"",
]) {
  assert.ok(html.includes(marker), `index.html should include ${marker}`);
}

assert.ok(main.includes("delete-region"), "main.js should render delete-region controls");

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
