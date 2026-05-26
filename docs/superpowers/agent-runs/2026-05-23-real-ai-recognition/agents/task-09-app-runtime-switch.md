# Agent Task Log: Task 9 App Runtime Switch

## Metadata

- Agent ID: Implementer
- Agent role: `implementer`
- Task ID: 9
- Task title: Add App-Level Runtime Switch, Authorization Copy, And Verification
- Parent plan: `docs/superpowers/plans/2026-05-23-real-ai-recognition.md`
- Assigned at: 2026-05-26
- Completed at:
- Status: `assigned`

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

- Task 9 owns app runtime selection, explicit external AI authorization copy, and final verification for the real-AI desktop slice.
- Phase 2 learning features remain out of scope.

## Leader Review

- Review status:
- Review notes:
- Required follow-up:

## Commit

- Commit hash:
