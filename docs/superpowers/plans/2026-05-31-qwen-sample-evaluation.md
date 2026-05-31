# Qwen Sample Evaluation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a safe, repeatable Qwen small-sample evaluation workflow for 10-15 local sanitized wrong-question photos.

**Architecture:** Keep private samples and raw provider output in ignored local paths. Strengthen the existing Node eval runner with manifest validation, add a redacted summary reporter, then run the local evaluation only when samples and credentials are present. Commit only contracts, tests, scripts, documentation, and redacted aggregate conclusions.

**Tech Stack:** Node ESM scripts, built-in `node:test` style assertions through standalone `.mjs` tests, existing Qwen adapter, npm scripts, git ignore privacy gates.

---

## File Structure

- Modify `scripts/evaluate-ai-samples.mjs`: add CLI parsing, manifest validation, `--validate-only`, `--allow-small-set`, and safer per-sample row fields.
- Create `scripts/summarize-ai-eval-results.mjs`: read ignored JSONL result files and write redacted JSON/Markdown summaries.
- Modify `tests/ai-eval-config.test.mjs`: cover manifest validation source, privacy gates, and new npm scripts.
- Create `tests/ai-eval-summary.test.mjs`: cover summary aggregation and redaction behavior.
- Modify `package.json`: add `test:ai-eval-summary` and include it in `npm test` or `test:ai-eval-config`.
- Modify `ai-eval/README.md`: document sample preparation, validation, run, summary, and redaction workflow.
- Modify `ai-eval/samples/manifest.example.json`: align with the stricter manifest contract from the design.
- Create `docs/testing/ai-eval/README.md`: define where redacted summaries live and what cannot be committed.
- Later, after local samples exist, create `docs/testing/ai-eval/<date>-qwen-sample-evaluation-summary.md`: redacted first-run conclusion only.

Private files that must remain untracked:

- `ai-eval/samples/manifest.local.json`
- `ai-eval/samples/private/**`
- `ai-eval/results/*.jsonl`
- `ai-eval/results/*.json`
- `.env*`

---

## Task 0: Preflight And Privacy Gate

**Files:**
- Modify: `docs/superpowers/agent-runs/2026-05-31-qwen-sample-evaluation/agents/task-00-preflight.md`
- Modify: `docs/superpowers/agent-runs/2026-05-31-qwen-sample-evaluation/README.md`
- No application-code changes.

- [ ] **Step 1: Confirm branch and PR base**

Run:

```bash
git status --short --branch
git log --oneline --decorate -5
git merge-base --is-ancestor aafafbc39b105ef1a46f662beee13c211851d226 origin/main; echo $?
```

Expected:

- Branch is `codex/qwen-sample-evaluation`.
- The merge-base check prints `0`, proving the real-AI migration is in `origin/main`.
- No uncommitted code changes before Task 0 starts.

- [ ] **Step 2: Confirm privacy ignore gates**

Run:

```bash
git check-ignore --quiet .env
git check-ignore --quiet .env.local
git check-ignore --quiet ai-eval/samples/manifest.local.json
git check-ignore --quiet ai-eval/samples/private/math.jpg
git check-ignore --quiet ai-eval/results/result-123.jsonl
git check-ignore --quiet ai-eval/results/summary-123.json
```

Expected: every command exits `0`.

- [ ] **Step 3: Confirm baseline tests**

Run:

```bash
npm run test:ai-eval-config
npm test
git diff --check
```

Expected:

- `npm run test:ai-eval-config` exits `0`.
- `npm test` exits `0`.
- `git diff --check` exits `0`.

- [ ] **Step 4: Update Task 0 log and commit**

Record commands and results in:

- `docs/superpowers/agent-runs/2026-05-31-qwen-sample-evaluation/agents/task-00-preflight.md`
- `docs/superpowers/agent-runs/2026-05-31-qwen-sample-evaluation/README.md`

Commit:

```bash
git add docs/superpowers/agent-runs/2026-05-31-qwen-sample-evaluation
git commit -m "Record Qwen sample evaluation preflight"
```

---

## Task 1: Manifest Validation And Dry Run

**Files:**
- Modify: `scripts/evaluate-ai-samples.mjs`
- Modify: `tests/ai-eval-config.test.mjs`
- Modify: `ai-eval/samples/manifest.example.json`
- Modify: `ai-eval/README.md`
- Modify: `package.json` only if a new script name is needed.
- Modify: `docs/superpowers/agent-runs/2026-05-31-qwen-sample-evaluation/agents/task-01-manifest-validation.md`

- [ ] **Step 1: Write failing validation tests**

Extend `tests/ai-eval-config.test.mjs` with temp manifest checks using `spawnSync`.

Add helpers near the bottom:

```js
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function createTempManifest(contents, imageNames = ["sample.jpg"]) {
  const root = mkdtempSync(join(tmpdir(), "evocraft-ai-eval-"));
  mkdirSync(join(root, "private"), { recursive: true });
  for (const imageName of imageNames) {
    writeFileSync(join(root, "private", imageName), "fake image bytes");
  }
  const manifestPath = join(root, "manifest.local.json");
  writeFileSync(manifestPath, JSON.stringify(contents), "utf8");
  return manifestPath;
}

function runValidateOnly(manifestPath, ...extraArgs) {
  return spawnSync(
    process.execPath,
    ["scripts/evaluate-ai-samples.mjs", manifestPath, join(tmpdir(), "unused.jsonl"), "--validate-only", ...extraArgs],
    { encoding: "utf8" },
  );
}
```

Add test cases:

```js
const validSmallManifest = {
  schemaVersion: 1,
  samples: [
    {
      id: "math-geometry-001",
      subject: "math",
      imagePath: "private/sample.jpg",
      labels: ["geometry"],
      expected: {
        targetQuestion: "人工确认区域中的一道题",
        mustNotInferAnswer: true,
        mustPreserveVisualElements: ["geometry-diagram"],
      },
    },
  ],
};

assert.equal(runValidateOnly(createTempManifest(validSmallManifest), "--allow-small-set").status, 0);

const invalidSubject = structuredClone(validSmallManifest);
invalidSubject.samples[0].subject = "science";
assert.notEqual(runValidateOnly(createTempManifest(invalidSubject), "--allow-small-set").status, 0);

const duplicateIds = structuredClone(validSmallManifest);
duplicateIds.samples.push({ ...duplicateIds.samples[0] });
assert.notEqual(runValidateOnly(createTempManifest(duplicateIds), "--allow-small-set").status, 0);

const escapingPath = structuredClone(validSmallManifest);
escapingPath.samples[0].imagePath = "../outside.jpg";
assert.notEqual(runValidateOnly(createTempManifest(escapingPath), "--allow-small-set").status, 0);

const tooSmallWithoutOverride = createTempManifest(validSmallManifest);
assert.notEqual(runValidateOnly(tooSmallWithoutOverride).status, 0);
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
npm run test:ai-eval-config
```

Expected: FAIL because `--validate-only`, `--allow-small-set`, and manifest validation do not exist yet.

- [ ] **Step 3: Implement CLI parsing and validation**

In `scripts/evaluate-ai-samples.mjs`, replace direct `process.argv` reads with:

```js
const args = process.argv.slice(2);
const flags = new Set(args.filter((arg) => arg.startsWith("--")));
const positional = args.filter((arg) => !arg.startsWith("--"));
const manifestPath = positional[0] ?? join(repoRoot, "ai-eval/samples/manifest.local.json");
const outputPath = positional[1] ?? join(repoRoot, `ai-eval/results/result-${Date.now()}.jsonl`);
const validateOnly = flags.has("--validate-only");
const allowSmallSet = flags.has("--allow-small-set");
```

Add validation before provider environment checks:

```js
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
await validateManifest(manifest, manifestPath, { allowSmallSet });

if (validateOnly) {
  console.log(`Manifest is valid: ${manifest.samples.length} samples`);
  process.exit(0);
}
```

Add helper functions:

```js
async function validateManifest(manifest, manifestPath, options = {}) {
  if (manifest?.schemaVersion !== 1) {
    throw new Error("manifest.schemaVersion must be 1");
  }

  if (!Array.isArray(manifest.samples) || manifest.samples.length === 0) {
    throw new Error("manifest.samples must be a non-empty array");
  }

  if (!options.allowSmallSet && (manifest.samples.length < 10 || manifest.samples.length > 15)) {
    throw new Error("first-pass evaluation requires 10-15 samples; use --allow-small-set only for local script tests");
  }

  const ids = new Set();
  for (const sample of manifest.samples) {
    validateSample(sample, ids);
    const imagePath = resolveSampleImagePath(manifestPath, sample.imagePath);
    await readFile(imagePath);
  }
}

function validateSample(sample, ids) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(sample?.id ?? "")) {
    throw new Error("sample.id must use lowercase letters, numbers, and hyphens");
  }
  if (ids.has(sample.id)) {
    throw new Error(`duplicate sample id: ${sample.id}`);
  }
  ids.add(sample.id);

  if (!["chinese", "math", "english", "auto"].includes(sample.subject)) {
    throw new Error(`invalid subject for ${sample.id}`);
  }
  if (typeof sample.imagePath !== "string" || sample.imagePath.startsWith("/") || sample.imagePath.includes("..")) {
    throw new Error(`invalid imagePath for ${sample.id}`);
  }
  if (!Array.isArray(sample.labels) || sample.labels.some((label) => typeof label !== "string")) {
    throw new Error(`labels must be strings for ${sample.id}`);
  }
  if (sample.expected?.mustNotInferAnswer !== true) {
    throw new Error(`expected.mustNotInferAnswer must be true for ${sample.id}`);
  }
  if (!Array.isArray(sample.expected?.mustPreserveVisualElements)) {
    throw new Error(`expected.mustPreserveVisualElements must be an array for ${sample.id}`);
  }
}

function resolveSampleImagePath(manifestPath, imagePath) {
  const samplesRoot = resolve(dirname(manifestPath));
  const resolved = resolve(samplesRoot, imagePath);
  if (!resolved.startsWith(`${samplesRoot}/`)) {
    throw new Error("sample imagePath escapes the manifest directory");
  }
  return resolved;
}
```

Update the main loop to reuse `resolveSampleImagePath(...)`:

```js
const imagePath = resolveSampleImagePath(manifestPath, sample.imagePath);
```

- [ ] **Step 4: Update manifest example**

Change `ai-eval/samples/manifest.example.json` so `imagePath` is relative to the manifest location:

```json
{
  "schemaVersion": 1,
  "samples": [
    {
      "id": "math-geometry-demo",
      "subject": "math",
      "imagePath": "private/math-geometry-demo.jpg",
      "labels": ["geometry", "multi-question-page", "teacher-markup"],
      "expected": {
        "targetQuestion": "只评测人工确认区域中的一道题",
        "mustNotInferAnswer": true,
        "mustPreserveVisualElements": ["geometry-diagram"],
        "notes": "示例文件不入库；真实图片放在本地 ignored private 目录"
      }
    }
  ]
}
```

- [ ] **Step 5: Update README**

Add validation usage to `ai-eval/README.md`:

````md
Validate a local manifest without calling the provider:

```bash
node scripts/evaluate-ai-samples.mjs ai-eval/samples/manifest.local.json ai-eval/results/unused.jsonl --validate-only
```

For script tests or a tiny local smoke set only:

```bash
node scripts/evaluate-ai-samples.mjs ai-eval/samples/manifest.local.json ai-eval/results/unused.jsonl --validate-only --allow-small-set
```
````

- [ ] **Step 6: Run GREEN verification**

Run:

```bash
npm run test:ai-eval-config
npm test
git diff --check
```

Expected: all exit `0`.

- [ ] **Step 7: Commit**

```bash
git add scripts/evaluate-ai-samples.mjs tests/ai-eval-config.test.mjs ai-eval/samples/manifest.example.json ai-eval/README.md package.json docs/superpowers/agent-runs/2026-05-31-qwen-sample-evaluation
git commit -m "Validate local Qwen evaluation manifests"
```

---

## Task 2: Redacted Summary Reporter

**Files:**
- Create: `scripts/summarize-ai-eval-results.mjs`
- Create: `tests/ai-eval-summary.test.mjs`
- Create: `docs/testing/ai-eval/README.md`
- Modify: `package.json`
- Modify: `ai-eval/README.md`
- Modify: `docs/superpowers/agent-runs/2026-05-31-qwen-sample-evaluation/agents/task-02-summary-reporter.md`

- [ ] **Step 1: Write failing summary tests**

Create `tests/ai-eval-summary.test.mjs`:

```js
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = mkdtempSync(join(tmpdir(), "evocraft-ai-summary-"));
const inputPath = join(root, "result.jsonl");
const outputPath = join(root, "summary.md");

writeFileSync(
  inputPath,
  [
    JSON.stringify({
      sampleId: "math-geometry-001",
      subject: "math",
      ok: true,
      elapsedMs: 1234,
      result: { ok: true, reviewItems: [{ status: "需复核", message: "geometry needs review" }] },
    }),
    JSON.stringify({
      sampleId: "english-reading-001",
      subject: "english",
      ok: false,
      elapsedMs: 900,
      result: { ok: false, reason: "provider_response_invalid", message: "raw OCR text must not leak" },
    }),
    "{ malformed json",
  ].join("\n") + "\n",
  "utf8",
);

const result = spawnSync(process.execPath, ["scripts/summarize-ai-eval-results.mjs", inputPath, outputPath], {
  encoding: "utf8",
});

assert.equal(result.status, 0, result.stderr);
const summary = readFileSync(outputPath, "utf8");
assert.match(summary, /Total samples: 2/);
assert.match(summary, /Malformed rows: 1/);
assert.match(summary, /provider_response_invalid/);
assert.match(summary, /math: 1/);
assert.match(summary, /english: 1/);
assert.doesNotMatch(summary, /raw OCR text must not leak/);
assert.doesNotMatch(summary, /data:image\//);
assert.doesNotMatch(summary, /Authorization/i);
```

- [ ] **Step 2: Run test and verify RED**

Run:

```bash
node tests/ai-eval-summary.test.mjs
```

Expected: FAIL because `scripts/summarize-ai-eval-results.mjs` does not exist.

- [ ] **Step 3: Implement summary reporter**

Create `scripts/summarize-ai-eval-results.mjs`:

```js
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
  console.error("Usage: node scripts/summarize-ai-eval-results.mjs <input.jsonl> <output.md>");
  process.exit(2);
}

const text = await readFile(inputPath, "utf8");
const rows = [];
let malformedRows = 0;

for (const line of text.split("\n")) {
  if (!line.trim()) continue;
  try {
    rows.push(JSON.parse(line));
  } catch {
    malformedRows += 1;
  }
}

const subjects = countBy(rows, (row) => row.subject ?? "unknown");
const failureReasons = countBy(
  rows.filter((row) => !row.ok),
  (row) => row.result?.reason ?? "unknown_failure",
);
const okCount = rows.filter((row) => row.ok).length;
const reviewCount = rows.filter((row) =>
  Array.isArray(row.result?.reviewItems) && row.result.reviewItems.length > 0,
).length;
const elapsedMs = rows.map((row) => Number(row.elapsedMs)).filter(Number.isFinite).sort((a, b) => a - b);

const summary = [
  "# Qwen Sample Evaluation Summary",
  "",
  `Total samples: ${rows.length}`,
  `Successful rows: ${okCount}`,
  `Rows with review items: ${reviewCount}`,
  `Failed rows: ${rows.length - okCount}`,
  `Malformed rows: ${malformedRows}`,
  `Median elapsed ms: ${median(elapsedMs) ?? "n/a"}`,
  "",
  "## Subject Counts",
  ...formatCounts(subjects),
  "",
  "## Failure Reasons",
  ...formatCounts(failureReasons),
  "",
  "## Redaction Rules",
  "",
  "- This summary intentionally excludes original images, OCR text, provider raw responses, request bodies, and credentials.",
  "- Use sample ids and aggregate failure reasons only.",
  "",
].join("\n");

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, summary, "utf8");
console.log(`Wrote redacted summary to ${outputPath}`);

function countBy(rows, getKey) {
  const counts = new Map();
  for (const row of rows) {
    const key = getKey(row);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function formatCounts(counts) {
  if (counts.size === 0) return ["- none"];
  return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, count]) => `- ${key}: ${count}`);
}

function median(values) {
  if (values.length === 0) return null;
  return values[Math.floor(values.length / 2)];
}
```

- [ ] **Step 4: Add npm script and README**

In `package.json`, add:

```json
"test:ai-eval-summary": "node tests/ai-eval-summary.test.mjs"
```

Add `tests/ai-eval-summary.test.mjs` to the main `test` script or append it to `test:ai-eval-config`.

Create `docs/testing/ai-eval/README.md`:

```md
# AI Evaluation Summaries

This folder is for redacted, commit-safe summaries derived from local ignored AI evaluation results.

Allowed:

- aggregate counts
- failure reason counts
- latency summaries
- anonymous sample ids
- prompt/schema recommendations

Forbidden:

- original images
- image data URLs
- full OCR text
- child answers or teacher comments copied verbatim
- provider raw responses
- request bodies, headers, API keys, or `.env` content
```

Update `ai-eval/README.md` with:

````md
Create a redacted summary after a local run:

```bash
node scripts/summarize-ai-eval-results.mjs ai-eval/results/result-local.jsonl docs/testing/ai-eval/2026-05-31-qwen-sample-evaluation-summary.md
```
````

- [ ] **Step 5: Run GREEN verification**

Run:

```bash
node tests/ai-eval-summary.test.mjs
npm test
git diff --check
```

Expected: all exit `0`.

- [ ] **Step 6: Commit**

```bash
git add scripts/summarize-ai-eval-results.mjs tests/ai-eval-summary.test.mjs package.json ai-eval/README.md docs/testing/ai-eval/README.md docs/superpowers/agent-runs/2026-05-31-qwen-sample-evaluation
git commit -m "Summarize Qwen eval results without sensitive content"
```

---

## Task 3: Local 10-15 Sample Run

**Files:**
- Private local only: `ai-eval/samples/manifest.local.json`
- Private local only: `ai-eval/samples/private/**`
- Private local only: `ai-eval/results/result-*.jsonl`
- Private local only: `ai-eval/results/summary-*.json`
- Create: `docs/testing/ai-eval/2026-05-31-qwen-sample-evaluation-summary.md`
- Modify: `docs/superpowers/agent-runs/2026-05-31-qwen-sample-evaluation/agents/task-03-local-sample-run.md`

- [ ] **Step 1: Confirm local prerequisites**

Run:

```bash
test -f ai-eval/samples/manifest.local.json
test -n "$DASHSCOPE_API_KEY"
git check-ignore --quiet ai-eval/samples/manifest.local.json
git check-ignore --quiet ai-eval/results/result-local.jsonl
```

Expected:

- All commands exit `0`.
- If either `manifest.local.json` or `DASHSCOPE_API_KEY` is missing, mark Task 3 `blocked` in the agent log and do not fabricate results.

- [ ] **Step 2: Validate manifest without provider calls**

Run:

```bash
node scripts/evaluate-ai-samples.mjs ai-eval/samples/manifest.local.json ai-eval/results/unused.jsonl --validate-only
```

Expected:

- Exit `0`.
- Output includes `Manifest is valid:`.

- [ ] **Step 3: Run Qwen evaluation**

Run:

```bash
EVOCRAFT_AI_EVAL_ENABLED=1 DASHSCOPE_API_KEY="$DASHSCOPE_API_KEY" node scripts/evaluate-ai-samples.mjs ai-eval/samples/manifest.local.json ai-eval/results/result-2026-05-31-qwen.jsonl
```

Expected:

- Exit `0`, unless provider/network/config fails.
- Writes ignored JSONL under `ai-eval/results/`.
- Does not stage any private files.

- [ ] **Step 4: Generate redacted summary**

Run:

```bash
node scripts/summarize-ai-eval-results.mjs ai-eval/results/result-2026-05-31-qwen.jsonl docs/testing/ai-eval/2026-05-31-qwen-sample-evaluation-summary.md
```

Expected:

- Exit `0`.
- Summary has aggregate counts and no raw OCR/provider content.

- [ ] **Step 5: Redaction scan**

Run:

```bash
rg -n "data:image/|DASHSCOPE_API_KEY|Authorization|Bearer|base64|raw OCR|provider raw" docs/testing/ai-eval/2026-05-31-qwen-sample-evaluation-summary.md
git ls-files -- ai-eval/samples/manifest.local.json 'ai-eval/samples/private/*' 'ai-eval/results/*' '.env*'
```

Expected:

- `rg` returns no matches.
- `git ls-files` returns no private sample/result/env paths.

- [ ] **Step 6: Commit redacted summary or blocked log**

If the sample run completed:

```bash
git add docs/testing/ai-eval/2026-05-31-qwen-sample-evaluation-summary.md docs/superpowers/agent-runs/2026-05-31-qwen-sample-evaluation
git commit -m "Record Qwen small-sample evaluation summary"
```

If local samples or credentials are missing:

```bash
git add docs/superpowers/agent-runs/2026-05-31-qwen-sample-evaluation
git commit -m "Record Qwen sample evaluation local blocker"
```

---

## Task 4: Evaluation Review And Next Decision

**Files:**
- Modify: `docs/testing/ai-eval/2026-05-31-qwen-sample-evaluation-summary.md` if created.
- Modify: `docs/planning/evocraft-project-memory.md`
- Modify: `docs/planning/evocraft-roadmap-progress.md`
- Modify: `docs/ideas/2026-05-10-evocraft-seed-capsule.md` if the result changes product/AI direction.
- Modify: `docs/superpowers/agent-runs/2026-05-31-qwen-sample-evaluation/README.md`
- Modify: `docs/superpowers/agent-runs/2026-05-31-qwen-sample-evaluation/agents/task-04-evaluation-review.md`

- [ ] **Step 1: Classify the result**

Use this decision rule:

```text
If valid JSON is stable, no invented answers appear, and failures are mostly reviewable sample/prompt issues:
  decision = expand_to_50_samples
If JSON breaks, subject mapping is unstable, or invented answers appear:
  decision = fix_prompt_or_schema_first
If provider/network/config dominates:
  decision = fix_provider_setup_first
If geometry/formula/table failures dominate after prompt fixes:
  decision = consider_second_provider_ab
```

- [ ] **Step 2: Record recommendation**

Add a `Decision` section to the redacted summary:

```md
## Decision

Recommended next step: `fix_prompt_or_schema_first`

Reason:

- The small sample run returned valid rows for most samples.
- Geometry/公式 samples repeatedly needed review.
- No committed evidence includes raw child content or provider responses.
```

Use the actual decision from Task 3 evidence.

- [ ] **Step 3: Update project memory and progress**

Update `docs/planning/evocraft-roadmap-progress.md` with:

- 本轮任务是什么
- 已完成什么
- 卡在哪里
- 执行的是什么命令
- 下一步的计划

Update `docs/planning/evocraft-project-memory.md` if the decision changes model strategy, prompt/schema priority, or whether to introduce a second provider.

Update `docs/ideas/2026-05-10-evocraft-seed-capsule.md` only if the evaluation changes a durable product principle.

- [ ] **Step 4: Final verification**

Run:

```bash
npm test
git diff --check
git ls-files -- .env .env.local '.env.*' ai-eval/.env ai-eval/.env.local 'ai-eval/.env.*' ai-eval/samples/manifest.local.json ai-eval/samples/private/math.jpg ai-eval/results/result-123.jsonl release dist
git status --short --branch
```

Expected:

- `npm test` exits `0`.
- `git diff --check` exits `0`.
- `git ls-files` returns no private env/sample/result paths.
- Only intended docs and code files are staged.

- [ ] **Step 5: Commit and push**

```bash
git add docs/testing/ai-eval docs/planning/evocraft-project-memory.md docs/planning/evocraft-roadmap-progress.md docs/ideas/2026-05-10-evocraft-seed-capsule.md docs/superpowers/agent-runs/2026-05-31-qwen-sample-evaluation
git commit -m "Record Qwen evaluation decision"
git push origin codex/qwen-sample-evaluation
```

---

## Final Verification For The Whole Plan

Run after all unblocked tasks:

```bash
npm test
npm run test:ai-eval-config
npm run test:ai-eval-summary
git diff --check
git ls-files -- .env .env.local '.env.*' ai-eval/.env ai-eval/.env.local 'ai-eval/.env.*' ai-eval/samples/manifest.local.json ai-eval/samples/private/math.jpg ai-eval/results/result-123.jsonl release dist
git status --short --branch
```

Expected:

- All test/build commands exit `0`.
- Private env/sample/result files are not tracked.
- The only committed evaluation artifact is a redacted summary.

## Execution Choice

Recommended execution mode: Subagent-Driven.

Reason:

- Task 1 and Task 2 are independent code/test tasks.
- Task 3 may block on local samples or credentials and should not block code hardening.
- Task 4 is a review/decision task that should run after evidence exists.
