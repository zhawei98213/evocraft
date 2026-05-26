# Agent Task Log: Task 9 App Runtime Switch

## Metadata

- Agent ID: Implementer
- Agent role: `implementer`
- Task ID: 9
- Task title: Add App-Level Runtime Switch, Authorization Copy, And Verification
- Parent plan: `docs/superpowers/plans/2026-05-23-real-ai-recognition.md`
- Assigned at: 2026-05-26
- Completed at: 2026-05-26
- Status: `changes_requested_fixed`

## Scope

Allowed files:

- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `src/app/styles.css`
- `src/features/wrongQuestion/wrongQuestionReducer.ts`
- `src/features/wrongQuestion/wrongQuestionReducer.test.ts`
- `docs/planning/evocraft-roadmap-progress.md`
- `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/agents/task-09-app-runtime-switch.md`
- `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/README.md`

Read-only context:

- `src/services/desktopAiAdapter.ts`
- `src/services/desktopBridge.ts`
- `src/services/mockAiAdapter.ts`
- `src/services/aiAdapter.ts`
- `docs/superpowers/plans/2026-05-23-real-ai-recognition.md`
- Task 8 implementation and review logs

Forbidden scope:

- Do not modify Electron main/preload/provider adapter code unless Task 9 tests expose a clear integration bug and the leader approves widening scope.
- Do not add solving, explanations, wrong-cause analysis, knowledge points, similar-question generation, backend/SaaS, SQLite, production signing, model prompt changes, new dependencies, API keys, `.env` files, private samples/results, `dist`, or `release`.
- Do not change app visual direction beyond the minimal runtime notice and authorization styling required by Task 9.

## Initial Work Plan

1. Add failing app tests for disabled desktop real AI defaulting to local mock and enabled real AI showing external AI authorization copy.
2. Add or update reducer tests for AI runtime status and authorization acknowledgement state transitions.
3. Implement reducer state/actions for `aiRuntimeMode`, `aiRuntimeMessage`, and `externalAiAcknowledged`.
4. Load Electron runtime status through `desktopBridge.getAiRuntimeStatus()` and choose `createDesktopAiAdapter(...)` only when runtime mode is real.
5. Keep `mockAiAdapter` as the browser/default/disabled fallback.
6. Add visible real-AI test-mode notice and block region selection until external AI is acknowledged.
7. Add minimal styles for runtime notice and authorization copy.
8. Run focused and full verification required by the plan.
9. Update this task log, run ledger, and roadmap progress, then commit and push the scoped implementation.

## Progress Log

### 2026-05-26 Assignment

- Task 8 completed spec and code-quality gates.
- Leader created this task log before implementation dispatch.
- Task 9 is ready for implementer dispatch.

### 2026-05-26 RED

- Added reducer tests for `AI_RUNTIME_READY` real/mock transitions and `EXTERNAL_AI_ACKNOWLEDGED` clearing `uploadError`.
- Added app tests for desktop real-AI disabled defaulting to mock copy, enabled real-AI showing authorization copy, and enabled real-AI blocking region detection until external authorization is checked.
- Ran `npm run test:react -- src/app/App.test.tsx src/features/wrongQuestion/wrongQuestionReducer.test.ts` and captured the expected RED:
  - reducer assertions failed because `aiRuntimeMode` and `externalAiAcknowledged` were still undefined.
  - app assertions failed because the upload screen did not render the runtime note / real-AI consent copy yet.

### 2026-05-26 GREEN

- Implemented reducer runtime state: `aiRuntimeMode`, `aiRuntimeMessage`, `externalAiAcknowledged`, plus `AI_RUNTIME_READY` and `EXTERNAL_AI_ACKNOWLEDGED`.
- Updated `App.tsx` to load runtime status through `desktopBridge.getAiRuntimeStatus()`, keep mock mode as the default fallback, select `createDesktopAiAdapter(...)` only in real mode, and block region detection until the user checks external-AI authorization.
- Added minimal upload-screen runtime copy and consent styles without changing the existing visual direction.
- `npm run build` initially exposed a type mismatch because `desktopBridge` AI methods are optional in the shared desktop bridge type. Fixed it in-scope with a local `hasDesktopAiBridge(...)` guard in `App.tsx` and re-ran the full verification suite successfully.

### 2026-05-26 Leader Follow-Up

- Leader resumed after the implementer subagent hit a usage-limit error and inspected the dirty worktree instead of discarding it.
- Added a regression assertion that missing external-AI authorization must keep the selected image and file metadata visible.
- Captured the expected RED: the existing implementation dispatched `UPLOAD_FAILED`, which cleared `question.png` from the upload screen.
- Added `UPLOAD_BLOCKED` as a non-destructive upload gate and switched the external-AI authorization block to use it.
- Added an app test proving that, after external authorization is checked, real desktop mode calls the desktop AI adapter with the selected image URI and enters region selection.
- Re-ran the focused and full Task 9 verification suite successfully.

### 2026-05-26 Code-Quality Follow-Up

- Code-quality review found that a delayed `getAiRuntimeStatus()` flip from mock to real could reach `rerunRegionDetection()` and `confirmSelectedRegion()` without re-checking `externalAiAcknowledged`.
- Added RED app regressions for delayed real-mode flips on both select-region entry points, plus a visible fallback regression for `enabled: true` runtime status when the desktop bridge is missing `detectRegions` / `recognizeQuestion`.
- Implemented an effective runtime mode in `App.tsx`: real mode now requires both `status.enabled` and the desktop AI bridge methods; otherwise the upload screen stays in mock mode with `真实 AI 桥接能力不可用，已回退到本地 mock。`.
- Centralized the external-AI authorization guard and applied it to initial region detection, rerun region detection, and final recognition.
- Re-ran the focused Task 9 suite successfully: `npm run test:react -- src/app/App.test.tsx src/features/wrongQuestion/wrongQuestionReducer.test.ts` -> `28` tests passed.
- Re-ran the full verification suite successfully: focused React tests, `npm test`, Electron config/store tests, AI eval config, Qwen adapter, web build, desktop build, `git diff --check`, and tracked secret/generated artifact checks.

## Commands Run

```bash
npm run test:react -- src/app/App.test.tsx src/features/wrongQuestion/wrongQuestionReducer.test.ts
npm run test:react -- src/app/App.test.tsx src/features/wrongQuestion/wrongQuestionReducer.test.ts
npm test
npm run test:electron-config
npm run test:electron-store
npm run test:ai-eval-config
npm run test:qwen-adapter
npm run build
npm run desktop:build
npm run test:react -- src/app/App.test.tsx src/features/wrongQuestion/wrongQuestionReducer.test.ts
npm test
npm run test:electron-config
npm run test:electron-store
npm run test:ai-eval-config
npm run test:qwen-adapter
npm run build
npm run desktop:build
git diff --check
git status --short --branch
npm run test:react -- src/app/App.test.tsx src/features/wrongQuestion/wrongQuestionReducer.test.ts
npm test
npm run test:electron-config
npm run test:electron-store
npm run test:ai-eval-config
npm run test:qwen-adapter
npm run build
npm run desktop:build
git diff --check
git status --short --branch
npm run test:react -- src/app/App.test.tsx src/features/wrongQuestion/wrongQuestionReducer.test.ts
npm test
npm run test:electron-config
npm run test:electron-store
npm run test:ai-eval-config
npm run test:qwen-adapter
npm run build
npm run desktop:build
git diff --check
git ls-files -- .env .env.local '.env.*' ai-eval/.env ai-eval/.env.local 'ai-eval/.env.*' ai-eval/samples/manifest.local.json ai-eval/samples/private/math.jpg ai-eval/results/result-123.jsonl release dist
```

## Files Changed

- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `src/app/styles.css`
- `src/features/wrongQuestion/wrongQuestionReducer.ts`
- `src/features/wrongQuestion/wrongQuestionReducer.test.ts`
- `docs/planning/evocraft-project-memory.md`
- `docs/planning/evocraft-roadmap-progress.md`
- `docs/ideas/2026-05-10-evocraft-seed-capsule.md`
- `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/agents/task-09-app-runtime-switch.md`
- `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/README.md`

## Verification

- RED: `npm run test:react -- src/app/App.test.tsx src/features/wrongQuestion/wrongQuestionReducer.test.ts` -> exit `1`; 5 failing tests (`2` reducer runtime-state failures, `3` app runtime-copy / consent-gate failures).
- GREEN: `npm run test:react -- src/app/App.test.tsx src/features/wrongQuestion/wrongQuestionReducer.test.ts` -> exit `0`; `25` tests passed after the leader follow-up.
- `npm test` -> exit `0`; `5` test files / `38` tests passed.
- `npm run test:electron-config` -> exit `0`.
- `npm run test:electron-store` -> exit `0`.
- `npm run test:ai-eval-config` -> exit `0`.
- `npm run test:qwen-adapter` -> exit `0`.
- `npm run build` -> first exit `1` on desktop bridge optional-method typing; rerun exit `0` after `hasDesktopAiBridge(...)` fix.
- `npm run desktop:build` -> first exit `1` for the same typing issue; rerun exit `0`, produced unpacked mac build and skipped code signing because `identity` is explicitly `null`.
- GREEN leader follow-up: `npm run test:react -- src/app/App.test.tsx src/features/wrongQuestion/wrongQuestionReducer.test.ts` -> exit `0`; `25` tests passed.
- GREEN leader follow-up: `npm test` -> exit `0`; `5` test files / `38` tests passed.
- GREEN leader follow-up: `npm run build` -> exit `0`.
- GREEN leader follow-up: `npm run desktop:build` -> exit `0`, produced unpacked mac build and skipped code signing because `identity` is explicitly `null`.
- GREEN leader follow-up: `git diff --check` -> exit `0`.
- RED code-quality follow-up: `npm run test:react -- src/app/App.test.tsx src/features/wrongQuestion/wrongQuestionReducer.test.ts` -> exit `1`; delayed runtime flip and missing bridge fallback tests failed before the fix.
- GREEN code-quality follow-up: `npm run test:react -- src/app/App.test.tsx src/features/wrongQuestion/wrongQuestionReducer.test.ts` -> exit `0`; `28` tests passed.
- Full code-quality follow-up: `npm test` -> exit `0`; `5` test files / `41` tests passed.
- Full code-quality follow-up: `npm run test:electron-config`, `npm run test:electron-store`, `npm run test:ai-eval-config`, and `npm run test:qwen-adapter` -> all exited `0`.
- Full code-quality follow-up: `npm run build` -> exit `0`.
- Full code-quality follow-up: `npm run desktop:build` -> exit `0`, produced unpacked mac build and skipped macOS signing because `identity` is explicitly `null`.
- Full code-quality follow-up: `git diff --check` -> exit `0`.
- Full code-quality follow-up: tracked secret/generated artifact check returned no tracked `.env`, private sample/result, `release`, or `dist` files.

## Blockers

- 无。等待 code-quality re-review。

## Handoff Notes

- Task 9 owns app runtime selection, explicit external AI authorization copy, and final verification for the real-AI desktop slice.
- Missing external-AI authorization is intentionally a non-destructive upload gate: it sets `uploadError` but keeps the selected image visible.
- Any new real-AI call path must use the shared authorization guard before invoking `aiAdapter`; runtime status can resolve after the user has already entered the select-region flow.
- Runtime status alone is not enough to show real mode. The renderer must also have both desktop AI bridge methods; otherwise it visibly falls back to mock.
- Phase 2 learning features remain out of scope.

## Leader Review

- Review status: ready_for_code_quality_re_review.
- Review notes: code-quality blockers have RED/GREEN coverage, implementation fix, and fresh full verification evidence.
- Required follow-up: commit/push the follow-up, then dispatch Task 9 code-quality re-review.

## Commit

- Commit hash: `c3d2f21`
