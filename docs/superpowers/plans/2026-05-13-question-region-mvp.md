# Question Region MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated `选择题目区域` step so a user can pick or manually draw one question region from a multi-question photo before recognition.

**Architecture:** Keep the current zero-dependency static app. Add one new screen between upload and review, extend the local record model with `selectedRegion`, `selectedRegionImageUri`, and `modelTraces`, and keep all AI behavior mocked behind small state helpers so a domestic provider adapter can be added later.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript modules, browser FileReader/canvas APIs, localStorage, Node static tests.

---

## Feature And UI Summary

Confirmed feature flow:

1. User uploads one photo that may contain many questions.
2. The app enters `选择题目区域`.
3. Mock AI shows candidate question boxes.
4. User picks a candidate or clicks `手动画框`.
5. User can drag and resize the selected rectangle, zoom the canvas, and confirm.
6. Recognition runs only on the confirmed region.
7. Saved records keep both the full original image and the selected question region.
8. Detail view defaults to clean question view and can switch to selected region or original image.

UI shape:

- Upload page CTA changes from direct recognition to `下一步：选择题目区域`.
- New region screen uses the existing three-column workbench: rail, main canvas, right side tool panel.
- Main canvas shows full image, candidate boxes, selected box handles, zoom controls, and a short instruction strip.
- Right panel shows candidate list, `确认此区域并识别`, `手动画框`, `重新自动找题`, and `返回上传`.
- Review page should show the selected region as the source input, with full original available for traceability.

Model strategy summary:

- First implementation uses mock region detection and mock recognition only.
- Runtime model direction is domestic-first: Qwen family as first candidate, Doubao visual understanding as backup.
- Provider-specific code must stay behind adapter-shaped functions; UI must not depend on a vendor SDK or visible model names.

## File Structure

- Modify `tests/static-mvp.test.mjs`: lock the new screen markers, actions, and record fields.
- Modify `app/state.js`: add region data helpers, mock candidates, selected-region image metadata, and model trace defaults.
- Modify `app/index.html`: add the `select-region` screen and review/detail image controls.
- Modify `app/main.js`: route upload to region selection, implement candidate selection, manual drawing, drag/resize, canvas crop, and detail mode switching.
- Modify `app/styles.css`: style the region canvas, overlays, candidate list, tool buttons, and responsive behavior.
- Modify `docs/planning/evocraft-roadmap-progress.md`: record implementation-plan creation and verification commands.

## Task 1: Lock Static Markers And Data Contract

**Files:**
- Modify: `tests/static-mvp.test.mjs`
- Test: `tests/static-mvp.test.mjs`

- [ ] **Step 1: Add failing static marker assertions**

Add these markers to the existing `marker` array in `tests/static-mvp.test.mjs`:

```js
const html = readFileSync("app/index.html", "utf8");
for (const marker of [
  "data-screen=\"hub\"",
  "data-screen=\"upload\"",
  "data-screen=\"select-region\"",
  "data-screen=\"review\"",
  "data-screen=\"records\"",
  "data-screen=\"detail\"",
  "id=\"image-input\"",
  "id=\"region-canvas-image\"",
  "id=\"region-overlay\"",
  "id=\"region-candidate-list\"",
  "id=\"records-list\"",
  "data-action=\"start-region-selection\"",
  "data-action=\"confirm-region\"",
  "data-action=\"manual-region\"",
  "data-action=\"go-records\"",
]) {
  assert.ok(html.includes(marker), `index.html should include ${marker}`);
}
```

- [ ] **Step 2: Add failing state contract assertions**

Add this block after the `state` import:

```js
const candidates = state.createMockRegionCandidates();
assert.equal(candidates.length, 3);
assert.equal(candidates[0].unit, "ratio");
assert.equal(candidates[0].source, "ai_candidate");
assert.ok(candidates[0].width > 0);
assert.ok(candidates[0].height > 0);
```

Update the draft creation assertion:

```js
const draft = state.createMockRecognition({
  subject: "math",
  imageUri: "data:image/png;base64,seed",
  selectedRegion: candidates[1],
  selectedRegionImageUri: "data:image/png;base64,region",
});

assert.deepEqual(draft.selectedRegion, candidates[1]);
assert.equal(draft.selectedRegionImageUri, "data:image/png;base64,region");
assert.equal(draft.modelTraces[0].provider, "mock");
assert.equal(draft.modelTraces[0].task, "ocr");
```

Update the record assertions:

```js
assert.deepEqual(record.selectedRegion, candidates[1]);
assert.equal(record.selectedRegionImageUri, "data:image/png;base64,region");
assert.ok(Array.isArray(record.modelTraces));
```

- [ ] **Step 3: Run test to verify it fails**

Run:

```bash
node tests/static-mvp.test.mjs
```

Expected: FAIL because `data-screen="select-region"` and `createMockRegionCandidates` do not exist yet.

- [ ] **Step 4: Commit test contract**

```bash
git add tests/static-mvp.test.mjs
git commit -m "Lock question region MVP contract"
```

## Task 2: Add Region Data Helpers

**Files:**
- Modify: `app/state.js`
- Test: `tests/static-mvp.test.mjs`

- [ ] **Step 1: Add region helpers to `app/state.js`**

Insert after `subjectSamples`:

```js
const defaultRegionCandidates = [
  {
    id: "candidate-1",
    label: "候选 1",
    x: 0.11,
    y: 0.18,
    width: 0.78,
    height: 0.18,
    unit: "ratio",
    source: "ai_candidate",
    confidence: 0.72,
  },
  {
    id: "candidate-2",
    label: "候选 2",
    x: 0.1,
    y: 0.4,
    width: 0.8,
    height: 0.28,
    unit: "ratio",
    source: "ai_candidate",
    confidence: 0.9,
  },
  {
    id: "candidate-3",
    label: "候选 3",
    x: 0.12,
    y: 0.72,
    width: 0.76,
    height: 0.16,
    unit: "ratio",
    source: "ai_candidate",
    confidence: 0.66,
  },
];

export function createMockRegionCandidates() {
  return defaultRegionCandidates.map((candidate) => ({ ...candidate }));
}

export function createManualRegion() {
  return {
    id: `manual-${Date.now()}`,
    label: "手动画框",
    x: 0.18,
    y: 0.28,
    width: 0.64,
    height: 0.34,
    unit: "ratio",
    source: "manual",
    confidence: 1,
  };
}
```

- [ ] **Step 2: Extend `createMockRecognition`**

Replace the function signature and returned image fields:

```js
export function createMockRecognition({
  subject = "math",
  imageUri,
  selectedRegion,
  selectedRegionImageUri,
} = {}) {
  const normalizedSubject = SUBJECTS[subject] ? subject : "math";
  const sample = subjectSamples[normalizedSubject];
  const now = new Date().toISOString();
  const fallbackRegion = selectedRegion ?? createMockRegionCandidates()[1];
  const originalImageUri = imageUri || createOriginalPlaceholderImage();

  return {
    id: `draft-${Date.now()}`,
    appId: APP_ID,
    createdAt: now,
    updatedAt: now,
    subject: normalizedSubject,
    title: sample.title,
    questionText: sample.question,
    originalImageUri,
    selectedRegion: fallbackRegion,
    selectedRegionImageUri: selectedRegionImageUri || originalImageUri,
    cleanedQuestionImageUri: createCleanQuestionImage(normalizedSubject),
    visualSnippetUri: createCleanQuestionImage(normalizedSubject),
    studentAnswer: "AI 识别到学生作答痕迹，已从干净题面中隐藏，请人工确认是否需要保留到备注。",
    correctAnswer: sample.answer,
    notes: "当前为本地 mock 识别结果；真实 AI/OCR 接入前不会上传儿童学习照片。",
    recognitionStatus: "needs_review",
    recognitionConfidence: 0.92,
    cleanupStatus: "needs_review",
    cleanupConfidence: 0.78,
    modelTraces: [
      { provider: "mock", modelId: "local-region-mock", task: "region_detection" },
      { provider: "mock", modelId: "local-ocr-mock", task: "ocr" },
      { provider: "mock", modelId: "local-structure-mock", task: "structure" },
      { provider: "mock", modelId: "local-cleanup-mock", task: "cleanup" },
    ],
    reviewItems: [
      { label: "题干文字已识别", status: "可信" },
      { label: "学生作答已隐藏", status: "请检查" },
      { label: "图形内容已保留", status: "可信" },
      { label: "批改痕迹需确认", status: "需复核" },
    ],
  };
}
```

- [ ] **Step 3: Run test to verify data helpers pass and HTML still fails**

```bash
node tests/static-mvp.test.mjs
```

Expected: FAIL only on missing HTML markers.

- [ ] **Step 4: Commit data helpers**

```bash
git add app/state.js
git commit -m "Add mock question region data"
```

## Task 3: Add The Select Region Screen Markup

**Files:**
- Modify: `app/index.html`
- Test: `tests/static-mvp.test.mjs`

- [ ] **Step 1: Change upload CTA action**

Replace the upload start button:

```html
<button class="button-primary start-button" type="button" data-action="start-region-selection" disabled>
  下一步：选择题目区域
</button>
```

- [ ] **Step 2: Insert select-region screen before review screen**

Add this section before `<section class="screen review-screen"`:

```html
<section class="screen region-screen" data-screen="select-region" aria-labelledby="region-title" hidden>
  <header class="workspace-header">
    <div>
      <h1 id="region-title">选择题目区域</h1>
      <p>确认本次要识别的一道题，AI 会只整理这个区域</p>
    </div>
    <div class="header-actions">
      <button class="button-secondary" type="button" data-action="go-upload">返回上传</button>
      <button class="button-primary" type="button" data-action="confirm-region">确认此区域并识别</button>
    </div>
  </header>

  <div class="region-layout">
    <section class="region-canvas-card" aria-labelledby="region-canvas-title">
      <header>
        <div>
          <h2 id="region-canvas-title">整张原图</h2>
          <p>拖动蓝框边角调整范围，或使用手动画框</p>
        </div>
        <div class="canvas-tools" aria-label="画布缩放">
          <button class="button-ghost" type="button" data-action="zoom-out">缩小</button>
          <button class="button-ghost" type="button" data-action="zoom-fit">适配</button>
          <button class="button-ghost" type="button" data-action="zoom-in">放大</button>
        </div>
      </header>
      <div class="region-canvas" id="region-canvas">
        <img id="region-canvas-image" alt="用于框选题目区域的整张原图" />
        <div class="region-overlay" id="region-overlay" aria-label="题目候选区域"></div>
      </div>
    </section>

    <aside class="region-tools" aria-labelledby="region-tools-title">
      <h2 id="region-tools-title">选题工具</h2>
      <p>先选 AI 候选框；如果没有框中，就手动画框。</p>
      <div class="region-candidate-list" id="region-candidate-list"></div>
      <div class="region-summary" id="selected-region-summary"></div>
      <button class="button-primary full" type="button" data-action="confirm-region">确认此区域并识别</button>
      <button class="button-secondary full" type="button" data-action="manual-region">手动画框</button>
      <button class="button-secondary full" type="button" data-action="rerun-region-detection">重新自动找题</button>
      <button class="button-ghost full" type="button" data-action="go-upload">返回上传</button>
    </aside>
  </div>
</section>
```

- [ ] **Step 3: Add selected region panel to review screen**

Inside `.review-grid`, insert this article before `clean-question-panel`:

```html
<article class="image-panel selected-region-panel">
  <header>
    <div>
      <h2>确认区域</h2>
      <p>本次只识别这道题</p>
    </div>
    <span class="status-chip ai">已确认</span>
  </header>
  <img id="review-region-image" alt="已确认的题目区域" />
  <footer>
    <span class="status-chip ai">来自选题区域</span>
  </footer>
</article>
```

- [ ] **Step 4: Run static test**

```bash
node tests/static-mvp.test.mjs
```

Expected: PASS after Task 2 is complete.

- [ ] **Step 5: Commit markup**

```bash
git add app/index.html tests/static-mvp.test.mjs
git commit -m "Add question region selection screen"
```

## Task 4: Implement Region Selection State And Routing

**Files:**
- Modify: `app/main.js`
- Test: `tests/static-mvp.test.mjs`

- [ ] **Step 1: Import region helpers**

Change the import block:

```js
import {
  SUBJECTS,
  createManualRegion,
  createMockRecognition,
  createMockRegionCandidates,
  createRecordFromDraft,
  formatTime,
  loadRecords,
  persistRecords,
} from "./state.js";
```

- [ ] **Step 2: Extend `appState`**

Add these fields:

```js
regionCandidates: [],
selectedRegionId: null,
selectedRegionImageUri: "",
regionZoom: 1,
dragState: null,
```

- [ ] **Step 3: Add element references**

Add to `els`:

```js
regionCanvas: document.querySelector("#region-canvas"),
regionCanvasImage: document.querySelector("#region-canvas-image"),
regionOverlay: document.querySelector("#region-overlay"),
regionCandidateList: document.querySelector("#region-candidate-list"),
selectedRegionSummary: document.querySelector("#selected-region-summary"),
reviewRegionImage: document.querySelector("#review-region-image"),
```

- [ ] **Step 4: Add actions**

Add to `actions`:

```js
"start-region-selection": startRegionSelection,
"confirm-region": confirmSelectedRegion,
"manual-region": useManualRegion,
"rerun-region-detection": rerunRegionDetection,
"zoom-in": () => setRegionZoom(Math.min(1.8, appState.regionZoom + 0.1)),
"zoom-out": () => setRegionZoom(Math.max(0.7, appState.regionZoom - 0.1)),
"zoom-fit": () => setRegionZoom(1),
```

- [ ] **Step 5: Replace direct recognition with region start**

Add:

```js
function startRegionSelection() {
  if (!appState.uploadedImageUri) {
    showUploadError("请先上传一张错题照片。");
    return;
  }

  appState.regionCandidates = createMockRegionCandidates();
  appState.selectedRegionId = appState.regionCandidates[1]?.id ?? appState.regionCandidates[0]?.id ?? null;
  appState.selectedRegionImageUri = "";
  appState.regionZoom = 1;
  setScreen("select-region");
}
```

- [ ] **Step 6: Make old recognition require selected region**

Replace `startRecognition` with:

```js
function startRecognition() {
  confirmSelectedRegion();
}
```

Add:

```js
async function confirmSelectedRegion() {
  const selectedRegion = getSelectedRegion();
  if (!appState.uploadedImageUri || !selectedRegion) {
    showUploadError("请先选择或手动画出一道题目区域。");
    return;
  }

  const subject = appState.selectedSubject === "auto" ? "math" : appState.selectedSubject;
  const selectedRegionImageUri = await createSelectedRegionImage(appState.uploadedImageUri, selectedRegion);
  appState.selectedRegionImageUri = selectedRegionImageUri;
  appState.draft = createMockRecognition({
    subject,
    imageUri: appState.uploadedImageUri,
    selectedRegion,
    selectedRegionImageUri,
  });
  setScreen("review");
}
```

- [ ] **Step 7: Add region utilities**

Add near helper functions:

```js
function getSelectedRegion() {
  return appState.regionCandidates.find((region) => region.id === appState.selectedRegionId) ?? null;
}

function useManualRegion() {
  const manualRegion = createManualRegion();
  appState.regionCandidates = [manualRegion, ...appState.regionCandidates.filter((region) => region.source !== "manual")];
  appState.selectedRegionId = manualRegion.id;
  renderRegionSelection();
}

function rerunRegionDetection() {
  appState.regionCandidates = createMockRegionCandidates();
  appState.selectedRegionId = appState.regionCandidates[1]?.id ?? appState.regionCandidates[0]?.id ?? null;
  renderRegionSelection();
}

function setRegionZoom(value) {
  appState.regionZoom = Number(value.toFixed(2));
  renderRegionSelection();
}
```

- [ ] **Step 8: Add canvas crop helper**

Add:

```js
function createSelectedRegionImage(imageUri, region) {
  return new Promise((resolve) => {
    const image = new Image();
    image.addEventListener("load", () => {
      const canvas = document.createElement("canvas");
      const sourceX = Math.max(0, Math.round(image.naturalWidth * region.x));
      const sourceY = Math.max(0, Math.round(image.naturalHeight * region.y));
      const sourceWidth = Math.max(1, Math.round(image.naturalWidth * region.width));
      const sourceHeight = Math.max(1, Math.round(image.naturalHeight * region.height));
      canvas.width = sourceWidth;
      canvas.height = sourceHeight;
      const context = canvas.getContext("2d");
      context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);
      resolve(canvas.toDataURL("image/png"));
    });
    image.addEventListener("error", () => resolve(imageUri));
    image.src = imageUri;
  });
}
```

- [ ] **Step 9: Include select-region in render lifecycle**

Update active nav logic:

```js
(["upload", "select-region", "review"].includes(appState.screen) && action === "go-upload")
```

Update render:

```js
if (appState.screen === "select-region") renderRegionSelection();
```

Update side panel map:

```js
select-region: renderRegionSidePanel,
```

- [ ] **Step 10: Run static test**

```bash
node tests/static-mvp.test.mjs
```

Expected: PASS.

- [ ] **Step 11: Commit routing**

```bash
git add app/main.js app/state.js
git commit -m "Route uploads through question region selection"
```

## Task 5: Render And Edit The Region Box

**Files:**
- Modify: `app/main.js`
- Modify: `app/styles.css`

- [ ] **Step 1: Add region render function**

Add to `app/main.js`:

```js
function renderRegionSelection() {
  if (!appState.uploadedImageUri) {
    setScreen("upload");
    return;
  }

  els.regionCanvasImage.src = appState.uploadedImageUri;
  els.regionCanvas.style.setProperty("--region-zoom", appState.regionZoom);

  const selectedRegion = getSelectedRegion();
  els.regionOverlay.innerHTML = appState.regionCandidates
    .map((region) => renderRegionFrame(region, region.id === appState.selectedRegionId))
    .join("");

  els.regionCandidateList.innerHTML = appState.regionCandidates
    .map(
      (region) => `
        <button class="region-candidate ${region.id === appState.selectedRegionId ? "is-selected" : ""}" type="button" data-region-id="${region.id}">
          <strong>${escapeHtml(region.label)}</strong>
          <span>${region.source === "manual" ? "手动画框" : `AI 候选 · ${Math.round((region.confidence ?? 0) * 100)}%`}</span>
        </button>
      `,
    )
    .join("");

  els.selectedRegionSummary.innerHTML = selectedRegion
    ? `<strong>当前区域</strong><span>${escapeHtml(selectedRegion.label)} · 宽 ${Math.round(selectedRegion.width * 100)}% · 高 ${Math.round(selectedRegion.height * 100)}%</span>`
    : `<strong>未选择区域</strong><span>请选择 AI 候选框或手动画框。</span>`;

  els.regionOverlay.querySelectorAll("[data-region-id]").forEach((frame) => {
    frame.addEventListener("pointerdown", handleRegionPointerDown);
  });

  els.regionCandidateList.querySelectorAll("[data-region-id]").forEach((button) => {
    button.addEventListener("click", () => {
      appState.selectedRegionId = button.dataset.regionId;
      renderRegionSelection();
    });
  });
}

function renderRegionFrame(region, selected) {
  return `
    <button
      class="region-frame ${selected ? "is-selected" : ""}"
      type="button"
      data-region-id="${region.id}"
      style="left:${region.x * 100}%;top:${region.y * 100}%;width:${region.width * 100}%;height:${region.height * 100}%"
      aria-label="${escapeHtml(region.label)}"
    >
      <span>${escapeHtml(region.label)}</span>
      ${selected ? `<i data-handle="se"></i><i data-handle="ne"></i><i data-handle="sw"></i>` : ""}
    </button>
  `;
}
```

- [ ] **Step 2: Add pointer editing**

Add:

```js
function handleRegionPointerDown(event) {
  const frame = event.currentTarget;
  appState.selectedRegionId = frame.dataset.regionId;
  const region = getSelectedRegion();
  if (!region) return;

  const canvasRect = els.regionOverlay.getBoundingClientRect();
  appState.dragState = {
    regionId: region.id,
    handle: event.target.dataset.handle ?? "move",
    startX: event.clientX,
    startY: event.clientY,
    startRegion: { ...region },
    canvasWidth: canvasRect.width,
    canvasHeight: canvasRect.height,
  };

  frame.setPointerCapture(event.pointerId);
  window.addEventListener("pointermove", handleRegionPointerMove);
  window.addEventListener("pointerup", handleRegionPointerUp, { once: true });
}

function handleRegionPointerMove(event) {
  if (!appState.dragState) return;
  const region = appState.regionCandidates.find((item) => item.id === appState.dragState.regionId);
  if (!region) return;

  const dx = (event.clientX - appState.dragState.startX) / appState.dragState.canvasWidth;
  const dy = (event.clientY - appState.dragState.startY) / appState.dragState.canvasHeight;
  const start = appState.dragState.startRegion;

  if (appState.dragState.handle === "move") {
    region.x = clamp(start.x + dx, 0, 1 - start.width);
    region.y = clamp(start.y + dy, 0, 1 - start.height);
  } else {
    region.width = clamp(start.width + dx, 0.08, 1 - start.x);
    region.height = clamp(start.height + dy, 0.08, 1 - start.y);
  }

  renderRegionSelection();
}

function handleRegionPointerUp() {
  appState.dragState = null;
  window.removeEventListener("pointermove", handleRegionPointerMove);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
```

- [ ] **Step 3: Add CSS for region UI**

Add to `app/styles.css`:

```css
.region-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 16px;
}

.region-canvas-card,
.region-tools {
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: 12px;
  padding: 16px;
}

.region-canvas-card > header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.canvas-tools {
  display: flex;
  gap: 8px;
}

.region-canvas {
  position: relative;
  overflow: auto;
  min-height: 520px;
  border: 1px solid var(--hairline);
  border-radius: 12px;
  background: #fffdf7;
}

.region-canvas img {
  display: block;
  width: calc(100% * var(--region-zoom, 1));
  max-width: none;
  transform-origin: top left;
}

.region-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.region-frame {
  position: absolute;
  border: 2px dashed #b8c8e6;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.18);
  color: var(--slate);
  pointer-events: auto;
  cursor: move;
}

.region-frame.is-selected {
  border: 3px solid var(--primary);
  background: rgba(232, 240, 255, 0.46);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

.region-frame span {
  position: absolute;
  top: -14px;
  left: 10px;
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--primary);
  color: white;
  font-size: 12px;
  font-weight: 700;
}

.region-frame i {
  position: absolute;
  width: 14px;
  height: 14px;
  border: 2px solid white;
  border-radius: 4px;
  background: var(--primary);
}

.region-frame i[data-handle="se"] { right: -7px; bottom: -7px; cursor: nwse-resize; }
.region-frame i[data-handle="ne"] { right: -7px; top: -7px; cursor: nesw-resize; }
.region-frame i[data-handle="sw"] { left: -7px; bottom: -7px; cursor: nesw-resize; }

.region-tools {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.region-candidate-list {
  display: grid;
  gap: 8px;
}

.region-candidate {
  text-align: left;
  border: 1px solid var(--hairline);
  border-radius: 10px;
  background: var(--surface);
  padding: 10px;
}

.region-candidate.is-selected {
  border-color: var(--primary);
  background: var(--primary-soft);
}

.region-candidate span,
.region-summary span {
  display: block;
  margin-top: 4px;
  color: var(--slate);
  font-size: 13px;
}

.region-summary {
  border: 1px solid var(--hairline);
  border-radius: 10px;
  background: var(--surface-blue);
  padding: 10px;
}

@media (max-width: 980px) {
  .region-layout {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Run static test**

```bash
node tests/static-mvp.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit region editing UI**

```bash
git add app/main.js app/styles.css
git commit -m "Make question regions selectable"
```

## Task 6: Connect Review, Save, And Detail Views

**Files:**
- Modify: `app/main.js`
- Modify: `app/index.html`
- Modify: `app/styles.css`
- Test: `tests/static-mvp.test.mjs`

- [ ] **Step 1: Render selected region in review**

Update `renderReview`:

```js
els.reviewOriginalImage.src = appState.draft.originalImageUri;
els.reviewRegionImage.src = appState.draft.selectedRegionImageUri;
els.reviewCleanImage.src = appState.draft.cleanedQuestionImageUri;
```

- [ ] **Step 2: Expand detail image modes**

Replace `toggleDetailImage`:

```js
function toggleDetailImage() {
  const modes = ["clean", "region", "original"];
  const currentIndex = modes.indexOf(appState.detailMode);
  appState.detailMode = modes[(currentIndex + 1) % modes.length];
  renderDetail();
}
```

Update `renderDetail` image selection:

```js
const modeConfig = {
  clean: {
    src: record.cleanedQuestionImageUri,
    title: "题目（干净题面）",
    chip: "干净题面",
    chipClass: "clean",
  },
  region: {
    src: record.selectedRegionImageUri ?? record.originalImageUri,
    title: "题目（确认区域）",
    chip: "题目区域",
    chipClass: "ai",
  },
  original: {
    src: record.originalImageUri,
    title: "题目（整张原图）",
    chip: "整张原图",
    chipClass: "review",
  },
};
const currentMode = modeConfig[appState.detailMode] ?? modeConfig.clean;
els.detailImage.src = currentMode.src;
els.detailRecordTitle.textContent = currentMode.title;
els.detailModeChip.textContent = currentMode.chip;
els.detailModeChip.className = `status-chip ${currentMode.chipClass}`;
```

- [ ] **Step 3: Update detail button text**

In `app/index.html`, change the detail toggle button to:

```html
<button class="button-secondary" type="button" data-action="toggle-detail-image">切换题面 / 区域 / 原图</button>
```

- [ ] **Step 4: Add record row status**

In `renderRecordList`, change the small text:

```js
<small>${SUBJECTS[record.subject] ?? record.subject} · ${formatTime(record.createdAt)} · 已确认题目区域</small>
```

- [ ] **Step 5: Run static test**

```bash
node tests/static-mvp.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit review/detail wiring**

```bash
git add app/index.html app/main.js app/styles.css
git commit -m "Show selected regions through saved records"
```

## Task 7: Browser Verification

**Files:**
- No source edits expected unless verification finds a defect.

- [ ] **Step 1: Start local server**

```bash
python3 -m http.server 4173
```

Expected: server listens at `http://127.0.0.1:4173/`.

- [ ] **Step 2: Open MVP**

Open:

```text
http://127.0.0.1:4173/app/index.html
```

Expected: App Hub loads and the rail shows `应用集合`, `错题收集`, and `错题本`.

- [ ] **Step 3: Verify upload to region flow**

Actions:

1. Click `错题收集`.
2. Upload a small image.
3. Click `下一步：选择题目区域`.

Expected:

- URL remains local.
- `选择题目区域` screen appears.
- The full uploaded image is visible.
- At least three mock candidate boxes appear.
- Right panel includes `确认此区域并识别`, `手动画框`, and `重新自动找题`.

- [ ] **Step 4: Verify manual region fallback**

Actions:

1. Click `手动画框`.
2. Drag the selected blue frame.
3. Resize from the lower-right handle.
4. Click `确认此区域并识别`.

Expected:

- Current region summary changes to `手动画框`.
- Blue frame moves or changes size.
- Review screen appears.
- Review screen shows `确认区域`, `原图`, and `干净题面`.

- [ ] **Step 5: Verify save and detail modes**

Actions:

1. Click `复核后保存`.
2. Click `切换题面 / 区域 / 原图` three times.
3. Click `返回错题本`.

Expected:

- Detail opens after save.
- The detail image cycles through `干净题面`, `题目区域`, and `整张原图`.
- `错题本` lists the saved record with `已确认题目区域`.

- [ ] **Step 6: Run final static test**

```bash
node tests/static-mvp.test.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit fixes if verification changed files**

```bash
git add app/index.html app/main.js app/state.js app/styles.css tests/static-mvp.test.mjs
git commit -m "Fix question region verification issues"
```

Skip this commit when there are no verification fixes.

## Task 8: Update Durable Project Records

**Files:**
- Modify: `docs/planning/evocraft-roadmap-progress.md`
- Modify: `docs/planning/evocraft-project-memory.md`

- [ ] **Step 1: Update progress**

Append a dated progress entry with these fields:

```markdown
### 2026-05-13：选题区域静态 MVP 实现

本轮任务是什么：

- 实现上传后的独立 `选择题目区域` 步骤，让多题照片可以先确认一道题再识别。

已完成什么：

- 新增 `select-region` 屏幕。
- 实现 mock 候选框、手动画框、拖动/缩放调整、确认后识别。
- 保存记录同时保留整张原图和确认后的题目区域。
- 详情页支持干净题面、题目区域和整张原图切换。

卡在哪里：

- 无。

执行的是什么命令：

- `node tests/static-mvp.test.mjs`
- `python3 -m http.server 4173`
- 浏览器手动验证上传、选题区域、复核、保存、错题本和详情切换。

下一步的计划：

- 补隐私授权、删除机制和模型调用失败状态。
- 后续再接阿里云百炼 Qwen 体系作为第一条国内 AI/OCR 链路。
```

- [ ] **Step 2: Update project memory**

In `docs/planning/evocraft-project-memory.md`, update current goal to mention that the local static MVP includes the selection-region step after implementation:

```markdown
当前目标：验证上传、选择题目区域、识别复核、保存、错题本列表和详情查看闭环，并继续保持真实 AI/OCR 接入前的本地 mock 策略。
```

- [ ] **Step 3: Run final repository checks**

```bash
node tests/static-mvp.test.mjs
git diff --check
git status --short --branch
```

Expected:

- Static test passes.
- Diff check has no output.
- Only intended source and docs files are modified; existing unrelated `docs/design/figma/*` deletions remain unstaged unless the user separately asks to handle them.

- [ ] **Step 4: Commit durable records**

```bash
git add docs/planning/evocraft-roadmap-progress.md docs/planning/evocraft-project-memory.md
git commit -m "Record question region MVP implementation"
```

## Execution Order

1. Task 1 locks expected behavior.
2. Task 2 adds data helpers.
3. Task 3 adds screen markup.
4. Task 4 wires routing and recognition.
5. Task 5 makes region selection interactive.
6. Task 6 carries selected region through review, save, and detail.
7. Task 7 verifies in browser.
8. Task 8 updates durable project records.

## Self-Review

- Spec coverage: covered independent selection step, AI candidates, manual drawing, drag/resize, zoom controls, confirmed-region recognition, full-original retention, selected-region retention, clean/detail views, model abstraction direction, and mock-first implementation.
- Placeholder scan: no open placeholders or unspecified implementation steps remain.
- Type consistency: uses `selectedRegion`, `selectedRegionImageUri`, `modelTraces`, `createMockRegionCandidates`, and `createManualRegion` consistently across test, state, UI, and save flow.
