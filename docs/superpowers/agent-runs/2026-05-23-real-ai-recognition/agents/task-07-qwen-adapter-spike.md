# Agent Task Log: Task 7 Qwen Adapter Spike

## Metadata

- Agent ID: Implementer
- Agent role: `implementer`
- Task ID: 7
- Task title: Add Qwen Adapter Spike With Fake-Fetch Tests
- Parent plan: `docs/superpowers/plans/2026-05-23-real-ai-recognition.md`
- Assigned at: 2026-05-24
- Completed at: 2026-05-24
- Status: `done`

## Scope

Allowed files:

- `electron/ai/recognitionPrompt.cjs`
- `electron/ai/qwenAdapter.cjs`
- `tests/qwen-adapter-contract.test.mjs`
- `scripts/evaluate-ai-samples.mjs`
- `package.json`
- `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/agents/task-07-qwen-adapter-spike.md`
- `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/README.md`

Forbidden scope:

- Do not modify Electron main/preload IPC or renderer runtime behavior in this task.
- Do not call the real provider from tests.
- Do not commit API keys, `.env` files, private samples, generated evaluation results, `dist/`, or `release/`.
- Do not add dependencies.
- Do not implement solving, explanations, wrong-cause analysis, knowledge points, or similar-question generation.

## Initial Work Plan

1. Add `tests/qwen-adapter-contract.test.mjs` first with fake-fetch coverage for JSON fence parsing, request endpoint/headers/body, success draft mapping, and no active solving.
2. Run `node tests/qwen-adapter-contract.test.mjs` and record the expected RED failure before the adapter exists.
3. Add `electron/ai/recognitionPrompt.cjs` with the strict recognition-only prompt.
4. Add `electron/ai/qwenAdapter.cjs` with provider configuration, fake-fetch injectable calls, safe failure mapping, JSON parsing, and draft mapping.
5. Connect `scripts/evaluate-ai-samples.mjs` to the Qwen adapter while keeping the existing disabled-by-default and API-key gates.
6. Add `test:qwen-adapter` to `package.json`.
7. Run `npm run test:qwen-adapter`, `npm run test:ai-eval-config`, `git diff --check`, and any focused smoke checks needed to prove no real provider call occurs in tests.
8. Update this task log and run ledger, then commit and push the scoped implementation.

## Progress Log

### 2026-05-24 Assignment

- Leader created this task log after Task 6 passed code-quality re-review.
- Implementation has not started yet.

### 2026-05-24 RED -> GREEN

- Added `tests/qwen-adapter-contract.test.mjs` first and ran `node tests/qwen-adapter-contract.test.mjs`.
- Captured the expected RED failure before implementation: `ERR_MODULE_NOT_FOUND` for `electron/ai/qwenAdapter.cjs`.
- Implemented `electron/ai/recognitionPrompt.cjs` with a strict recognition-only JSON prompt that forbids solving, explanations, wrong-cause analysis, knowledge points, and similar-question generation.
- Implemented `electron/ai/qwenAdapter.cjs` with:
  - conservative placeholder `detectRegions()` output for non-empty images,
  - required recoverable failures for `image_missing`, `region_missing`, `region_image_missing`,
  - provider failures for `provider_not_configured`, `provider_request_failed`, and `provider_response_invalid`,
  - fake-fetch injectable provider calls using only `selectedRegionImageUri`,
  - Qwen response parsing for raw JSON and fenced ```json blocks,
  - wrong-question draft mapping with Qwen model traces and `providerMeta.usage` / `providerMeta.elapsedMs`.
- Updated `scripts/evaluate-ai-samples.mjs` to instantiate `createQwenAdapter()` only after the existing disabled/key gates pass, then evaluate each sample via a full-image manual region and emit JSONL rows `{ sampleId, subject, ok, elapsedMs, result }`.
- Added `test:qwen-adapter` to `package.json`.
- Re-ran the Node contract test and focused verification to GREEN without using a real API key.

### 2026-05-24 Leader Follow-Up

- Leader review found `tests/ai-eval-config.test.mjs` still asserted the old Task 6 placeholder handoff by matching `status: "not-run"` and `Provider adapter is connected in the next task.`.
- Added a regression first so `npm run test:ai-eval-config` failed while `scripts/evaluate-ai-samples.mjs` still contained the stale Task 6 compatibility comments.
- Removed the stale comments from `scripts/evaluate-ai-samples.mjs`.
- Updated `tests/ai-eval-config.test.mjs` to assert the Task 7 runner uses `createQwenAdapter`, calls `adapter.recognizeQuestion`, does not keep placeholder `not-run` rows, and does not bypass the shared adapter with direct `fetch`.
- Re-ran focused verification and default regression checks to GREEN.

## Commands Run

```bash
sed -n '1,220p' /Users/zha/.codex/prompts/test-engineer.md
sed -n '1,260p' docs/planning/evocraft-project-memory.md
sed -n '1,260p' docs/planning/evocraft-roadmap-progress.md
sed -n '1,240p' docs/ideas/2026-05-10-evocraft-seed-capsule.md
sed -n '1,260p' scripts/evaluate-ai-samples.mjs
sed -n '1,260p' package.json
sed -n '1,260p' docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/README.md
sed -n '1,260p' docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/agents/task-07-qwen-adapter-spike.md
sed -n '1,260p' src/services/aiAdapter.ts
sed -n '1,260p' src/domain/wrongQuestion.ts
sed -n '1,260p' src/services/aiAdapter.test.ts
sed -n '1,260p' src/services/mockAiAdapter.ts
sed -n '1,260p' tests/ai-eval-config.test.mjs
sed -n '1132,1468p' docs/superpowers/plans/2026-05-23-real-ai-recognition.md
node tests/qwen-adapter-contract.test.mjs
node tests/qwen-adapter-contract.test.mjs
npm run test:qwen-adapter
npm run test:ai-eval-config
git diff --check
node scripts/evaluate-ai-samples.mjs
EVOCRAFT_AI_EVAL_ENABLED=1 node scripts/evaluate-ai-samples.mjs
npm run test:ai-eval-config
npm run test:qwen-adapter
npm test
```

## Files Changed

- `tests/qwen-adapter-contract.test.mjs`
- `electron/ai/recognitionPrompt.cjs`
- `electron/ai/qwenAdapter.cjs`
- `scripts/evaluate-ai-samples.mjs`
- `package.json`
- `tests/ai-eval-config.test.mjs`
- `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/agents/task-07-qwen-adapter-spike.md`
- `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/README.md`

## Verification

- RED: `node tests/qwen-adapter-contract.test.mjs` -> `ERR_MODULE_NOT_FOUND` for missing `electron/ai/qwenAdapter.cjs`
- GREEN: `node tests/qwen-adapter-contract.test.mjs` -> exit `0`
- GREEN: `npm run test:qwen-adapter` -> exit `0`
- GREEN: `npm run test:ai-eval-config` -> exit `0`
- GREEN: `git diff --check` -> exit `0`
- GREEN safety probe: `node scripts/evaluate-ai-samples.mjs` -> exit `2`, `AI evaluation is disabled. Set EVOCRAFT_AI_EVAL_ENABLED=1 to call the provider.`
- GREEN safety probe: `EVOCRAFT_AI_EVAL_ENABLED=1 node scripts/evaluate-ai-samples.mjs` -> exit `2`, `DASHSCOPE_API_KEY is required for Qwen evaluation.`
- RED follow-up: `npm run test:ai-eval-config` failed while the Task 7 runner still carried Task 6 placeholder comments.
- GREEN follow-up: `npm run test:ai-eval-config`, `npm run test:qwen-adapter`, `git diff --check`, and `npm test` passed after removing stale comments and updating the config test to the Task 7 adapter contract.

## Blockers

- 无。

## Handoff Notes

- Task 7 creates the real-provider adapter surface and local evaluation runner connection only.
- Task 8 owns Electron IPC and renderer adapter wiring.
- Keep provider execution behind explicit `EVOCRAFT_AI_EVAL_ENABLED=1` and `DASHSCOPE_API_KEY` for local evaluation.

## Leader Review

- Review status: spec review passed with concerns; code-quality review pending.
- Review notes: leader follow-up commit `309f8aa` aligned `tests/ai-eval-config.test.mjs` with the Task 7 runner contract and removed stale Task 6 placeholder comments from `scripts/evaluate-ai-samples.mjs`.
- Required follow-up: run Task 7 code-quality review before Task 8.

## Commit

- Commit hash: `5f9ba4f`, evidence/docs `0c8e488`, leader follow-up `309f8aa`
