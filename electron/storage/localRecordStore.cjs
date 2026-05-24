const { createHash } = require("node:crypto");
const { mkdir, readdir, readFile, rename, rm, writeFile } = require("node:fs/promises");
const { dirname, extname, join, relative, resolve } = require("node:path");
const { pathToFileURL, fileURLToPath } = require("node:url");

const SCHEMA_VERSION = 1;
const IMAGE_FIELDS = [
  "originalImageUri",
  "selectedRegionImageUri",
  "cleanedQuestionImageUri",
  "visualSnippetUri",
];

function createLocalRecordStore(userDataDir) {
  const rootDir = join(userDataDir, "wrong-question");
  const recordsDir = join(rootDir, "records");
  const indexPath = join(rootDir, "index.json");

  return {
    async load() {
      await ensureDir(recordsDir);
      const recordIds = await listRecordDirectoryNames(recordsDir);
      const records = [];

      for (const recordId of recordIds) {
        const recordDir = join(recordsDir, recordId);
        const recordPath = join(recordDir, "record.json");

        try {
          const raw = await readFile(recordPath, "utf8");
          const parsed = JSON.parse(raw);
          records.push(hydrateRecord(parsed, recordDir));
        } catch {
          // Skip broken records so one bad file does not block the notebook.
        }
      }

      const sortedRecords = sortRecords(records);
      await writeIndex(indexPath, sortedRecords);
      return sortedRecords;
    },

    async save(records) {
      try {
        if (!Array.isArray(records) || !records.every(isValidWrongQuestionRecord)) {
          return { ok: false, reason: "storage_write_failed" };
        }

        await ensureDir(recordsDir);
        const savedRecords = [];

        for (const record of records) {
          const recordDir = join(recordsDir, sanitizeRecordId(record.id));
          await ensureDir(recordDir);
          const dehydrated = await dehydrateRecord(record, recordDir);
          await writeJsonAtomic(join(recordDir, "record.json"), dehydrated);
          savedRecords.push(hydrateRecord(dehydrated, recordDir));
        }

        const sortedRecords = sortRecords(savedRecords);
        await pruneRemovedRecords(recordsDir, sortedRecords.map((record) => record.id));
        await writeIndex(indexPath, sortedRecords);
        return { ok: true };
      } catch {
        return { ok: false, reason: "storage_write_failed" };
      }
    },

    async clear() {
      try {
        await rm(rootDir, { recursive: true, force: true });
        await ensureDir(recordsDir);
        await writeIndex(indexPath, []);
        return { ok: true };
      } catch {
        return { ok: false, reason: "storage_clear_failed" };
      }
    },
  };
}

async function dehydrateRecord(record, recordDir) {
  const nextRecord = { ...record, schemaVersion: SCHEMA_VERSION };

  for (const field of IMAGE_FIELDS) {
    const value = nextRecord[field];
    if (typeof value !== "string" || value.length === 0) continue;

    if (value.startsWith("data:image/")) {
      nextRecord[field] = await persistDataUrlAsset(value, recordDir, field);
      continue;
    }

    if (value.startsWith("file://")) {
      nextRecord[field] = await persistFileUrlAsset(value, recordDir, field);
    }
  }

  return nextRecord;
}

function hydrateRecord(record, recordDir) {
  const nextRecord = { ...record };
  delete nextRecord.schemaVersion;

  for (const field of IMAGE_FIELDS) {
    const value = nextRecord[field];
    if (typeof value !== "string") continue;
    if (!value.startsWith("./")) continue;

    const hydratedPath = resolveContainedRecordPath(recordDir, value);
    if (!hydratedPath) {
      delete nextRecord[field];
      continue;
    }

    nextRecord[field] = pathToFileURL(hydratedPath).toString();
  }

  return nextRecord;
}

async function persistDataUrlAsset(dataUrl, recordDir, field) {
  const match = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) return dataUrl;

  const mimeType = match[1].toLowerCase();
  const bytes = Buffer.from(match[2], "base64");
  const extension = getImageExtension(mimeType);
  const assetHash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  return persistAssetBytes(bytes, recordDir, field, extension, assetHash);
}

async function persistFileUrlAsset(fileUrl, recordDir, field) {
  const filePath = resolve(fileURLToPath(fileUrl));

  if (isContainedPath(join(recordDir, "assets"), filePath)) {
    return toStoredRelativePath(relative(recordDir, filePath));
  }

  const bytes = await readFile(filePath);
  const extension = getImageExtensionFromPath(filePath);
  const assetHash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  return persistAssetBytes(bytes, recordDir, field, extension, assetHash);
}

function getImageExtension(mimeType) {
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") return ".jpg";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/bmp") return ".bmp";
  if (mimeType === "image/heic") return ".heic";
  return ".png";
}

function getImageExtensionFromPath(filePath) {
  const extension = extname(filePath).toLowerCase();
  if (extension === ".jpg" || extension === ".jpeg") return ".jpg";
  if (extension === ".webp") return ".webp";
  if (extension === ".bmp") return ".bmp";
  if (extension === ".heic") return ".heic";
  return ".png";
}

async function writeIndex(indexPath, records) {
  await ensureDir(dirname(indexPath));
  await writeJsonAtomic(indexPath, {
    schemaVersion: SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    records: records.map((record) => ({
      id: record.id,
      title: record.title,
      subject: record.subject,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })),
  });
}

async function writeJsonAtomic(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(tempPath, filePath);
}

async function listRecordDirectoryNames(recordsDir) {
  const entries = await readdir(recordsDir, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
}

async function pruneRemovedRecords(recordsDir, recordIds) {
  const keepDirectories = new Set(recordIds.map((recordId) => sanitizeRecordId(recordId)));
  const directoryNames = await listRecordDirectoryNames(recordsDir);

  for (const directoryName of directoryNames) {
    if (keepDirectories.has(directoryName)) continue;
    await rm(join(recordsDir, directoryName), { recursive: true, force: true });
  }
}

async function ensureDir(dirPath) {
  await mkdir(dirPath, { recursive: true });
}

async function persistAssetBytes(bytes, recordDir, field, extension, assetHash) {
  const assetDir = join(recordDir, "assets");
  const fileName = `${field}-${assetHash}${extension}`;
  const filePath = join(assetDir, fileName);

  await ensureDir(assetDir);
  await writeFile(filePath, bytes);
  return toStoredRelativePath(relative(recordDir, filePath));
}

function sanitizeRecordId(recordId) {
  const sanitized = String(recordId).replace(/[^a-zA-Z0-9_.-]/g, "-").replace(/^\.+/, "");
  if (sanitized.length > 0) return sanitized;

  return `record-${createHash("sha256").update(String(recordId)).digest("hex").slice(0, 12)}`;
}

function sortRecords(records) {
  return [...records].sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)));
}

function isValidWrongQuestionRecord(record) {
  return (
    isPlainObject(record) &&
    hasNonEmptyString(record.id) &&
    record.appId === "wrong_question_capture" &&
    isValidSubject(record.subject) &&
    hasNonEmptyString(record.title) &&
    hasString(record.createdAt) &&
    hasString(record.updatedAt) &&
    hasString(record.questionText) &&
    hasString(record.originalImageUri) &&
    isValidRegionCandidate(record.selectedRegion) &&
    hasString(record.selectedRegionImageUri) &&
    hasString(record.cleanedQuestionImageUri) &&
    hasString(record.visualSnippetUri) &&
    hasString(record.studentAnswer) &&
    hasString(record.correctAnswer) &&
    hasString(record.notes) &&
    record.recognitionStatus === "reviewed" &&
    isFiniteNumber(record.recognitionConfidence) &&
    record.cleanupStatus === "reviewed" &&
    isFiniteNumber(record.cleanupConfidence) &&
    Array.isArray(record.modelTraces) &&
    record.modelTraces.every(isValidModelTrace) &&
    Array.isArray(record.reviewItems) &&
    record.reviewItems.every(isValidReviewItem)
  );
}

function isValidRegionCandidate(candidate) {
  return (
    isPlainObject(candidate) &&
    hasNonEmptyString(candidate.id) &&
    hasString(candidate.label) &&
    isFiniteNumber(candidate.x) &&
    isFiniteNumber(candidate.y) &&
    isFiniteNumber(candidate.width) &&
    isFiniteNumber(candidate.height) &&
    candidate.unit === "ratio" &&
    (candidate.source === "ai_candidate" || candidate.source === "manual") &&
    isFiniteNumber(candidate.confidence)
  );
}

function isValidModelTrace(trace) {
  return (
    isPlainObject(trace) &&
    hasString(trace.provider) &&
    hasString(trace.modelId) &&
    ["region_detection", "ocr", "structure", "cleanup"].includes(trace.task)
  );
}

function isValidReviewItem(item) {
  return isPlainObject(item) && hasString(item.label) && hasString(item.status);
}

function isValidSubject(subject) {
  return subject === "chinese" || subject === "math" || subject === "english";
}

function hasString(value) {
  return typeof value === "string";
}

function hasNonEmptyString(value) {
  return typeof value === "string" && value.length > 0;
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toPortableRelativePath(filePath) {
  return filePath.replace(/\\/g, "/");
}

function toStoredRelativePath(filePath) {
  return `./${toPortableRelativePath(filePath).replace(/^\.?\//, "")}`;
}

function resolveContainedRecordPath(recordDir, storedPath) {
  const resolvedPath = resolve(recordDir, storedPath);
  if (!isContainedPath(recordDir, resolvedPath)) return null;

  return resolvedPath;
}

function isContainedPath(rootDir, targetPath) {
  const relativePath = relative(resolve(rootDir), resolve(targetPath));
  return relativePath.length > 0 && !relativePath.startsWith("..") && !relativePath.startsWith("/");
}

module.exports = { createLocalRecordStore, isValidWrongQuestionRecord };
