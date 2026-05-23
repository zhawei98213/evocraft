# EvoCraft Design Documentation System

日期：2026-05-23

文档状态：已确认流程规则

适用范围：所有重要产品、设计、架构、AI、隐私、数据、实现计划和 subagent-driven 执行。

## 1. 目标

EvoCraft 的实现不能依赖聊天上下文、单个 agent 的临时判断或未落库的口头计划。每次进入重要实现前，必须先有能被后续 agent、测试、review 和产品决策复用的设计文档。

这个文档定义：

- 需要哪些设计文档。
- 每类文档放在哪里。
- 文档之间如何连接。
- 什么时候必须先补文档。
- subagent-driven 执行前如何准备 agent 记录。

## 2. 文档分层

EvoCraft 文档分为五层。

| 层级 | 作用 | 典型位置 | 是否执行前必须存在 |
| --- | --- | --- | --- |
| 产品意图层 | 记录为什么做、用户价值和产品边界 | `docs/ideas/`, `docs/prd/`, `docs/planning/evocraft-project-memory.md` | 是，涉及产品边界时 |
| 详细设计层 | 记录怎么设计能力、架构、数据、AI、隐私、UI 状态和测试策略 | `docs/superpowers/specs/`, `docs/planning/` | 是，涉及重要实现时 |
| 实施计划层 | 把设计拆成可执行、可验证、可提交的任务 | `docs/superpowers/plans/` | 是，进入实现前 |
| Agent 执行层 | 记录每个 subagent 的任务计划、进度、命令、变更和 review | `docs/superpowers/agent-runs/` | 是，进入 subagent-driven 前 |
| 验证归档层 | 保存截图、评测结果、QA 记录和 release 检查 | `docs/design/`, `docs/testing/`, `ai-eval/results/` 本地忽略目录 | 视任务需要 |

## 3. 详细设计文档必须覆盖的内容

重要实现前的详细设计文档必须回答这些问题：

- 背景：为什么现在要做。
- 范围：本轮做什么。
- 非目标：本轮明确不做什么。
- 用户和场景：谁使用，在哪里使用，成功体验是什么。
- 架构：模块边界、运行位置、进程边界和依赖方向。
- 数据流：输入、处理、输出、持久化和删除路径。
- 合同：关键接口、adapter、IPC、schema、错误返回。
- UI 状态：可见状态、加载、失败、恢复、授权、空状态。
- 隐私与安全：敏感数据、API key、外部服务、授权、日志和删除。
- 失败处理：每个失败点如何恢复，用户看到什么。
- 测试策略：单元、契约、集成、端到端、手动验收、评测集。
- 迁移与回滚：从当前状态如何迁移，失败如何回退。
- 决策记录：已选方案、拒绝方案和原因。
- 开放问题：实现前必须回答的问题和可以实现中解决的问题。

没有这些内容时，不应进入实现计划或 subagent-driven 执行。

## 4. 文档组织规则

设计文档按能力而不是按聊天轮次组织。

推荐位置：

- 产品需求：`docs/prd/YYYY-MM-DD-<capability>-prd.md`
- 技术/能力设计：`docs/superpowers/specs/YYYY-MM-DD-<capability>-design.md`
- 跨项目流程规则：`docs/planning/YYYY-MM-DD-<topic>.md`
- 实施计划：`docs/superpowers/plans/YYYY-MM-DD-<capability>.md`
- Agent 执行记录：`docs/superpowers/agent-runs/YYYY-MM-DD-<capability>/`
- UI 视觉基线：`docs/design/<scope>/`
- AI 评测规则：`ai-eval/README.md`、`ai-eval/samples/manifest.example.json`

每个新文档都必须从 `docs/README.md` 能找到。影响长期方向时，还要同步：

- `docs/planning/evocraft-project-memory.md`
- `docs/planning/evocraft-roadmap-progress.md`
- `docs/ideas/2026-05-10-evocraft-seed-capsule.md`

## 5. 当前真实 AI 接入的文档结构

真实 AI 识别接入当前使用这组文档：

- 产品边界：`docs/prd/2026-05-10-wrong-question-capture-mvp-prd.md`
- 详细设计：`docs/superpowers/specs/2026-05-23-real-ai-recognition-design.md`
- 实施计划：`docs/superpowers/plans/2026-05-23-real-ai-recognition.md`
- Agent run ledger：`docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/README.md`
- Agent 记录模板：`docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/agent-log-template.md`
- 评测说明：后续实现计划会创建 `ai-eval/README.md`

进入 subagent-driven 前，上述前五项必须存在并通过自检。

## 6. 进入实现前的文档 Gate

实现前必须检查：

1. PRD 或需求边界是否存在并链接到设计。
2. 详细设计是否覆盖范围、非目标、架构、数据、隐私、失败、测试和迁移。
3. 实施计划是否拆成可独立执行和验证的任务。
4. Agent run ledger 是否存在。
5. 每个即将派发的 subagent 是否有对应 task log 或明确的创建规则。
6. 文档索引、项目记忆、路线图进度是否同步。
7. 是否需要更新想法胶囊。
8. `rg` 扫描没有未解决占位词、模板残留或互相矛盾的旧路线。
9. `git diff --check` 通过。

未通过这些检查时，不启动实现。

## 7. Subagent-Driven 执行文档要求

每次 subagent-driven 执行必须有一个 run ledger：

```text
docs/superpowers/agent-runs/<YYYY-MM-DD-feature>/
  README.md
  agent-log-template.md
  agents/
    task-01-<slug>.md
    task-02-<slug>.md
```

`README.md` 记录整体状态：

- 父级 spec 和 plan。
- 当前执行模式。
- 任务列表。
- 每个 task 的 agent、状态、提交、测试和 review 结论。
- 全局阻塞。
- 最终验证。

每个 `agents/task-*.md` 记录单个 agent：

- 任务编号和标题。
- 父级计划链接。
- 分配给 agent 的范围。
- 允许修改的文件。
- 禁止修改的范围。
- agent 的工作计划。
- 过程进度。
- 执行命令。
- 改动文件。
- 验证结果。
- 阻塞和恢复。
- leader review 结果。
- 对下一任务的交接。

## 8. 更新职责

Leader 负责：

- 创建 run ledger。
- 创建或要求创建每个 task log。
- 派发前写清任务边界。
- 收到 agent 结果后更新 ledger。
- review 后记录通过、返工或阻塞。
- 汇总最终验证和提交。

Subagent 负责：

- 只做分配的任务。
- 报告执行过的命令、文件、测试和阻塞。
- 不自行扩大范围。
- 不把重要结论只留在对话里。

如果 subagent 不能直接写文档，leader 必须把它的报告整理到对应 task log。

## 9. 自检

本流程文档确认：

- 设计文档先于实现。
- 实施计划先于 subagent-driven。
- Agent run ledger 先于派发。
- 每个 agent 必须有工作计划和进度记录。
- 项目长期记忆、索引和进度必须同步。
