# Desktop-First Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the completed static Web MVP onto a React/Vite/TypeScript trunk, protect the AI boundary with contract tests, and add the first Electron desktop shell without changing product scope.

**Architecture:** Keep `app/` as the static MVP baseline and create a new `src/` React app as the future engineering trunk. Move pure wrong-question domain behavior into typed modules, route UI through a provider-agnostic AI adapter, and introduce Electron only after the React build is stable. Electron code uses main/preload/renderer boundaries: renderer has no direct Node access, preload exposes a small API, and main owns filesystem access.

**Tech Stack:** React, Vite, TypeScript, Vitest, Testing Library, Electron, existing Node static tests.

---

## Scope Check

This plan intentionally covers one sequential desktop-first migration. The work has three dependent lanes:

1. React/Vite/TypeScript trunk.
2. AI adapter contract tests and mock implementation.
3. Electron shell around the stable frontend build.

Do not start real Qwen/Doubao provider integration, account systems, cloud sync, automatic updates, production signing, or mobile/tablet implementation in this plan.

## File Structure

Keep the static MVP intact:

- `app/index.html`: current static MVP reference.
- `app/main.js`: current static MVP reference.
- `app/state.js`: source reference for pure domain behavior during migration.
- `app/styles.css`: visual baseline reference.
- `tests/static-mvp.test.mjs`: current regression guard for the static baseline.

Create the new trunk:

- `index.html`: Vite app entry.
- `vite.config.ts`: Vite, React plugin, Vitest config.
- `tsconfig.json`, `tsconfig.node.json`: TypeScript configuration.
- `src/main.tsx`: React mount.
- `src/test/setup.ts`: Testing Library setup.
- `src/app/App.tsx`: top-level shell and screen routing.
- `src/app/App.test.tsx`: main flow test.
- `src/app/styles.css`: migrated UI styles from `app/styles.css`.
- `src/domain/wrongQuestion.ts`: typed wrong-question records, regions, mock data, and pure helpers.
- `src/domain/wrongQuestion.test.ts`: domain regression tests.
- `src/services/aiAdapter.ts`: provider-agnostic AI contract.
- `src/services/mockAiAdapter.ts`: local mock implementation.
- `src/services/aiAdapter.test.ts`: adapter contract tests.
- `src/services/storage.ts`: storage port for browser and desktop-backed persistence.
- `src/services/storage.test.ts`: storage tests.
- `src/features/wrongQuestion/wrongQuestionReducer.ts`: UI state transitions.
- `src/features/wrongQuestion/wrongQuestionReducer.test.ts`: reducer tests.

Add desktop shell after the web build passes:

- `electron/main.cjs`: Electron main process and BrowserWindow creation.
- `electron/preload.cjs`: context-bridged renderer API.
- `src/services/desktopBridge.ts`: renderer-side adapter for Electron preload API.
- `tests/electron-config.test.mjs`: lightweight Electron security/config regression test.

## Task 0: Toolchain Preflight

**Files:**
- Test: none
- Modify: none

- [ ] **Step 1: Verify Node and npm**

Run:

```bash
node --version
command -v npm || test -x /usr/local/bin/npm
```

Expected:

```text
Node prints a version.
npm is found either through PATH or at /usr/local/bin/npm.
```

- [ ] **Step 2: Normalize npm for this shell**

Run:

```bash
export PATH="/usr/local/bin:$PATH"
npm --version
```

Expected:

```text
npm prints a version.
```

- [ ] **Step 3: Verify current baseline still passes**

Run:

```bash
node tests/static-mvp.test.mjs
```

Expected:

```text
The command exits 0 with no assertion output.
```

- [ ] **Step 4: Commit**

No commit for this task because it changes no files.

## Task 1: Add Vite React TypeScript Scaffold

**Files:**
- Modify: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/app/App.test.tsx`
- Create: `src/test/setup.ts`
- Create: `src/vite-env.d.ts`
- Test: `src/app/App.test.tsx`

- [ ] **Step 1: Write the failing smoke test**

Create `src/app/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("App", () => {
  it("renders the EvoCraft desktop app shell", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "应用集合" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "错题收集" })).toBeInTheDocument();
    expect(screen.getByText("AI 学习助手应用集合")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
export PATH="/usr/local/bin:$PATH"
npm test -- --run src/app/App.test.tsx
```

Expected:

```text
FAIL because Vitest, React, or src/app/App.tsx is not configured yet.
```

- [ ] **Step 3: Install the frontend toolchain**

Run:

```bash
export PATH="/usr/local/bin:$PATH"
npm install react react-dom
npm install --save-dev @vitejs/plugin-react typescript vite vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom @types/react @types/react-dom
```

Expected:

```text
package.json and package-lock.json are updated with React, Vite, TypeScript, Vitest, and Testing Library packages.
```

- [ ] **Step 4: Update package scripts**

Modify `package.json` so its scripts are:

```json
{
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc -b && vite build",
    "preview": "vite preview --host 127.0.0.1",
    "test": "node tests/static-mvp.test.mjs && vitest run",
    "test:static": "node tests/static-mvp.test.mjs",
    "test:react": "vitest run"
  }
}
```

Keep existing `name`, `version`, `private`, and `type` fields.

- [ ] **Step 5: Create the Vite config**

Create `vite.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["src/test/setup.ts"],
    css: true,
  },
});
```

- [ ] **Step 6: Create TypeScript configs**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 7: Create the React entry**

Create `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>EvoCraft Desktop</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./app/App";
import "./app/styles.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

Create `src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
```

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 8: Create the initial App component**

Create `src/app/App.tsx`:

```tsx
export function App() {
  return (
    <div className="app-shell" data-testid="app-shell">
      <aside className="app-rail" aria-label="EvoCraft 应用集合">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            E
          </div>
          <div>
            <strong>EvoCraft</strong>
            <span>AI 学习助手应用集合</span>
          </div>
        </div>

        <nav className="rail-nav" aria-label="主导航">
          <button className="rail-link is-active" type="button">
            应用集合
          </button>
          <button className="rail-link" type="button">
            错题收集
          </button>
          <button className="rail-link" type="button">
            错题本
          </button>
        </nav>
      </aside>

      <main className="main-workspace" id="main-content">
        <section className="screen hub-screen" aria-labelledby="hub-title">
          <header className="workspace-header">
            <div>
              <h1 id="hub-title">应用集合</h1>
              <p>选择应用，开始高效学习</p>
            </div>
          </header>
        </section>
      </main>
    </div>
  );
}
```

Create `src/app/styles.css` by copying the contents of `app/styles.css`.

- [ ] **Step 9: Run tests and build**

Run:

```bash
export PATH="/usr/local/bin:$PATH"
npm test
npm run build
```

Expected:

```text
static MVP tests pass.
Vitest passes App.test.tsx.
Vite writes dist/.
```

- [ ] **Step 10: Commit**

Run:

```bash
git add package.json package-lock.json index.html vite.config.ts tsconfig.json tsconfig.node.json src/main.tsx src/app/App.tsx src/app/App.test.tsx src/app/styles.css src/test/setup.ts src/vite-env.d.ts
git commit -m "Start the React desktop trunk" \
  -m "The static MVP stays intact while the desktop route gets a typed Vite entry point." \
  -m "Constraint: Keep app/ as the behavior and visual baseline" \
  -m "Confidence: high" \
  -m "Scope-risk: moderate" \
  -m "Tested: npm test; npm run build" \
  -m "Co-authored-by: OmX <omx@oh-my-codex.dev>"
```

## Task 2: Port The Wrong-Question Domain Model

**Files:**
- Create: `src/domain/wrongQuestion.ts`
- Create: `src/domain/wrongQuestion.test.ts`
- Modify: `src/app/App.tsx`
- Test: `src/domain/wrongQuestion.test.ts`

- [ ] **Step 1: Write the failing domain tests**

Create `src/domain/wrongQuestion.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  STORAGE_KEY,
  createMockRecognition,
  createMockRegionCandidates,
  createRecordFromDraft,
  deleteRecord,
  deleteRegionCandidate,
} from "./wrongQuestion";

describe("wrongQuestion domain", () => {
  it("creates typed region candidates", () => {
    const candidates = createMockRegionCandidates();

    expect(candidates).toHaveLength(3);
    expect(candidates[0]).toMatchObject({
      id: "candidate-1",
      unit: "ratio",
      source: "ai_candidate",
    });
  });

  it("moves selection after deleting the selected region", () => {
    const candidates = createMockRegionCandidates();
    const result = deleteRegionCandidate(candidates, "candidate-2", "candidate-2");

    expect(result.regionCandidates.map((candidate) => candidate.id)).toEqual([
      "candidate-1",
      "candidate-3",
    ]);
    expect(result.selectedRegionId).toBe("candidate-3");
  });

  it("creates a reviewed record from a draft", () => {
    const selectedRegion = createMockRegionCandidates()[1];
    const draft = createMockRecognition({
      subject: "math",
      imageUri: "data:image/png;base64,original",
      selectedRegion,
      selectedRegionImageUri: "data:image/png;base64,region",
      now: "2026-05-17T08:00:00.000Z",
    });

    const record = createRecordFromDraft(draft, {
      id: "wq-fixed",
      now: "2026-05-17T09:00:00.000Z",
    });

    expect(record.id).toBe("wq-fixed");
    expect(record.appId).toBe("wrong_question_capture");
    expect(record.recognitionStatus).toBe("reviewed");
    expect(record.cleanupStatus).toBe("reviewed");
    expect(record.selectedRegionImageUri).toBe("data:image/png;base64,region");
    expect(record.modelTraces[0]).toMatchObject({
      provider: "mock",
      task: "region_detection",
    });
  });

  it("keeps immutable record deletion behavior", () => {
    const candidates = createMockRegionCandidates();
    const first = createRecordFromDraft(
      createMockRecognition({ selectedRegion: candidates[0] }),
      { id: "wq-first", now: "2026-05-17T08:00:00.000Z" },
    );
    const second = createRecordFromDraft(
      createMockRecognition({ selectedRegion: candidates[1] }),
      { id: "wq-second", now: "2026-05-17T09:00:00.000Z" },
    );

    const result = deleteRecord([first, second], "wq-first", "wq-first");

    expect(result.records).toHaveLength(1);
    expect(result.records[0].id).toBe("wq-second");
    expect(result.selectedRecordId).toBe("wq-second");
  });

  it("uses the v1 storage key", () => {
    expect(STORAGE_KEY).toBe("evocraft.wrongQuestion.records.v1");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
export PATH="/usr/local/bin:$PATH"
npm run test:react -- src/domain/wrongQuestion.test.ts
```

Expected:

```text
FAIL because src/domain/wrongQuestion.ts does not exist yet.
```

- [ ] **Step 3: Create the typed domain module**

Create `src/domain/wrongQuestion.ts` by porting the pure behavior from `app/state.js`. The module must export these names:

```ts
export const APP_ID = "wrong_question_capture";
export const STORAGE_KEY = "evocraft.wrongQuestion.records.v1";

export type Subject = "chinese" | "math" | "english";
export type RegionSource = "ai_candidate" | "manual";
export type RegionUnit = "ratio";
export type AiTask = "region_detection" | "ocr" | "structure" | "cleanup";
export type ReviewStatus = "needs_review" | "reviewed";

export interface RegionCandidate {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  unit: RegionUnit;
  source: RegionSource;
  confidence: number;
}

export interface ModelTrace {
  provider: "mock" | string;
  modelId: string;
  task: AiTask;
}

export interface WrongQuestionDraft {
  id: string;
  appId: typeof APP_ID;
  createdAt: string;
  updatedAt: string;
  subject: Subject;
  title: string;
  questionText: string;
  originalImageUri: string;
  selectedRegion: RegionCandidate;
  selectedRegionImageUri: string;
  cleanedQuestionImageUri: string;
  visualSnippetUri: string;
  studentAnswer: string;
  correctAnswer: string;
  notes: string;
  recognitionStatus: ReviewStatus;
  recognitionConfidence: number;
  cleanupStatus: ReviewStatus;
  cleanupConfidence: number;
  modelTraces: ModelTrace[];
  reviewItems: Array<{ label: string; status: string }>;
}

export interface WrongQuestionRecord extends WrongQuestionDraft {
  id: string;
  recognitionStatus: "reviewed";
  cleanupStatus: "reviewed";
}
```

Use the same candidate coordinates, sample subjects, `deleteRegionCandidate`, `deleteRecord`, `createMockRecognition`, `createRecordFromDraft`, `formatTime`, `createCleanQuestionImage`, and `createOriginalPlaceholderImage` behavior from `app/state.js`. Add a `now?: string` option to `createMockRecognition` so tests can avoid time-dependent assertions.

- [ ] **Step 4: Run tests**

Run:

```bash
export PATH="/usr/local/bin:$PATH"
npm run test:react -- src/domain/wrongQuestion.test.ts
npm test
```

Expected:

```text
Domain tests pass.
Static MVP tests still pass.
```

- [ ] **Step 5: Commit**

Run:

```bash
git add src/domain/wrongQuestion.ts src/domain/wrongQuestion.test.ts
git commit -m "Port the wrong-question domain to TypeScript" \
  -m "The React trunk needs typed records and pure helpers before UI migration." \
  -m "Constraint: Preserve static MVP domain behavior" \
  -m "Confidence: high" \
  -m "Scope-risk: narrow" \
  -m "Tested: npm run test:react -- src/domain/wrongQuestion.test.ts; npm test" \
  -m "Co-authored-by: OmX <omx@oh-my-codex.dev>"
```

## Task 3: Add The Provider-Agnostic AI Adapter Contract

**Files:**
- Create: `src/services/aiAdapter.ts`
- Create: `src/services/mockAiAdapter.ts`
- Create: `src/services/aiAdapter.test.ts`
- Test: `src/services/aiAdapter.test.ts`

- [ ] **Step 1: Write the failing adapter contract tests**

Create `src/services/aiAdapter.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { createMockRegionCandidates } from "../domain/wrongQuestion";
import { mockAiAdapter } from "./mockAiAdapter";

describe("mockAiAdapter", () => {
  it("returns selectable region candidates", async () => {
    const result = await mockAiAdapter.detectRegions({
      imageUri: "data:image/png;base64,original",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.candidates).toHaveLength(3);
    expect(result.candidates[1]).toMatchObject({
      id: "candidate-2",
      source: "ai_candidate",
    });
  });

  it("recognizes a confirmed region into a reviewed draft contract", async () => {
    const selectedRegion = createMockRegionCandidates()[1];
    const result = await mockAiAdapter.recognizeQuestion({
      subject: "math",
      imageUri: "data:image/png;base64,original",
      selectedRegion,
      selectedRegionImageUri: "data:image/png;base64,region",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.draft.subject).toBe("math");
    expect(result.draft.selectedRegion).toEqual(selectedRegion);
    expect(result.draft.modelTraces.map((trace) => trace.task)).toEqual([
      "region_detection",
      "ocr",
      "structure",
      "cleanup",
    ]);
  });

  it("returns recoverable failures for empty image input", async () => {
    const regionResult = await mockAiAdapter.detectRegions({ imageUri: "" });

    expect(regionResult).toEqual({
      ok: false,
      reason: "image_missing",
      message: "请先选择一张错题照片。",
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
export PATH="/usr/local/bin:$PATH"
npm run test:react -- src/services/aiAdapter.test.ts
```

Expected:

```text
FAIL because src/services/mockAiAdapter.ts does not exist yet.
```

- [ ] **Step 3: Define the adapter contract**

Create `src/services/aiAdapter.ts`:

```ts
import type { RegionCandidate, Subject, WrongQuestionDraft } from "../domain/wrongQuestion";

export type AiAdapterFailureReason =
  | "image_missing"
  | "region_missing"
  | "region_detection_failed"
  | "recognition_failed";

export interface AiAdapterFailure {
  ok: false;
  reason: AiAdapterFailureReason;
  message: string;
}

export interface DetectRegionsInput {
  imageUri: string;
}

export interface DetectRegionsSuccess {
  ok: true;
  candidates: RegionCandidate[];
}

export interface RecognizeQuestionInput {
  subject: Subject | "auto";
  imageUri: string;
  selectedRegion: RegionCandidate;
  selectedRegionImageUri: string;
}

export interface RecognizeQuestionSuccess {
  ok: true;
  draft: WrongQuestionDraft;
}

export interface AiAdapter {
  detectRegions(input: DetectRegionsInput): Promise<DetectRegionsSuccess | AiAdapterFailure>;
  recognizeQuestion(
    input: RecognizeQuestionInput,
  ): Promise<RecognizeQuestionSuccess | AiAdapterFailure>;
}
```

- [ ] **Step 4: Implement the mock adapter**

Create `src/services/mockAiAdapter.ts`:

```ts
import {
  createMockRecognition,
  createMockRegionCandidates,
  type Subject,
} from "../domain/wrongQuestion";
import type { AiAdapter } from "./aiAdapter";

function normalizeSubject(subject: Subject | "auto"): Subject {
  return subject === "auto" ? "math" : subject;
}

export const mockAiAdapter: AiAdapter = {
  async detectRegions(input) {
    if (!input.imageUri) {
      return {
        ok: false,
        reason: "image_missing",
        message: "请先选择一张错题照片。",
      };
    }

    return {
      ok: true,
      candidates: createMockRegionCandidates(),
    };
  },

  async recognizeQuestion(input) {
    if (!input.imageUri) {
      return {
        ok: false,
        reason: "image_missing",
        message: "请先选择一张错题照片。",
      };
    }

    if (!input.selectedRegion) {
      return {
        ok: false,
        reason: "region_missing",
        message: "请先选择或手动画出一道题目区域。",
      };
    }

    return {
      ok: true,
      draft: createMockRecognition({
        subject: normalizeSubject(input.subject),
        imageUri: input.imageUri,
        selectedRegion: input.selectedRegion,
        selectedRegionImageUri: input.selectedRegionImageUri,
      }),
    };
  },
};
```

- [ ] **Step 5: Run tests**

Run:

```bash
export PATH="/usr/local/bin:$PATH"
npm run test:react -- src/services/aiAdapter.test.ts
npm test
```

Expected:

```text
Adapter contract tests pass.
Full test suite passes.
```

- [ ] **Step 6: Commit**

Run:

```bash
git add src/services/aiAdapter.ts src/services/mockAiAdapter.ts src/services/aiAdapter.test.ts
git commit -m "Define the AI adapter contract" \
  -m "The UI must depend on a stable local contract before any real model provider is evaluated." \
  -m "Constraint: Current MVP must not upload real child learning photos" \
  -m "Rejected: Call a provider SDK directly from React | it would couple UI state to vendor behavior" \
  -m "Confidence: high" \
  -m "Scope-risk: narrow" \
  -m "Tested: npm run test:react -- src/services/aiAdapter.test.ts; npm test" \
  -m "Co-authored-by: OmX <omx@oh-my-codex.dev>"
```

## Task 4: Add Browser-Compatible Storage Port

**Files:**
- Create: `src/services/storage.ts`
- Create: `src/services/storage.test.ts`
- Test: `src/services/storage.test.ts`

- [ ] **Step 1: Write failing storage tests**

Create `src/services/storage.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { createMockRecognition, createRecordFromDraft } from "../domain/wrongQuestion";
import { createLocalStorageRecordStore } from "./storage";

describe("createLocalStorageRecordStore", () => {
  it("saves and loads records", () => {
    const storage = createMemoryStorage();
    const store = createLocalStorageRecordStore(storage);
    const record = createRecordFromDraft(createMockRecognition(), {
      id: "wq-storage",
      now: "2026-05-17T08:00:00.000Z",
    });

    expect(store.save([record])).toEqual({ ok: true });
    expect(store.load()).toEqual([record]);
  });

  it("returns a recoverable write failure", () => {
    const store = createLocalStorageRecordStore({
      getItem: () => null,
      setItem: () => {
        throw new Error("quota exceeded");
      },
      removeItem: () => undefined,
    });

    expect(store.save([])).toEqual({
      ok: false,
      reason: "storage_write_failed",
    });
  });

  it("clears records", () => {
    const storage = createMemoryStorage();
    const store = createLocalStorageRecordStore(storage);
    const record = createRecordFromDraft(createMockRecognition(), {
      id: "wq-clear",
      now: "2026-05-17T08:00:00.000Z",
    });

    store.save([record]);

    expect(store.clear()).toEqual({ ok: true });
    expect(store.load()).toEqual([]);
  });
});

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
export PATH="/usr/local/bin:$PATH"
npm run test:react -- src/services/storage.test.ts
```

Expected:

```text
FAIL because src/services/storage.ts does not exist yet.
```

- [ ] **Step 3: Implement storage port**

Create `src/services/storage.ts`:

```ts
import { STORAGE_KEY, type WrongQuestionRecord } from "../domain/wrongQuestion";

export type StorageFailureReason =
  | "storage_unavailable"
  | "storage_read_failed"
  | "storage_write_failed"
  | "storage_clear_failed";

export interface StorageResult {
  ok: true;
}

export interface StorageFailure {
  ok: false;
  reason: StorageFailureReason;
}

export interface RecordStore {
  load(): WrongQuestionRecord[];
  save(records: WrongQuestionRecord[]): StorageResult | StorageFailure;
  clear(): StorageResult | StorageFailure;
}

export function createLocalStorageRecordStore(storage: Storage | undefined): RecordStore {
  return {
    load() {
      if (!storage) return [];

      try {
        const raw = storage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as WrongQuestionRecord[]) : [];
      } catch {
        return [];
      }
    },

    save(records) {
      if (!storage) return { ok: false, reason: "storage_unavailable" };

      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(records));
        return { ok: true };
      } catch {
        return { ok: false, reason: "storage_write_failed" };
      }
    },

    clear() {
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

- [ ] **Step 4: Run tests**

Run:

```bash
export PATH="/usr/local/bin:$PATH"
npm run test:react -- src/services/storage.test.ts
npm test
```

Expected:

```text
Storage tests pass.
Full test suite passes.
```

- [ ] **Step 5: Commit**

Run:

```bash
git add src/services/storage.ts src/services/storage.test.ts
git commit -m "Add a storage port for desktop migration" \
  -m "The app needs a browser-compatible storage boundary before local desktop persistence is introduced." \
  -m "Constraint: localStorage remains the migration bridge for the existing MVP data shape" \
  -m "Confidence: high" \
  -m "Scope-risk: narrow" \
  -m "Tested: npm run test:react -- src/services/storage.test.ts; npm test" \
  -m "Co-authored-by: OmX <omx@oh-my-codex.dev>"
```

## Task 5: Move Wrong-Question Flow State Into A Reducer

**Files:**
- Create: `src/features/wrongQuestion/wrongQuestionReducer.ts`
- Create: `src/features/wrongQuestion/wrongQuestionReducer.test.ts`
- Modify: `src/app/App.tsx`
- Test: `src/features/wrongQuestion/wrongQuestionReducer.test.ts`

- [ ] **Step 1: Write failing reducer tests**

Create `src/features/wrongQuestion/wrongQuestionReducer.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { createMockRegionCandidates, createMockRecognition, createRecordFromDraft } from "../../domain/wrongQuestion";
import { createInitialWrongQuestionState, wrongQuestionReducer } from "./wrongQuestionReducer";

describe("wrongQuestionReducer", () => {
  it("gates region selection behind image and privacy acknowledgement", () => {
    const initial = createInitialWrongQuestionState([]);

    const noImage = wrongQuestionReducer(initial, { type: "START_REGION_SELECTION" });
    expect(noImage.uploadError).toBe("请先选择一张错题照片。");

    const withImage = wrongQuestionReducer(initial, {
      type: "IMAGE_SELECTED",
      imageUri: "data:image/png;base64,original",
      fileName: "question.png",
      fileMeta: "1.2 MB",
    });
    const blocked = wrongQuestionReducer(withImage, { type: "START_REGION_SELECTION" });
    expect(blocked.uploadError).toBe("请先确认本地隐私说明。");
  });

  it("enters region selection when privacy is acknowledged", () => {
    const state = createInitialWrongQuestionState([]);
    const withImage = wrongQuestionReducer(state, {
      type: "IMAGE_SELECTED",
      imageUri: "data:image/png;base64,original",
      fileName: "question.png",
      fileMeta: "1.2 MB",
    });
    const acknowledged = wrongQuestionReducer(withImage, {
      type: "PRIVACY_ACKNOWLEDGED",
      acknowledged: true,
    });
    const selecting = wrongQuestionReducer(acknowledged, {
      type: "REGION_CANDIDATES_READY",
      candidates: createMockRegionCandidates(),
    });

    expect(selecting.screen).toBe("select-region");
    expect(selecting.selectedRegionId).toBe("candidate-2");
  });

  it("saves a reviewed draft at the top of the notebook", () => {
    const draft = createMockRecognition();
    const initialRecord = createRecordFromDraft(createMockRecognition(), {
      id: "wq-existing",
      now: "2026-05-17T08:00:00.000Z",
    });
    const state = {
      ...createInitialWrongQuestionState([initialRecord]),
      draft,
    };

    const saved = wrongQuestionReducer(state, {
      type: "RECORD_SAVED",
      record: createRecordFromDraft(draft, {
        id: "wq-new",
        now: "2026-05-17T09:00:00.000Z",
      }),
    });

    expect(saved.records.map((record) => record.id)).toEqual(["wq-new", "wq-existing"]);
    expect(saved.selectedRecordId).toBe("wq-new");
    expect(saved.screen).toBe("detail");
  });
});
```

- [ ] **Step 2: Run the reducer test to verify it fails**

Run:

```bash
export PATH="/usr/local/bin:$PATH"
npm run test:react -- src/features/wrongQuestion/wrongQuestionReducer.test.ts
```

Expected:

```text
FAIL because src/features/wrongQuestion/wrongQuestionReducer.ts does not exist yet.
```

- [ ] **Step 3: Implement the reducer**

Create `src/features/wrongQuestion/wrongQuestionReducer.ts` with these exported names:

```ts
import type { RegionCandidate, WrongQuestionDraft, WrongQuestionRecord } from "../../domain/wrongQuestion";

export type Screen = "hub" | "upload" | "select-region" | "review" | "records" | "detail";

export interface WrongQuestionState {
  screen: Screen;
  selectedSubject: "auto" | "chinese" | "math" | "english";
  privacyAcknowledged: boolean;
  uploadedImageUri: string;
  uploadedFileName: string;
  uploadedFileMeta: string;
  uploadError: string;
  regionCandidates: RegionCandidate[];
  selectedRegionId: string | null;
  regionZoom: number;
  regionError: string;
  draft: WrongQuestionDraft | null;
  records: WrongQuestionRecord[];
  selectedRecordId: string | null;
  saveError: string;
  storageStatus: string;
  detailImageMode: "clean" | "region" | "original";
}

export type WrongQuestionAction =
  | { type: "GO_TO_SCREEN"; screen: Screen }
  | { type: "IMAGE_SELECTED"; imageUri: string; fileName: string; fileMeta: string }
  | { type: "PRIVACY_ACKNOWLEDGED"; acknowledged: boolean }
  | { type: "START_REGION_SELECTION" }
  | { type: "REGION_CANDIDATES_READY"; candidates: RegionCandidate[] }
  | { type: "REGION_SELECTION_FAILED"; message: string }
  | { type: "REGION_SELECTED"; regionId: string }
  | { type: "DRAFT_READY"; draft: WrongQuestionDraft }
  | { type: "RECORD_SAVED"; record: WrongQuestionRecord }
  | { type: "SAVE_FAILED"; message: string };
```

The reducer must preserve these behaviors from `app/main.js`:

- Without an image, `START_REGION_SELECTION` sets `uploadError` to `请先选择一张错题照片。`.
- Without privacy acknowledgement, `START_REGION_SELECTION` sets `uploadError` to `请先确认本地隐私说明。`.
- `REGION_CANDIDATES_READY` switches to `select-region` and selects the second candidate first when available.
- `DRAFT_READY` switches to `review`.
- `RECORD_SAVED` places the record first, selects it, clears the draft save error, and switches to `detail`.

- [ ] **Step 4: Run tests**

Run:

```bash
export PATH="/usr/local/bin:$PATH"
npm run test:react -- src/features/wrongQuestion/wrongQuestionReducer.test.ts
npm test
```

Expected:

```text
Reducer tests pass.
Full suite passes.
```

- [ ] **Step 5: Commit**

Run:

```bash
git add src/features/wrongQuestion/wrongQuestionReducer.ts src/features/wrongQuestion/wrongQuestionReducer.test.ts
git commit -m "Move wrong-question flow into a reducer" \
  -m "The desktop UI needs explicit state transitions before the static screens are migrated into React." \
  -m "Constraint: Preserve privacy gating and notebook save behavior" \
  -m "Confidence: high" \
  -m "Scope-risk: moderate" \
  -m "Tested: npm run test:react -- src/features/wrongQuestion/wrongQuestionReducer.test.ts; npm test" \
  -m "Co-authored-by: OmX <omx@oh-my-codex.dev>"
```

## Task 6: Migrate The MVP Screens Into React

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.test.tsx`
- Modify: `src/app/styles.css`
- Test: `src/app/App.test.tsx`

- [ ] **Step 1: Replace the smoke test with a user-flow test**

Modify `src/app/App.test.tsx`:

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("App", () => {
  it("runs the desktop MVP flow through upload, region selection, review, save, and notebook", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "错题收集" }));
    expect(screen.getByRole("heading", { name: "错题收集" })).toBeInTheDocument();

    const file = new File(["fake-image"], "question.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("选择错题照片"), file);
    await user.click(screen.getByRole("checkbox", { name: /本地隐私确认/ }));
    await user.click(screen.getByRole("button", { name: "下一步：选择题目区域" }));

    expect(screen.getByRole("heading", { name: "选择题目区域" })).toBeInTheDocument();
    expect(screen.getByText("候选 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "确认此区域并识别" }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "识别复核" })).toBeInTheDocument();
    });

    await user.clear(screen.getByLabelText("标题"));
    await user.type(screen.getByLabelText("标题"), "一次函数图像与坐标综合题");
    await user.click(screen.getByRole("button", { name: "保存到错题本" }));

    expect(screen.getByRole("heading", { name: "一次函数图像与坐标综合题" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "错题本" }));
    expect(screen.getByText("共 1 条")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
export PATH="/usr/local/bin:$PATH"
npm run test:react -- src/app/App.test.tsx
```

Expected:

```text
FAIL because the current App component only renders the shell.
```

- [ ] **Step 3: Migrate static screens into React**

Modify `src/app/App.tsx` to:

- Use `useReducer(wrongQuestionReducer, createInitialWrongQuestionState(recordStore.load()))`.
- Use `mockAiAdapter.detectRegions` in the upload to region transition.
- Use `mockAiAdapter.recognizeQuestion` in the region to review transition.
- Use `createRecordFromDraft` and `recordStore.save` when saving from review.
- Render the same six screens as `app/index.html`: `hub`, `upload`, `select-region`, `review`, `records`, `detail`.
- Preserve these accessible names because tests and browser verification depend on them:
  - `应用集合`
  - `错题收集`
  - `选择题目区域`
  - `识别复核`
  - `错题本`
  - `下一步：选择题目区域`
  - `确认此区域并识别`
  - `保存到错题本`

Use `src/app/styles.css` as the migrated CSS source and keep the existing layout tokens from `app/styles.css`.

- [ ] **Step 4: Run React and static tests**

Run:

```bash
export PATH="/usr/local/bin:$PATH"
npm run test:react -- src/app/App.test.tsx
npm test
npm run build
```

Expected:

```text
The user-flow test passes.
Static MVP tests still pass.
The Vite build succeeds.
```

- [ ] **Step 5: Commit**

Run:

```bash
git add src/app/App.tsx src/app/App.test.tsx src/app/styles.css
git commit -m "Migrate the MVP flow into React" \
  -m "The desktop trunk now owns the same upload, region, review, save, and notebook flow as the static MVP." \
  -m "Constraint: Do not expand product scope during framework migration" \
  -m "Confidence: medium" \
  -m "Scope-risk: moderate" \
  -m "Tested: npm run test:react -- src/app/App.test.tsx; npm test; npm run build" \
  -m "Co-authored-by: OmX <omx@oh-my-codex.dev>"
```

## Task 7: Add Browser Capture Verification For The React Trunk

**Files:**
- Create: `docs/design/desktop-trunk/capture-react-ui.mjs`
- Create: `docs/design/desktop-trunk/README.md`
- Test: manual screenshot review plus build

- [ ] **Step 1: Create the React screenshot script**

Create `docs/design/desktop-trunk/capture-react-ui.mjs` by copying `docs/design/implemented-mvp/capture-ui.mjs` and changing:

- The static server target from `/app/index.html` to `/index.html`.
- The output directory to `docs/design/desktop-trunk/screens`.
- The seeded storage import from `../../../app/state.js` to `../../../src/domain/wrongQuestion.ts` is not valid in Node without transpilation; instead seed through browser UI interactions only.

The script must capture:

```text
01-app-hub.png
02-upload-privacy.png
03-region-selection.png
04-recognition-review.png
05-saved-record-detail.png
06-records-notebook.png
```

- [ ] **Step 2: Create the screenshot index**

Create `docs/design/desktop-trunk/README.md`:

```md
# Desktop Trunk UI Capture

This folder stores screenshots from the React/Vite desktop trunk after the static MVP migration.

The screenshots are used to compare the new trunk against `docs/design/implemented-mvp/screens/`.

Run:

```bash
npm run build
node docs/design/desktop-trunk/capture-react-ui.mjs
```
```

- [ ] **Step 3: Run screenshot verification**

Run:

```bash
export PATH="/usr/local/bin:$PATH"
npm run build
node docs/design/desktop-trunk/capture-react-ui.mjs
```

Expected:

```text
The command writes six PNG files under docs/design/desktop-trunk/screens.
```

- [ ] **Step 4: Inspect screenshots**

Open:

```text
docs/design/desktop-trunk/screens/03-region-selection.png
docs/design/desktop-trunk/screens/04-recognition-review.png
docs/design/desktop-trunk/screens/06-records-notebook.png
```

Expected:

```text
No blank screens.
No overlapping primary controls.
Records list keeps image, text, and open action in one row on desktop.
```

- [ ] **Step 5: Commit**

Run:

```bash
git add docs/design/desktop-trunk
git commit -m "Capture the React desktop trunk UI" \
  -m "The migration needs a visual baseline before a desktop shell is added." \
  -m "Constraint: Compare against the existing implemented MVP screenshots" \
  -m "Confidence: medium" \
  -m "Scope-risk: narrow" \
  -m "Tested: npm run build; node docs/design/desktop-trunk/capture-react-ui.mjs; manual screenshot inspection" \
  -m "Co-authored-by: OmX <omx@oh-my-codex.dev>"
```

## Task 8: Add The Minimal Electron Shell

**Files:**
- Modify: `package.json`
- Create: `electron/main.cjs`
- Create: `electron/preload.cjs`
- Create: `src/services/desktopBridge.ts`
- Create: `tests/electron-config.test.mjs`
- Test: `tests/electron-config.test.mjs`

- [ ] **Step 1: Write the failing Electron config test**

Create `tests/electron-config.test.mjs`:

```js
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

assert.ok(existsSync("electron/main.cjs"), "electron/main.cjs should exist");
assert.ok(existsSync("electron/preload.cjs"), "electron/preload.cjs should exist");
assert.ok(existsSync("src/services/desktopBridge.ts"), "desktopBridge should exist");

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
assert.equal(pkg.main, "electron/main.cjs");
assert.equal(pkg.scripts["desktop:dev"], "concurrently -k \"npm run dev\" \"npm run electron:dev\"");
assert.equal(pkg.scripts["desktop:build"], "npm run build && electron-builder --dir");
assert.ok(pkg.devDependencies.electron, "electron should be a dev dependency");
assert.ok(pkg.devDependencies["electron-builder"], "electron-builder should be a dev dependency");

const main = readFileSync("electron/main.cjs", "utf8");
assert.match(main, /nodeIntegration:\\s*false/);
assert.match(main, /contextIsolation:\\s*true/);
assert.match(main, /sandbox:\\s*true/);
assert.match(main, /setWindowOpenHandler/);
assert.match(main, /will-navigate/);
assert.match(main, /ipcMain\\.handle\\(\"dialog:select-image\"/);

const preload = readFileSync("electron/preload.cjs", "utf8");
assert.match(preload, /contextBridge\\.exposeInMainWorld\\(\"evocraft\"/);
assert.doesNotMatch(preload, /ipcRenderer\\.send\\(/);
assert.match(preload, /selectImage/);
assert.match(preload, /readImageAsDataUrl/);
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
node tests/electron-config.test.mjs
```

Expected:

```text
FAIL because Electron files do not exist yet.
```

- [ ] **Step 3: Install Electron packages**

Run:

```bash
export PATH="/usr/local/bin:$PATH"
npm install --save-dev electron electron-builder concurrently wait-on
```

Modify `package.json` to add:

```json
{
  "main": "electron/main.cjs",
  "scripts": {
    "electron:dev": "wait-on http://127.0.0.1:5173 && ELECTRON_RENDERER_URL=http://127.0.0.1:5173 electron .",
    "desktop:dev": "concurrently -k \"npm run dev\" \"npm run electron:dev\"",
    "desktop:build": "npm run build && electron-builder --dir",
    "test:electron-config": "node tests/electron-config.test.mjs"
  },
  "build": {
    "appId": "com.evocraft.app",
    "productName": "EvoCraft",
    "files": ["dist/**", "electron/**", "package.json"],
    "directories": {
      "output": "release"
    }
  }
}
```

Keep the existing scripts from Task 1.

- [ ] **Step 4: Add Electron main process**

Create `electron/main.cjs`:

```js
const { app, BrowserWindow, dialog, ipcMain, session } = require("electron");
const { readFile } = require("node:fs/promises");
const { extname, join } = require("node:path");

const isDev = Boolean(process.env.ELECTRON_RENDERER_URL);

function createWindow() {
  const window = new BrowserWindow({
    title: "EvoCraft",
    width: 1440,
    height: 980,
    minWidth: 1180,
    minHeight: 760,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event, url) => {
    const allowed = isDev
      ? url.startsWith("http://127.0.0.1:5173")
      : url.startsWith("file://");
    if (!allowed) event.preventDefault();
  });

  if (isDev) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL ?? "http://127.0.0.1:5173");
    window.webContents.openDevTools({ mode: "detach" });
  } else {
    void window.loadFile(join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          "default-src 'self'; img-src 'self' data: blob: file:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' http://127.0.0.1:5173 ws://127.0.0.1:5173;",
        ],
      },
    });
  });

  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.handle("dialog:select-image", async () => {
  const result = await dialog.showOpenDialog({
    title: "选择错题照片",
    properties: ["openFile"],
    filters: [
      { name: "Images", extensions: ["png", "jpg", "jpeg", "webp", "bmp", "heic"] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

ipcMain.handle("file:read-image-data-url", async (_event, filePath) => {
  if (typeof filePath !== "string" || filePath.length === 0) {
    throw new Error("Invalid file path");
  }

  const extension = extname(filePath).toLowerCase().replace(".", "");
  const mime =
    extension === "jpg" || extension === "jpeg"
      ? "image/jpeg"
      : extension === "webp"
        ? "image/webp"
        : extension === "bmp"
          ? "image/bmp"
          : extension === "heic"
            ? "image/heic"
            : "image/png";
  const bytes = await readFile(filePath);
  return `data:${mime};base64,${bytes.toString("base64")}`;
});
```

- [ ] **Step 5: Add Electron preload and renderer bridge**

Create `electron/preload.cjs`:

```js
const { contextBridge, ipcRenderer } = require("electron");

const api = {
  selectImage: () => ipcRenderer.invoke("dialog:select-image"),
  readImageAsDataUrl: (filePath) => ipcRenderer.invoke("file:read-image-data-url", filePath),
};

contextBridge.exposeInMainWorld("evocraft", api);
```

Create `src/services/desktopBridge.ts`:

```ts
export interface EvoCraftDesktopApi {
  selectImage(): Promise<string | null>;
  readImageAsDataUrl(filePath: string): Promise<string>;
}

declare global {
  interface Window {
    evocraft?: EvoCraftDesktopApi;
  }
}

export function getDesktopBridge() {
  return window.evocraft ?? null;
}
```

- [ ] **Step 6: Run config and build verification**

Run:

```bash
export PATH="/usr/local/bin:$PATH"
node tests/electron-config.test.mjs
npm run build
npm run desktop:build
```

Expected:

```text
Electron config test passes.
Vite build passes.
electron-builder dry directory build passes.
```

- [ ] **Step 7: Commit**

Run:

```bash
git add package.json package-lock.json electron src/services/desktopBridge.ts tests/electron-config.test.mjs
git commit -m "Add the first Electron desktop shell" \
  -m "The React trunk can now be launched through a minimal Electron wrapper with explicit main, preload, and renderer boundaries." \
  -m "Constraint: Renderer must not receive direct Node access" \
  -m "Rejected: Add updater and signing now | those need release process decisions" \
  -m "Confidence: medium" \
  -m "Scope-risk: moderate" \
  -m "Tested: node tests/electron-config.test.mjs; npm run build; npm run desktop:build" \
  -m "Co-authored-by: OmX <omx@oh-my-codex.dev>"
```

## Task 9: Update Durable Project Records

**Files:**
- Modify: `docs/README.md`
- Modify: `docs/planning/evocraft-project-memory.md`
- Modify: `docs/planning/evocraft-roadmap-progress.md`
- Test: document scans

- [ ] **Step 1: Update document index**

Modify `docs/README.md` to add:

```md
- [桌面优先迁移实施计划](superpowers/plans/2026-05-17-desktop-first-migration.md)：把桌面优先技术选型拆成 React/Vite/TypeScript 迁移、AI adapter contract tests 和 Electron shell 的可执行任务。
```

- [ ] **Step 2: Update project memory after implementation**

Modify `docs/planning/evocraft-project-memory.md` after the implementation work is complete:

```md
- 桌面优先迁移已完成第一阶段工程落地：React/Vite/TypeScript 主干、typed wrong-question domain、mock AI adapter contract、storage port 和 Electron shell。
```

Only add this line after Tasks 1 through 8 have passed.

- [ ] **Step 3: Add progress entry**

Append a progress entry to `docs/planning/evocraft-roadmap-progress.md` with these fields:

```md
### 2026-05-17：桌面优先迁移实施

本轮任务是什么：

- 执行桌面优先迁移计划，建立 React/Vite/TypeScript 主干、AI adapter contract tests 和 Electron 桌面壳。

已完成什么：

- 完成 React/Vite/TypeScript 主干、typed wrong-question domain、mock AI adapter contract、storage port、React UI 迁移、桌面 trunk 截图验证和 Electron shell。

卡在哪里：

- 无。

执行的是什么命令：

- `export PATH="/usr/local/bin:$PATH"`
- `npm test`
- `npm run build`
- `node docs/design/desktop-trunk/capture-react-ui.mjs`
- `node tests/electron-config.test.mjs`
- `npm run desktop:build`
- `git diff --check`

下一步的计划：

- 进入真实 AI/OCR provider 评估前，先补 AI adapter provider PRD，明确供应商数据边界、授权文案、模型分层和失败降级。
```

When writing the real progress entry, remove the angle-bracket instruction lines and replace them with factual content.

- [ ] **Step 4: Run document scans**

Run:

```bash
node -e 'const fs=require("node:fs"); const files=["docs/superpowers/plans/2026-05-17-desktop-first-migration.md","docs/README.md","docs/planning/evocraft-project-memory.md","docs/planning/evocraft-roadmap-progress.md"]; const bad=["T"+"BD","T"+"ODO","待"+"定","待"+"补","PLACE"+"HOLDER","implement "+"later"]; for (const file of files) { const text=fs.readFileSync(file,"utf8"); for (const pattern of bad) { if (text.includes(pattern)) { console.error(`${file}: contains ${pattern}`); process.exitCode=1; } } }'
git diff --check
```

Expected:

```text
No placeholder output from the node scan.
git diff --check exits 0.
```

- [ ] **Step 5: Final test pass**

Run:

```bash
export PATH="/usr/local/bin:$PATH"
npm test
npm run build
node tests/electron-config.test.mjs
npm run desktop:build
```

Expected:

```text
All tests pass.
Vite build passes.
Electron config test passes.
Electron directory build passes.
```

- [ ] **Step 6: Commit**

Run:

```bash
git add docs/README.md docs/planning/evocraft-project-memory.md docs/planning/evocraft-roadmap-progress.md docs/superpowers/plans/2026-05-17-desktop-first-migration.md
git commit -m "Record the desktop migration implementation state" \
  -m "The project memory now reflects the React trunk, AI adapter boundary, and Electron shell implementation status." \
  -m "Constraint: Durable Superpowers outputs must live under the main project directory" \
  -m "Confidence: high" \
  -m "Scope-risk: narrow" \
  -m "Tested: npm test; npm run build; node tests/electron-config.test.mjs; npm run desktop:build; git diff --check" \
  -m "Co-authored-by: OmX <omx@oh-my-codex.dev>"
```

## Self-Review

- Spec coverage: This plan covers React/Vite/TypeScript trunk setup, typed domain migration, AI adapter contract tests, storage boundary, React UI migration, screenshot verification, Electron shell, and durable project records.
- Out of scope: Real provider integration, account/cloud sync, automatic updates, production signing, mobile/tablet implementation.
- Dependency order: Task 1 enables React tests and build. Tasks 2 through 5 create typed business boundaries. Task 6 migrates UI. Task 7 captures visual evidence. Task 8 adds Electron after web build stability. Task 9 records completion.
- Known execution risk: The current Codex shell may not include `npm` in PATH. Use `export PATH="/usr/local/bin:$PATH"` before npm commands.
