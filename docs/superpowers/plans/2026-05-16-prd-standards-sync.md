# PRD Standards Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the wrong-question capture PRD with the PRD writing standards, and update the standards with useful structures found in the existing PRD.

**Architecture:** Treat `docs/prd/2026-05-16-prd-writing-standards.md` as the canonical PRD format. Update the MVP PRD to that format, then synchronize repository process rules in `AGENTS.md`, project memory, progress, idea capsule, and document index.

**Tech Stack:** Markdown documentation, `rg` checks, `git diff --check`.

---

### Task 1: Bring The Standards Into The Current Branch

**Files:**
- Create: `docs/prd/2026-05-16-prd-writing-standards.md`

- [x] **Step 1: Read the standards from main**

Run: `git show origin/main:docs/prd/2026-05-16-prd-writing-standards.md`

Expected: the PRD writing standards are available for comparison.

- [x] **Step 2: Add the standards file to this branch**

Run: `git checkout origin/main -- docs/prd/2026-05-16-prd-writing-standards.md`

Expected: `git status` shows the standards file as added.

### Task 2: Rewrite The MVP PRD To The Standards

**Files:**
- Modify: `docs/prd/2026-05-10-wrong-question-capture-mvp-prd.md`

- [x] **Step 1: Compare section coverage**

Check current PRD headings against the standards headings with `rg -n "^#|^##|^###"`.

- [x] **Step 2: Update PRD to v1.5**

Add meta fields, related documents, change summary, target scenarios, default decisions, functional and non-functional requirements, risk/open questions, and handoff summary.

### Task 3: Reverse-Extract Missing Standards

**Files:**
- Modify: `docs/prd/2026-05-16-prd-writing-standards.md`

- [x] **Step 1: Extract reusable PRD patterns**

Generalize existing PRD patterns into the standards: application-collection positioning, technical route decisions, supplier/model strategy, UI generation summary, local deletion, and product feedback synchronization.

- [x] **Step 2: Update standards to v1.1**

Add standards metadata, reverse-extraction rules, checklist entries, and template fields.

### Task 4: Make Standards Mandatory For Future PRDs

**Files:**
- Modify: `AGENTS.md`
- Modify: `docs/README.md`
- Modify: `docs/planning/evocraft-project-memory.md`
- Modify: `docs/planning/evocraft-roadmap-progress.md`
- Modify: `docs/ideas/2026-05-10-evocraft-seed-capsule.md`

- [x] **Step 1: Update repository instructions**

Write the rule that future PRDs must follow the PRD writing standards and update the standards when existing PRDs reveal missing reusable structures.

- [x] **Step 2: Update durable project docs**

Record the standards rule in README, project memory, progress, and idea capsule.

### Task 5: Verify And Commit

**Files:**
- All changed docs

- [x] **Step 1: Run content checks**

Run placeholder scans and whitespace checks.

- [x] **Step 2: Commit and push**

Commit with Lore trailers and push the current branch.
