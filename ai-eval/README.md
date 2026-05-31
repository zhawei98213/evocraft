# EvoCraft AI Evaluation

This folder defines the local evaluation workflow for real AI recognition.

- Real child photos are not committed.
- Use `ai-eval/samples/manifest.local.json` for private local samples.
- Use `ai-eval/results/` for generated result JSONL files.
- The runner calls cloud AI only when `EVOCRAFT_AI_EVAL_ENABLED=1`.
- The first pass should use 10-15 mixed Chinese, math, and English samples.
- The pass criteria are valid JSON, no invented answer, recoverable failures, and clear review flags.
