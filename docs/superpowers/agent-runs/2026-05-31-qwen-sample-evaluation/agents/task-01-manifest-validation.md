# Agent Task Log: Task 1 Manifest Validation And Dry Run

## Metadata

- Agent ID: unassigned
- Agent role: `implementer`
- Task ID: `1`
- Task title: Manifest Validation And Dry Run
- Parent plan: `docs/superpowers/plans/2026-05-31-qwen-sample-evaluation.md`
- Assigned at: not assigned
- Completed at: not completed
- Status: `pending`

## Scope

Allowed files:

- `scripts/evaluate-ai-samples.mjs`
- `tests/ai-eval-config.test.mjs`
- `ai-eval/samples/manifest.example.json`
- `ai-eval/README.md`
- `package.json` only if a new script name is required
- `docs/superpowers/agent-runs/2026-05-31-qwen-sample-evaluation/agents/task-01-manifest-validation.md`
- `docs/superpowers/agent-runs/2026-05-31-qwen-sample-evaluation/README.md`

Forbidden scope:

- Do not call the provider.
- Do not create or commit `manifest.local.json`.
- Do not commit real samples or raw results.
- Do not change Qwen prompt behavior unless tests prove validation requires it.

## Initial Work Plan

1. Add RED tests for `--validate-only`, invalid subject, duplicate ids, escaping path, and sample-count gate.
2. Implement manifest validation in the eval runner.
3. Update manifest example and eval README.
4. Run focused and full verification.
5. Record evidence and commit.

## Progress Log

- Awaiting Task 0 completion.

## Commands Run

```bash
```

## Files Changed

- None yet.

## Verification

- Not run yet.

## Blockers

- Blocked until Task 0 passes.

## Handoff Notes

- Task 2 can start after validation tests are green.

## Commit

- Not committed.
