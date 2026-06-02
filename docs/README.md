# EvoCraft 文档索引

这个目录是 EvoCraft 的项目记忆区。后续每次进入比较实质的产品、设计、开发工作前，都应该先读当前记忆和进度文件，避免上下文丢失。

## 先读这些

- [项目记忆](planning/evocraft-project-memory.md)：稳定产品背景、已确认决策、开放问题、记忆更新规则。
- [路线图与进度](planning/evocraft-roadmap-progress.md)：长期路线、当前阶段、进度记录。
- [设计文档体系](planning/2026-05-23-design-documentation-system.md)：定义 PRD、详细设计、实施计划、agent run ledger 和验证归档的组织方式与执行 gate。
- [应用集合架构](planning/evocraft-app-collection-architecture.md)：EvoCraft 作为 AI 学习助手应用集合的顶层结构。
- [想法胶囊](ideas/2026-05-10-evocraft-seed-capsule.md)：原始想法碎片和产品方向。
- [PRD 编写规范 v1.1](prd/2026-05-16-prd-writing-standards.md)：后续 PRD 新建、重大更新、需求评审和规范反向提炼的统一标准。
- [MVP PRD v1.5](prd/2026-05-10-wrong-question-capture-mvp-prd.md)：用于生成 UI 图和指导开发的错题收集 MVP 产品需求文档。
- [已实现 MVP UI 设计图](design/implemented-mvp/2026-05-16-implemented-mvp-ui-design.md)：由当前静态 Web 实现自动跑通主流程后保存的 UI 基线截图。
- [MVP 技术路线决策](planning/2026-05-16-mvp-technical-route-decision.md)：基于 PRD v1.5、已实现 UI 基线和桌面优先方向确认 React/Vite/TypeScript、AI adapter、Electron 桌面壳和后端的推进顺序。
- [桌面优先技术选型设计](superpowers/specs/2026-05-16-desktop-first-technical-selection-design.md)：确认下一阶段采用 React/Vite/TypeScript 工程主干、provider-agnostic AI adapter 和 Electron 桌面壳。
- [桌面优先迁移实施计划](superpowers/plans/2026-05-17-desktop-first-migration.md)：把桌面优先技术选型拆成 React/Vite/TypeScript 迁移、AI adapter contract tests 和 Electron shell 的可执行任务。
- [真实 AI 识别接入设计](superpowers/specs/2026-05-23-real-ai-recognition-design.md)：确认第一版真实 AI 只做识别整理、Electron main 调用 Qwen、本地文件夹 + JSON 索引持久化和评测脚本策略。
- [真实 AI 识别实施计划](superpowers/plans/2026-05-23-real-ai-recognition.md)：把真实 AI 接入拆成本地文件存储、AI adapter v1、Qwen 评测脚本、Electron main IPC、开发开关和授权提示任务。
- [真实 AI 识别 Agent Run Ledger](superpowers/agent-runs/2026-05-23-real-ai-recognition/README.md)：记录 subagent-driven 执行中每个 agent 的计划、进度、命令、验证和 review。
- [应用内真实 AI 配置设计](superpowers/specs/2026-06-02-app-visible-ai-config-design.md)：把 API key 和 LLM 名称从隐藏环境变量迁移到桌面设置页，同时保持 main-process 密钥边界。
- [应用内真实 AI 配置实施计划](superpowers/plans/2026-06-02-app-visible-ai-config.md)：实现设置页、`ai:configure` IPC、runtime 状态同步和验证步骤。
- [Qwen 脱敏样本评测设计](superpowers/specs/2026-05-31-qwen-sample-evaluation-design.md)：确认第一轮 10-15 张本地脱敏样本评测的样本规范、manifest 合同、隐私边界、结果 redaction 和决策规则。
- [Qwen 脱敏样本评测实施计划](superpowers/plans/2026-05-31-qwen-sample-evaluation.md)：把样本评测拆成 preflight、manifest validation、redacted summary reporter、本地样本运行和评估决策任务。
- [Qwen 脱敏样本评测 Agent Run Ledger](superpowers/agent-runs/2026-05-31-qwen-sample-evaluation/README.md)：记录后续 subagent-driven 执行中每个 agent 的任务边界、进度、命令和 review。
- [AI 评测脱敏汇总说明](testing/ai-eval/README.md)：说明哪些评测汇总信息可以入库、哪些敏感内容必须继续留在 ignored 本地结果文件中。
- [React 桌面主干 UI 截图](design/desktop-trunk/README.md)：React/Vite 桌面主干跑通后保存的六屏视觉回归基线。
- [EvoCraft Logo 方向探索](design/logo/2026-05-18-evocraft-logo-options.md)：第一组应用 logo 视觉方向和当前扫描笔记选定稿，已接入 React 品牌位、favicon 与 Electron macOS app icon。
- [MVP 收尾加固设计](superpowers/specs/2026-05-16-mvp-hardening-tech-route-design.md)：隐私确认、本地删除、失败恢复和技术路线的实现设计。
- [MVP UI 原型简报](design/2026-05-10-mvp-ui-prototype-brief.md)：基于 PRD v1.0 的第一版 UI 原型生成说明。
- [UI 风格探索简报](design/2026-05-10-ui-style-options-brief.md)：用于生成多套视觉风格方向供选择。
- [B 方案设计基线](design/desgin.md)：选定 `未来学习工作台` 后的 EvoCraft MVP 视觉与组件规范。
- [B 方案正式 UI 图生成简报](design/2026-05-10-b-style-ui-generation-brief.md)：用于生成可指导 coding 的多屏 UI 图。
- [第一版静态 Web MVP](../app/index.html)：基于 PRD 和 B 方案设计基线实现的本地错题收集闭环。
- [React/Vite 桌面主干](../src/app/App.tsx)：承接静态 MVP 同等流程的桌面版前端主干，后续由 Electron 壳加载。

## 记忆规则

每次有实质开发或产品决策时：

1. 先读 `docs/planning/evocraft-project-memory.md`。
2. 再读 `docs/planning/evocraft-roadmap-progress.md`。
3. 当新增 PRD、更新 PRD 或出现明确产品想法时，必须同步更新想法胶囊。
4. 后续 PRD 必须遵循 `docs/prd/2026-05-16-prd-writing-standards.md`。
5. 如果既有 PRD 有规范未提炼的有效结构或原则，必须同步更新 PRD 编写规范。
6. 任何技能或工具 workflow 产生的项目相关结果，都必须保存到主项目目录 `/Users/zha/Documents/CodeSpaces/evo-craft` 中，不能只留在聊天、临时目录、worktree 或外部工具状态里。
7. 想法胶囊按时间线记录提炼后的观点，不复制 PRD 原文。
8. 当决策、文件、功能、风险变化时，更新进度记录。
9. 进度记录必须包含：本轮任务、已完成、卡点、执行命令、下一步计划。
10. 原始想法放在 `docs/ideas/`，已经收敛的产品需求放在 `docs/prd/`。
11. 进入重要实现或 subagent-driven 前，必须先确认详细设计文档、实施计划和 agent run ledger 已入库。
12. 每个 subagent 的工作计划和进度必须记录在 `docs/superpowers/agent-runs/`。
