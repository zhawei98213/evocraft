import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createQwenAdapter } from "../electron/ai/qwenAdapter.cjs";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const manifestPath = process.argv[2] ?? join(repoRoot, "ai-eval/samples/manifest.local.json");
const outputPath = process.argv[3] ?? join(repoRoot, `ai-eval/results/result-${Date.now()}.jsonl`);

if (process.env.EVOCRAFT_AI_EVAL_ENABLED !== "1") {
  console.error("AI evaluation is disabled. Set EVOCRAFT_AI_EVAL_ENABLED=1 to call the provider.");
  process.exit(2);
}

if (!process.env.DASHSCOPE_API_KEY) {
  console.error("DASHSCOPE_API_KEY is required for Qwen evaluation.");
  process.exit(2);
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
await mkdir(dirname(outputPath), { recursive: true });

const adapter = createQwenAdapter({ apiKey: process.env.DASHSCOPE_API_KEY });
const rows = [];
for (const sample of manifest.samples) {
  const imagePath = resolve(dirname(manifestPath), sample.imagePath);
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
