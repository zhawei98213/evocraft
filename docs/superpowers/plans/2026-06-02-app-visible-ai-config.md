# App-Visible AI Configuration Implementation Plan

日期：2026-06-02

父级设计：`docs/superpowers/specs/2026-06-02-app-visible-ai-config-design.md`

目标：把桌面真实 AI 的 API key 和 LLM 名称配置从隐藏环境变量迁移为应用内设置页，同时保持 Electron main process 持有密钥、外部 AI 授权 gate 和 mock fallback。

## Scope Check

本计划只实现设置页、IPC 配置合同和 runtime 状态同步。不做钥匙串持久化、多供应商、Qwen prompt/schema 调整、评测样本运行、SaaS 后端或账号系统。

## Tasks

- [x] Task 1：文档同步
  - 更新 PRD、真实 AI 设计、docs 索引、idea capsule、项目记忆和进度记录。
  - 保存本设计和实施计划到项目目录。

- [x] Task 2：RED 测试
  - 在 `src/app/App.test.tsx` 增加设置页和配置提交行为测试。
  - 在 `tests/electron-ai-ipc.test.mjs` 增加 `ai:configure` IPC 行为测试。
  - 在 `tests/electron-config.test.mjs` 增加 preload/static 合同检查。

- [x] Task 3：Electron main/preload 实现
  - 在 `electron/main.cjs` 增加会话内 AI config、runtime status builder 和 `ai:configure` handler。
  - 在 `electron/preload.cjs` 暴露 `configureAiRuntime`。
  - 保持 status 不返回 API key，provider call 使用配置后的 model。

- [x] Task 4：React 设置页实现
  - 扩展 reducer runtime state。
  - 启用左侧 `设置` 导航。
  - 添加设置页表单、保存状态和上传页 runtime 文案。
  - 配置成功后清空 API key 输入并重置外部 AI 授权。

- [x] Task 5：验证与收尾
  - 跑 focused RED/GREEN 命令。
  - 跑 `npm run test:electron-config`、focused React 测试、`npm test`、`npm run build`、`git diff --check`。
  - 检查没有 tracked `.env*`、private eval samples/results、`dist` 或 `release`。
  - 提交并推送。
