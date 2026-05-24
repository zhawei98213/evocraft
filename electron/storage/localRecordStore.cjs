const { createHash } = require("node:crypto");
const { mkdir, readdir, readFile, rename, rm, writeFile } = require("node:fs/promises");
const { dirname, join, relative, resolve } = require("node:path");
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
      nextRecord[field] = normalizeFileUrlToRelativePath(value, recordDir);
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

    nextRecord[field] = pathToFileURL(resolve(recordDir, value)).toString();
  }

  return nextRecord;
}

async function persistDataUrlAsset(dataUrl, recordDir, field) {
  const match = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) return dataUrl;

  const mimeType = match[1].toLowerCase();
  const bytes = Buffer.from(match[2], "base64");
  const assetDir = join(recordDir, "assets");
  const extension = getImageExtension(mimeType);
  const assetHash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  const fileName = `${field}-${assetHash}${extension}`;
  const filePath = join(assetDir, fileName);

  await ensureDir(assetDir);
  await writeFile(filePath, bytes);
  return toStoredRelativePath(join("assets", fileName));
}

function normalizeFileUrlToRelativePath(fileUrl, recordDir) {
  try {
    const filePath = fileURLToPath(fileUrl);
    const relativePath = relative(recordDir, filePath);
    if (relativePath.startsWith("..") || relativePath === "") {
      return fileUrl;
    }

    return toStoredRelativePath(relativePath);
  } catch {
    return fileUrl;
  }
}

function getImageExtension(mimeType) {
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") return ".jpg";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/bmp") return ".bmp";
  if (mimeType === "image/heic") return ".heic";
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

function sanitizeRecordId(recordId) {
  const sanitized = String(recordId).replace(/[^a-zA-Z0-9_.-]/g, "-").replace(/^\.+/, "");
  if (sanitized.length > 0) return sanitized;

  return `record-${createHash("sha256").update(String(recordId)).digest("hex").slice(0, 12)}`;
}

function sortRecords(records) {
  return [...records].sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)));
}

function toPortableRelativePath(filePath) {
  return filePath.replace(/\\/g, "/");
}

function toStoredRelativePath(filePath) {
  return `./${toPortableRelativePath(filePath).replace(/^\.?\//, "")}`;
}

module.exports = { createLocalRecordStore };
