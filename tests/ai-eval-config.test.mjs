import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

assert.ok(existsSync("scripts/evaluate-ai-samples.mjs"), "evaluation script should exist");
assert.ok(existsSync("ai-eval/README.md"), "evaluation README should exist");
assert.ok(existsSync("ai-eval/samples/.gitkeep"), "samples keepfile should exist");
assert.ok(existsSync("ai-eval/samples/manifest.example.json"), "manifest example should exist");
assert.ok(existsSync("ai-eval/results/.gitignore"), "evaluation results must be ignored");

const script = readFileSync("scripts/evaluate-ai-samples.mjs", "utf8");
assert.match(script, /EVOCRAFT_AI_EVAL_ENABLED/, "runner should require an explicit enable flag");
assert.match(script, /DASHSCOPE_API_KEY/, "runner should mention the DashScope API key");
assert.match(script, /manifestPath/, "runner should read a manifest path");
assert.match(script, /outputPath/, "runner should support a result output path");
assert.match(script, /status:\s*"not-run"/, "runner should only emit placeholder not-run rows for now");
assert.match(script, /Provider adapter is connected in the next task\./, "runner should document the Task 7 handoff");
assert.doesNotMatch(script, /fetch\(.*DASHSCOPE_API_KEY/s, "runner must not call a provider directly in Task 6");

const readme = readFileSync("ai-eval/README.md", "utf8");
assert.match(readme, /Real child photos are not committed\./);
assert.match(readme, /manifest\.local\.json/);
assert.match(readme, /EVOCRAFT_AI_EVAL_ENABLED=1/);

const manifestExample = JSON.parse(readFileSync("ai-eval/samples/manifest.example.json", "utf8"));
assert.equal(manifestExample.schemaVersion, 1);
assert.ok(Array.isArray(manifestExample.samples), "manifest example should use a samples array");
assert.ok(manifestExample.samples.length > 0, "manifest example should include at least one sample");
assert.equal(manifestExample.samples[0].expected.mustNotInferAnswer, true);

const resultsIgnore = readFileSync("ai-eval/results/.gitignore", "utf8");
assert.match(resultsIgnore, /^\*/m);
assert.match(resultsIgnore, /^!\.gitignore$/m);

const rootIgnore = readFileSync(".gitignore", "utf8");
assert.match(rootIgnore, /^ai-eval\/samples\/\*$/m);
assert.match(rootIgnore, /^!ai-eval\/samples\/\.gitkeep$/m);
assert.match(rootIgnore, /^!ai-eval\/samples\/manifest\.example\.json$/m);
assert.match(rootIgnore, /^ai-eval\/results\/\*$/m);
assert.match(rootIgnore, /^!ai-eval\/results\/\.gitignore$/m);

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
assert.equal(pkg.scripts["test:ai-eval-config"], "node tests/ai-eval-config.test.mjs");
