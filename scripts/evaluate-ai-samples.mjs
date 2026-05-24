import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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

const rows = [];
for (const sample of manifest.samples) {
  rows.push({
    sampleId: sample.id,
    subject: sample.subject,
    status: "not-run",
    message: "Provider adapter is connected in the next task.",
  });
}

await writeFile(outputPath, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`, "utf8");
console.log(`Wrote ${rows.length} evaluation rows to ${outputPath}`);
