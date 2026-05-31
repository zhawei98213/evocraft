import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

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
assert.match(script, /createQwenAdapter/, "runner should use the shared Qwen adapter after Task 7");
assert.match(script, /adapter\.recognizeQuestion/, "runner should evaluate samples through recognizeQuestion");
assert.match(script, /toDataUrl/, "runner should convert local sample files before provider calls");
assert.doesNotMatch(script, /pathToFileURL/, "runner must not send local file URLs to cloud providers");
assert.doesNotMatch(script, /status:\s*"not-run"/, "Task 7 runner should not keep Task 6 placeholder rows");
assert.doesNotMatch(
  script,
  /Provider adapter is connected in the next task\./,
  "Task 7 runner should not keep the old handoff comment",
);
assert.doesNotMatch(script, /fetch\(.*DASHSCOPE_API_KEY/s, "runner must not bypass the shared adapter");

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
assert.match(rootIgnore, /^\.env$/m);
assert.match(rootIgnore, /^\.env\.local$/m);
assert.match(rootIgnore, /^\.env\.\*$/m);
assert.match(rootIgnore, /^ai-eval\/samples\/\*$/m);
assert.match(rootIgnore, /^!ai-eval\/samples\/\.gitkeep$/m);
assert.match(rootIgnore, /^!ai-eval\/samples\/manifest\.example\.json$/m);
assert.match(rootIgnore, /^ai-eval\/results\/\*$/m);
assert.match(rootIgnore, /^!ai-eval\/results\/\.gitignore$/m);

assertGitIgnored(".env");
assertGitIgnored(".env.local");
assertGitIgnored(".env.production");
assertGitIgnored("ai-eval/.env");
assertGitIgnored("ai-eval/.env.local");
assertGitIgnored("ai-eval/samples/manifest.local.json");
assertGitIgnored("ai-eval/samples/private/math.jpg");
assertGitIgnored("ai-eval/results/result-123.jsonl");
assertGitNotIgnored("ai-eval/samples/.gitkeep");
assertGitNotIgnored("ai-eval/samples/manifest.example.json");
assertGitNotIgnored("ai-eval/results/.gitignore");

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
assert.equal(pkg.scripts["test:ai-eval-config"], "node tests/ai-eval-config.test.mjs");
assert.match(pkg.scripts.test, /tests\/ai-eval-config\.test\.mjs/);

const validSmallManifest = {
  schemaVersion: 1,
  samples: [
    {
      id: "math-geometry-001",
      subject: "math",
      imagePath: "private/sample.jpg",
      labels: ["geometry"],
      expected: {
        targetQuestion: "人工确认区域中的一道题",
        mustNotInferAnswer: true,
        mustPreserveVisualElements: ["geometry-diagram"],
      },
    },
  ],
};

assert.equal(runValidateOnly(createTempManifest(validSmallManifest), "--allow-small-set").status, 0);

const symlinkWorkspace = createTempManifestWorkspace(validSmallManifest, []);
const outsideSamplePath = join(tmpdir(), `evocraft-outside-${process.pid}-${Date.now()}.txt`);
writeFileSync(outsideSamplePath, "outside sample content", "utf8");
symlinkSync(outsideSamplePath, join(symlinkWorkspace.root, "private", "sample.jpg"));
assertValidateFailureFromPath(symlinkWorkspace.manifestPath, /symbolic link|outside/i, "--allow-small-set");

const invalidSubject = structuredClone(validSmallManifest);
invalidSubject.samples[0].subject = "science";
assertValidateFailure(invalidSubject, /invalid subject/, "--allow-small-set");

const duplicateIds = structuredClone(validSmallManifest);
duplicateIds.samples.push({ ...duplicateIds.samples[0] });
assertValidateFailure(duplicateIds, /duplicate sample id/, "--allow-small-set");

const escapingPath = structuredClone(validSmallManifest);
escapingPath.samples[0].imagePath = "../outside.jpg";
assertValidateFailure(escapingPath, /invalid imagePath/, "--allow-small-set");

const absolutePath = structuredClone(validSmallManifest);
const absoluteImagePath = join(tmpdir(), "outside.jpg");
absolutePath.samples[0].imagePath = absoluteImagePath;
assertValidateFailure(absolutePath, /invalid imagePath/, "--allow-small-set", { forbiddenText: absoluteImagePath });

assertValidateFailure(validSmallManifest, /first-pass evaluation requires 10-15 samples/);

function createTempManifest(contents, imageNames = ["sample.jpg"]) {
  return createTempManifestWorkspace(contents, imageNames).manifestPath;
}

function createTempManifestWorkspace(contents, imageNames = ["sample.jpg"]) {
  const root = mkdtempSync(join(tmpdir(), "evocraft-ai-eval-"));
  mkdirSync(join(root, "private"), { recursive: true });
  for (const imageName of imageNames) {
    writeFileSync(join(root, "private", imageName), "fake image bytes");
  }

  const manifestPath = join(root, "manifest.local.json");
  writeFileSync(manifestPath, JSON.stringify(contents), "utf8");
  return { root, manifestPath };
}

function assertValidateFailure(manifest, expectedMessage, ...args) {
  assertValidateFailureFromPath(createTempManifest(manifest), expectedMessage, ...args);
}

function assertValidateFailureFromPath(manifestPath, expectedMessage, ...args) {
  const { extraArgs, options } = parseFailureAssertionArgs(args);
  const result = runValidateOnly(manifestPath, ...extraArgs);
  assert.equal(result.status, 1);
  assert.match(result.stderr, expectedMessage);
  if (options.forbiddenText) {
    assert.doesNotMatch(result.stderr, new RegExp(escapeRegExp(options.forbiddenText)));
  }
  assert.doesNotMatch(result.stderr, /file:\/\//);
  assert.doesNotMatch(result.stderr, /\n\s+at\s+/);
}

function parseFailureAssertionArgs(args) {
  const options = {};
  if (args.length > 0) {
    const lastArg = args.at(-1);
    if (lastArg && typeof lastArg === "object" && !Array.isArray(lastArg)) {
      Object.assign(options, args.pop());
    }
  }

  return { extraArgs: args, options };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function runValidateOnly(manifestPath, ...extraArgs) {
  return spawnSync(
    process.execPath,
    ["scripts/evaluate-ai-samples.mjs", manifestPath, join(tmpdir(), "unused.jsonl"), "--validate-only", ...extraArgs],
    { encoding: "utf8" },
  );
}

function assertGitIgnored(path) {
  const result = spawnSync("git", ["check-ignore", "--quiet", path], { encoding: "utf8" });
  assert.equal(result.status, 0, `${path} should be ignored by git`);
}

function assertGitNotIgnored(path) {
  const result = spawnSync("git", ["check-ignore", "--quiet", path], { encoding: "utf8" });
  assert.notEqual(result.status, 0, `${path} should not be ignored by git`);
}
