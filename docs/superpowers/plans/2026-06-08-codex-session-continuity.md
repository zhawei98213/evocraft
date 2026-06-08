# Codex Session Continuity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make EvoCraft resilient to Codex context compaction failures by adding a project-local session handoff protocol and generator command.

**Architecture:** Stable rules live in tracked `docs/`; volatile current-window state is generated into ignored `.omx/context/current-session-handoff.md`. The script reads git state and the latest roadmap progress, redacts sensitive values, and emits a short Markdown handoff for a new Codex window.

**Tech Stack:** Node.js standard library, npm scripts, Markdown project documentation.

---

## File Structure

- Create: `docs/planning/2026-06-08-codex-session-continuity.md`
- Create: `docs/superpowers/specs/2026-06-08-codex-session-continuity-design.md`
- Create: `docs/superpowers/plans/2026-06-08-codex-session-continuity.md`
- Create: `scripts/create-session-handoff.mjs`
- Modify: `package.json`
- Modify: `docs/README.md`
- Modify: `docs/planning/evocraft-project-memory.md`
- Modify: `docs/planning/evocraft-roadmap-progress.md`
- Modify: `docs/ideas/2026-05-10-evocraft-seed-capsule.md`

### Task 1: Document The Continuity Protocol

- [x] **Step 1: Create the planning protocol**

Write `docs/planning/2026-06-08-codex-session-continuity.md` with the purpose, default workflow, new-window read order, handoff content boundaries, privacy exclusions, and maintenance responsibility.

- [x] **Step 2: Create the design spec**

Write `docs/superpowers/specs/2026-06-08-codex-session-continuity-design.md` with background, scope, non-goals, architecture, data flow, failure handling, privacy, tests, and rejected alternatives.

### Task 2: Add The Handoff Generator

- [x] **Step 1: Create `scripts/create-session-handoff.mjs`**

Implement a Node script that:

- Runs git commands from the repo root.
- Extracts the latest roadmap progress section.
- Redacts image data URLs, Authorization values, and common key/token/secret patterns.
- Writes `.omx/context/current-session-handoff.md` by default.
- Supports `--stdout` and `--out <path>`.

- [x] **Step 2: Add the npm command**

Add this package script:

```json
"codex:handoff": "node scripts/create-session-handoff.mjs"
```

### Task 3: Synchronize Project Memory

- [x] **Step 1: Update the document index**

Add links to the new continuity protocol, design spec, and implementation plan in `docs/README.md`.

- [x] **Step 2: Update long-term memory**

Update `docs/planning/evocraft-project-memory.md` with the session continuity decision.

- [x] **Step 3: Update the idea capsule**

Add a 2026-06-08 entry that records the principle: project context must survive remote compact failures through repository-backed handoff.

- [x] **Step 4: Update roadmap progress**

Add the current task entry with files changed, blockers, commands, and next steps.

### Task 4: Verify

- [x] **Step 1: Generate default handoff**

Run:

```bash
npm run codex:handoff
```

Expected: `.omx/context/current-session-handoff.md` is created or updated.

- [x] **Step 2: Verify stdout mode**

Run:

```bash
node scripts/create-session-handoff.mjs --stdout
```

Expected: Markdown handoff is printed to stdout.

- [x] **Step 3: Check whitespace**

Run:

```bash
git diff --check
```

Expected: no output.

- [x] **Step 4: Run project verification**

Run:

```bash
npm test
npm run build
```

Expected: existing tests and build pass, or any failure is documented with the exact unrelated blocker.

## Verification Results

- `npm run codex:handoff` passed and wrote `.omx/context/current-session-handoff.md`.
- `node scripts/create-session-handoff.mjs --stdout` passed and printed the Markdown handoff.
- `node --check scripts/create-session-handoff.mjs` passed.
- `git diff --check` passed.
- `npm run build` passed.
- `npm test` did not pass because this worktree already had unrelated RED tests before this task: `src/app/App.test.tsx` expects removal of `使用指南` and a new `选项` review field from the separate 2026-06-07 complete-recognition debug-logs work. Those tests are outside this session-continuity scope and the corresponding implementation files were not modified in this task.
