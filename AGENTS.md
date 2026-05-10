# EvoCraft Agent Instructions

These instructions apply to the entire repository.

## Iron Rule: Idea Capsule First-Class Memory / 想法胶囊铁律

Whenever a new PRD is created, an existing PRD is materially updated, or the user states a clear product idea, update the idea capsule in the same change set.

无论是生成新的 PRD、重要更新已有 PRD，还是用户提出明确产品想法，都必须在同一次变更中更新想法胶囊。

Canonical idea capsule:

- `docs/ideas/2026-05-10-evocraft-seed-capsule.md`

Required behavior:

- Record the update under a timeline section with the concrete date.
- Extract the product idea, principle, or viewpoint; do not copy PRD sections verbatim.
- Keep entries concise and decision-oriented.
- If a PRD changes scope, architecture, user value, AI behavior, privacy posture, data shape, or UI direction, add a capsule entry summarizing the underlying idea.
- Do not finish or commit a PRD-related change unless the idea capsule has been checked and updated when needed.

The PRD is the structured requirement artifact. The idea capsule is the chronological product memory and intent ledger.

PRD 负责结构化需求；想法胶囊负责按时间线记录提炼后的产品观点和意图演化。

## Long-Term Memory And Progress / 长期记忆与进度机制

Before any meaningful product, design, documentation, or implementation work, read the project memory and progress files:

- `docs/planning/evocraft-project-memory.md`
- `docs/planning/evocraft-roadmap-progress.md`
- `docs/ideas/2026-05-10-evocraft-seed-capsule.md`

When a task changes product direction, project process, PRDs, design docs, implementation plans, code behavior, or verification status, update the long-term memory/progress docs in the same change set.

Progress records must be written in `docs/planning/evocraft-roadmap-progress.md` and must include these fields:

- 本轮任务是什么
- 已完成什么
- 卡在哪里
- 执行的是什么命令
- 下一步的计划

Progress records should be chronological. Keep them factual and operational: what changed, what was checked, what remains blocked, and what the next agent should do. If there is no blocker, explicitly write `无`.

Do not rely on chat history as the only memory. Durable project state belongs in repository files.

## Git Persistence

After repository files are updated, commit the intended changes and push them to:

- `git@github.com:zhawei98213/evocraft.git`

Keep runtime state such as `.omx/` out of git unless the user explicitly asks otherwise.
