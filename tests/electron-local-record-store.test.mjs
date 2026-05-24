import assert from "node:assert/strict";
import { access, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { createLocalRecordStore } from "../electron/storage/localRecordStore.cjs";

await runTest("saves records, rebuilds index, and clears the store", async (userDataDir) => {
  const store = createLocalRecordStore(userDataDir);
  const record = createRecord({
    id: "wq-file-store",
    updatedAt: "2026-05-24T09:00:00.000Z",
    originalImageUri: "data:image/png;base64,b3JpZ2luYWw=",
    selectedRegionImageUri: "data:image/png;base64,cmVnaW9u",
    cleanedQuestionImageUri: "data:image/png;base64,Y2xlYW4=",
  });

  assert.deepEqual(await store.save([record]), { ok: true });

  const loaded = await store.load();
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].id, record.id);
  assert.match(loaded[0].originalImageUri, /^file:\/\//);
  assert.match(loaded[0].selectedRegionImageUri, /^file:\/\//);
  assert.match(loaded[0].cleanedQuestionImageUri, /^file:\/\//);

  const index = await readIndex(userDataDir);
  assert.equal(index.schemaVersion, 1);
  assert.equal(index.records.length, 1);
  assert.equal(index.records[0].id, record.id);

  assert.deepEqual(await store.clear(), { ok: true });
  assert.deepEqual(await store.load(), []);
});

await runTest("does not hydrate traversal paths outside the record directory", async (userDataDir) => {
  const outsidePath = join(userDataDir, "outside.txt");
  const recordDir = join(userDataDir, "wrong-question", "records", "attack");
  await mkdir(recordDir, { recursive: true });
  await writeFile(outsidePath, "outside", "utf8");
  await writeFile(
    join(recordDir, "record.json"),
    `${JSON.stringify({
      ...createRecord({
        id: "attack",
        updatedAt: "2026-05-24T10:00:00.000Z",
        originalImageUri: "./../../../outside.txt",
      }),
      schemaVersion: 1,
    })}\n`,
    "utf8",
  );

  const store = createLocalRecordStore(userDataDir);
  const loaded = await store.load();

  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].id, "attack");
  assert.notEqual(loaded[0].originalImageUri, pathToFileURL(outsidePath).toString());
  assert.doesNotMatch(String(loaded[0].originalImageUri ?? ""), /^file:\/\//);
});

await runTest("copies external file assets into the record directory on save", async (userDataDir) => {
  const store = createLocalRecordStore(userDataDir);
  const externalPath = join(userDataDir, "external.png");
  await writeFile(externalPath, Buffer.from("external-image"), "utf8");

  const record = createRecord({
    id: "external-file",
    updatedAt: "2026-05-24T11:00:00.000Z",
    originalImageUri: pathToFileURL(externalPath).toString(),
  });

  assert.deepEqual(await store.save([record]), { ok: true });

  const storedRecord = await readStoredRecord(userDataDir, "external-file");
  assert.match(storedRecord.originalImageUri, /^\.\/assets\/originalImageUri-/);
  assert.doesNotMatch(storedRecord.originalImageUri, /^file:\/\//);

  const copiedAssetUrl = pathToFileURL(
    join(userDataDir, "wrong-question", "records", "external-file", storedRecord.originalImageUri),
  ).toString();
  const loaded = await store.load();
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].id, "external-file");
  assert.equal(loaded[0].originalImageUri, copiedAssetUrl);
  assert.notEqual(loaded[0].originalImageUri, pathToFileURL(externalPath).toString());
});

await runTest("prunes record directories removed from a later save", async (userDataDir) => {
  const store = createLocalRecordStore(userDataDir);
  const first = createRecord({ id: "keep-me", updatedAt: "2026-05-24T12:00:00.000Z" });
  const second = createRecord({ id: "remove-me", updatedAt: "2026-05-24T11:00:00.000Z" });

  assert.deepEqual(await store.save([first, second]), { ok: true });
  assert.deepEqual(await store.save([first]), { ok: true });

  await assert.rejects(access(join(userDataDir, "wrong-question", "records", "remove-me")));
  const loaded = await store.load();
  assert.deepEqual(
    loaded.map((record) => record.id),
    ["keep-me"],
  );
});

await runTest("rejects malformed records without writing them", async (userDataDir) => {
  const store = createLocalRecordStore(userDataDir);

  assert.deepEqual(await store.save([{ id: "broken-only-id" }, "bad-record"]), {
    ok: false,
    reason: "storage_write_failed",
  });
  assert.deepEqual(await store.load(), []);
});

await runTest("skips broken record json and sorts by descending updatedAt", async (userDataDir) => {
  const recordsDir = join(userDataDir, "wrong-question", "records");
  const validOlderDir = join(recordsDir, "valid-older");
  const validNewerDir = join(recordsDir, "valid-newer");
  const brokenDir = join(recordsDir, "broken");
  await mkdir(validOlderDir, { recursive: true });
  await mkdir(validNewerDir, { recursive: true });
  await mkdir(brokenDir, { recursive: true });

  await writeFile(
    join(validOlderDir, "record.json"),
    `${JSON.stringify({
      ...createRecord({
        id: "valid-older",
        updatedAt: "2026-05-24T09:00:00.000Z",
      }),
      schemaVersion: 1,
    })}\n`,
    "utf8",
  );
  await writeFile(
    join(validNewerDir, "record.json"),
    `${JSON.stringify({
      ...createRecord({
        id: "valid-newer",
        updatedAt: "2026-05-24T13:00:00.000Z",
      }),
      schemaVersion: 1,
    })}\n`,
    "utf8",
  );
  await writeFile(join(brokenDir, "record.json"), "{not-json\n", "utf8");

  const store = createLocalRecordStore(userDataDir);
  const loaded = await store.load();

  assert.deepEqual(
    loaded.map((record) => record.id),
    ["valid-newer", "valid-older"],
  );

  const index = await readIndex(userDataDir);
  assert.deepEqual(
    index.records.map((record) => record.id),
    ["valid-newer", "valid-older"],
  );
});

function createRecord(overrides = {}) {
  return {
    id: "record-default",
    appId: "wrong_question_capture",
    title: "Local record store test",
    subject: "math",
    createdAt: "2026-05-24T09:00:00.000Z",
    updatedAt: "2026-05-24T09:00:00.000Z",
    questionText: "23. 如图，求函数解析式。",
    originalImageUri: "data:image/png;base64,b3JpZ2luYWw=",
    selectedRegion: {
      id: "candidate-1",
      label: "候选 1",
      x: 0.1,
      y: 0.2,
      width: 0.7,
      height: 0.3,
      unit: "ratio",
      source: "ai_candidate",
      confidence: 0.92,
    },
    selectedRegionImageUri: "data:image/png;base64,cmVnaW9u",
    cleanedQuestionImageUri: "data:image/png;base64,Y2xlYW4=",
    visualSnippetUri: "data:image/png;base64,c25pcHBldA==",
    studentAnswer: "",
    correctAnswer: "",
    notes: "",
    recognitionStatus: "reviewed",
    recognitionConfidence: 0.91,
    cleanupStatus: "reviewed",
    cleanupConfidence: 0.88,
    modelTraces: [{ provider: "mock", modelId: "mock-v1", task: "ocr" }],
    reviewItems: [{ label: "题干文字", status: "reviewed" }],
    ...overrides,
  };
}

async function readStoredRecord(userDataDir, recordId) {
  const raw = await readFile(
    join(userDataDir, "wrong-question", "records", recordId, "record.json"),
    "utf8",
  );
  return JSON.parse(raw);
}

async function readIndex(userDataDir) {
  return JSON.parse(await readFile(join(userDataDir, "wrong-question", "index.json"), "utf8"));
}

async function runTest(name, callback) {
  const userDataDir = await mkdtemp(join(tmpdir(), "evocraft-store-"));

  try {
    await callback(userDataDir);
  } catch (error) {
    error.message = `${name}: ${error.message}`;
    throw error;
  } finally {
    await rm(userDataDir, { recursive: true, force: true });
  }
}
