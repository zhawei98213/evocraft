import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createLocalRecordStore } from "../electron/storage/localRecordStore.cjs";

const userDataDir = await mkdtemp(join(tmpdir(), "evocraft-store-"));

try {
  const store = createLocalRecordStore(userDataDir);
  const record = {
    id: "wq-file-store",
    title: "本地文件存储测试",
    subject: "math",
    createdAt: "2026-05-24T09:00:00.000Z",
    updatedAt: "2026-05-24T09:00:00.000Z",
    originalImageUri: "data:image/png;base64,b3JpZ2luYWw=",
    selectedRegionImageUri: "data:image/png;base64,cmVnaW9u",
    cleanedQuestionImageUri: "data:image/png;base64,Y2xlYW4=",
  };

  assert.deepEqual(await store.save([record]), { ok: true });

  const loaded = await store.load();
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].id, record.id);
  assert.match(loaded[0].originalImageUri, /^file:\/\//);
  assert.match(loaded[0].selectedRegionImageUri, /^file:\/\//);
  assert.match(loaded[0].cleanedQuestionImageUri, /^file:\/\//);

  const index = JSON.parse(await readFile(join(userDataDir, "wrong-question", "index.json"), "utf8"));
  assert.equal(index.schemaVersion, 1);
  assert.equal(index.records.length, 1);
  assert.equal(index.records[0].id, record.id);

  assert.deepEqual(await store.clear(), { ok: true });
  assert.deepEqual(await store.load(), []);
} finally {
  await rm(userDataDir, { recursive: true, force: true });
}
