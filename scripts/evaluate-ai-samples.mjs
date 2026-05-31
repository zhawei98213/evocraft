import { lstat, mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createQwenAdapter } from "../electron/ai/qwenAdapter.cjs";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  if (process.env.EVOCRAFT_AI_EVAL_DEBUG === "1" && error instanceof Error && error.stack) {
    console.error(error.stack);
  } else {
    console.error(`AI evaluation failed: ${message}`);
  }
  process.exitCode = 1;
});

async function main() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((arg) => arg.startsWith("--")));
  const positional = args.filter((arg) => !arg.startsWith("--"));
  const manifestPath = positional[0] ?? join(repoRoot, "ai-eval/samples/manifest.local.json");
  const outputPath = positional[1] ?? join(repoRoot, `ai-eval/results/result-${Date.now()}.jsonl`);
  const validateOnly = flags.has("--validate-only");
  const allowSmallSet = flags.has("--allow-small-set");

  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  await validateManifest(manifest, manifestPath, { allowSmallSet });

  if (validateOnly) {
    console.log(`Manifest is valid: ${manifest.samples.length} samples`);
    return;
  }

  if (process.env.EVOCRAFT_AI_EVAL_ENABLED !== "1") {
    console.error("AI evaluation is disabled. Set EVOCRAFT_AI_EVAL_ENABLED=1 to call the provider.");
    process.exitCode = 2;
    return;
  }

  if (!process.env.DASHSCOPE_API_KEY) {
    console.error("DASHSCOPE_API_KEY is required for Qwen evaluation.");
    process.exitCode = 2;
    return;
  }

  await mkdir(dirname(outputPath), { recursive: true });

  const adapter = createQwenAdapter({ apiKey: process.env.DASHSCOPE_API_KEY });
  const rows = [];
  for (const sample of manifest.samples) {
    const imagePath = await resolveSampleImagePath(manifestPath, sample.imagePath, sample.id);
    const imageUri = await toDataUrl(imagePath);
    const startedAt = Date.now();
    const result = await adapter.recognizeQuestion({
      subject: sample.subject ?? "auto",
      imageUri,
      selectedRegion: {
        id: `${sample.id}-full`,
        label: "人工确认区域",
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        unit: "ratio",
        source: "manual",
        confidence: 1,
      },
      selectedRegionImageUri: imageUri,
    });

    rows.push({
      sampleId: sample.id,
      subject: sample.subject,
      ok: result.ok,
      elapsedMs: Date.now() - startedAt,
      result,
    });
  }

  await writeFile(outputPath, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`, "utf8");
  console.log(`Wrote ${rows.length} evaluation rows to ${outputPath}`);
}

async function validateManifest(manifest, currentManifestPath, options = {}) {
  if (manifest?.schemaVersion !== 1) {
    throw new Error("manifest.schemaVersion must be 1");
  }

  if (!Array.isArray(manifest.samples) || manifest.samples.length === 0) {
    throw new Error("manifest.samples must be a non-empty array");
  }

  if (!options.allowSmallSet && (manifest.samples.length < 10 || manifest.samples.length > 15)) {
    throw new Error("first-pass evaluation requires 10-15 samples; use --allow-small-set only for local script tests");
  }

  const ids = new Set();
  for (const sample of manifest.samples) {
    validateSample(sample, ids);
    const imagePath = await resolveSampleImagePath(currentManifestPath, sample.imagePath, sample.id);
    try {
      await readFile(imagePath);
    } catch (error) {
      throw new Error(`image file is not readable for ${sample.id}: ${sample.imagePath}`, { cause: error });
    }
  }
}

function validateSample(sample, ids) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(sample?.id ?? "")) {
    throw new Error("sample.id must use lowercase letters, numbers, and hyphens");
  }

  if (ids.has(sample.id)) {
    throw new Error(`duplicate sample id: ${sample.id}`);
  }
  ids.add(sample.id);

  if (!["chinese", "math", "english", "auto"].includes(sample.subject)) {
    throw new Error(`invalid subject for ${sample.id}`);
  }

  if (!Array.isArray(sample.labels) || sample.labels.some((label) => typeof label !== "string")) {
    throw new Error(`labels must be strings for ${sample.id}`);
  }

  if (sample?.expected?.mustNotInferAnswer !== true) {
    throw new Error(`expected.mustNotInferAnswer must be true for ${sample.id}`);
  }

  if (
    !Array.isArray(sample?.expected?.mustPreserveVisualElements) ||
    sample.expected.mustPreserveVisualElements.some((value) => typeof value !== "string")
  ) {
    throw new Error(`expected.mustPreserveVisualElements must be an array of strings for ${sample.id}`);
  }
}

async function resolveSampleImagePath(currentManifestPath, imagePath, sampleId = "sample") {
  if (typeof imagePath !== "string" || imagePath.length === 0) {
    throw new Error("sample.imagePath must be a non-empty string");
  }

  if (isAbsolute(imagePath) || imagePath.split(/[\\/]/).includes("..")) {
    throw new Error(`invalid imagePath for ${sampleId}: path must be relative and cannot contain parent-directory segments`);
  }

  const manifestDirectory = dirname(currentManifestPath);
  const resolvedImagePath = resolve(manifestDirectory, imagePath);
  const relativeImagePath = relative(manifestDirectory, resolvedImagePath);
  if (relativeImagePath.startsWith("..") || isAbsolute(relativeImagePath)) {
    throw new Error(`imagePath resolves outside the manifest directory: ${imagePath}`);
  }

  let fileStats;
  try {
    fileStats = await lstat(resolvedImagePath);
  } catch (error) {
    throw new Error(`image file is not readable for ${sampleId}: ${imagePath}`, { cause: error });
  }

  if (fileStats.isSymbolicLink()) {
    throw new Error(`sample imagePath must not be a symbolic link for ${sampleId}: ${imagePath}`);
  }

  let manifestDirectoryRealPath;
  let imageRealPath;
  try {
    [manifestDirectoryRealPath, imageRealPath] = await Promise.all([
      realpath(manifestDirectory),
      realpath(resolvedImagePath),
    ]);
  } catch (error) {
    throw new Error(`image file is not readable for ${sampleId}: ${imagePath}`, { cause: error });
  }

  const realRelativePath = relative(manifestDirectoryRealPath, imageRealPath);
  if (realRelativePath.startsWith("..") || isAbsolute(realRelativePath)) {
    throw new Error(`imagePath resolves outside the manifest directory for ${sampleId}: ${imagePath}`);
  }

  return resolvedImagePath;
}

async function toDataUrl(imagePath) {
  const extension = extname(imagePath).toLowerCase();
  const mime = getImageMimeType(extension);
  const bytes = await readFile(imagePath);
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

function getImageMimeType(extension) {
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  if (extension === ".bmp") return "image/bmp";
  if (extension === ".heic") return "image/heic";
  return "image/png";
}
