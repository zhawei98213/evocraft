import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join } from "node:path";

const workspace = mkdtempSync(join(tmpdir(), "evocraft-ai-eval-summary-"));
const inputPath = join(workspace, "results.jsonl");
const outputPath = join(workspace, "reports", "summary.md");

const rows = [
  JSON.stringify({
    sampleId: "math-geometry-001",
    subject: "math",
    ok: true,
    elapsedMs: 110,
    result: {
      ok: true,
      message: "SENSITIVE_FULL_MESSAGE_SHOULD_NOT_APPEAR",
      draft: {
        questionText: "OCR_SECRET_PHRASE should never appear in committed summaries.",
        reviewItems: [{ label: "diagram", status: "需复核" }],
        providerMeta: {
          rawText: "PROVIDER_RAW_TEXT_SHOULD_NOT_APPEAR",
        },
      },
      providerRawText: "PROVIDER_RAW_TOP_LEVEL_SHOULD_NOT_APPEAR",
      requestBody: {
        authorization: "Authorization: Bearer sk-live-top-secret-value",
        imageUri: "data:image/png;base64,AAAA",
      },
    },
  }),
  JSON.stringify({
    sampleId: "english-reading-001",
    subject: "english",
    ok: false,
    elapsedMs: 40,
    result: {
      ok: false,
      reason: "provider_request_failed",
      message: "SENSITIVE_FAILURE_MESSAGE_SHOULD_NOT_APPEAR Authorization: Bearer api-key-123456",
      providerRawText: "RAW_PROVIDER_FAILURE_TEXT_SHOULD_NOT_APPEAR",
    },
  }),
  "{not valid json",
  JSON.stringify({
    sampleId: "chinese-reading-001",
    subject: "chinese",
    ok: true,
    elapsedMs: 310,
    result: {
      ok: true,
      message: "SECOND_SENSITIVE_MESSAGE_SHOULD_NOT_APPEAR",
      draft: {
        questionText: "OCR_SECOND_SECRET should not be printed.",
        reviewItems: [{ label: "subject", status: "需复核" }],
      },
      provider: {
        rawResponse: "PROVIDER_RAW_RESPONSE_SECOND_SHOULD_NOT_APPEAR",
      },
      request: {
        body: {
          token: "Bearer another-super-secret-token",
        },
      },
    },
  }),
  JSON.stringify({
    sampleId: "math-algebra-001",
    subject: "math",
    ok: false,
    elapsedMs: 530,
    result: {
      ok: false,
      reason: "provider_response_invalid",
      message: "THIRD_SENSITIVE_MESSAGE_SHOULD_NOT_APPEAR",
      ocrText: "OCR_THIRD_SECRET should remain private.",
    },
  }),
  JSON.stringify({
    sampleId: "auto-review-001",
    subject: "auto",
    ok: true,
    elapsedMs: 90,
    result: {
      ok: true,
      reviewItems: [{ label: "top-level-review", status: "需复核" }],
      message: "TOP_LEVEL_REVIEW_MESSAGE_SHOULD_NOT_APPEAR",
    },
  }),
  JSON.stringify({
    sampleId: "bad-reason-001",
    subject: "math",
    ok: false,
    elapsedMs: 70,
    result: {
      ok: false,
      reason: "Authorization: Bearer reason-secret-token should not appear",
      message: "BAD_REASON_MESSAGE_SHOULD_NOT_APPEAR",
    },
  }),
  JSON.stringify({
    sampleId: "bad-subject-001",
    subject: "Authorization: Bearer subject-secret-token",
    ok: true,
    elapsedMs: 80,
    result: {
      ok: true,
      message: "BAD_SUBJECT_MESSAGE_SHOULD_NOT_APPEAR",
    },
  }),
  JSON.stringify(null),
  JSON.stringify("primitive row should count as malformed"),
  JSON.stringify({
    sampleId: "mixed-review-items-001",
    subject: "english",
    ok: true,
    elapsedMs: 120,
    result: {
      ok: true,
      draft: { reviewItems: [] },
      reviewItems: [{ label: "fallback-review", status: "需复核" }],
      message: "MIXED_REVIEW_MESSAGE_SHOULD_NOT_APPEAR",
    },
  }),
];

writeFileSync(inputPath, `${rows.join("\n")}\n`, "utf8");
mkdirSync(join(workspace, "reports"), { recursive: true });

const summaryRun = spawnSync(process.execPath, ["scripts/summarize-ai-eval-results.mjs", inputPath, outputPath], {
  encoding: "utf8",
});

assert.equal(summaryRun.status, 0, `summary reporter should succeed: ${summaryRun.stderr || summaryRun.stdout}`);

const summary = readFileSync(outputPath, "utf8");
const combinedOutput = `${summaryRun.stdout}\n${summaryRun.stderr}\n${summary}`;

assert.match(summary, /Total samples:\s*8/);
assert.match(summary, /Malformed rows:\s*3/);
assert.match(summary, /Successful rows:\s*5/);
assert.match(summary, /Failed rows:\s*3/);
assert.match(summary, /Rows with review items:\s*4/);
assert.match(summary, /Median elapsed ms:\s*100/);
assert.match(summary, /math:\s*3/);
assert.match(summary, /english:\s*2/);
assert.match(summary, /chinese:\s*1/);
assert.match(summary, /auto:\s*1/);
assert.match(summary, /redacted_subject:\s*1/);
assert.match(summary, /provider_request_failed:\s*1/);
assert.match(summary, /provider_response_invalid:\s*1/);
assert.match(summary, /redacted_failure_reason:\s*1/);

for (const forbiddenPattern of [
  /OCR_SECRET_PHRASE/,
  /OCR_SECOND_SECRET/,
  /OCR_THIRD_SECRET/,
  /data:image/i,
  /Authorization:/i,
  /Bearer\s+[A-Za-z0-9._-]+/i,
  /api-key-[A-Za-z0-9._-]+/i,
  /requestBody/i,
  /rawResponse/i,
  /providerRawText/i,
  /SENSITIVE_FULL_MESSAGE_SHOULD_NOT_APPEAR/,
  /SENSITIVE_FAILURE_MESSAGE_SHOULD_NOT_APPEAR/,
  /SECOND_SENSITIVE_MESSAGE_SHOULD_NOT_APPEAR/,
  /THIRD_SENSITIVE_MESSAGE_SHOULD_NOT_APPEAR/,
  /TOP_LEVEL_REVIEW_MESSAGE_SHOULD_NOT_APPEAR/,
  /BAD_REASON_MESSAGE_SHOULD_NOT_APPEAR/,
  /reason-secret-token/,
  /subject-secret-token/,
  /BAD_SUBJECT_MESSAGE_SHOULD_NOT_APPEAR/,
  /MIXED_REVIEW_MESSAGE_SHOULD_NOT_APPEAR/,
  new RegExp(escapeRegExp(workspace)),
  new RegExp(escapeRegExp(inputPath)),
  new RegExp(escapeRegExp(outputPath)),
]) {
  assert.doesNotMatch(combinedOutput, forbiddenPattern);
}

assert.doesNotMatch(summaryRun.stdout, /summary\.md/);
assert.equal(hasAbsolutePathFragment(summaryRun.stdout), false);
assert.equal(hasAbsolutePathFragment(summaryRun.stderr), false);

const usageRun = spawnSync(process.execPath, ["scripts/summarize-ai-eval-results.mjs"], { encoding: "utf8" });
assert.equal(usageRun.status, 2, "usage errors should exit with code 2");
assert.match(usageRun.stderr, /Usage:/);

const missingInputPath = join(workspace, "private", "missing.jsonl");
const missingInputRun = spawnSync(
  process.execPath,
  ["scripts/summarize-ai-eval-results.mjs", missingInputPath, outputPath],
  { encoding: "utf8" },
);
assert.equal(missingInputRun.status, 1);
assert.doesNotMatch(`${missingInputRun.stdout}\n${missingInputRun.stderr}`, new RegExp(escapeRegExp(missingInputPath)));
assert.equal(hasAbsolutePathFragment(missingInputRun.stderr), false);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasAbsolutePathFragment(value) {
  return value
    .split(/\s+/)
    .some((part) => isAbsolute(part.replace(/[.:,;]+$/, "")));
}
