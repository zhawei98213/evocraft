# Flow Control Tower UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the selected Product Design direction: use direction A as the overall desktop AI flow skeleton, absorb direction B's review split layout, and absorb direction C's row-based record library.

**Architecture:** Keep the existing React/Vite/Electron boundaries and reducer state. Add presentation helpers in `src/app/App.tsx` for workflow stages, AI status, review comparison, and record rows; use CSS-only layout changes in `src/app/styles.css`. Keep domain and IPC contracts stable unless tests expose a small missing UI action such as opening a record row.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, existing CSS tokens, existing image assets.

**Status:** Completed and verified on 2026-06-07. Direction A is selected as the shell, direction B is absorbed into review, and direction C is absorbed into records.

---

## File Structure

- Modify `src/app/App.test.tsx`: add behavior tests for the selected UI direction before production edits.
- Modify `src/app/App.tsx`: add flow stage tracker, richer AI status rail, selected review split, and row-based record list callbacks.
- Modify `src/app/styles.css`: implement the direction A desktop shell, direction B review split, and direction C record table/list treatment.
- Modify `docs/design/2026-06-07-product-design-directions.md`: mark direction A as selected and record the absorbed patterns.
- Modify `docs/superpowers/specs/2026-06-06-desktop-ai-flow-ux-redesign-design.md`: synchronize selected direction.
- Modify `docs/superpowers/plans/2026-06-06-desktop-ai-flow-ux-redesign.md`: mark direction selection complete.
- Modify `docs/planning/evocraft-project-memory.md`, `docs/planning/evocraft-roadmap-progress.md`, and `docs/ideas/2026-05-10-evocraft-seed-capsule.md`: record durable product/design state.

## Task 1: Lock The Selected UI Direction In Tests

**Files:**
- Modify: `src/app/App.test.tsx`

- [x] **Step 1: Add failing test for the flow-control skeleton**

Add a test that uploads a browser image, enters region selection, and expects:

```tsx
expect(screen.getByRole("navigation", { name: "错题收集流程" })).toBeInTheDocument();
expect(screen.getByText("授权与找题")).toBeInTheDocument();
expect(screen.getByText("3 / 5 选择区域")).toBeInTheDocument();
expect(screen.getByText("AI 处理状态")).toBeInTheDocument();
expect(screen.getByText("诊断信息（已脱敏）")).toBeInTheDocument();
```

- [x] **Step 2: Run focused test and verify RED**

Run:

```bash
PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" npm run test:react -- src/app/App.test.tsx
```

Expected: fails because the stage navigation and redacted diagnostics are not rendered.

- [x] **Step 3: Add failing test for review split layout**

Add a test that reaches review and expects:

```tsx
expect(screen.getByText("原始证据")).toBeInTheDocument();
expect(screen.getByText("清晰复核面")).toBeInTheDocument();
expect(screen.getByText("题目信息")).toBeInTheDocument();
expect(screen.getByText("AI 建议：数学")).toBeInTheDocument();
```

- [x] **Step 4: Add failing test for row-based record library**

Preload two records, open `错题本`, and expect:

```tsx
expect(screen.getByRole("table", { name: "错题资料库" })).toBeInTheDocument();
expect(screen.getByText("待复核")).toBeInTheDocument();
expect(screen.getByText("本周新增")).toBeInTheDocument();
expect(screen.getAllByText("已确认区域").length).toBeGreaterThan(0);
```

Also click a record's `打开` button and expect detail view to show that record title.

## Task 2: Implement Direction A Shell And AI Status Rail

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/app/styles.css`

- [x] **Step 1: Add flow stage helper**

Create a `FlowStageTracker` component that maps current `screen` to five stages:

```tsx
const flowStages = [
  { label: "上传照片", screens: ["upload"] },
  { label: "授权与找题", screens: ["upload"] },
  { label: "选择区域", screens: ["select-region"] },
  { label: "识别复核", screens: ["review"] },
  { label: "保存", screens: ["detail", "records"] },
] as const;
```

Render it in upload, select-region, review, records, and detail headers with `aria-label="错题收集流程"`.

- [x] **Step 2: Replace generic side panel with AI status rail**

Make `SidePanel` render:

- Runtime mode: real/mock/configured.
- Authorization state.
- Processing/current stage summary.
- Redacted diagnostic rows.
- Recoverable error hint when on upload/region/review with a visible error.

No secrets, raw provider JSON, or full image data may be displayed.

- [x] **Step 3: Run focused tests and verify GREEN for shell behavior**

Run:

```bash
PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" npm run test:react -- src/app/App.test.tsx
```

Expected: flow-control skeleton tests pass.

## Task 3: Implement Direction B Review Split

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/app/styles.css`

- [x] **Step 1: Rebuild `ReviewScreen` layout**

Use three zones:

- `review-evidence-panel`: original/selected evidence with tabs or stacked original evidence.
- `review-clean-panel`: clean question preview and copy actions.
- `review-inspector`: subject confirmation and editable fields.

Keep all existing inputs functional and accessible. Save remains disabled when subject is empty.

- [x] **Step 2: Show AI subject suggestion**

When draft subject is legal, show `AI 建议：{SUBJECTS[draft.subject]}` next to the subject selector. When unknown, show `AI 未能确认科目`.

- [x] **Step 3: Run focused tests and verify GREEN for review behavior**

Run:

```bash
PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" npm run test:react -- src/app/App.test.tsx
```

Expected: review split tests and existing save tests pass.

## Task 4: Implement Direction C Record Library Rows

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/app/styles.css`

- [x] **Step 1: Add record row callbacks**

Change `RecordList` to accept:

```ts
onOpenRecord?: (recordId: string) => void;
showActions?: boolean;
```

Wire `records` screen and compact lists so `打开` selects the record and navigates to detail.

- [x] **Step 2: Render row-based table/list**

For non-compact records, render a table-like grouped surface with columns:

- 题目预览
- 标题
- 科目
- 保存时间
- 状态
- 操作

Include status chips: `已确认区域`, `科目已确认`, and model/provider label derived from the first model trace.

- [x] **Step 3: Upgrade records overview**

Show `已保存`, `待复核`, `本周新增`, `默认复习材料：干净题面`. Keep `继续收集` prominent.

- [x] **Step 4: Run focused tests and verify GREEN for records behavior**

Run:

```bash
PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" npm run test:react -- src/app/App.test.tsx
```

Expected: row library tests and existing load/save tests pass.

## Task 5: Documentation And Verification

**Files:**
- Modify: project docs listed in File Structure.

- [x] **Step 1: Update selected-direction docs**

Record that direction A is selected as the shell, direction B is used for review, and direction C is used for records.

- [x] **Step 2: Run automated verification**

Run:

```bash
git diff --check
PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" npm test
PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" npm run build
```

Expected: all commands exit 0.

- [x] **Step 3: Run browser visual verification**

Start dev server:

```bash
PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" npm run dev
```

Open `http://127.0.0.1:5173/`, exercise upload -> region -> review -> records, and capture screenshots. Verify no blank screens, no obvious overlaps, no clipped primary text, and the selected direction is visible.

- [x] **Step 4: Commit and push**

Use Lore commit protocol and push `codex/qwen-sample-evaluation`.

Verification evidence:

- `git diff --check`: passed.
- `PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" npm run test:react -- src/app/App.test.tsx`: 1 test file / 26 tests passed.
- `PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" npm test`: 5 test files / 53 tests passed.
- `PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" npm run build`: passed.
- `PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" node docs/design/desktop-trunk/capture-react-ui.mjs`: regenerated six screenshots under `docs/design/desktop-trunk/screens/`.
- Browser check at `http://127.0.0.1:5174/`: desktop 1280x720 and mobile 390x844 upload screens both showed the stage tracker and AI rail, with horizontal overflow count/offset 0.
