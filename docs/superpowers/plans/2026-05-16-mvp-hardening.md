# MVP Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the wrong-question capture MVP safe to trial by adding privacy confirmation, local deletion, clear-all, and recoverable failure states.

**Architecture:** Keep the static Web MVP. Add pure data helpers to `app/state.js`, bind UI state in `app/main.js`, and expose the new controls through existing screens. Keep technical route decisions in docs so the next implementation phase can move quickly into AI adapter design.

**Tech Stack:** Static HTML/CSS/ES modules, browser `localStorage`, Node built-in test assertions.

---

### Task 1: Lock Hardening Requirements With Tests

**Files:**
- Modify: `tests/static-mvp.test.mjs`

- [x] **Step 1: Add structure assertions**

Add markers for `privacy-consent`, `region-error`, `save-error`, `delete-record`, and `clear-records`.

- [x] **Step 2: Add state helper tests**

Test `deleteRecord`, `persistRecords`, and `clearStoredRecords` with in-memory storage and failing storage.

- [x] **Step 3: Verify red**

Run: `npm test`

Expected: failure before implementation because `privacy-consent` and new helpers do not exist.

### Task 2: Implement Local State Helpers

**Files:**
- Modify: `app/state.js`

- [x] **Step 1: Add `deleteRecord`**

Return next records and the next selected record id after deleting selected, unselected, only, or missing records.

- [x] **Step 2: Harden local persistence**

Make `persistRecords` return `{ ok: true }` or `{ ok: false, reason }`, and add `clearStoredRecords`.

- [x] **Step 3: Verify green**

Run: `npm test`

Expected: all assertions pass.

### Task 3: Add MVP Hardening UI

**Files:**
- Modify: `app/index.html`
- Modify: `app/main.js`
- Modify: `app/styles.css`

- [x] **Step 1: Add privacy gate**

Add a checkbox on the upload screen and disable `下一步：选择题目区域` until a valid image and local privacy confirmation are both present.

- [x] **Step 2: Add recoverable errors**

Show region errors in the region screen and save errors in the review screen. Keep users on the same screen when recovery is possible.

- [x] **Step 3: Add deletion controls**

Add per-record delete controls, detail delete control, and clear-all control for the local notebook.

- [x] **Step 4: Verify syntax and tests**

Run: `node --check app/main.js`, `node --check app/state.js`, and `npm test`.

### Task 4: Sync Product And Technical Docs

**Files:**
- Modify: `docs/prd/2026-05-10-wrong-question-capture-mvp-prd.md`
- Modify: `docs/README.md`
- Modify: `docs/ideas/2026-05-10-evocraft-seed-capsule.md`
- Modify: `docs/planning/evocraft-project-memory.md`
- Modify: `docs/planning/evocraft-roadmap-progress.md`
- Create: `docs/planning/2026-05-16-mvp-technical-route-decision.md`
- Create: `docs/superpowers/specs/2026-05-16-mvp-hardening-tech-route-design.md`

- [x] **Step 1: Update PRD to v1.4**

Add privacy confirmation, local deletion, clear local data, failure recovery, and technical route decision.

- [x] **Step 2: Capture technical route**

Record that the MVP remains static Web now, React/Vite is the next migration target, and Electron/Tauri/backend are deferred.

- [x] **Step 3: Update durable memory and progress**

Record the implementation, verification commands, open risks, and next plan.

### Task 5: Final Verification

**Files:**
- All changed files

- [x] **Step 1: Run automated checks**

Run: `npm test`, `node --check app/main.js`, `node --check app/state.js`, and `git diff --check`.

- [x] **Step 2: Run browser smoke test**

Exercise privacy gate, upload, region confirm, save, detail delete, notebook clear, and empty-state recovery.

- [x] **Step 3: Commit and push**

Commit with Lore trailers and push `codex/question-region-mvp`.
