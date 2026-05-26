# Agent Task Log: Task 8 Spec Review

## Metadata

- Agent ID: Spec Reviewer
- Agent role: `spec-reviewer`
- Task ID: 8
- Task title: Real AI IPC Spec Review
- Parent plan: `docs/superpowers/plans/2026-05-23-real-ai-recognition.md`
- Assigned at: 2026-05-26
- Completed at: 2026-05-26
- Status: `failed`

## Scope

Allowed files:

- `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/agents/task-08-spec-review.md`
- `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/README.md`

Read-only review targets:

- `electron/main.cjs`
- `electron/preload.cjs`
- `src/services/desktopBridge.ts`
- `src/services/desktopAiAdapter.ts`
- `src/services/aiAdapter.ts`
- `tests/electron-config.test.mjs`
- `src/services/aiAdapter.test.ts`
- Task 8 implementation commit

Forbidden scope:

- Do not modify implementation code.
- Do not start Task 9.
- Do not add dependencies, API keys, `.env` files, private samples/results, `dist`, or `release`.

## Initial Work Plan

1. Wait until Task 8 implementation completes.
2. Check implementation against Task 8 plan steps and file scope.
3. Confirm API keys stay in Electron main process and are not exposed through preload or renderer types.
4. Confirm renderer receives typed IPC methods only, not direct provider/network/key access.
5. Report `PASS`, `FAIL`, or `PASS_WITH_CONCERNS`.

## Progress Log

### 2026-05-26 Pending

- Leader created this reviewer log before spec-review dispatch.
- Spec review is pending until Task 8 implementation completes.

### 2026-05-26 Review Failed

- Reviewed range: `259e5de..4c5efbf`, with implementation focus on `37f5ad9` and log/progress follow-ups in `2a7880f` and `4c5efbf`.
- Result: `FAIL`.
- Confirmed the reviewed implementation stays inside the intended Task 8 file and behavior boundary:
  - `git diff --name-only 259e5de..HEAD` only showed Task 8 code files plus progress / run-log docs.
  - No Task 9 runtime-switch, authorization-copy, style, or `src/app/App.tsx` behavior change landed in the reviewed range.
  - `electron/main.cjs` keeps `DASHSCOPE_API_KEY` reads in Electron main only, and `electron/preload.cjs` still does not expose `DASHSCOPE_API_KEY`.
  - `ai:runtime-status`, `ai:detect-regions`, and `ai:recognize-question` all call `assertAllowedSender(event)`.
  - Disabled / missing-key mode returns `{ ok: false, reason: "real_ai_disabled", ... }` before calling the provider adapter.
  - `src/services/desktopAiAdapter.ts` only delegates through the typed preload bridge and does not access provider code or secrets directly.
- Blocking spec gap: the reviewed test changes do not cover Task 8's key runtime boundary.
  - `tests/electron-config.test.mjs` only regex-checks that AI IPC handler names, env-variable tokens, and preload method names exist in source text, plus the pre-existing `rendererTrust` URL helper behavior.
  - `src/services/aiAdapter.test.ts` only proves that `createDesktopAiAdapter(...)` delegates `detectRegions(...)` and `recognizeQuestion(...)` to the desktop bridge.
  - No reviewed test executes the new AI IPC handlers to prove the `assertAllowedSender(event)` guard, the disabled / missing-key `real_ai_disabled` gate, or the "do not call provider adapter when disabled" boundary.
  - Because Task 8 checklist item 7 requires main / preload / desktop-adapter tests to cover those boundaries, this review cannot pass yet.
- Non-blocking concern: `src/services/desktopBridge.ts` keeps AI methods optional for pre-Task-9 helper compatibility, but `createDesktopAiAdapter(...)` narrows `detectRegions` and `recognizeQuestion` with `Required<Pick<...>>`; this is acceptable as a compatibility choice and does not cause the spec failure on its own.
- Code-quality review should not start yet. Add executable runtime coverage for the AI IPC gate and sender boundary first, then re-run spec review.

## Commands Run

```bash
git status --short --branch
git rev-parse --short HEAD
git rev-parse --abbrev-ref HEAD
git log --oneline --decorate -5
git diff --name-only 259e5de..HEAD
git diff --check
git ls-files -- .env .env.local '.env.*' ai-eval/.env ai-eval/.env.local 'ai-eval/.env.*' ai-eval/samples/manifest.local.json ai-eval/samples/private/math.jpg ai-eval/results/result-123.jsonl
sed -n '1464,1652p' docs/superpowers/plans/2026-05-23-real-ai-recognition.md
sed -n '1,260p' docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/README.md
sed -n '1,260p' docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/agents/task-08-real-ai-ipc.md
git diff 259e5de..HEAD -- electron/main.cjs electron/preload.cjs src/services/desktopBridge.ts src/services/desktopAiAdapter.ts src/services/aiAdapter.ts tests/electron-config.test.mjs src/services/aiAdapter.test.ts
nl -ba electron/main.cjs | sed -n '1,260p'
nl -ba electron/preload.cjs | sed -n '1,220p'
nl -ba src/services/desktopBridge.ts | sed -n '1,220p'
nl -ba src/services/desktopAiAdapter.ts | sed -n '1,240p'
nl -ba src/services/aiAdapter.ts | sed -n '1,260p'
nl -ba tests/electron-config.test.mjs | sed -n '1,260p'
nl -ba src/services/aiAdapter.test.ts | sed -n '1,260p'
rg -n "createDesktopAiAdapter|getAiRuntimeStatus|detectRegions\\(|recognizeQuestion\\(|window\\.evocraft|mock|real_ai_disabled|DASHSCOPE_API_KEY|EVOCRAFT_AI_ENABLED|App\\.tsx|authorization|授权|runtime switch" src electron tests -g '!dist'
npm run test:electron-config
npm run test:react -- src/services/aiAdapter.test.ts
npm run build
rg -n "console\\.log\\(|catch \\([^)]*\\) \\{\\s*\\}|apiKey\\s*=\\s*\\\"" electron src/services tests
```

## Files Changed

- No implementation files changed by the reviewer.
- This log and the run ledger are the only reviewer-written files.

## Verification

- `git status --short --branch` confirmed branch `codex/real-ai-recognition-implementation` at `HEAD=4c5efbf` with a clean worktree before this docs-only review update.
- `git diff --check` passed.
- `npm run test:electron-config` passed.
- `npm run test:react -- src/services/aiAdapter.test.ts` passed with 1 file / 5 tests.
- `npm run build` passed.
- `git diff --name-only 259e5de..HEAD` matched the intended Task 8 scope plus progress / run-log docs:
  - `docs/planning/evocraft-roadmap-progress.md`
  - `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/README.md`
  - `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/agents/task-08-real-ai-ipc.md`
  - `electron/main.cjs`
  - `electron/preload.cjs`
  - `src/services/aiAdapter.test.ts`
  - `src/services/aiAdapter.ts`
  - `src/services/desktopAiAdapter.ts`
  - `src/services/desktopBridge.ts`
  - `tests/electron-config.test.mjs`
- `git ls-files -- ...` returned no tracked `.env`, local manifest, private sample, or generated result files.
- `lsp_diagnostics` returned zero diagnostics for:
  - `electron/main.cjs`
  - `electron/preload.cjs`
  - `src/services/desktopBridge.ts`
  - `src/services/desktopAiAdapter.ts`
  - `src/services/aiAdapter.ts`
  - `tests/electron-config.test.mjs`
  - `src/services/aiAdapter.test.ts`
- `ast_grep_search` was unavailable in this session because `ast-grep` is not installed; fallback `rg` pattern scans found no `console.log(...)`, empty `catch {}` block, or hardcoded `apiKey = "..."` assignment in the reviewed files.
- Spec conclusion is still `FAIL` because the passing tests do not execute the new AI IPC runtime gate / sender boundary.

## Blockers

- Task 8 spec pass is blocked on focused runtime coverage for the new AI IPC handlers:
  - prove untrusted senders are rejected for all three `ai:*` handlers,
  - prove disabled / missing-key mode returns `real_ai_disabled`,
  - prove the provider adapter is not invoked when real AI is disabled.

## Handoff Notes

- Do not start Task 8 code-quality review yet.
- Follow-up implementation should add executable tests for `registerAiIpc(...)` / AI handler behavior rather than only source-text assertions.
- After the follow-up lands, re-run:
  - `git status --short --branch`
  - `git diff --check`
  - `npm run test:electron-config`
  - `npm run test:react -- src/services/aiAdapter.test.ts`
  - `npm run build`
  - `git diff --name-only 259e5de..HEAD`
  - `git ls-files -- .env .env.local '.env.*' ai-eval/.env ai-eval/.env.local 'ai-eval/.env.*' ai-eval/samples/manifest.local.json ai-eval/samples/private/math.jpg ai-eval/results/result-123.jsonl`

## Leader Review

- Review status: failed.
- Review notes: implementation scope and secret boundary are acceptable, but Task 8 checklist item 7 is not met because the reviewed tests do not execute the new AI IPC boundary.
- Required follow-up: add focused runtime coverage for AI IPC sender validation and disabled-mode gating, then re-run spec review before code-quality review.

## Commit

- Reviewed commits: `37f5ad9`, `2a7880f`, `4c5efbf`
