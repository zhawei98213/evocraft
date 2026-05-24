# Agent Task Log: Task 5 AI Adapter Contract

## Metadata

- Agent ID: Implementer
- Agent role: `implementer`
- Task ID: 5
- Task title: Expand AI Adapter Contract For Real Recognition
- Parent plan: `docs/superpowers/plans/2026-05-23-real-ai-recognition.md`
- Assigned at: 2026-05-24
- Completed at: 2026-05-24 16:00:55 CST
- Status: `completed`

## Scope

Allowed files:

- `src/services/aiAdapter.ts`
- `src/services/mockAiAdapter.ts`
- `src/services/aiAdapter.test.ts`
- `src/domain/wrongQuestion.ts`
- `src/domain/wrongQuestion.test.ts`
- `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/agents/task-05-ai-adapter-contract.md`
- `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/README.md`

Forbidden scope:

- Do not connect real AI or Qwen provider calls; this task is contract/mock only.
- Do not modify Electron main/preload IPC or local file storage.
- Do not change React runtime switching or UI behavior.
- Do not add dependencies.
- Do not commit generated build outputs, `dist/`, `release/`, API keys, sample child photos, or local environment files.

## Initial Work Plan

1. Add failing `src/services/aiAdapter.test.ts` assertions for review items, model trace metadata, no inferred-answer wording, and missing region image failure.
2. Run `npm run test:react -- src/services/aiAdapter.test.ts` and record the RED failure.
3. Extend `AiAdapterFailureReason` and `AiAdapterFailure` in `src/services/aiAdapter.ts`.
4. Update `src/services/mockAiAdapter.ts` so empty `selectedRegionImageUri` returns recoverable `region_image_missing`.
5. Adjust domain/mock contract only if the new assertions expose missing review-item or trace fields.
6. Run focused adapter/domain tests and build.
7. Update this task log and run ledger, then commit and push the scoped implementation.

## Progress Log

### 2026-05-24 Assignment

- Leader created this task log after Task 4 code-quality review passed.
- Scope is limited to the provider-agnostic AI contract, mock adapter, and focused tests.

### 2026-05-24 RED

- Added the planned assertions in `src/services/aiAdapter.test.ts` for review items, model trace metadata, answer wording, and missing region image failure.
- Ran `npm run test:react -- src/services/aiAdapter.test.ts`.
- Observed the expected RED failure: `mockAiAdapter.recognizeQuestion(...)` returned `{ ok: true, draft: ... }` when `selectedRegionImageUri` was empty instead of the required recoverable `region_image_missing` failure.

### 2026-05-24 GREEN

- Expanded `AiAdapterFailureReason` with `region_image_missing`, `real_ai_disabled`, `provider_not_configured`, `provider_request_failed`, and `provider_response_invalid`.
- Added optional `retryable?: boolean` to `AiAdapterFailure` without forcing mock callers to set it yet.
- Updated `mockAiAdapter.recognizeQuestion(...)` to return the user-readable `region_image_missing` failure when `selectedRegionImageUri` is empty.
- Confirmed no domain changes were needed because the existing mock draft already contains `需复核` review items, provider/model trace metadata, and a `correctAnswer` without `模型推理`.

### 2026-05-24 Verification

- Re-ran `npm run test:react -- src/services/aiAdapter.test.ts` and closed the RED/GREEN loop with 4 passing tests.
- Ran the required focused verification:
  - `npm run test:react -- src/services/aiAdapter.test.ts src/domain/wrongQuestion.test.ts`
  - `npm run build`
  - `git diff --check`
- Ran diagnostics on modified files with `lsp_diagnostics`; all returned zero findings.

## Commands Run

```bash
npm run test:react -- src/services/aiAdapter.test.ts
npm run test:react -- src/services/aiAdapter.test.ts
npm run test:react -- src/services/aiAdapter.test.ts src/domain/wrongQuestion.test.ts
npm run build
git diff --check
npx tsc --noEmit --pretty false --project /Users/zha/Documents/CodeSpaces/evo-craft/tsconfig.json
```

## Files Changed

- `src/services/aiAdapter.test.ts`
- `src/services/aiAdapter.ts`
- `src/services/mockAiAdapter.ts`
- `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/agents/task-05-ai-adapter-contract.md`
- `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/README.md`

## Verification

- RED: `npm run test:react -- src/services/aiAdapter.test.ts` -> failed with 1 expected assertion because empty `selectedRegionImageUri` still returned success.
- Focused GREEN: `npm run test:react -- src/services/aiAdapter.test.ts` -> 1 file passed, 4 tests passed.
- Focused suite: `npm run test:react -- src/services/aiAdapter.test.ts src/domain/wrongQuestion.test.ts` -> 2 files passed, 9 tests passed.
- Build: `npm run build` -> passed.
- Diagnostics: modified source files returned zero `lsp_diagnostics` findings.
- Hygiene: `git diff --check` -> passed.

## Blockers

- 无。

## Handoff Notes

- This task prepares the AI boundary for real recognition but must not call any provider.

## Leader Review

- Review status:
- Review notes:
- Required follow-up:

## Commit

- Commit hash: 待本任务 scoped commit 写入最终回执。
