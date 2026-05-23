# EvoCraft Agent Run Protocol

日期：2026-05-23

用途：记录 subagent-driven 执行中每一个 agent 的工作计划、过程、命令、验证和 review。

## 1. 为什么需要这个目录

EvoCraft 的实现任务会越来越多地依赖多个 agent 并行完成。聊天记录不能作为唯一交接物，所以每次 subagent-driven 执行都必须在项目内留下可审计的 run ledger 和 per-agent task log。

## 2. 目录结构

每次 subagent-driven 执行创建一个 run 目录：

```text
docs/superpowers/agent-runs/
  YYYY-MM-DD-feature-name/
    README.md
    agent-log-template.md
    agents/
      task-01-short-name.md
      task-02-short-name.md
```

## 3. Run Ledger 要求

每个 run 的 `README.md` 必须包含：

- Run 名称和日期。
- 父级 spec。
- 父级 implementation plan。
- 执行模式。
- 当前状态。
- 任务总表。
- 每个 agent 的状态、分配范围、测试、提交和 review 结论。
- 全局阻塞。
- 最终验证记录。

状态值统一使用：

- `pending`
- `assigned`
- `in_progress`
- `blocked`
- `review`
- `changes_requested`
- `completed`
- `cancelled`

## 4. Per-Agent Task Log 要求

每个 agent 必须有一个 task log，包含：

- Agent ID。
- Task ID。
- 任务标题。
- 父级计划链接。
- 分配时间。
- 完成时间。
- 状态。
- 任务目标。
- 允许修改的文件。
- 禁止修改的范围。
- 初始工作计划。
- 过程进度。
- 执行命令。
- 修改文件。
- 验证结果。
- 阻塞。
- Handoff。
- Leader review。
- Commit hash。

## 5. Leader 规则

Leader 必须：

1. 在派发 subagent 前创建 run ledger。
2. 在派发时写清 task log 的初始任务边界。
3. 收到 agent 报告后更新 task log。
4. review 后更新 run ledger。
5. 如果 agent 返工，记录返工原因和新的验证结果。
6. 合并前确认所有 task log 都处于 `completed` 或明确 `cancelled`。
7. 最终报告中引用 run ledger。

## 6. Agent 报告最小格式

每个 agent 回报至少要包含：

```md
## Summary

## Files Changed

## Commands Run

## Verification

## Blockers

## Handoff Notes
```

Leader 把这些内容整理进对应 task log。

## 7. 当前 Runs

- [真实 AI 识别接入](2026-05-23-real-ai-recognition/README.md)
