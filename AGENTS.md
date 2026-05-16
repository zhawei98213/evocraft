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
- If the user explicitly says a feature is missing, asks to add/补 a feature, or points out a product gap, update the relevant PRD in the same change set and update the idea capsule with the underlying product decision.
- If implementation happens before the PRD update, do not finish, commit, or push until the PRD and idea capsule have been synchronized.
- Do not finish or commit a PRD-related change unless the idea capsule has been checked and updated when needed.

The PRD is the structured requirement artifact. The idea capsule is the chronological product memory and intent ledger.

PRD 负责结构化需求；想法胶囊负责按时间线记录提炼后的产品观点和意图演化。

## PRD Writing Standards / PRD 编写规范

All future PRDs, materially updated PRDs, and PRD changes caused by product-gap feedback must follow:

- `docs/prd/2026-05-16-prd-writing-standards.md`

Required behavior:

- Before creating or materially updating a PRD, read the PRD writing standards and structure the PRD against them.
- If an existing PRD contains a useful section, product principle, verification rule, AI/privacy/data boundary, or handoff pattern that the standards have not extracted yet, update the PRD writing standards in the same change set.
- Do not flatten or delete existing PRD substance just because the standards do not mention it yet; first decide whether it should be preserved and generalized into the standards.
- Keep PRD, PRD writing standards, idea capsule, project memory, roadmap progress, and document index synchronized when the change affects product direction, scope, AI behavior, privacy posture, data shape, UI direction, or process rules.
- Do not finish, commit, or push a PRD-related change until the PRD standards compliance check has been done and any needed standards update is included.

后续所有新的 PRD、重要更新的 PRD，以及因产品缺口反馈触发的 PRD 更新，都必须遵循 `docs/prd/2026-05-16-prd-writing-standards.md`。如果既有 PRD 中有规范尚未提炼但应复用的结构或原则，必须在同一次变更中更新规范，不能因为规范暂未覆盖就删掉或弱化原 PRD 的有效内容。

## Feature Gap Feedback Protocol / 缺失功能反馈协议

When the user explicitly says a feature is missing, asks to add or 补 a feature, asks where an expected feature is, or otherwise points out a product gap:

1. Treat it as a product requirement change, not only an implementation request.
2. Update the relevant PRD in the same change set, including affected scope, flow, page/information architecture, functional requirements, and acceptance criteria.
3. Update the idea capsule with the underlying product decision or principle.
4. Update project memory/progress if the change affects process, implementation status, verification status, or future work.
5. Do not finish, commit, or push the implementation until code, PRD, idea capsule, and progress records are synchronized.

当用户明确指出“缺少功能”“补功能”“这个功能在哪里”等产品缺口时，必须把它当成需求边界变化处理，而不是只改代码。

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
