import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

main().catch((error) => {
  const message = error instanceof Error && error.name === "SyntaxError"
    ? "input contains invalid JSON"
    : "unable to read or write evaluation summary";
  console.error(`AI eval summary failed: ${message}`);
  process.exitCode = 1;
});

async function main() {
  const args = process.argv.slice(2);
  const positional = args.filter((arg) => !arg.startsWith("--"));

  if (positional.length !== 2) {
    console.error("Usage: node scripts/summarize-ai-eval-results.mjs <input-jsonl> <output-md>");
    process.exitCode = 2;
    return;
  }

  const [inputPath, outputPath] = positional;
  const summary = summarizeRows(await readFile(inputPath, "utf8"));

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, renderMarkdownSummary(summary), "utf8");

  console.log("Wrote redacted AI evaluation summary.");
}

function summarizeRows(contents) {
  const stats = {
    totalSamples: 0,
    malformedRows: 0,
    successfulRows: 0,
    failedRows: 0,
    rowsWithReviewItems: 0,
    elapsedValues: [],
    subjectCounts: new Map(),
    failureReasonCounts: new Map(),
  };

  for (const line of contents.split(/\r?\n/)) {
    if (line.trim().length === 0) {
      continue;
    }

    let row;
    try {
      row = JSON.parse(line);
    } catch {
      stats.malformedRows += 1;
      continue;
    }

    if (!isPlainObject(row)) {
      stats.malformedRows += 1;
      continue;
    }

    stats.totalSamples += 1;
    incrementCount(stats.subjectCounts, normalizeSubject(row.subject));

    if (Number.isFinite(row.elapsedMs)) {
      stats.elapsedValues.push(row.elapsedMs);
    }

    if (row.ok === true) {
      stats.successfulRows += 1;
    } else if (row.ok === false) {
      stats.failedRows += 1;
      incrementCount(
        stats.failureReasonCounts,
        normalizeAggregateKey(row?.result?.reason, "unknown_failure", "redacted_failure_reason"),
      );
    }

    if (getReviewItemCount(row) > 0) {
      stats.rowsWithReviewItems += 1;
    }
  }

  return {
    totalSamples: stats.totalSamples,
    malformedRows: stats.malformedRows,
    successfulRows: stats.successfulRows,
    failedRows: stats.failedRows,
    rowsWithReviewItems: stats.rowsWithReviewItems,
    medianElapsedMs: computeMedian(stats.elapsedValues),
    subjectCounts: mapEntriesSorted(stats.subjectCounts),
    failureReasonCounts: mapEntriesSorted(stats.failureReasonCounts),
  };
}

function getReviewItemCount(row) {
  const draftReviewItems = row?.result?.draft?.reviewItems;
  const topLevelReviewItems = row?.result?.reviewItems;
  return [draftReviewItems, topLevelReviewItems]
    .filter(Array.isArray)
    .reduce((count, reviewItems) => count + reviewItems.length, 0);
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeSubject(subject) {
  const normalized = normalizeKey(subject, "unknown");
  return ["chinese", "math", "english", "auto", "unknown"].includes(normalized)
    ? normalized
    : "redacted_subject";
}

function normalizeKey(value, fallback) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function normalizeAggregateKey(value, fallback, redactedFallback) {
  const normalized = normalizeKey(value, fallback);
  return /^[a-z][a-z0-9_-]{0,80}$/.test(normalized) ? normalized : redactedFallback;
}

function incrementCount(map, key) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function computeMedian(values) {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[middle];
  }

  return (sorted[middle - 1] + sorted[middle]) / 2;
}

function mapEntriesSorted(map) {
  return [...map.entries()].sort((left, right) => {
    if (right[1] !== left[1]) {
      return right[1] - left[1];
    }

    return left[0].localeCompare(right[0]);
  });
}

function renderMarkdownSummary(summary) {
  const lines = [
    "# AI Eval Redacted Summary",
    "",
    "## Aggregate Metrics",
    `- Total samples: ${summary.totalSamples}`,
    `- Malformed rows: ${summary.malformedRows}`,
    `- Successful rows: ${summary.successfulRows}`,
    `- Failed rows: ${summary.failedRows}`,
    `- Rows with review items: ${summary.rowsWithReviewItems}`,
    `- Median elapsed ms: ${formatMedian(summary.medianElapsedMs)}`,
    "",
    "## Subject Counts",
    ...renderCountLines(summary.subjectCounts),
    "",
    "## Failure Reason Counts",
    ...renderCountLines(summary.failureReasonCounts),
    "",
    "> This summary is intentionally redacted and excludes OCR text, provider raw output, request bodies, auth headers, tokens, and image data URLs.",
    "",
  ];

  return lines.join("\n");
}

function renderCountLines(entries) {
  if (entries.length === 0) {
    return ["- none: 0"];
  }

  return entries.map(([label, count]) => `- ${label}: ${count}`);
}

function formatMedian(value) {
  if (value === null) {
    return "n/a";
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
