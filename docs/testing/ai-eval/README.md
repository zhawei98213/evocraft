# AI Eval Redacted Summaries

This directory is for committed aggregate evaluation summaries only.

Allowed committed content:

- Total sample counts, malformed-row counts, success/failure counts, review-item row counts, and elapsed-time aggregates.
- Subject counts limited to `chinese`, `math`, `english`, `auto`, `unknown`, and `redacted_subject`.
- Failure-reason counts limited to safe aggregate labels; unsafe values are collapsed to `redacted_failure_reason`.
- Short decision notes derived from aggregate results.

Forbidden committed content:

- Raw OCR text or reconstructed question text.
- Provider raw responses, prompt text, or request bodies.
- `Authorization` headers, Bearer tokens, API keys, env values, or `.env` contents.
- `data:image/...` URLs, base64 image payloads, or private local sample paths.
- Full failure messages copied from provider output.
- Arbitrary subject labels or failure reasons copied from model/provider output.

Use the reporter to generate Markdown from ignored JSONL results:

```bash
node scripts/summarize-ai-eval-results.mjs \
  ai-eval/results/result-local.jsonl \
  docs/testing/ai-eval/<date>-qwen-sample-summary.md
```

Keep `ai-eval/results/*.jsonl` ignored. Commit only the redacted aggregate summary when the evaluation is ready for review.
