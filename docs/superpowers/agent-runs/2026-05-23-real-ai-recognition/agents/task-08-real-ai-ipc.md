# Agent Task Log: Task 8 Real AI IPC

## Metadata

- Agent ID: Implementer
- Agent role: `implementer`
- Task ID: 8
- Task title: Add Real AI IPC And Renderer Adapter
- Parent plan: `docs/superpowers/plans/2026-05-23-real-ai-recognition.md`
- Assigned at: 2026-05-26
- Completed at: 2026-05-26
- Status: `changes_requested_fixed`

## Scope

Allowed files:

- `electron/main.cjs`
- `electron/preload.cjs`
- `src/services/desktopBridge.ts`
- `src/services/desktopAiAdapter.ts`
- `src/services/aiAdapter.ts`
- `tests/electron-config.test.mjs`
- `src/services/aiAdapter.test.ts`
- `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/agents/task-08-real-ai-ipc.md`
- `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/README.md`

Forbidden scope:

- Do not modify `src/app/App.tsx`, app runtime selection UI, authorization copy, or styles in this task; Task 9 owns app-level runtime switch.
- Do not commit API keys, `.env` files, private samples, generated evaluation results, `dist/`, or `release/`.
- Do not add dependencies.
- Do not move provider calls into the renderer.
- Do not implement solving, explanations, wrong-cause analysis, knowledge points, or similar-question generation.

## Initial Work Plan

1. Extend `tests/electron-config.test.mjs` first with assertions for AI IPC handlers, AI env gates, preload AI API exposure, and no `DASHSCOPE_API_KEY` in preload.
2. Run `npm run test:electron-config` and record the expected RED failure before AI IPC exists.
3. Register real AI runtime status, detect-regions, and recognize-question IPC in `electron/main.cjs` using `createQwenAdapter(...)`, `EVOCRAFT_AI_ENABLED`, and `DASHSCOPE_API_KEY`.
4. Expose `getAiRuntimeStatus`, `detectRegions`, and `recognizeQuestion` in `electron/preload.cjs`.
5. Extend `src/services/desktopBridge.ts` types and add `AiRuntimeStatus` to `src/services/aiAdapter.ts`.
6. Create `src/services/desktopAiAdapter.ts`.
7. Add focused React/adapter tests for the desktop AI adapter boundary if needed.
8. Run `npm run test:electron-config`, `npm run test:react -- src/services/aiAdapter.test.ts`, `npm run build`, and `git diff --check`.
9. Update this task log and run ledger, then commit and push the scoped implementation.

## Progress Log

### 2026-05-26 Assignment

- Leader created this task log after Task 7 fully passed code-quality re-review.
- Implementation started from the existing Task 8 plan and stayed inside the Electron main/preload + typed bridge boundary.

### 2026-05-26 RED -> GREEN

- Extended `tests/electron-config.test.mjs` first with required assertions for `ai:runtime-status`, `ai:detect-regions`, `ai:recognize-question`, `EVOCRAFT_AI_ENABLED`, `DASHSCOPE_API_KEY`, preload AI methods, and the preload no-secret rule.
- Extended `src/services/aiAdapter.test.ts` first with a desktop adapter delegation test that imported the yet-missing `src/services/desktopAiAdapter.ts`.
- Captured the expected RED failures before implementation:
  - `npm run test:electron-config` failed on the missing `ipcMain.handle("ai:runtime-status"...` assertion.
  - `npm run test:react -- src/services/aiAdapter.test.ts` failed because `./desktopAiAdapter` did not exist yet.
- Implemented `electron/main.cjs` real-AI runtime wiring:
  - imported `createQwenAdapter`,
  - added `createAiRuntime()` using `EVOCRAFT_AI_ENABLED`, `EVOCRAFT_AI_PROVIDER`, and `DASHSCOPE_API_KEY`,
  - registered `ai:runtime-status`, `ai:detect-regions`, and `ai:recognize-question`,
  - enforced `assertAllowedSender(event)` in every AI handler,
  - returned the required `{ ok: false, reason: "real_ai_disabled", message: "真实 AI 未开启。", retryable: false }` gate before adapter calls when real AI is not enabled.
- Implemented `electron/preload.cjs` AI bridge methods `getAiRuntimeStatus`, `detectRegions`, and `recognizeQuestion` without exposing `DASHSCOPE_API_KEY`.
- Added `AiRuntimeStatus` to `src/services/aiAdapter.ts`.
- Extended `src/services/desktopBridge.ts` with typed AI bridge methods while keeping them optional for existing pre-Task-9 desktop test helpers.
- Added `src/services/desktopAiAdapter.ts` as the renderer-side delegating adapter.
- Added delegation assertions in `src/services/aiAdapter.test.ts` so the new desktop adapter proves it forwards the exact region/recognition payloads to the desktop bridge.

### 2026-05-26 Build Follow-Up

- `npm run build` first exposed one compile-time compatibility issue outside Task 8 business logic: an existing `src/app/App.test.tsx` helper still constructs a desktop bridge without AI methods.
- Resolved that within Task 8 scope by making the new AI methods optional on `EvoCraftDesktopApi` and requiring them only in `createDesktopAiAdapter(...)`.
- Re-ran the full Task 8 verification set to GREEN after the typing fix.

### 2026-05-26 Spec Review Follow-Up

- Task 8 spec review failed because the tests only checked source text and desktop adapter delegation; they did not execute the new `ai:*` IPC handlers.
- Added `tests/electron-ai-ipc.test.mjs` first and wired it into `npm run test:electron-config`.
- Captured the expected RED failure: requiring `electron/main.cjs` under Node hit the Electron app startup side effect before `registerAiIpc(...)` could be tested.
- Refactored `electron/main.cjs` minimally so ordinary Node tests can require it without starting the Electron app.
- Kept production startup behavior behind the real Electron `app.whenReady` object, and exported the AI IPC helpers needed by tests.
- Added injection points to `registerAiIpc(...)` for fake `ipcMain` and sender trust checks.
- The new test now executes the three AI IPC handlers and proves:
  - untrusted sender URLs are rejected for `ai:runtime-status`, `ai:detect-regions`, and `ai:recognize-question`,
  - trusted disabled mode returns `real_ai_disabled`,
  - disabled mode does not call the provider adapter,
  - enabled mode delegates to provider methods exactly once.
- Re-ran focused Task 8 verification after the fix: `npm run test:electron-config`, `npm run test:react -- src/services/aiAdapter.test.ts`, and `npm run build` passed.

## Commands Run

```bash
sed -n '1,220p' /Users/zha/.codex/plugins/cache/openai-curated/superpowers/6188456f/skills/brainstorming/SKILL.md
sed -n '1,260p' /Users/zha/.codex/plugins/cache/openai-curated/superpowers/6188456f/skills/test-driven-development/SKILL.md
sed -n '1,220p' docs/planning/evocraft-project-memory.md
sed -n '1,260p' docs/planning/evocraft-roadmap-progress.md
sed -n '1,240p' docs/ideas/2026-05-10-evocraft-seed-capsule.md
git status --short --branch
sed -n '1,260p' docs/superpowers/plans/2026-05-23-real-ai-recognition.md
sed -n '1,260p' docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/README.md
sed -n '1,260p' docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/agents/task-08-real-ai-ipc.md
sed -n '1,260p' tests/electron-config.test.mjs
sed -n '1,260p' src/services/aiAdapter.ts
sed -n '1,260p' src/services/desktopBridge.ts
sed -n '1,260p' src/services/aiAdapter.test.ts
sed -n '1,320p' electron/main.cjs
sed -n '1,260p' electron/preload.cjs
sed -n '1,320p' electron/ai/qwenAdapter.cjs
sed -n '1,260p' src/services/mockAiAdapter.ts
npm run test:electron-config
npm run test:react -- src/services/aiAdapter.test.ts
npm run test:electron-config
npm run test:react -- src/services/aiAdapter.test.ts
npm run build
npm run test:electron-config
npm run test:react -- src/services/aiAdapter.test.ts
npm run build
git diff --check
git status --short --branch
npm run test:electron-config
npm run test:react -- src/services/aiAdapter.test.ts
npm run build
```

## Files Changed

- `electron/main.cjs`
- `electron/preload.cjs`
- `src/services/aiAdapter.ts`
- `src/services/desktopBridge.ts`
- `src/services/desktopAiAdapter.ts`
- `src/services/aiAdapter.test.ts`
- `tests/electron-config.test.mjs`
- `tests/electron-ai-ipc.test.mjs`
- `package.json`
- `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/agents/task-08-real-ai-ipc.md`
- `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/README.md`

## Verification

- RED: `npm run test:electron-config` -> assertion failure for missing `ipcMain.handle("ai:runtime-status"...`
- RED: `npm run test:react -- src/services/aiAdapter.test.ts` -> `Failed to resolve import "./desktopAiAdapter"`
- GREEN: `npm run test:electron-config` -> exit `0`
- GREEN: `npm run test:react -- src/services/aiAdapter.test.ts` -> `1` file passed, `5` tests passed
- RED follow-up: `npm run build` -> existing `src/app/App.test.tsx` desktop bridge helper no longer satisfied the stricter AI bridge typing
- GREEN follow-up: `npm run test:electron-config` -> exit `0`
- GREEN follow-up: `npm run test:react -- src/services/aiAdapter.test.ts` -> `1` file passed, `5` tests passed
- GREEN follow-up: `npm run build` -> exit `0`
- GREEN: `git diff --check` -> exit `0`
- GREEN: `git status --short --branch` -> only the scoped Task 8 files plus the new `src/services/desktopAiAdapter.ts` were modified
- RED spec follow-up: `npm run test:electron-config` -> `TypeError: Cannot read properties of undefined (reading 'whenReady')` when the new runtime IPC test required `electron/main.cjs` before testable exports existed.
- GREEN spec follow-up: `npm run test:electron-config` -> exit `0`
- GREEN spec follow-up: `npm run test:react -- src/services/aiAdapter.test.ts` -> `1` file passed, `5` tests passed
- GREEN spec follow-up: `npm run build` -> exit `0`

## Blockers

- 无。Spec review 提出的 runtime IPC coverage gap 已补齐，等待 spec re-review。

## Handoff Notes

- Task 8 exposes the real AI adapter through Electron main/preload and typed renderer bridge only.
- `tests/electron-ai-ipc.test.mjs` is the executable boundary proof for sender validation, disabled-mode gating, and provider delegation.
- Task 9 owns choosing mock vs desktop AI in the running app and showing external AI authorization copy.
- Keep API keys in Electron main process only.

## Leader Review

- Review status:
- Review notes:
- Required follow-up:

## Commit

- Commit hash: `37f5ad9`
