# Agent Task Log: Task 9 Code Quality Review

## Metadata

- Agent ID: Code Quality Reviewer
- Agent role: `code-quality-reviewer`
- Task ID: 9
- Task title: App Runtime Switch Code Quality Review
- Parent plan: `docs/superpowers/plans/2026-05-23-real-ai-recognition.md`
- Assigned at: 2026-05-26
- Completed at: 2026-05-26
- Status: `changes_requested`

## Scope

Allowed files:

- `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/agents/task-09-code-quality-review.md`
- `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/README.md`

Read-only review targets:

- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `src/app/styles.css`
- `src/features/wrongQuestion/wrongQuestionReducer.ts`
- `src/features/wrongQuestion/wrongQuestionReducer.test.ts`
- `src/services/desktopAiAdapter.ts`
- `src/services/desktopBridge.ts`
- `src/services/mockAiAdapter.ts`
- `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/agents/task-09-app-runtime-switch.md`
- `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/agents/task-09-spec-review.md`
- Task 9 implementation and spec-review commits

Forbidden scope:

- Do not modify implementation code.
- Do not add solving, explanations, wrong-cause analysis, knowledge points, similar-question generation, backend/SaaS, SQLite, production signing, or model prompt changes.
- Do not add dependencies, API keys, `.env` files, private samples/results, `dist`, or `release`.

## Initial Work Plan

1. Wait until Task 9 spec review passes.
2. Review reducer state transitions, app effect cleanup, adapter selection, authorization gating, UI copy, accessibility, and tests.
3. Confirm browser/local fallback remains stable and desktop real AI is explicit opt-in.
4. Confirm no API key or provider implementation reaches renderer/preload UI code.
5. Report `PASS`, `FAIL`, or `PASS_WITH_CONCERNS`.

## Progress Log

### 2026-05-26 Pending

- Leader created this reviewer log before Task 9 implementer dispatch.
- Quality review is pending until Task 9 spec review passes.

### 2026-05-26 Review Complete

- Reviewed current HEAD `80767a7` on branch `codex/real-ai-recognition-implementation`; this matches the expected spec-review-pass baseline instead of the earlier docs anchor `f620485`.
- Result from code-quality reviewer: `FAIL`.
- Stage 1 spec-compliance gate stays green: the reviewed range `4908ac1..HEAD` is still limited to the planned Task 9 files and required docs sync, with no backend / SQLite / prompt / dependency scope creep.
- Stage 2 quality review found one blocking authorization bug and one medium fallback-consistency issue:
  - A late `getAiRuntimeStatus()` flip from default `mock` to `real` can route `rerunRegionDetection()` and `confirmSelectedRegion()` through the desktop real-AI adapter without re-checking `externalAiAcknowledged`, so explicit opt-in is not reliably enforced on every real-AI path.
  - `AI_RUNTIME_READY` trusts `status.enabled`, but adapter selection separately falls back to `mockAiAdapter` when optional bridge methods are missing, so the UI can show “真实 AI 测试模式” while behavior silently stays local mock.
- Current tests cover steady-state enabled/disabled startup, missing authorization on the first transition, and the happy authorized path, but they do not cover the delayed-runtime flip or missing-method fallback cases that expose the issues above.

## Code Review Summary

**Files Reviewed:** 10
**Total Issues:** 2

### By Severity

- CRITICAL: 0
- HIGH: 1
- MEDIUM: 1
- LOW: 0

### Issues

[HIGH] Late runtime-status flip can bypass explicit external-AI authorization on select-region actions
File: `src/app/App.tsx:123-143`, `src/app/App.tsx:214-246`, `src/app/App.tsx:290-306`
Issue: `aiRuntimeMode` defaults to `mock` and only flips after the async `getAiRuntimeStatus()` effect resolves. A desktop user can therefore enter `select-region` while the app still behaves as mock, then have `aiRuntimeMode` switch to `real` later. At that point `rerunRegionDetection()` and `confirmSelectedRegion()` call `aiAdapter` directly without re-checking `externalAiAcknowledged`, so the real desktop adapter can receive image data or selected-region data even though the user never opted in to external AI.
Why it matters: Task 9’s privacy boundary is “real AI remains explicit opt-in.” This race breaks that guarantee and can send study-photo data off-device on a reachable UI path.
Fix: Centralize a single real-AI authorization guard and apply it to every real-AI entry point (`startRegionSelection`, `rerunRegionDetection`, `confirmSelectedRegion`). Also prevent a late runtime flip from silently upgrading an in-progress flow: either block the upload/select-region actions until runtime status is loaded, or downgrade/clear select-region state until the user explicitly acknowledges external AI after the mode changes. Add a regression test that starts under default mock, delays `getAiRuntimeStatus()` to real, then exercises rerun/confirm without acknowledgement.

[MEDIUM] Real-mode UI can silently fall back to mock when optional desktop AI methods are missing
File: `src/app/App.tsx:65-70`, `src/app/App.tsx:87-92`, `src/app/App.tsx:123-136`
Issue: The reducer enters real mode whenever `getAiRuntimeStatus()` returns `enabled: true`, but adapter selection separately requires `detectRegions` and `recognizeQuestion` to exist. In a version-skew or partial-bridge scenario, the upload screen shows the external-AI consent copy and requires acknowledgement, yet the app still uses `mockAiAdapter` with no visible fallback message.
Why it matters: The app does not crash, but the fallback is not intentional or transparent. The consent copy and the actual execution path can disagree, which makes debugging and user trust harder.
Fix: Derive an effective runtime mode that requires both `status.enabled` and `hasDesktopAiBridge(desktopBridge)` before dispatching `AI_RUNTIME_READY`, or force a visible mock fallback message when bridge methods are missing. Add a test with `getAiRuntimeStatus()` present but missing `detectRegions` / `recognizeQuestion`.

### Recommendation

REQUEST CHANGES

Task 9 cannot be marked completed until the real-AI authorization gate is re-applied to all real-AI entry points and the missing-method fallback becomes explicit.

## Commands Run

```bash
git status --short --branch
git diff --check
npm run test:react -- src/app/App.test.tsx src/features/wrongQuestion/wrongQuestionReducer.test.ts
npm test
npm run test:electron-config
npm run test:electron-store
npm run test:ai-eval-config
npm run test:qwen-adapter
npm run build
npm run desktop:build
git diff --name-only 4908ac1..HEAD
git ls-files -- .env .env.local '.env.*' ai-eval/.env ai-eval/.env.local 'ai-eval/.env.*' ai-eval/samples/manifest.local.json ai-eval/samples/private/math.jpg ai-eval/results/result-123.jsonl release dist
rg -n "DASHSCOPE_API_KEY|createQwenAdapter|fetch\(|apiKey|真实 AI 测试模式|本地 mock 识别|请先确认外部 AI 识别授权|UPLOAD_BLOCKED|AI_RUNTIME_READY|EXTERNAL_AI_ACKNOWLEDGED|getAiRuntimeStatus|createDesktopAiAdapter|mockAiAdapter" src docs -g '!dist'
lsp_diagnostics src/app/App.tsx
lsp_diagnostics src/app/App.test.tsx
lsp_diagnostics src/app/styles.css
lsp_diagnostics src/features/wrongQuestion/wrongQuestionReducer.ts
lsp_diagnostics src/features/wrongQuestion/wrongQuestionReducer.test.ts
ast_grep_search console.log / empty catch / hardcoded apiKey patterns (tool unavailable in this environment; fallback `rg` scan used)
rg -n "console\\.log\\(|catch \\([^)]*\\) \\{\\s*\\}|apiKey\\s*=\\s*\\\"" src/app/App.tsx src/app/App.test.tsx src/app/styles.css src/features/wrongQuestion/wrongQuestionReducer.ts src/features/wrongQuestion/wrongQuestionReducer.test.ts src/services/desktopAiAdapter.ts src/services/desktopBridge.ts src/services/mockAiAdapter.ts src/services/aiAdapter.ts
sed -n '1653,1987p' docs/superpowers/plans/2026-05-23-real-ai-recognition.md
sed -n '1,260p' docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/README.md
sed -n '1,260p' docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/agents/task-09-app-runtime-switch.md
sed -n '1,260p' docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/agents/task-09-spec-review.md
sed -n '1,260p' docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/agents/task-09-code-quality-review.md
sed -n '1,320p' src/app/App.tsx
sed -n '320,760p' src/app/App.tsx
sed -n '1,360p' src/app/App.test.tsx
sed -n '360,760p' src/app/App.test.tsx
sed -n '1,260p' src/app/styles.css
sed -n '1,320p' src/features/wrongQuestion/wrongQuestionReducer.ts
sed -n '1,360p' src/features/wrongQuestion/wrongQuestionReducer.test.ts
sed -n '1,220p' src/services/desktopAiAdapter.ts
sed -n '1,240p' src/services/desktopBridge.ts
sed -n '1,220p' src/services/mockAiAdapter.ts
sed -n '1,260p' src/services/aiAdapter.ts
sed -n '1,260p' docs/planning/evocraft-project-memory.md
sed -n '1,260p' docs/planning/evocraft-roadmap-progress.md
sed -n '1,260p' docs/ideas/2026-05-10-evocraft-seed-capsule.md
nl -ba src/app/App.tsx | sed -n '60,320p'
nl -ba src/features/wrongQuestion/wrongQuestionReducer.ts | sed -n '1,220p'
nl -ba src/app/App.test.tsx | sed -n '300,430p'
git diff 4908ac1..HEAD -- src/app/App.tsx src/app/App.test.tsx src/app/styles.css src/features/wrongQuestion/wrongQuestionReducer.ts src/features/wrongQuestion/wrongQuestionReducer.test.ts
```

## Files Changed

- `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/agents/task-09-code-quality-review.md`
- `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/README.md`

## Verification

- `git status --short --branch` showed `## codex/real-ai-recognition-implementation...origin/codex/real-ai-recognition-implementation` at review start; current review basis is `HEAD=80767a7`.
- `git diff --check` returned no output and exited `0`.
- `npm run test:react -- src/app/App.test.tsx src/features/wrongQuestion/wrongQuestionReducer.test.ts` passed: `2` files / `25` tests.
- `npm test` passed: `5` files / `38` tests.
- `npm run test:electron-config` passed.
- `npm run test:electron-store` passed.
- `npm run test:ai-eval-config` passed.
- `npm run test:qwen-adapter` passed.
- `npm run build` passed and emitted `dist/` artifacts only.
- `npm run desktop:build` passed, produced unpacked `release/mac`, and skipped macOS signing because `identity` is explicitly `null`.
- `git diff --name-only 4908ac1..HEAD` matched the intended Task 9 scope plus required docs sync:
  - `docs/ideas/2026-05-10-evocraft-seed-capsule.md`
  - `docs/planning/evocraft-project-memory.md`
  - `docs/planning/evocraft-roadmap-progress.md`
  - `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/README.md`
  - `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/agents/task-09-app-runtime-switch.md`
  - `src/app/App.test.tsx`
  - `src/app/App.tsx`
  - `src/app/styles.css`
  - `src/features/wrongQuestion/wrongQuestionReducer.test.ts`
  - `src/features/wrongQuestion/wrongQuestionReducer.ts`
- `git ls-files -- ... release dist` returned no tracked `.env`, local manifest, private sample, generated result, `release`, or `dist` files.
- `rg -n "DASHSCOPE_API_KEY|createQwenAdapter|fetch\\(|apiKey|..." src docs -g '!dist'` found Task 9 runtime-copy strings in renderer files and docs references to provider code, but no renderer/provider import or secret exposure in the Task 9 implementation files.
- `lsp_diagnostics` reported zero diagnostics for every modified Task 9 file: `src/app/App.tsx`, `src/app/App.test.tsx`, `src/app/styles.css`, `src/features/wrongQuestion/wrongQuestionReducer.ts`, and `src/features/wrongQuestion/wrongQuestionReducer.test.ts`.
- `ast_grep_search` could not run because `ast-grep` is not installed in this environment; fallback `rg` scan found no `console.log(...)`, no empty `catch (...) {}` block, and no hardcoded `apiKey = "..."` assignment in the reviewed source files.

## Blockers

- Blocking code-quality issue: explicit external-AI authorization is not enforced on every real-AI path after the runtime-mode flip, so Task 9 cannot close.

## Handoff Notes

- Do not mark Task 9 complete yet.
- Fix the authorization model first: every real-AI call site must share one explicit opt-in gate, including delayed runtime-mode transitions and post-entry select-region actions.
- After the fix, re-run the same required command suite and add regression coverage for:
  - delayed `getAiRuntimeStatus()` resolving to real after the user already entered the flow,
  - missing `detectRegions` / `recognizeQuestion` bridge methods while `getAiRuntimeStatus()` reports enabled real mode.

## Leader Review

- Review status: changes_requested.
- Review notes: spec scope is still correct, but the implementation does not yet preserve the “real AI is explicit opt-in” guarantee under asynchronous runtime-state changes.
- Required follow-up: return Task 9 to the implementer for a shared authorization gate, explicit missing-method fallback, and focused regression tests before re-running code-quality review.

## Commit

- Review basis: `80767a7`
