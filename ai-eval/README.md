# EvoCraft AI Evaluation

This folder defines the local evaluation workflow for real AI recognition.

- Real child photos are not committed.
- Use `ai-eval/samples/manifest.local.json` for private local samples.
- Put real sample images under `ai-eval/samples/private/`; that directory stays git ignored.
- Use `ai-eval/results/` for generated result JSONL files.
- The runner calls cloud AI only when `EVOCRAFT_AI_EVAL_ENABLED=1`.
- The first pass should use 10-15 mixed Chinese, math, and English samples.
- The pass criteria are valid JSON, no invented answer, recoverable failures, and clear review flags.

Validation and local dry-run commands:

```bash
node scripts/evaluate-ai-samples.mjs ai-eval/samples/manifest.local.json ai-eval/results/unused.jsonl --validate-only
node scripts/evaluate-ai-samples.mjs ai-eval/samples/manifest.local.json ai-eval/results/unused.jsonl --validate-only --allow-small-set
```

- `--validate-only` checks the manifest and referenced image files before any provider env checks.
- `--allow-small-set` is only for local script tests and tiny dry runs; the first real pass still requires 10-15 samples.

Provider run command:

```bash
EVOCRAFT_AI_EVAL_ENABLED=1 DASHSCOPE_API_KEY=your_key_here \
  node scripts/evaluate-ai-samples.mjs ai-eval/samples/manifest.local.json ai-eval/results/result-local.jsonl
```

Redacted summary command:

```bash
node scripts/summarize-ai-eval-results.mjs \
  ai-eval/results/result-local.jsonl \
  docs/testing/ai-eval/2026-05-31-qwen-sample-summary.md
```

- The summary output is for committed aggregate conclusions only.
- Do not commit raw JSONL rows, OCR text, provider raw responses, request bodies, auth headers, tokens, or image data URLs.

Current design and execution docs:

- `docs/superpowers/specs/2026-05-31-qwen-sample-evaluation-design.md`
- `docs/superpowers/plans/2026-05-31-qwen-sample-evaluation.md`
- `docs/superpowers/agent-runs/2026-05-31-qwen-sample-evaluation/README.md`
