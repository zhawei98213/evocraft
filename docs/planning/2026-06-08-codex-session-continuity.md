# Codex 会话连续性与续跑协议

日期：2026-06-08

状态：已启用

执行入口：本协议已纳入仓库根目录 `AGENTS.md` 的 Codex 会话连续性铁律。后续 agent 必须按 `AGENTS.md` 和本协议执行。

## 1. 背景

Codex 长线程在自动上下文压缩时可能因为远端 compact 任务或网络流中断而失败。这个问题不应迫使 EvoCraft 丢失任务状态，也不应让新窗口重新依赖聊天历史。

本协议把长线程风险转成项目内可恢复流程：关键状态写入仓库文档，当前窗口可生成本地 handoff，新窗口按固定读取顺序继续。

## 2. 默认工作方式

- 每个实质任务仍以 `docs/planning/evocraft-roadmap-progress.md` 作为长期进度来源。
- 任务改变产品、设计、流程、代码行为或验证状态时，同步更新项目记忆、进度和必要的设计/计划文档。
- 长任务进入实现前，应有详细设计和实施计划；使用 subagent-driven 前继续遵守 agent run ledger 规则。
- 当前窗口即将变长、遇到 compact 报错、准备切新窗口或完成一个阶段时，运行：

```bash
npm run codex:handoff
```

默认输出：

```text
.omx/context/current-session-handoff.md
```

`.omx/` 仍是本地运行态目录，不入 git；真正需要长期保存的结论继续写进 `docs/`。

## 3. 新窗口续跑顺序

新窗口不要从聊天记忆猜测任务状态。先按这个顺序读取：

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/planning/evocraft-project-memory.md`
4. `docs/planning/evocraft-roadmap-progress.md`
5. `.omx/context/current-session-handoff.md`（如果存在）
6. `git status --short --branch`

然后只继续最新未完成任务；如果 handoff 与长期文档冲突，以仓库文档和当前 git 状态为准。

## 4. Handoff 内容边界

handoff 应包含：

- 当前分支和最近提交。
- 未提交文件列表。
- 最新进度记录摘要。
- 当前阻塞和下一步计划。
- 新窗口可直接使用的续跑提示。

handoff 不应包含：

- API key、Authorization header、token 或 secret。
- 原始儿童学习照片、图片 data URL、raw provider response。
- 大段日志全文；只保留错误类型、命令名和可复现路径。

## 5. 何时主动切短线程

满足任一条件时，优先生成 handoff 并切到新窗口：

- 同一窗口已经完成一个可提交阶段。
- 即将进入新的 PRD、设计、实现或验证阶段。
- 工具输出、截图、测试日志或代码 diff 已经明显拉长上下文。
- 看到 `Error running remote compact task` 或 stream disconnect 相关错误。

切短线程不是中断工作，而是把聊天上下文降级为临时缓存，把仓库文档作为真实上下文。

## 6. 维护责任

- 任何 agent 都可以运行 `npm run codex:handoff` 生成本地 handoff。
- 完成实质变更后，必须更新路线图进度；handoff 不能替代长期进度记录。
- 如果续跑发现 handoff 过期，只重新运行命令生成新 handoff，不手动修补旧快照。
