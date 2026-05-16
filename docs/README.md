# EvoCraft 文档索引

这个目录是 EvoCraft 的项目记忆区。后续每次进入比较实质的产品、设计、开发工作前，都应该先读当前记忆和进度文件，避免上下文丢失。

## 先读这些

- [项目记忆](planning/evocraft-project-memory.md)：稳定产品背景、已确认决策、开放问题、记忆更新规则。
- [路线图与进度](planning/evocraft-roadmap-progress.md)：长期路线、当前阶段、进度记录。
- [应用集合架构](planning/evocraft-app-collection-architecture.md)：EvoCraft 作为 AI 学习助手应用集合的顶层结构。
- [想法胶囊](ideas/2026-05-10-evocraft-seed-capsule.md)：原始想法碎片和产品方向。
- [PRD 编写规范 v1.1](prd/2026-05-16-prd-writing-standards.md)：后续 PRD 新建、重大更新、需求评审和规范反向提炼的统一标准。
- [MVP PRD v1.5](prd/2026-05-10-wrong-question-capture-mvp-prd.md)：用于生成 UI 图和指导开发的错题收集 MVP 产品需求文档。
- [已实现 MVP UI 设计图](design/implemented-mvp/2026-05-16-implemented-mvp-ui-design.md)：由当前静态 Web 实现自动跑通主流程后保存的 UI 基线截图。
- [MVP 技术路线决策](planning/2026-05-16-mvp-technical-route-decision.md)：基于 PRD v1.5 和已实现 UI 基线确认静态 Web、AI adapter、React/Vite、桌面壳和后端的推进顺序。
- [MVP 收尾加固设计](superpowers/specs/2026-05-16-mvp-hardening-tech-route-design.md)：隐私确认、本地删除、失败恢复和技术路线的实现设计。
- [MVP UI 原型简报](design/2026-05-10-mvp-ui-prototype-brief.md)：基于 PRD v1.0 的第一版 UI 原型生成说明。
- [UI 风格探索简报](design/2026-05-10-ui-style-options-brief.md)：用于生成多套视觉风格方向供选择。
- [B 方案设计基线](design/desgin.md)：选定 `未来学习工作台` 后的 EvoCraft MVP 视觉与组件规范。
- [B 方案正式 UI 图生成简报](design/2026-05-10-b-style-ui-generation-brief.md)：用于生成可指导 coding 的多屏 UI 图。
- [B 方案 Figma 导入包](design/figma/README.md)：蓝色主导 UI 的 SVG 总览画板和独立页面稿。
- [第一版静态 Web MVP](../app/index.html)：基于 PRD 和 B 方案设计基线实现的本地错题收集闭环。

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
