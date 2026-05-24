# Agent Task Log: Task 5 AI Adapter Contract

## Metadata

- Agent ID: Implementer
- Agent role: `implementer`
- Task ID: 5
- Task title: Expand AI Adapter Contract For Real Recognition
- Parent plan: `docs/superpowers/plans/2026-05-23-real-ai-recognition.md`
- Assigned at: 2026-05-24
- Completed at:
- Status: `pending`

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
- Implementation has not started yet.

## Commands Run

```bash
# No commands run yet.
```

## Files Changed

- No files changed yet.

## Verification

- Not run yet.

## Blockers

- 无。

## Handoff Notes

- This task prepares the AI boundary for real recognition but must not call any provider.

## Leader Review

- Review status:
- Review notes:
- Required follow-up:

## Commit

- Commit hash:
