# Codex 会话连续性优化设计

日期：2026-06-08

状态：已实现

相关文档：

- 会话连续性协议：`docs/planning/2026-06-08-codex-session-continuity.md`
- 项目记忆：`docs/planning/evocraft-project-memory.md`
- 路线图与进度：`docs/planning/evocraft-roadmap-progress.md`
- 想法胶囊：`docs/ideas/2026-05-10-evocraft-seed-capsule.md`

## 1. 背景

用户经常遇到 Codex 自动上下文压缩失败，只能在同项目里新开窗口。EvoCraft 已经有“不依赖聊天上下文”的项目记忆机制，但缺少一个面向新窗口续跑的固定入口和自动快照命令。

## 2. 范围

- 新增项目级 Codex 会话连续性协议，定义长线程、compact 报错和新窗口续跑时的读取顺序。
- 新增 `scripts/create-session-handoff.mjs`，自动生成当前窗口 handoff。
- 在 `package.json` 暴露 `npm run codex:handoff`。
- 将协议和命令加入文档索引、项目记忆、进度和想法胶囊。

## 3. 非目标

- 不修改 Codex App 或 OpenAI 远端 compact 行为。
- 不把 `.omx/` 运行态加入 git。
- 不保存原始图片、API key、provider raw response 或完整敏感日志。
- 不引入新依赖。
- 不改业务 UI、AI adapter、Electron IPC 或测试中的既有未提交改动。

## 4. 方案

采用“长期文档 + 本地快照”的两层恢复模型。

长期文档层继续由 `docs/` 承担：项目记忆、路线图进度、设计文档和实施计划记录稳定事实。本地快照层由 `npm run codex:handoff` 生成 `.omx/context/current-session-handoff.md`，只保存新窗口恢复当前工作所需的临时事实。

## 5. 数据流

输入：

- `git status --short --branch`
- `git log --oneline --decorate -5`
- `docs/planning/evocraft-roadmap-progress.md` 的最新进度段
- 固定的新窗口读取清单

处理：

- 脚本在仓库根目录运行。
- 对输出做基本 redaction：图片 data URL、Authorization、常见 key/token/secret 文本、`sk-` 形态密钥。
- 默认写入 `.omx/context/current-session-handoff.md`。

输出：

- 一个短 Markdown handoff，包含当前分支、最近提交、未提交文件、最新进度摘要、续跑提示和隐私边界。

## 6. 错误处理

- `git` 命令失败时，脚本把失败信息写入 handoff，而不是中断整个生成流程。
- 进度文件缺失时，脚本输出明确缺失提示。
- `--out` 参数缺少路径时，脚本直接失败并给出用法。

## 7. 隐私与安全

handoff 是运行态文件，默认留在 ignored `.omx/`。它不应进入提交，也不应包含儿童学习照片、图片 data URL、API key、Authorization header、raw provider response 或完整 OCR 内容。

## 8. 测试策略

- 运行 `npm run codex:handoff`，确认默认输出文件生成。
- 运行 `node scripts/create-session-handoff.mjs --stdout`，确认 stdout 模式可用。
- 运行 `git diff --check`。
- 运行项目测试和构建，确认新增脚本和 package 命令不破坏现有工程。

## 9. 决策记录

- 选择本地 `.omx/context/current-session-handoff.md` 作为默认快照路径，因为它适合新窗口读取但不应频繁进入 git。
- 拒绝把动态 handoff 放进 `docs/planning/current-session-handoff.md`，因为当前分支、脏文件和阻塞会频繁变化，提交后容易制造伪长期事实。
- 拒绝新增第三方 CLI 依赖；Node 标准库已足够生成快照。
