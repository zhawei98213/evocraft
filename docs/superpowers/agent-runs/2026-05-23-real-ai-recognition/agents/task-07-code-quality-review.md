# Agent Task Log: Task 7 Code Quality Review

## Metadata

- Agent ID: Code Quality Reviewer
- Agent role: `code-quality-reviewer`
- Task ID: 7
- Task title: Qwen Adapter Spike Code Quality Review
- Parent plan: `docs/superpowers/plans/2026-05-23-real-ai-recognition.md`
- Assigned at: 2026-05-24
- Completed at: 2026-05-24
- Status: `passed`

## Scope

Allowed files:

- `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/agents/task-07-code-quality-review.md`
- `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/README.md`

Read-only review targets:

- `electron/ai/recognitionPrompt.cjs`
- `electron/ai/qwenAdapter.cjs`
- `tests/qwen-adapter-contract.test.mjs`
- `scripts/evaluate-ai-samples.mjs`
- `package.json`
- `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/agents/task-07-qwen-adapter-spike.md`
- `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/agents/task-07-spec-review.md`
- Task 7 implementation and spec-review commits

Forbidden scope:

- Do not modify implementation code.
- Do not start Task 8.
- Do not add dependencies, provider calls in tests, private samples/results, API keys, or `.env` files.

## Initial Work Plan

1. Wait until Task 7 spec review passes.
2. Review adapter failure behavior, prompt containment, request construction, JSON parsing, test adequacy, runner safety, and scope containment.
3. Confirm no tests call the real provider and no secrets or generated outputs are tracked.
4. Confirm the adapter remains Node/Electron-side and is not bundled into the renderer yet.
5. Report `PASS`, `FAIL`, or `PASS_WITH_CONCERNS`.

## Progress Log

### 2026-05-24 Pending

- Leader created this reviewer log before quality-review dispatch.
- Quality review is pending until Task 7 spec review passes.

### 2026-05-24 Review Passed With Concerns

- Reviewed commits `5f9ba4f`, `0c8e488`, `309f8aa`, and docs-range head `a5c4c83`.
- Result: `PASS_WITH_CONCERNS`.
- Confirmed `electron/ai/recognitionPrompt.cjs` keeps the prompt recognition-only and explicitly forbids solving, explanations, wrong-cause analysis, knowledge points, and similar-question generation.
- Confirmed `electron/ai/qwenAdapter.cjs` keeps provider execution in the Node/Electron-side adapter, maps request/parse failures to recoverable failure objects, uses `selectedRegionImageUri` as the only provider image input, and does not throw on the malformed payload probes run during review.
- Confirmed `tests/qwen-adapter-contract.test.mjs` uses fake fetch only, covers success plus key failure branches, and never calls the real provider.
- Confirmed `scripts/evaluate-ai-samples.mjs` stays disabled by default, still requires `DASHSCOPE_API_KEY` before adapter construction, routes provider access through `createQwenAdapter`, and writes JSONL rows with `sampleId`, `subject`, `ok`, `elapsedMs`, and `result`.
- Confirmed `tests/ai-eval-config.test.mjs` protects the runner gates, shared-adapter usage, and privacy ignore boundaries, and `package.json` only adds the `test:qwen-adapter` script with no dependency churn.
- Non-blocking concern `[MEDIUM]` `electron/ai/qwenAdapter.cjs:163`: `subject: "auto"` is silently rewritten to `"math"` even when the provider response contains no subject classification. A direct review probe returned `true math`, so future auto-subject calls would misfile non-math drafts instead of surfacing an unresolved subject. Fix: require subject output from the provider and validate/map it, or return a recoverable invalid-response path instead of hardcoding `"math"`.
- Non-blocking concern `[MEDIUM]` `electron/ai/qwenAdapter.cjs:232-239`: `normalizeReviewItems()` accepts any non-empty `status` string, despite the prompt contract restricting status to `可信` or `需复核`. A direct review probe returned `[{"label":"答案","status":"模型长篇解释而不是状态"}]`, so malformed provider responses can persist arbitrary status text. Fix: normalize unknown statuses to `需复核` or drop invalid items and fall back to the default review item, then add a contract test for that case.
- Test-gap note `[LOW]` `tests/qwen-adapter-contract.test.mjs:154-185`: the contract test covers thrown-request and malformed-content failures but does not yet assert the non-`ok` HTTP branch or the invalid-review-status normalization path. Fix: add fake-fetch cases for `response.ok === false` and for a bad `reviewItems[*].status` value.

### 2026-05-24 Follow-Up Fixed

- Leader accepted both medium concerns and fixed them before Task 8.
- Added contract tests for the HTTP non-`ok` branch, invalid review-item status normalization, missing provider subject in auto mode, and valid provider subject mapping in auto mode.
- Updated `recognitionPrompt.cjs` to require `subject` when the user selects auto mode, constrained to `chinese`, `math`, or `english`.
- Updated `qwenAdapter.cjs` so explicit user-selected subjects are preserved, auto mode requires a valid provider subject, missing/invalid auto-subject responses return `provider_response_invalid`, and invalid review-item statuses downgrade to `需复核`.
- Focused and broader verification passed after the fix.

### 2026-05-24 Re-review Failed

- Code-quality re-review confirmed the previous auto-subject and review-status concerns were fixed, but returned `FAIL` on prompt containment.
- Issue: `buildRecognitionPrompt({ subject: "chinese" })` still included the auto-subject return instruction, so explicit-subject requests were unnecessarily asking the provider to classify the subject again.
- Required fix: include the `subject` return instruction only for `subject === "auto"`.

### 2026-05-24 Prompt Follow-Up Fixed

- Added prompt contract assertions to `tests/qwen-adapter-contract.test.mjs`.
- Verified the new assertion failed while explicit-subject prompts still included the auto-subject instruction.
- Updated `recognitionPrompt.cjs` so the auto-subject instruction is appended only for auto mode.
- Focused and broader verification passed after the fix.

### 2026-05-24 Re-review Passed

- Reviewed follow-up commits `338e55b` and `f090b93`.
- Result: `PASS`.
- Confirmed `buildRecognitionPrompt({ subject: "chinese" })` no longer includes the auto-subject return instruction, while `buildRecognitionPrompt({ subject: "auto" })` still includes it.
- Confirmed the prompt remains recognition-only and still forbids solving, explanations, wrong-cause analysis, knowledge points, and similar-question generation.
- Confirmed the earlier adapter fixes remain closed: explicit subjects are preserved, auto mode requires a valid provider subject and returns `provider_response_invalid` when missing/invalid, and invalid `reviewItems[*].status` values still normalize to `需复核`.
- Confirmed the contract test now covers explicit prompt containment, auto prompt containment, `response.ok === false`, invalid review-item status normalization, auto mode without provider subject, and auto mode with a valid provider subject.
- Confirmed the follow-up range stays contained to prompt/test/docs updates and does not touch Electron main/preload, renderer runtime, storage, dependencies, API key/`.env`, private samples, generated results, `dist`, or `release`.

## Commands Run

```bash
git status --short --branch
git diff --check
npm run test:qwen-adapter
npm run test:ai-eval-config
npm test
npm run build
node scripts/evaluate-ai-samples.mjs
EVOCRAFT_AI_EVAL_ENABLED=1 node scripts/evaluate-ai-samples.mjs
git diff --name-only 704afd3..a5c4c83
git ls-files -- .env .env.local '.env.*' ai-eval/.env ai-eval/.env.local 'ai-eval/.env.*' ai-eval/samples/manifest.local.json ai-eval/samples/private/math.jpg ai-eval/results/result-123.jsonl
npx tsc --noEmit --pretty false --project tsconfig.json
node -e 'const {createQwenAdapter}=require("./electron/ai/qwenAdapter.cjs"); (async()=>{const r=await createQwenAdapter({apiKey:"test-key",fetchImpl:async()=>({ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({title:"t",questionText:"q",reviewItems:[]})}}]})})}).recognizeQuestion({subject:"auto",imageUri:"data:image/png;base64,b3JpZw==",selectedRegion:{id:"r",label:"R",x:0,y:0,width:1,height:1,unit:"ratio",source:"manual",confidence:1},selectedRegionImageUri:"data:image/png;base64,cmVnaW9u"}); console.log(r.ok, r.draft.subject);})()'
node -e 'const {createQwenAdapter}=require("./electron/ai/qwenAdapter.cjs"); (async()=>{const r=await createQwenAdapter({apiKey:"test-key",fetchImpl:async()=>({ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({title:"t",questionText:"q",reviewItems:[{label:"答案",status:"模型长篇解释而不是状态"}]})}}]})})}).recognizeQuestion({subject:"chinese",imageUri:"data:image/png;base64,b3JpZw==",selectedRegion:{id:"r",label:"R",x:0,y:0,width:1,height:1,unit:"ratio",source:"manual",confidence:1},selectedRegionImageUri:"data:image/png;base64,cmVnaW9u"}); console.log(JSON.stringify(r.draft.reviewItems));})()'
npm run test:qwen-adapter
npm run test:ai-eval-config
npm test
npm run build
node scripts/evaluate-ai-samples.mjs
EVOCRAFT_AI_EVAL_ENABLED=1 node scripts/evaluate-ai-samples.mjs
git diff --name-only 338e55b..f090b93
git ls-files -- .env .env.local '.env.*' ai-eval/.env ai-eval/.env.local 'ai-eval/.env.*' ai-eval/samples/manifest.local.json ai-eval/samples/private/math.jpg ai-eval/results/result-123.jsonl
node - <<'EOF'
const { buildRecognitionPrompt } = require('./electron/ai/recognitionPrompt.cjs');
const explicit = buildRecognitionPrompt({ subject: 'chinese' });
const auto = buildRecognitionPrompt({ subject: 'auto' });
console.log(JSON.stringify({
  explicitHasAutoInstruction: /自动判断，必须返回 subject/.test(explicit),
  autoHasAutoInstruction: /自动判断，必须返回 subject/.test(auto),
}, null, 2));
EOF
node - <<'EOF'
const { createQwenAdapter } = require('./electron/ai/qwenAdapter.cjs');
(async () => {
  const base = {
    imageUri: 'data:image/png;base64,b3JpZw==',
    selectedRegion: { id:'r', label:'R', x:0, y:0, width:1, height:1, unit:'ratio', source:'manual', confidence:1 },
    selectedRegionImageUri: 'data:image/png;base64,cmVnaW9u',
  };
  const explicit = await createQwenAdapter({
    apiKey: 'test-key',
    fetchImpl: async () => ({ ok: true, async json() { return { choices: [{ message: { content: JSON.stringify({ subject:'english', title:'t', questionText:'q', reviewItems:[{label:'x', status:'可信'}] }) } }] }; } }),
  }).recognizeQuestion({ ...base, subject: 'chinese' });
  const autoMissing = await createQwenAdapter({
    apiKey: 'test-key',
    fetchImpl: async () => ({ ok: true, async json() { return { choices: [{ message: { content: JSON.stringify({ title:'t', questionText:'q', reviewItems:[{label:'x', status:'可信'}] }) } }] }; } }),
  }).recognizeQuestion({ ...base, subject: 'auto' });
  const autoInvalid = await createQwenAdapter({
    apiKey: 'test-key',
    fetchImpl: async () => ({ ok: true, async json() { return { choices: [{ message: { content: JSON.stringify({ subject:'science', title:'t', questionText:'q', reviewItems:[{label:'x', status:'可信'}] }) } }] }; } }),
  }).recognizeQuestion({ ...base, subject: 'auto' });
  const autoValid = await createQwenAdapter({
    apiKey: 'test-key',
    fetchImpl: async () => ({ ok: true, async json() { return { choices: [{ message: { content: JSON.stringify({ subject:'english', title:'t', questionText:'q', reviewItems:[{label:'x', status:'可信'}] }) } }] }; } }),
  }).recognizeQuestion({ ...base, subject: 'auto' });
  const badStatus = await createQwenAdapter({
    apiKey: 'test-key',
    fetchImpl: async () => ({ ok: true, async json() { return { choices: [{ message: { content: JSON.stringify({ title:'t', questionText:'q', reviewItems:[{label:'x', status:'bad status'}] }) } }] }; } }),
  }).recognizeQuestion({ ...base, subject: 'english' });
  console.log(JSON.stringify({
    explicitSubject: explicit.ok && explicit.draft.subject,
    autoMissing,
    autoInvalid,
    autoValidSubject: autoValid.ok && autoValid.draft.subject,
    badStatus: badStatus.ok && badStatus.draft.reviewItems,
  }, null, 2));
})();
EOF
```

## Files Changed

- This log file.
- `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/README.md`

## Verification

- `git diff --check` passed.
- `npm run test:qwen-adapter` passed.
- `npm run test:ai-eval-config` passed.
- `npm test` passed with 5 test files and 30 tests.
- `npm run build` passed.
- `node scripts/evaluate-ai-samples.mjs` exited `2` with the disabled message before any provider call.
- `EVOCRAFT_AI_EVAL_ENABLED=1 node scripts/evaluate-ai-samples.mjs` exited `2` with the missing-key message before adapter construction.
- `git diff --name-only 704afd3..a5c4c83` stayed within Task 7 code/tests/docs scope and did not include Electron main/preload IPC, renderer runtime, storage format, dependencies, `dist`, or `release`.
- `git ls-files` found no tracked `.env`, private sample, or generated result files.
- `npx tsc --noEmit --pretty false --project tsconfig.json` passed.
- `lsp_diagnostics` reported zero findings for `electron/ai/recognitionPrompt.cjs`, `electron/ai/qwenAdapter.cjs`, `tests/qwen-adapter-contract.test.mjs`, `scripts/evaluate-ai-samples.mjs`, `tests/ai-eval-config.test.mjs`, and `package.json`.
- `ast-grep` was unavailable in this environment, so the required pattern checks were retried with `rg`; no empty catches or hardcoded `apiKey = "..."` matches were found, and the only `console.log` hit was the expected result-summary line in `scripts/evaluate-ai-samples.mjs`.
- Direct probe evidence:
  - `node -e ... subject:"auto" ...` printed `true math`.
  - `node -e ... bad reviewItems status ...` printed `[{"label":"答案","status":"模型长篇解释而不是状态"}]`.
- Follow-up RED: `npm run test:qwen-adapter` failed before the status-normalization fix.
- Follow-up GREEN: `npm run test:qwen-adapter`, `npm run test:ai-eval-config`, `git diff --check`, `npm test`, `npm run build`, `node scripts/evaluate-ai-samples.mjs`, and `EVOCRAFT_AI_EVAL_ENABLED=1 node scripts/evaluate-ai-samples.mjs` passed after the fix.
- Re-review result: `FAIL` because explicit-subject prompts still included the auto-subject instruction.
- Prompt follow-up RED: `npm run test:qwen-adapter` failed before the prompt containment fix.
- Prompt follow-up GREEN: `npm run test:qwen-adapter`, `npm run test:ai-eval-config`, `git diff --check`, `npm test`, `npm run build`, `node scripts/evaluate-ai-samples.mjs`, and `EVOCRAFT_AI_EVAL_ENABLED=1 node scripts/evaluate-ai-samples.mjs` passed after the fix.
- `git diff --name-only 338e55b..f090b93` stayed within prompt/test/docs scope and did not include Electron main/preload IPC, renderer runtime, storage, dependencies, `dist`, or `release`.
- `git ls-files` again found no tracked `.env`, private sample, or generated result files.
- Direct prompt probe printed `explicitHasAutoInstruction: false` and `autoHasAutoInstruction: true`.
- Direct adapter probe confirmed:
  - explicit subject remains `chinese`
  - missing/invalid auto subject returns `provider_response_invalid`
  - valid auto subject maps to `english`
  - invalid review-item status normalizes to `需复核`
- `lsp_diagnostics` / `ast-grep` were unavailable in this re-review lane because the `omx_code_intel` transport closed, so `npx tsc --noEmit --pretty false --project tsconfig.json` plus direct `rg` pattern checks were used as fallback diagnostics.

## Blockers

- 无。

## Handoff Notes

- Task 7 code-quality review is now fully passed.
- Task 8 has not started in this lane.

## Leader Review

- Review status: passed.
- Review notes: the prompt follow-up at `f090b93` closes the last containment issue without reopening the earlier adapter concerns, and the required prompt/adapter contract coverage is now in place.
- Required follow-up: Task 7 quality lane is complete; do not infer Task 8 execution from this review.

## Commit

- Reviewed commits: `5f9ba4f`, `0c8e488`, `309f8aa`, `a5c4c83`, `338e55b`, `f090b93`
