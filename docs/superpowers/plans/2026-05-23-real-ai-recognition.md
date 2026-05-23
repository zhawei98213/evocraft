# Real AI Recognition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local-first desktop foundation for real AI recognition: desktop file storage, provider-agnostic AI contracts, a Qwen evaluation harness, and an opt-in Electron main-process real AI path.

**Architecture:** Keep React as the renderer and Electron main as the owner of files, secrets, and real provider calls. Migrate long-lived desktop records away from `localStorage` into an app-data folder with one directory per wrong-question record, while keeping browser/local mock behavior available for tests and web fallback. Real AI stays behind a disabled-by-default runtime switch and uses the existing `AiAdapter` boundary so future SQLite or SaaS migration does not rewrite product logic.

**Tech Stack:** React, Vite, TypeScript, Vitest, Testing Library, Electron main/preload IPC, Node `fs/promises`, Node `fetch`, Aliyun DashScope OpenAI-compatible Qwen OCR endpoint.

---

## Scope Check

This plan implements one sequential desktop-first slice. It does not build Phase 2 learning understanding features. Do not add solving, explanations, wrong-cause analysis, knowledge point tagging, similar-question generation, accounts, cloud sync, SaaS backend, SQLite, automatic updates, production signing, or image inpainting in this plan.

The work is intentionally ordered so real AI cannot be connected before desktop persistence exists.

## File Structure

Existing files to modify:

- `src/services/storage.ts`: convert record persistence to an async record-store contract and keep the browser/localStorage implementation as a fallback.
- `src/services/storage.test.ts`: update tests for the async contract.
- `src/services/aiAdapter.ts`: extend the provider-agnostic AI contract with runtime status, richer failure reasons, and trace metadata.
- `src/services/aiAdapter.test.ts`: keep the mock adapter locked to the expanded contract.
- `src/services/mockAiAdapter.ts`: return the expanded contract without provider-specific imports.
- `src/services/desktopBridge.ts`: add typed Electron APIs for records and real AI runtime calls.
- `src/app/App.tsx`: load records asynchronously, save through the selected record store, and choose mock or desktop AI adapter based on runtime status.
- `src/app/App.test.tsx`: cover async loading, desktop real-AI disabled default, and recoverable AI failures.
- `src/features/wrongQuestion/wrongQuestionReducer.ts`: add actions for loaded records and AI authorization/runtime status.
- `src/features/wrongQuestion/wrongQuestionReducer.test.ts`: cover the new actions.
- `electron/main.cjs`: register desktop record-store IPC and real-AI IPC in main process.
- `electron/preload.cjs`: expose only the new minimal APIs through `contextBridge`.
- `tests/electron-config.test.mjs`: assert IPC channel names, no raw `send`, and no renderer secret exposure.
- `docs/README.md`: link the plan if the current index does not already include it.
- `docs/planning/evocraft-roadmap-progress.md`: append implementation-plan creation progress after the plan is saved.

New files to create:

- `src/services/desktopRecordStore.ts`: renderer-side adapter that calls desktop record IPC and implements `RecordStore`.
- `src/services/desktopAiAdapter.ts`: renderer-side adapter that calls desktop AI IPC and implements `AiAdapter`.
- `electron/storage/localRecordStore.cjs`: Electron main-process folder + JSON record store.
- `tests/electron-local-record-store.test.mjs`: Node tests for local record storage using a temporary directory.
- `electron/ai/qwenAdapter.cjs`: Electron/main and evaluation-script Qwen adapter.
- `electron/ai/recognitionPrompt.cjs`: centralized prompts and JSON schema instructions for recognition-only output.
- `tests/qwen-adapter-contract.test.mjs`: contract tests for request construction and response parsing with fake fetch.
- `ai-eval/README.md`: evaluation workflow and sample rules.
- `ai-eval/samples/manifest.example.json`: schema example without real child photos.
- `ai-eval/samples/.gitkeep`: keeps the folder without committing real samples.
- `ai-eval/results/.gitignore`: ignores generated evaluation outputs.
- `scripts/evaluate-ai-samples.mjs`: local evaluation runner that calls cloud Qwen only when explicitly enabled.
- `tests/ai-eval-config.test.mjs`: static checks for the evaluation harness and ignored sample data.

## Task 0: Preflight And Baseline

**Files:**
- Modify: none
- Test: existing test suite

- [ ] **Step 1: Verify repository state**

Run:

```bash
git status --short --branch
```

Expected:

```text
## main...origin/main
```

- [ ] **Step 2: Verify current tests pass before edits**

Run:

```bash
npm test
npm run test:electron-config
npm run build
```

Expected:

```text
All commands exit 0.
```

- [ ] **Step 3: Commit**

No commit for this task because it changes no files.

## Task 1: Convert RecordStore To Async Without Changing Behavior

**Files:**
- Modify: `src/services/storage.ts`
- Modify: `src/services/storage.test.ts`
- Modify: `src/app/App.tsx`
- Modify: `src/features/wrongQuestion/wrongQuestionReducer.ts`
- Modify: `src/features/wrongQuestion/wrongQuestionReducer.test.ts`
- Test: `src/services/storage.test.ts`
- Test: `src/app/App.test.tsx`

- [ ] **Step 1: Write failing async storage tests**

Modify `src/services/storage.test.ts` so the first and clear tests await the store:

```ts
it("saves and loads records", async () => {
  const storage = createMemoryStorage();
  const store = createLocalStorageRecordStore(storage);
  const record = createRecordFromDraft(createMockRecognition(), {
    id: "wq-storage",
    now: "2026-05-17T08:00:00.000Z",
  });

  await expect(store.save([record])).resolves.toEqual({ ok: true });
  await expect(store.load()).resolves.toEqual([record]);
});

it("clears records", async () => {
  const storage = createMemoryStorage();
  const store = createLocalStorageRecordStore(storage);
  const record = createRecordFromDraft(createMockRecognition(), {
    id: "wq-clear",
    now: "2026-05-17T08:00:00.000Z",
  });

  await store.save([record]);

  await expect(store.clear()).resolves.toEqual({ ok: true });
  await expect(store.load()).resolves.toEqual([]);
});
```

- [ ] **Step 2: Run the focused tests and verify failure**

Run:

```bash
npm run test:react -- src/services/storage.test.ts
```

Expected:

```text
FAIL because RecordStore methods are still synchronous.
```

- [ ] **Step 3: Convert the storage contract**

Modify `src/services/storage.ts`:

```ts
export interface RecordStore {
  load(): Promise<WrongQuestionRecord[]>;
  save(records: WrongQuestionRecord[]): Promise<StorageResult | StorageFailure>;
  clear(): Promise<StorageResult | StorageFailure>;
}

export function createLocalStorageRecordStore(storage: StorageLike | undefined): RecordStore {
  return {
    async load() {
      if (!storage) return [];

      try {
        const raw = storage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as WrongQuestionRecord[]) : [];
      } catch {
        return [];
      }
    },

    async save(records) {
      if (!storage) return { ok: false, reason: "storage_unavailable" };

      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(records));
        return { ok: true };
      } catch {
        return { ok: false, reason: "storage_write_failed" };
      }
    },

    async clear() {
      if (!storage) return { ok: false, reason: "storage_unavailable" };

      try {
        storage.removeItem(STORAGE_KEY);
        return { ok: true };
      } catch {
        return { ok: false, reason: "storage_clear_failed" };
      }
    },
  };
}
```

- [ ] **Step 4: Add a records-loaded reducer action**

Modify `src/features/wrongQuestion/wrongQuestionReducer.ts`:

```ts
export type WrongQuestionAction =
  | { type: "GO_TO_SCREEN"; screen: Screen }
  | { type: "RECORDS_LOADED"; records: WrongQuestionRecord[] }
  | { type: "IMAGE_SELECTED"; imageUri: string; fileName: string; fileMeta: string }
  // keep the remaining existing actions unchanged
```

Add this case before `IMAGE_SELECTED`:

```ts
case "RECORDS_LOADED":
  return {
    ...state,
    records: action.records,
    selectedRecordId: action.records[0]?.id ?? null,
  };
```

Add this reducer test to `src/features/wrongQuestion/wrongQuestionReducer.test.ts`:

```ts
it("loads records after the app store initializes", () => {
  const record = createRecordFromDraft(createMockRecognition(), {
    id: "wq-loaded",
    now: "2026-05-23T08:00:00.000Z",
  });

  const state = wrongQuestionReducer(createInitialWrongQuestionState([]), {
    type: "RECORDS_LOADED",
    records: [record],
  });

  expect(state.records).toEqual([record]);
  expect(state.selectedRecordId).toBe("wq-loaded");
});
```

- [ ] **Step 5: Load records asynchronously in App**

Modify the app initialization in `src/app/App.tsx`:

```tsx
const [state, dispatch] = useReducer(
  wrongQuestionReducer,
  undefined,
  () => createInitialWrongQuestionState([]),
);
```

Add an effect after the existing `document.body.dataset.screen` effect:

```tsx
useEffect(() => {
  let active = true;

  void recordStore.load().then((records) => {
    if (active) dispatch({ type: "RECORDS_LOADED", records });
  });

  return () => {
    active = false;
  };
}, [recordStore]);
```

Modify `saveRecord()` to be async:

```tsx
async function saveRecord() {
  if (!state.draft) return;

  const record = createRecordFromDraft(state.draft, reviewForm);
  const nextRecords = [record, ...state.records.filter((item) => item.id !== record.id)];
  const saveResult = await recordStore.save(nextRecords);

  if (!saveResult.ok) {
    dispatch({ type: "SAVE_FAILED", message: getStorageErrorMessage(saveResult.reason) });
    return;
  }

  dispatch({ type: "RECORD_SAVED", record });
}
```

Keep the existing save button as `onClick={saveRecord}`.

- [ ] **Step 6: Run focused tests**

Run:

```bash
npm run test:react -- src/services/storage.test.ts src/features/wrongQuestion/wrongQuestionReducer.test.ts src/app/App.test.tsx
```

Expected:

```text
PASS for the focused test files.
```

- [ ] **Step 7: Commit**

```bash
git add src/services/storage.ts src/services/storage.test.ts src/app/App.tsx src/features/wrongQuestion/wrongQuestionReducer.ts src/features/wrongQuestion/wrongQuestionReducer.test.ts
git commit -m $'Prepare records for async desktop persistence\n\nThe desktop store will cross Electron IPC, so the renderer store boundary must be promise-based before local file persistence can replace long-lived localStorage.\n\nConstraint: Renderer cannot directly access the Electron filesystem\nConfidence: high\nScope-risk: moderate\nTested: npm run test:react -- src/services/storage.test.ts src/features/wrongQuestion/wrongQuestionReducer.test.ts src/app/App.test.tsx\nCo-authored-by: OmX <omx@oh-my-codex.dev>'
```

## Task 2: Add Electron Main Local Record Store

**Files:**
- Create: `electron/storage/localRecordStore.cjs`
- Create: `tests/electron-local-record-store.test.mjs`
- Modify: `package.json`
- Test: `tests/electron-local-record-store.test.mjs`

- [ ] **Step 1: Write the failing Node store test**

Create `tests/electron-local-record-store.test.mjs`:

```js
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createLocalRecordStore } from "../electron/storage/localRecordStore.cjs";

const rootDir = await mkdtemp(join(tmpdir(), "evocraft-store-"));

try {
  const store = createLocalRecordStore(rootDir);
  const record = {
    id: "wq-file-store",
    title: "本地文件存储测试",
    subject: "math",
    createdAt: "2026-05-23T09:00:00.000Z",
    updatedAt: "2026-05-23T09:00:00.000Z",
    originalImageUri: "data:image/png;base64,b3JpZ2luYWw=",
    selectedRegionImageUri: "data:image/png;base64,cmVnaW9u",
    cleanedQuestionImageUri: "data:image/png;base64,Y2xlYW4=",
  };

  const saveResult = await store.save([record]);
  assert.deepEqual(saveResult, { ok: true });

  const loaded = await store.load();
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].id, "wq-file-store");
  assert.match(loaded[0].originalImageUri, /^file:\/\//);
  assert.match(loaded[0].selectedRegionImageUri, /^file:\/\//);

  const indexRaw = await readFile(join(rootDir, "wrong-question", "index.json"), "utf8");
  const index = JSON.parse(indexRaw);
  assert.equal(index.schemaVersion, 1);
  assert.equal(index.records[0].id, "wq-file-store");

  const clearResult = await store.clear();
  assert.deepEqual(clearResult, { ok: true });
  assert.deepEqual(await store.load(), []);
} finally {
  await rm(rootDir, { recursive: true, force: true });
}
```

- [ ] **Step 2: Run the test and verify failure**

Run:

```bash
node tests/electron-local-record-store.test.mjs
```

Expected:

```text
FAIL because electron/storage/localRecordStore.cjs does not exist.
```

- [ ] **Step 3: Implement the local store**

Create `electron/storage/localRecordStore.cjs`:

```js
const { mkdir, readdir, readFile, rename, rm, writeFile } = require("node:fs/promises");
const { existsSync } = require("node:fs");
const { basename, dirname, join } = require("node:path");
const { pathToFileURL } = require("node:url");
const { createHash } = require("node:crypto");

const schemaVersion = 1;
const imageFields = ["originalImageUri", "selectedRegionImageUri", "cleanedQuestionImageUri", "visualSnippetUri"];

function createLocalRecordStore(userDataDir) {
  const rootDir = join(userDataDir, "wrong-question");
  const recordsDir = join(rootDir, "records");
  const indexPath = join(rootDir, "index.json");

  return {
    async load() {
      await ensureDir(recordsDir);
      const ids = await listRecordIds(recordsDir);
      const records = [];

      for (const id of ids) {
        const recordPath = join(recordsDir, id, "record.json");
        try {
          const raw = await readFile(recordPath, "utf8");
          records.push(hydrateRecord(JSON.parse(raw), join(recordsDir, id)));
        } catch {
          // Skip broken records; index rebuild keeps the app usable.
        }
      }

      records.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
      await writeIndex(indexPath, records);
      return records;
    },

    async save(records) {
      try {
        await ensureDir(recordsDir);
        const savedRecords = [];

        for (const record of records) {
          const recordDir = join(recordsDir, sanitizeId(record.id));
          await ensureDir(recordDir);
          const dehydrated = await dehydrateRecord(record, recordDir);
          await writeJsonAtomic(join(recordDir, "record.json"), dehydrated);
          savedRecords.push(hydrateRecord(dehydrated, recordDir));
        }

        await pruneRemovedRecords(recordsDir, savedRecords.map((record) => record.id));
        await writeIndex(indexPath, savedRecords);
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
  const nextRecord = { ...record, schemaVersion };

  for (const field of imageFields) {
    if (typeof nextRecord[field] === "string" && nextRecord[field].startsWith("data:image/")) {
      nextRecord[field] = await persistDataUrl(nextRecord[field], recordDir, field);
    }
  }

  return nextRecord;
}

function hydrateRecord(record, recordDir) {
  const nextRecord = { ...record };

  for (const field of imageFields) {
    if (typeof nextRecord[field] === "string" && nextRecord[field].startsWith("./")) {
      nextRecord[field] = pathToFileURL(join(recordDir, nextRecord[field])).toString();
    }
  }

  return nextRecord;
}

async function persistDataUrl(dataUrl, recordDir, field) {
  const match = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) return dataUrl;

  const mime = match[1].toLowerCase();
  const bytes = Buffer.from(match[2], "base64");
  const extension = getExtension(mime);
  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  const relativePath = `./assets/${field}-${hash}${extension}`;
  const outputPath = join(recordDir, relativePath);

  await ensureDir(dirname(outputPath));
  await writeFile(outputPath, bytes);
  return relativePath;
}

function getExtension(mime) {
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/bmp") return ".bmp";
  if (mime === "image/heic") return ".heic";
  return ".png";
}

async function writeIndex(indexPath, records) {
  await ensureDir(dirname(indexPath));
  await writeJsonAtomic(indexPath, {
    schemaVersion,
    updatedAt: new Date().toISOString(),
    records: records.map((record) => ({
      id: record.id,
      title: record.title,
      subject: record.subject,
      updatedAt: record.updatedAt,
      createdAt: record.createdAt,
    })),
  });
}

async function writeJsonAtomic(filePath, value) {
  const tmpPath = `${filePath}.tmp`;
  await writeFile(tmpPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(tmpPath, filePath);
}

async function listRecordIds(recordsDir) {
  if (!existsSync(recordsDir)) return [];
  const entries = await readdir(recordsDir, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
}

async function pruneRemovedRecords(recordsDir, keepIds) {
  const keep = new Set(keepIds.map(sanitizeId));
  const ids = await listRecordIds(recordsDir);

  for (const id of ids) {
    if (!keep.has(id)) await rm(join(recordsDir, id), { recursive: true, force: true });
  }
}

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

function sanitizeId(value) {
  return basename(String(value).replace(/[^a-zA-Z0-9_.-]/g, "-"));
}

module.exports = { createLocalRecordStore };
```

- [ ] **Step 4: Add the test script**

Modify `package.json`:

```json
"test:electron-store": "node tests/electron-local-record-store.test.mjs"
```

Keep the existing scripts unchanged.

- [ ] **Step 5: Run the focused store test**

Run:

```bash
npm run test:electron-store
```

Expected:

```text
The command exits 0.
```

- [ ] **Step 6: Commit**

```bash
git add package.json electron/storage/localRecordStore.cjs tests/electron-local-record-store.test.mjs
git commit -m $'Add desktop file-backed record storage\n\nThe first real AI slice needs a durable local record store before images and model traces are persisted. Each record now has a directory with JSON metadata and image assets that can be rehydrated for the renderer.\n\nConstraint: Long-lived desktop records must not stay in localStorage\nConfidence: high\nScope-risk: moderate\nTested: npm run test:electron-store\nCo-authored-by: OmX <omx@oh-my-codex.dev>'
```

## Task 3: Expose Desktop Record Store Through IPC

**Files:**
- Modify: `electron/main.cjs`
- Modify: `electron/preload.cjs`
- Modify: `src/services/desktopBridge.ts`
- Create: `src/services/desktopRecordStore.ts`
- Modify: `tests/electron-config.test.mjs`
- Test: `tests/electron-config.test.mjs`

- [ ] **Step 1: Extend the electron config test first**

Add these assertions to `tests/electron-config.test.mjs`:

```js
assert.match(main, /createLocalRecordStore/);
assert.match(main, /ipcMain\.handle\("records:load"/);
assert.match(main, /ipcMain\.handle\("records:save"/);
assert.match(main, /ipcMain\.handle\("records:clear"/);

assert.match(preload, /loadRecords/);
assert.match(preload, /saveRecords/);
assert.match(preload, /clearRecords/);
assert.doesNotMatch(preload, /DASHSCOPE_API_KEY/);
```

- [ ] **Step 2: Run the test and verify failure**

Run:

```bash
npm run test:electron-config
```

Expected:

```text
FAIL because record IPC channels are not registered.
```

- [ ] **Step 3: Register record IPC in main**

Modify `electron/main.cjs`:

```js
const { createLocalRecordStore } = require("./storage/localRecordStore.cjs");
```

Inside `app.whenReady().then(() => { ... })`, before `createWindow();`:

```js
const recordStore = createLocalRecordStore(app.getPath("userData"));
registerRecordIpc(recordStore);
```

Add below the existing `ipcMain.handle("file:read-image-data-url", ...)` handler:

```js
function registerRecordIpc(recordStore) {
  ipcMain.handle("records:load", async (event) => {
    assertAllowedSender(event);
    return recordStore.load();
  });

  ipcMain.handle("records:save", async (event, records) => {
    assertAllowedSender(event);
    if (!Array.isArray(records)) throw new Error("Invalid records payload");
    return recordStore.save(records);
  });

  ipcMain.handle("records:clear", async (event) => {
    assertAllowedSender(event);
    return recordStore.clear();
  });
}
```

- [ ] **Step 4: Expose record IPC in preload**

Modify `electron/preload.cjs`:

```js
const api = {
  selectImage: () => ipcRenderer.invoke("dialog:select-image"),
  readImageAsDataUrl: (filePath) => ipcRenderer.invoke("file:read-image-data-url", filePath),
  loadRecords: () => ipcRenderer.invoke("records:load"),
  saveRecords: (records) => ipcRenderer.invoke("records:save", records),
  clearRecords: () => ipcRenderer.invoke("records:clear"),
};
```

- [ ] **Step 5: Type the desktop bridge**

Modify `src/services/desktopBridge.ts`:

```ts
import type { WrongQuestionRecord } from "../domain/wrongQuestion";
import type { StorageFailure, StorageResult } from "./storage";

export interface EvoCraftDesktopApi {
  selectImage(): Promise<string | null>;
  readImageAsDataUrl(filePath: string): Promise<string>;
  loadRecords(): Promise<WrongQuestionRecord[]>;
  saveRecords(records: WrongQuestionRecord[]): Promise<StorageResult | StorageFailure>;
  clearRecords(): Promise<StorageResult | StorageFailure>;
}
```

- [ ] **Step 6: Add renderer-side desktop store**

Create `src/services/desktopRecordStore.ts`:

```ts
import type { EvoCraftDesktopApi } from "./desktopBridge";
import type { RecordStore } from "./storage";

export function createDesktopRecordStore(desktop: EvoCraftDesktopApi): RecordStore {
  return {
    load: () => desktop.loadRecords(),
    save: (records) => desktop.saveRecords(records),
    clear: () => desktop.clearRecords(),
  };
}
```

- [ ] **Step 7: Run focused tests**

Run:

```bash
npm run test:electron-config
npm run test:react -- src/services/storage.test.ts src/app/App.test.tsx
```

Expected:

```text
All focused tests pass.
```

- [ ] **Step 8: Commit**

```bash
git add electron/main.cjs electron/preload.cjs src/services/desktopBridge.ts src/services/desktopRecordStore.ts tests/electron-config.test.mjs
git commit -m $'Expose local records through safe desktop IPC\n\nRenderer code can now use the same async record-store boundary in browser and desktop modes while Electron main keeps ownership of the filesystem.\n\nConstraint: Renderer IPC must stay allowlisted through preload\nConfidence: high\nScope-risk: moderate\nTested: npm run test:electron-config\nTested: npm run test:react -- src/services/storage.test.ts src/app/App.test.tsx\nCo-authored-by: OmX <omx@oh-my-codex.dev>'
```

## Task 4: Use Desktop Store In The React App

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.test.tsx`
- Test: `src/app/App.test.tsx`

- [ ] **Step 1: Add a failing desktop store selection test**

Add this test to `src/app/App.test.tsx`:

```tsx
it("loads records from the desktop bridge when running as a desktop app", async () => {
  const record = createRecordFromDraft(createMockRecognition(), {
    id: "wq-desktop-loaded",
    title: "桌面本地记录",
    now: "2026-05-23T10:00:00.000Z",
  });

  window.evocraft = {
    selectImage: vi.fn(),
    readImageAsDataUrl: vi.fn(),
    loadRecords: vi.fn().mockResolvedValue([record]),
    saveRecords: vi.fn().mockResolvedValue({ ok: true }),
    clearRecords: vi.fn().mockResolvedValue({ ok: true }),
  };

  render(<App />);

  await userEvent.click(screen.getByRole("button", { name: "错题本" }));

  expect(await screen.findByText("桌面本地记录")).toBeInTheDocument();
  expect(window.evocraft.loadRecords).toHaveBeenCalledTimes(1);
});
```

Ensure `vi`, `userEvent`, `createMockRecognition`, and `createRecordFromDraft` are imported if the file does not already import them.

- [ ] **Step 2: Run the test and verify failure**

Run:

```bash
npm run test:react -- src/app/App.test.tsx
```

Expected:

```text
FAIL because App still always creates the localStorage record store.
```

- [ ] **Step 3: Select the desktop store when bridge exists**

Modify imports in `src/app/App.tsx`:

```ts
import { createDesktopRecordStore } from "../services/desktopRecordStore";
```

Modify the `recordStore` memo:

```tsx
const desktopBridge = getDesktopBridge();
const recordStore = useMemo(
  () =>
    desktopBridge
      ? createDesktopRecordStore(desktopBridge)
      : createLocalStorageRecordStore(getBrowserStorage()),
  [desktopBridge],
);
```

Remove the later duplicate `const desktopBridge = getDesktopBridge();` line if it exists below the reducer.

- [ ] **Step 4: Run focused tests**

Run:

```bash
npm run test:react -- src/app/App.test.tsx src/services/storage.test.ts
```

Expected:

```text
PASS for focused app and storage tests.
```

- [ ] **Step 5: Commit**

```bash
git add src/app/App.tsx src/app/App.test.tsx
git commit -m $'Use the desktop record store when available\n\nThe app now chooses the Electron-backed record store in desktop mode and keeps localStorage as the browser fallback.\n\nConstraint: Browser fallback must keep existing tests and previews working\nConfidence: high\nScope-risk: narrow\nTested: npm run test:react -- src/app/App.test.tsx src/services/storage.test.ts\nCo-authored-by: OmX <omx@oh-my-codex.dev>'
```

## Task 5: Expand The AI Adapter Contract For Real Recognition

**Files:**
- Modify: `src/services/aiAdapter.ts`
- Modify: `src/services/mockAiAdapter.ts`
- Modify: `src/services/aiAdapter.test.ts`
- Modify: `src/domain/wrongQuestion.ts`
- Modify: `src/domain/wrongQuestion.test.ts`
- Test: `src/services/aiAdapter.test.ts`
- Test: `src/domain/wrongQuestion.test.ts`

- [ ] **Step 1: Write failing contract assertions**

Add these assertions to the successful recognition test in `src/services/aiAdapter.test.ts`:

```ts
expect(result.draft.reviewItems.some((item) => item.status === "需复核")).toBe(true);
expect(result.draft.modelTraces.every((trace) => trace.provider)).toBe(true);
expect(result.draft.modelTraces.every((trace) => trace.modelId)).toBe(true);
expect(result.draft.correctAnswer).not.toContain("模型推理");
```

Add this failure test:

```ts
it("keeps recognition failures recoverable and user-readable", async () => {
  const selectedRegion = createMockRegionCandidates()[0];
  const result = await mockAiAdapter.recognizeQuestion({
    subject: "auto",
    imageUri: "data:image/png;base64,original",
    selectedRegion,
    selectedRegionImageUri: "",
  });

  expect(result).toEqual({
    ok: false,
    reason: "region_image_missing",
    message: "题目区域截图生成失败，请重新确认区域。",
  });
});
```

- [ ] **Step 2: Run the test and verify failure**

Run:

```bash
npm run test:react -- src/services/aiAdapter.test.ts
```

Expected:

```text
FAIL because region_image_missing is not in the contract and mock adapter accepts an empty region image.
```

- [ ] **Step 3: Extend failure reasons**

Modify `src/services/aiAdapter.ts`:

```ts
export type AiAdapterFailureReason =
  | "image_missing"
  | "region_missing"
  | "region_image_missing"
  | "real_ai_disabled"
  | "provider_not_configured"
  | "provider_request_failed"
  | "provider_response_invalid"
  | "region_detection_failed"
  | "recognition_failed";
```

Add optional metadata to `AiAdapterFailure`:

```ts
export interface AiAdapterFailure {
  ok: false;
  reason: AiAdapterFailureReason;
  message: string;
  retryable?: boolean;
}
```

- [ ] **Step 4: Make the mock respect the contract**

Modify `src/services/mockAiAdapter.ts` inside `recognizeQuestion` after the selected region check:

```ts
if (!input.selectedRegionImageUri) {
  return {
    ok: false,
    reason: "region_image_missing",
    message: "题目区域截图生成失败，请重新确认区域。",
    retryable: true,
  };
}
```

If the test expects exact equality without `retryable`, either remove the `retryable` property from this mock failure or include it in the expected object. Keep the product message exactly as above.

- [ ] **Step 5: Run focused tests**

Run:

```bash
npm run test:react -- src/services/aiAdapter.test.ts src/domain/wrongQuestion.test.ts
```

Expected:

```text
PASS for adapter and domain tests.
```

- [ ] **Step 6: Commit**

```bash
git add src/services/aiAdapter.ts src/services/mockAiAdapter.ts src/services/aiAdapter.test.ts src/domain/wrongQuestion.ts src/domain/wrongQuestion.test.ts
git commit -m $'Harden the AI adapter contract for real recognition\n\nThe adapter now distinguishes missing region images and provider failures before the Qwen path is introduced, keeping recognition failures recoverable and user-readable.\n\nConstraint: AI results remain editable drafts and failures must not break manual save\nConfidence: high\nScope-risk: narrow\nTested: npm run test:react -- src/services/aiAdapter.test.ts src/domain/wrongQuestion.test.ts\nCo-authored-by: OmX <omx@oh-my-codex.dev>'
```

## Task 6: Add The Local AI Evaluation Harness

**Files:**
- Create: `ai-eval/README.md`
- Create: `ai-eval/samples/manifest.example.json`
- Create: `ai-eval/samples/.gitkeep`
- Create: `ai-eval/results/.gitignore`
- Create: `scripts/evaluate-ai-samples.mjs`
- Create: `tests/ai-eval-config.test.mjs`
- Modify: `package.json`
- Modify: `.gitignore`
- Test: `tests/ai-eval-config.test.mjs`

- [ ] **Step 1: Write the failing static harness test**

Create `tests/ai-eval-config.test.mjs`:

```js
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

assert.ok(existsSync("scripts/evaluate-ai-samples.mjs"), "evaluation script should exist");
assert.ok(existsSync("ai-eval/samples/manifest.example.json"), "manifest example should exist");
assert.ok(existsSync("ai-eval/results/.gitignore"), "evaluation results must be ignored");

const script = readFileSync("scripts/evaluate-ai-samples.mjs", "utf8");
assert.match(script, /EVOCRAFT_AI_EVAL_ENABLED/);
assert.match(script, /DASHSCOPE_API_KEY/);
assert.match(script, /manifestPath/);
assert.doesNotMatch(script, /fetch\(.*DASHSCOPE_API_KEY/);

const resultsIgnore = readFileSync("ai-eval/results/.gitignore", "utf8");
assert.match(resultsIgnore, /\*/);

const rootIgnore = readFileSync(".gitignore", "utf8");
assert.match(rootIgnore, /ai-eval\/samples\/\*/);
assert.match(rootIgnore, /!ai-eval\/samples\/manifest\.example\.json/);
```

- [ ] **Step 2: Run the test and verify failure**

Run:

```bash
node tests/ai-eval-config.test.mjs
```

Expected:

```text
FAIL because the evaluation harness files do not exist.
```

- [ ] **Step 3: Create ignored sample and result folders**

Modify `.gitignore`:

```gitignore
ai-eval/samples/*
!ai-eval/samples/.gitkeep
!ai-eval/samples/manifest.example.json
ai-eval/results/*
!ai-eval/results/.gitignore
```

Create `ai-eval/results/.gitignore`:

```gitignore
*
!.gitignore
```

Create empty `ai-eval/samples/.gitkeep`.

- [ ] **Step 4: Add the manifest example**

Create `ai-eval/samples/manifest.example.json`:

```json
{
  "schemaVersion": 1,
  "samples": [
    {
      "id": "math-geometry-demo",
      "subject": "math",
      "imagePath": "samples/private/math-geometry-demo.jpg",
      "labels": ["geometry", "multi-question-page", "teacher-markup"],
      "expected": {
        "targetQuestion": "只评测人工确认区域中的一道题",
        "mustNotInferAnswer": true,
        "mustPreserveVisualElements": ["geometry-diagram"]
      }
    }
  ]
}
```

- [ ] **Step 5: Add the evaluation README**

Create `ai-eval/README.md`:

```md
# EvoCraft AI Evaluation

This folder defines the local evaluation workflow for real AI recognition.

- Real child photos are not committed.
- Use `ai-eval/samples/manifest.local.json` for private local samples.
- Use `ai-eval/results/` for generated result JSONL files.
- The runner calls cloud AI only when `EVOCRAFT_AI_EVAL_ENABLED=1`.
- The first pass should use 10-15 mixed Chinese, math, and English samples.
- The pass criteria are valid JSON, no invented answer, recoverable failures, and clear review flags.
```

- [ ] **Step 6: Add the disabled-by-default runner**

Create `scripts/evaluate-ai-samples.mjs`:

```js
import { readFile, mkdir, writeFile } from "node:fs/promises";
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

await writeFile(outputPath, rows.map((row) => JSON.stringify(row)).join("\n") + "\n", "utf8");
console.log(`Wrote ${rows.length} evaluation rows to ${outputPath}`);
```

- [ ] **Step 7: Add the test script**

Modify `package.json`:

```json
"test:ai-eval-config": "node tests/ai-eval-config.test.mjs"
```

- [ ] **Step 8: Run focused tests**

Run:

```bash
npm run test:ai-eval-config
```

Expected:

```text
The command exits 0.
```

- [ ] **Step 9: Commit**

```bash
git add .gitignore package.json ai-eval/README.md ai-eval/samples/.gitkeep ai-eval/samples/manifest.example.json ai-eval/results/.gitignore scripts/evaluate-ai-samples.mjs tests/ai-eval-config.test.mjs
git commit -m $'Add a disabled-by-default AI evaluation harness\n\nThe project now has a local evaluation surface for private samples without committing child photos or accidentally calling a provider.\n\nConstraint: Real samples and generated results must stay out of git\nConfidence: high\nScope-risk: narrow\nTested: npm run test:ai-eval-config\nCo-authored-by: OmX <omx@oh-my-codex.dev>'
```

## Task 7: Add Qwen Adapter Spike With Fake-Fetch Tests

**Files:**
- Create: `electron/ai/recognitionPrompt.cjs`
- Create: `electron/ai/qwenAdapter.cjs`
- Create: `tests/qwen-adapter-contract.test.mjs`
- Modify: `scripts/evaluate-ai-samples.mjs`
- Modify: `package.json`
- Test: `tests/qwen-adapter-contract.test.mjs`

- [ ] **Step 1: Write the fake-fetch contract test**

Create `tests/qwen-adapter-contract.test.mjs`:

```js
import assert from "node:assert/strict";

import { createQwenAdapter, parseQwenJsonContent } from "../electron/ai/qwenAdapter.cjs";

const parsed = parseQwenJsonContent("```json\n{\"title\":\"一元一次方程\",\"questionText\":\"2x=4\"}\n```");
assert.equal(parsed.title, "一元一次方程");
assert.equal(parsed.questionText, "2x=4");

const calls = [];
const adapter = createQwenAdapter({
  apiKey: "test-key",
  fetchImpl: async (url, init) => {
    calls.push({ url, init });
    return {
      ok: true,
      status: 200,
      async json() {
        return {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  title: "阅读理解",
                  questionText: "请概括文章主要内容。",
                  studentAnswer: "图片中可见学生作答，需复核。",
                  correctAnswer: "",
                  notes: "未主动解题。",
                  reviewItems: [{ label: "答案", status: "需复核" }],
                }),
              },
            },
          ],
          usage: { total_tokens: 128 },
        };
      },
    };
  },
});

const result = await adapter.recognizeQuestion({
  subject: "chinese",
  imageUri: "data:image/png;base64,b3JpZ2luYWw=",
  selectedRegion: {
    id: "candidate-1",
    label: "候选 1",
    x: 0.1,
    y: 0.1,
    width: 0.5,
    height: 0.5,
    unit: "ratio",
    source: "manual",
    confidence: 1,
  },
  selectedRegionImageUri: "data:image/png;base64,cmVnaW9u",
});

assert.equal(result.ok, true);
assert.equal(result.draft.title, "阅读理解");
assert.equal(result.draft.correctAnswer, "");
assert.equal(calls.length, 1);
assert.equal(calls[0].url, "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions");
assert.match(calls[0].init.headers.Authorization, /^Bearer test-key$/);
assert.match(calls[0].init.body, /qwen-vl-ocr-latest/);
```

- [ ] **Step 2: Run the test and verify failure**

Run:

```bash
node tests/qwen-adapter-contract.test.mjs
```

Expected:

```text
FAIL because electron/ai/qwenAdapter.cjs does not exist.
```

- [ ] **Step 3: Add the recognition prompt module**

Create `electron/ai/recognitionPrompt.cjs`:

```js
function buildRecognitionPrompt({ subject }) {
  return [
    "你是 EvoCraft 的错题识别整理模块。",
    "只做图片中可见内容的识别和整理。",
    "不要主动解题，不要生成讲解，不要生成相似题。",
    "如果图片中没有标准答案，请把 correctAnswer 留空。",
    `用户选择的科目是 ${subject === "auto" ? "自动判断" : subject}。`,
    "必须返回 JSON，字段包括 title, questionText, studentAnswer, correctAnswer, notes, reviewItems。",
    "reviewItems 是数组，每项包含 label 和 status，status 使用 可信 或 需复核。",
  ].join("\n");
}

module.exports = { buildRecognitionPrompt };
```

- [ ] **Step 4: Add the Qwen adapter**

Create `electron/ai/qwenAdapter.cjs`:

```js
const { buildRecognitionPrompt } = require("./recognitionPrompt.cjs");

const defaultEndpoint = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
const defaultModel = "qwen-vl-ocr-latest";

function createQwenAdapter({ apiKey, endpoint = defaultEndpoint, model = defaultModel, fetchImpl = fetch }) {
  return {
    async detectRegions(input) {
      if (!input.imageUri) {
        return { ok: false, reason: "image_missing", message: "请先选择一张错题照片。", retryable: true };
      }

      return {
        ok: true,
        candidates: [
          {
            id: "qwen-candidate-1",
            label: "AI 候选 1",
            x: 0.08,
            y: 0.08,
            width: 0.84,
            height: 0.42,
            unit: "ratio",
            source: "ai_candidate",
            confidence: 0.7,
          },
        ],
      };
    },

    async recognizeQuestion(input) {
      if (!input.imageUri) {
        return { ok: false, reason: "image_missing", message: "请先选择一张错题照片。", retryable: true };
      }
      if (!input.selectedRegion) {
        return { ok: false, reason: "region_missing", message: "请先选择或手动画出一道题目区域。", retryable: true };
      }
      if (!input.selectedRegionImageUri) {
        return { ok: false, reason: "region_image_missing", message: "题目区域截图生成失败，请重新确认区域。", retryable: true };
      }
      if (!apiKey) {
        return { ok: false, reason: "provider_not_configured", message: "真实 AI 未配置 API Key。", retryable: false };
      }

      const startedAt = Date.now();
      const response = await fetchImpl(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: buildRecognitionPrompt({ subject: input.subject }) },
            {
              role: "user",
              content: [
                { type: "text", text: "请只识别这张题目区域图片中的可见内容，并返回 JSON。" },
                { type: "image_url", image_url: { url: input.selectedRegionImageUri } },
              ],
            },
          ],
          temperature: 0,
        }),
      });

      if (!response.ok) {
        return { ok: false, reason: "provider_request_failed", message: "真实 AI 服务请求失败，请稍后重试。", retryable: true };
      }

      const payload = await response.json();
      const content = payload?.choices?.[0]?.message?.content;
      const parsed = parseQwenJsonContent(content);
      if (!parsed) {
        return { ok: false, reason: "provider_response_invalid", message: "真实 AI 返回格式异常，请重试或手动填写。", retryable: true };
      }

      return {
        ok: true,
        draft: {
          id: `draft-${Date.now()}`,
          appId: "wrong_question_capture",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          subject: input.subject === "auto" ? "math" : input.subject,
          title: String(parsed.title ?? "识别草稿"),
          questionText: String(parsed.questionText ?? ""),
          originalImageUri: input.imageUri,
          selectedRegion: input.selectedRegion,
          selectedRegionImageUri: input.selectedRegionImageUri,
          cleanedQuestionImageUri: input.selectedRegionImageUri,
          visualSnippetUri: input.selectedRegionImageUri,
          studentAnswer: String(parsed.studentAnswer ?? ""),
          correctAnswer: String(parsed.correctAnswer ?? ""),
          notes: String(parsed.notes ?? "真实 AI 识别草稿，请人工复核。"),
          recognitionStatus: "needs_review",
          recognitionConfidence: 0.7,
          cleanupStatus: "needs_review",
          cleanupConfidence: 0.7,
          modelTraces: [
            { provider: "qwen", modelId: model, task: "ocr" },
            { provider: "qwen", modelId: model, task: "structure" },
            { provider: "qwen", modelId: model, task: "cleanup" },
          ],
          reviewItems: Array.isArray(parsed.reviewItems) ? parsed.reviewItems : [{ label: "识别结果", status: "需复核" }],
          providerMeta: {
            elapsedMs: Date.now() - startedAt,
            usage: payload.usage ?? null,
          },
        },
      };
    },
  };
}

function parseQwenJsonContent(content) {
  if (typeof content !== "string") return null;
  const cleaned = content
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");

  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

module.exports = { createQwenAdapter, parseQwenJsonContent };
```

- [ ] **Step 5: Connect the eval runner to Qwen**

Modify `scripts/evaluate-ai-samples.mjs`:

```js
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { createQwenAdapter } from "../electron/ai/qwenAdapter.cjs";
```

Replace the row loop with:

```js
const adapter = createQwenAdapter({ apiKey: process.env.DASHSCOPE_API_KEY });
const rows = [];

for (const sample of manifest.samples) {
  const imagePath = resolve(dirname(manifestPath), sample.imagePath);
  const imageUri = pathToFileURL(imagePath).toString();
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
```

- [ ] **Step 6: Add the test script**

Modify `package.json`:

```json
"test:qwen-adapter": "node tests/qwen-adapter-contract.test.mjs"
```

- [ ] **Step 7: Run focused tests**

Run:

```bash
npm run test:qwen-adapter
npm run test:ai-eval-config
```

Expected:

```text
Both commands exit 0 without calling the real provider.
```

- [ ] **Step 8: Commit**

```bash
git add package.json electron/ai/recognitionPrompt.cjs electron/ai/qwenAdapter.cjs scripts/evaluate-ai-samples.mjs tests/qwen-adapter-contract.test.mjs
git commit -m $'Add the Qwen recognition adapter spike\n\nThe real provider path is now testable with fake fetch and reusable from the local evaluation runner while remaining disabled unless explicitly configured.\n\nConstraint: Provider code stays in Electron/Node surfaces, not renderer bundles\nConfidence: medium\nScope-risk: moderate\nTested: npm run test:qwen-adapter\nTested: npm run test:ai-eval-config\nCo-authored-by: OmX <omx@oh-my-codex.dev>'
```

## Task 8: Add Real AI IPC And Renderer Adapter

**Files:**
- Modify: `electron/main.cjs`
- Modify: `electron/preload.cjs`
- Modify: `src/services/desktopBridge.ts`
- Create: `src/services/desktopAiAdapter.ts`
- Modify: `tests/electron-config.test.mjs`
- Test: `tests/electron-config.test.mjs`
- Test: `src/services/aiAdapter.test.ts`

- [ ] **Step 1: Extend config tests first**

Add these assertions to `tests/electron-config.test.mjs`:

```js
assert.match(main, /ipcMain\.handle\("ai:runtime-status"/);
assert.match(main, /ipcMain\.handle\("ai:detect-regions"/);
assert.match(main, /ipcMain\.handle\("ai:recognize-question"/);
assert.match(main, /EVOCRAFT_AI_ENABLED/);
assert.match(main, /DASHSCOPE_API_KEY/);

assert.match(preload, /getAiRuntimeStatus/);
assert.match(preload, /detectRegions/);
assert.match(preload, /recognizeQuestion/);
assert.doesNotMatch(preload, /DASHSCOPE_API_KEY/);
```

- [ ] **Step 2: Run and verify failure**

Run:

```bash
npm run test:electron-config
```

Expected:

```text
FAIL because real AI IPC is not registered.
```

- [ ] **Step 3: Register AI IPC in Electron main**

Modify `electron/main.cjs`:

```js
const { createQwenAdapter } = require("./ai/qwenAdapter.cjs");
```

Inside `app.whenReady().then(() => { ... })`, after `registerRecordIpc(recordStore);`:

```js
registerAiIpc(createAiRuntime());
```

Add:

```js
function createAiRuntime() {
  const enabled = process.env.EVOCRAFT_AI_ENABLED === "1";
  const provider = process.env.EVOCRAFT_AI_PROVIDER ?? "qwen";
  const apiKey = process.env.DASHSCOPE_API_KEY ?? "";

  return {
    status: {
      enabled: enabled && Boolean(apiKey),
      provider,
      mode: enabled && apiKey ? "real" : "mock",
      message: enabled && !apiKey ? "真实 AI 已开启但缺少 API Key。" : "",
    },
    adapter: createQwenAdapter({ apiKey }),
  };
}

function registerAiIpc(runtime) {
  ipcMain.handle("ai:runtime-status", (event) => {
    assertAllowedSender(event);
    return runtime.status;
  });

  ipcMain.handle("ai:detect-regions", async (event, input) => {
    assertAllowedSender(event);
    if (!runtime.status.enabled) {
      return { ok: false, reason: "real_ai_disabled", message: "真实 AI 未开启。", retryable: false };
    }
    return runtime.adapter.detectRegions(input);
  });

  ipcMain.handle("ai:recognize-question", async (event, input) => {
    assertAllowedSender(event);
    if (!runtime.status.enabled) {
      return { ok: false, reason: "real_ai_disabled", message: "真实 AI 未开启。", retryable: false };
    }
    return runtime.adapter.recognizeQuestion(input);
  });
}
```

- [ ] **Step 4: Expose AI IPC in preload**

Modify `electron/preload.cjs`:

```js
const api = {
  selectImage: () => ipcRenderer.invoke("dialog:select-image"),
  readImageAsDataUrl: (filePath) => ipcRenderer.invoke("file:read-image-data-url", filePath),
  loadRecords: () => ipcRenderer.invoke("records:load"),
  saveRecords: (records) => ipcRenderer.invoke("records:save", records),
  clearRecords: () => ipcRenderer.invoke("records:clear"),
  getAiRuntimeStatus: () => ipcRenderer.invoke("ai:runtime-status"),
  detectRegions: (input) => ipcRenderer.invoke("ai:detect-regions", input),
  recognizeQuestion: (input) => ipcRenderer.invoke("ai:recognize-question", input),
};
```

- [ ] **Step 5: Type the bridge and add renderer AI adapter**

Modify `src/services/desktopBridge.ts`:

```ts
import type {
  AiAdapterFailure,
  AiRuntimeStatus,
  DetectRegionsInput,
  DetectRegionsSuccess,
  RecognizeQuestionInput,
  RecognizeQuestionSuccess,
} from "./aiAdapter";

export interface EvoCraftDesktopApi {
  selectImage(): Promise<string | null>;
  readImageAsDataUrl(filePath: string): Promise<string>;
  loadRecords(): Promise<WrongQuestionRecord[]>;
  saveRecords(records: WrongQuestionRecord[]): Promise<StorageResult | StorageFailure>;
  clearRecords(): Promise<StorageResult | StorageFailure>;
  getAiRuntimeStatus(): Promise<AiRuntimeStatus>;
  detectRegions(input: DetectRegionsInput): Promise<DetectRegionsSuccess | AiAdapterFailure>;
  recognizeQuestion(input: RecognizeQuestionInput): Promise<RecognizeQuestionSuccess | AiAdapterFailure>;
}
```

Add `AiRuntimeStatus` to `src/services/aiAdapter.ts`:

```ts
export interface AiRuntimeStatus {
  enabled: boolean;
  provider: string;
  mode: "mock" | "real";
  message: string;
}
```

Create `src/services/desktopAiAdapter.ts`:

```ts
import type { AiAdapter } from "./aiAdapter";
import type { EvoCraftDesktopApi } from "./desktopBridge";

export function createDesktopAiAdapter(desktop: EvoCraftDesktopApi): AiAdapter {
  return {
    detectRegions: (input) => desktop.detectRegions(input),
    recognizeQuestion: (input) => desktop.recognizeQuestion(input),
  };
}
```

- [ ] **Step 6: Run focused tests**

Run:

```bash
npm run test:electron-config
npm run test:react -- src/services/aiAdapter.test.ts
```

Expected:

```text
Both commands exit 0.
```

- [ ] **Step 7: Commit**

```bash
git add electron/main.cjs electron/preload.cjs src/services/desktopBridge.ts src/services/desktopAiAdapter.ts src/services/aiAdapter.ts tests/electron-config.test.mjs
git commit -m $'Route real AI through Electron main IPC\n\nReal AI calls are now isolated behind Electron main and preload APIs, keeping provider keys and network calls out of the renderer.\n\nConstraint: API keys must never enter renderer code or persisted records\nConfidence: high\nScope-risk: moderate\nTested: npm run test:electron-config\nTested: npm run test:react -- src/services/aiAdapter.test.ts\nCo-authored-by: OmX <omx@oh-my-codex.dev>'
```

## Task 9: Add App-Level Runtime Switch, Authorization Copy, And Verification

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.test.tsx`
- Modify: `src/app/styles.css`
- Modify: `src/features/wrongQuestion/wrongQuestionReducer.ts`
- Modify: `src/features/wrongQuestion/wrongQuestionReducer.test.ts`
- Modify: `docs/planning/evocraft-roadmap-progress.md`
- Test: app, electron, build, desktop build

- [ ] **Step 1: Add failing UI tests**

Add this test to `src/app/App.test.tsx`:

```tsx
it("keeps mock AI as the default when desktop real AI is disabled", async () => {
  window.evocraft = {
    selectImage: vi.fn(),
    readImageAsDataUrl: vi.fn(),
    loadRecords: vi.fn().mockResolvedValue([]),
    saveRecords: vi.fn().mockResolvedValue({ ok: true }),
    clearRecords: vi.fn().mockResolvedValue({ ok: true }),
    getAiRuntimeStatus: vi.fn().mockResolvedValue({
      enabled: false,
      provider: "qwen",
      mode: "mock",
      message: "",
    }),
    detectRegions: vi.fn(),
    recognizeQuestion: vi.fn(),
  };

  render(<App />);

  await userEvent.click(screen.getByRole("button", { name: "错题收集" }));

  expect(await screen.findByText("本地 mock 识别")).toBeInTheDocument();
  expect(window.evocraft.detectRegions).not.toHaveBeenCalled();
});
```

Add this test:

```tsx
it("shows an external AI authorization notice when real AI is enabled", async () => {
  window.evocraft = {
    selectImage: vi.fn(),
    readImageAsDataUrl: vi.fn(),
    loadRecords: vi.fn().mockResolvedValue([]),
    saveRecords: vi.fn().mockResolvedValue({ ok: true }),
    clearRecords: vi.fn().mockResolvedValue({ ok: true }),
    getAiRuntimeStatus: vi.fn().mockResolvedValue({
      enabled: true,
      provider: "qwen",
      mode: "real",
      message: "",
    }),
    detectRegions: vi.fn(),
    recognizeQuestion: vi.fn(),
  };

  render(<App />);

  await userEvent.click(screen.getByRole("button", { name: "错题收集" }));

  expect(await screen.findByText("真实 AI 测试模式")).toBeInTheDocument();
  expect(screen.getByText("开启后会把确认的题目区域发送到外部 AI 服务进行识别。")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the app tests and verify failure**

Run:

```bash
npm run test:react -- src/app/App.test.tsx
```

Expected:

```text
FAIL because runtime status is not loaded and the notice does not exist.
```

- [ ] **Step 3: Add AI runtime state**

Modify `src/features/wrongQuestion/wrongQuestionReducer.ts` state:

```ts
aiRuntimeMode: "mock" | "real";
aiRuntimeMessage: string;
externalAiAcknowledged: boolean;
```

Set initial values:

```ts
aiRuntimeMode: "mock",
aiRuntimeMessage: "",
externalAiAcknowledged: false,
```

Add actions:

```ts
| { type: "AI_RUNTIME_READY"; mode: "mock" | "real"; message: string }
| { type: "EXTERNAL_AI_ACKNOWLEDGED"; acknowledged: boolean }
```

Add cases:

```ts
case "AI_RUNTIME_READY":
  return {
    ...state,
    aiRuntimeMode: action.mode,
    aiRuntimeMessage: action.message,
    externalAiAcknowledged: action.mode === "mock" ? false : state.externalAiAcknowledged,
  };

case "EXTERNAL_AI_ACKNOWLEDGED":
  return {
    ...state,
    externalAiAcknowledged: action.acknowledged,
    uploadError: action.acknowledged ? "" : state.uploadError,
  };
```

- [ ] **Step 4: Load runtime status and choose adapter**

Modify imports in `src/app/App.tsx`:

```ts
import { createDesktopAiAdapter } from "../services/desktopAiAdapter";
import type { AiAdapter } from "../services/aiAdapter";
```

Add memo:

```tsx
const aiAdapter: AiAdapter = useMemo(
  () => (desktopBridge && state.aiRuntimeMode === "real" ? createDesktopAiAdapter(desktopBridge) : mockAiAdapter),
  [desktopBridge, state.aiRuntimeMode],
);
```

Add effect:

```tsx
useEffect(() => {
  if (!desktopBridge?.getAiRuntimeStatus) return;

  let active = true;
  void desktopBridge.getAiRuntimeStatus().then((status) => {
    if (active) {
      dispatch({
        type: "AI_RUNTIME_READY",
        mode: status.enabled ? "real" : "mock",
        message: status.message,
      });
    }
  });

  return () => {
    active = false;
  };
}, [desktopBridge]);
```

Replace `mockAiAdapter.detectRegions` and `mockAiAdapter.recognizeQuestion` calls with `aiAdapter.detectRegions` and `aiAdapter.recognizeQuestion`.

- [ ] **Step 5: Add visible runtime copy**

In the upload screen JSX, near the existing privacy copy, render:

```tsx
{state.aiRuntimeMode === "real" ? (
  <label className="privacy-box ai-consent">
    <input
      type="checkbox"
      checked={state.externalAiAcknowledged}
      onChange={(event) =>
        dispatch({
          type: "EXTERNAL_AI_ACKNOWLEDGED",
          acknowledged: event.target.checked,
        })
      }
    />
    <span>
      <strong>真实 AI 测试模式</strong>
      开启后会把确认的题目区域发送到外部 AI 服务进行识别。
    </span>
  </label>
) : (
  <p className="ai-mode-note">本地 mock 识别</p>
)}
```

In `startRegionSelection()`, block real AI when external AI is not acknowledged:

```ts
if (state.aiRuntimeMode === "real" && !state.externalAiAcknowledged) {
  dispatch({ type: "UPLOAD_FAILED", message: "请先确认外部 AI 识别授权。" });
  return;
}
```

- [ ] **Step 6: Style the runtime notice**

Add to `src/app/styles.css`:

```css
.ai-mode-note {
  margin: 12px 0 0;
  color: var(--muted);
  font-size: 13px;
}

.ai-consent {
  margin-top: 12px;
  border-color: rgba(14, 165, 233, 0.3);
  background: rgba(240, 249, 255, 0.86);
}
```

- [ ] **Step 7: Run full verification**

Run:

```bash
npm run test:react -- src/app/App.test.tsx src/features/wrongQuestion/wrongQuestionReducer.test.ts
npm test
npm run test:electron-config
npm run test:electron-store
npm run test:ai-eval-config
npm run test:qwen-adapter
npm run build
npm run desktop:build
git diff --check
```

Expected:

```text
All commands exit 0.
```

- [ ] **Step 8: Update progress docs**

Append to `docs/planning/evocraft-roadmap-progress.md` under current progress:

```md
### 2026-05-23：真实 AI 识别接入实现

本轮任务是什么：

- 按已确认的真实 AI 识别接入设计，落地桌面本地文件存储、AI adapter v1、Qwen 评测脚本、Electron main IPC 和应用内真实 AI 开发开关。

已完成什么：

- 完成异步 RecordStore、Electron 本地文件存储、记录 IPC、React 桌面存储选择、AI adapter v1、AI 评测脚本、Qwen adapter spike、真实 AI IPC、应用内真实 AI 测试模式和外部 AI 授权提示。

卡在哪里：

- 如无阻塞，写 `无`。

执行的是什么命令：

- `npm run test:react -- src/app/App.test.tsx src/features/wrongQuestion/wrongQuestionReducer.test.ts`
- `npm test`
- `npm run test:electron-config`
- `npm run test:electron-store`
- `npm run test:ai-eval-config`
- `npm run test:qwen-adapter`
- `npm run build`
- `npm run desktop:build`
- `git diff --check`

下一步的计划：

- 根据 10-15 张脱敏样本评测结果，决定是否扩展到 50 张样本和第二供应商 A/B。
```

- [ ] **Step 9: Commit**

```bash
git add src/app/App.tsx src/app/App.test.tsx src/app/styles.css src/features/wrongQuestion/wrongQuestionReducer.ts src/features/wrongQuestion/wrongQuestionReducer.test.ts docs/planning/evocraft-roadmap-progress.md
git commit -m $'Expose real AI as an explicit desktop test mode\n\nThe app now keeps mock recognition as the default while allowing Electron desktop builds to opt into real AI through main-process IPC and explicit external AI authorization copy.\n\nConstraint: Real AI must be disabled by default and clearly authorized before upload\nConfidence: high\nScope-risk: moderate\nTested: npm run test:react -- src/app/App.test.tsx src/features/wrongQuestion/wrongQuestionReducer.test.ts\nTested: npm test\nTested: npm run test:electron-config\nTested: npm run test:electron-store\nTested: npm run test:ai-eval-config\nTested: npm run test:qwen-adapter\nTested: npm run build\nTested: npm run desktop:build\nTested: git diff --check\nCo-authored-by: OmX <omx@oh-my-codex.dev>'
```

## Final Verification

After all tasks are complete, run:

```bash
npm test
npm run test:electron-config
npm run test:electron-store
npm run test:ai-eval-config
npm run test:qwen-adapter
npm run build
npm run desktop:build
git diff --check
git status --short --branch
```

Expected:

```text
All commands exit 0.
git status shows only intended committed changes or a clean branch.
```

## Self-Review

Spec coverage:

- Local-first desktop storage is covered by Tasks 1-4.
- Provider-agnostic AI contract is covered by Task 5.
- Local evaluation harness is covered by Task 6.
- Qwen adapter spike is covered by Task 7.
- Electron main-process real AI IPC is covered by Task 8.
- Default mock mode, explicit real-AI authorization, and UI copy are covered by Task 9.
- Phase 2 exclusions are protected by Task 5 contract checks and Task 7 prompt rules.

Known implementation risks:

- The Qwen adapter response shape may need adjustment after the first real API call; fake-fetch tests protect request construction and JSON parsing, not model quality.
- File URL rendering works with the current Electron CSP because `img-src` already allows `file:`.
- The first implementation stores records as folders and JSON; if query needs grow, migrate through `schemaVersion` to SQLite.

Handoff rule:

- Do not run real provider calls unless `EVOCRAFT_AI_EVAL_ENABLED=1` or `EVOCRAFT_AI_ENABLED=1` is explicitly set and `DASHSCOPE_API_KEY` is present.
