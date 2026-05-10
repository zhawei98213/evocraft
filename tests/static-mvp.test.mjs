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
for (const marker of [
  "data-screen=\"hub\"",
  "data-screen=\"upload\"",
  "data-screen=\"review\"",
  "data-screen=\"detail\"",
  "id=\"image-input\"",
]) {
  assert.ok(html.includes(marker), `index.html should include ${marker}`);
}

const state = await import("../app/state.js");

const draft = state.createMockRecognition({
  subject: "math",
  imageUri: "data:image/png;base64,seed",
});

assert.equal(draft.appId, "wrong_question_capture");
assert.equal(draft.subject, "math");
assert.equal(draft.recognitionStatus, "needs_review");
assert.equal(draft.cleanupStatus, "needs_review");
assert.ok(draft.questionText.includes("如图"));
assert.ok(draft.cleanedQuestionImageUri.startsWith("data:image/svg+xml"));

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
