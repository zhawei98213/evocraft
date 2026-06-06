# 桌面真实 AI 流程诊断与交互重设计实施计划

日期：2026-06-06

状态：未开始实施

目标：解决真实 AI 连接后的题目区域点击无反应、缺少后台日志、科目前置流程不合理、候选框不能就地删除、图标疑似回退、API key 不持久化，并在修复后用 Product Design workflow 重新设计整体界面和交互。

相关文档：

- 详细设计：`docs/superpowers/specs/2026-06-06-desktop-ai-flow-ux-redesign-design.md`
- Product Design brief：`docs/design/2026-06-06-product-design-redesign-brief.md`
- MVP PRD：`docs/prd/2026-05-10-wrong-question-capture-mvp-prd.md`
- 进度记录：`docs/planning/evocraft-roadmap-progress.md`

## 执行前检查

- [ ] 确认工作树状态，避免覆盖用户未提交改动。
- [ ] 读取本计划、详细设计、当前 PRD、项目记忆和进度记录。
- [ ] 如果后续使用 subagent-driven，先创建 `docs/superpowers/agent-runs/2026-06-06-desktop-ai-flow-ux-redesign/README.md` 和每个 agent log。
- [ ] 启动前确认本轮是否只修复基础流程，还是同时进入 Product Design 重设计实现。

## Task 1：补真实 AI 诊断日志

- [ ] 增加 main-process runtime logger helper，统一输出 structured log。
- [ ] 日志覆盖 `ai.config.load/save/clear`、授权同步、`detectRegions`、`recognizeQuestion`、records load/save failure。
- [ ] 所有日志先 redaction：API key、Authorization header、图片 data URL、原始 provider JSON 不得明文输出。
- [ ] 在 `registerAiIpc` / AI runtime / desktop store 的关键路径接入日志。
- [ ] 测试：
  - [ ] 新增或更新 Electron 日志测试，验证关键事件输出。
  - [ ] 验证日志里不包含用户提供的 key 形态、`data:image` 完整内容或 raw provider JSON。

## Task 2：修复题目区域点击无反应并加可见状态

- [ ] 用 Electron 桌面窗口复现真实 AI 模式下点击候选框无反应的问题。
- [ ] 检查选区画布的 pointer event、z-index、拖拽 handle、删除按钮和图片层级。
- [ ] 给“自动找题中/候选已准备/识别中/失败可恢复”补明确 UI 状态。
- [ ] 如果 provider 调用失败或 main process 拒绝调用，renderer 必须显示可恢复错误，而不是静默。
- [ ] 测试：
  - [ ] React/Testing Library 覆盖点击候选框会更新选中区域。
  - [ ] Browser/Playwright 覆盖真实桌面窗口候选框选择、确认识别。

## Task 3：把科目选择后移到识别复核

- [ ] 上传页移除前置 `自动/语文/数学/英语` 控件。
- [ ] 选区确认后的首次识别默认发送 `subject: "auto"`。
- [ ] 复核页展示模型建议科目，并允许用户改为语文、数学或英语。
- [ ] provider 未返回合法科目时，草稿进入 `unknown`/待确认状态；保存前必须要求用户选择科目。
- [ ] 显式科目只用于复核页用户修正和后续重新识别，不再作为上传页前置动作。
- [ ] 更新 domain/type 边界，确保已保存 `WrongQuestionRecord.subject` 仍只保存合法三科。
- [ ] 测试：
  - [ ] reducer 测试覆盖 subject draft unknown、用户确认、保存前校验。
  - [ ] Qwen adapter / prompt 测试覆盖 auto 科目和显式科目 retry。
  - [ ] React 测试覆盖上传页无科目控件、复核页有科目确认控件。

## Task 4：候选框就地删除

- [ ] 在每个候选框右上角增加删除按钮，按钮有 accessible label。
- [ ] 删除按钮点击必须 `stopPropagation`，不能触发选中、拖动或缩放。
- [ ] 删除当前框后自动选择合理的下一个候选；删光后显示恢复提示并禁用确认识别。
- [ ] 保留候选列表里的删除入口，但不要求用户必须通过列表删除。
- [ ] 测试：
  - [ ] React 测试覆盖在框上删除当前候选、非当前候选、删光候选。
  - [ ] Browser/Playwright 覆盖框上删除不触发拖拽。

## Task 5：API key 加密持久化和可更改

- [ ] 新增 main-process AI 配置存储模块，保存 provider、modelId、encryptedApiKey、updatedAt。
- [ ] 使用 Electron `safeStorage` 加密保存 API key。
- [ ] 如果 `safeStorage` 不可用，不明文持久化，状态提示仅会话可用。
- [ ] 启动时读取本地配置并恢复真实 AI runtime。
- [ ] 设置页显示已保存 key 状态、当前 model、更新时间。
- [ ] 设置页提供“更改 key”和“清除 key”。
- [ ] 更改或清除 key 时重置外部 AI 授权。
- [ ] 测试：
  - [ ] Electron IPC 测试覆盖保存、重启读取、清除、status 不回显 key。
  - [ ] React 设置页测试覆盖已保存、修改、清除和 bridge 不可用状态。
  - [ ] 敏感信息扫描确认 key 未入库。

## Task 6：图标链路审计和修复

- [ ] 检查 `build-resources/icon.icns` 是否为当前 EvoCraft 选定图标。
- [ ] 检查 `package.json` electron-builder mac icon 配置。
- [ ] 检查 `electron/main.cjs` dev BrowserWindow icon 设置。
- [ ] 检查 `public/favicon.*`、`index.html`、`src/assets/evocraft-logo.png`。
- [ ] 如图标回退，重新从当前 logo 资产导出并接入。
- [ ] 测试：
  - [ ] 静态配置测试覆盖所有图标路径存在。
  - [ ] 启动 dev Electron 截图/人工验收窗口、Dock 或 app switcher 图标。
  - [ ] 如运行打包验证，执行 `npm run desktop:build` 或现有等价命令并检查 packaged icon。

## Task 7：Product Design 重设计

- [ ] 先播放并确认 `docs/design/2026-06-06-product-design-redesign-brief.md`。
- [ ] 使用 Product Design get-context gate；当前已知 saved Product Design context 不存在，应以当前产品代码、现有截图、logo 资产和设计基线作为视觉来源。
- [ ] 先做 3 个视觉/交互方向，不直接进入代码重做。
- [ ] 选择方向后，再进入可运行原型或现有 React UI 改造。
- [ ] 设计必须覆盖上传、设置、选区、复核、错题本、详情、mock/real/未授权/失败状态。
- [ ] 产物必须保存到项目内，例如 `docs/design/`、`docs/superpowers/specs/` 或实现代码路径。

## Task 8：验证和收尾

- [ ] 运行 focused tests：
  - [ ] `npm run test:react -- src/app/App.test.tsx src/features/wrongQuestion/wrongQuestionReducer.test.ts`
  - [ ] `npm run test:qwen-adapter`
  - [ ] `npm run test:electron-config`
  - [ ] `npm run test:electron-store`
  - [ ] `node tests/electron-ai-ipc.test.mjs`
- [ ] 运行全量验证：
  - [ ] `npm test`
  - [ ] `npm run build`
  - [ ] `git diff --check`
- [ ] 运行敏感信息检查，确认 API key、`.env`、private samples、raw provider output 未入库。
- [ ] 更新 `docs/planning/evocraft-roadmap-progress.md`，记录实际执行命令、完成项和卡点。
- [ ] 更新 PRD、项目记忆、想法胶囊和文档索引中因实现而变化的状态。
- [ ] 按 Lore Commit Protocol 提交并推送到 `git@github.com:zhawei98213/evocraft.git`。
