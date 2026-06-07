# 桌面真实 AI 流程诊断与交互重设计详细设计

日期：2026-06-06

状态：基础修复已实施，Product Design 三方向已产出，等待选择主方向

相关文档：

- MVP PRD：`docs/prd/2026-05-10-wrong-question-capture-mvp-prd.md`
- 实施计划：`docs/superpowers/plans/2026-06-06-desktop-ai-flow-ux-redesign.md`
- Product Design brief：`docs/design/2026-06-06-product-design-redesign-brief.md`
- Product Design 三方向：`docs/design/2026-06-07-product-design-directions.md`
- 项目记忆：`docs/planning/evocraft-project-memory.md`
- 路线图与进度：`docs/planning/evocraft-roadmap-progress.md`

## 1. 背景

用户在 Electron 桌面窗口里连接真实 AI 后继续试用，反馈出五个产品和运行时问题：

1. 真实 AI 可用后，点击题目区域没有反应，需要后台日志帮助定位。
2. 上传页提前选择科目可能不是正确流程，科目更像识别题目之后的确认动作。
3. 候选框不能在框上直接删除。
4. 应用图标可能回退，需要重新验收图标链路。
5. API key 输入一次后应该保存，同时允许后续更改。

这些问题不只是局部 UI bug。它们影响真实 AI 调用可观测性、科目判断责任边界、选区交互、桌面品牌资产和本地凭据策略，所以本轮先同步 PRD、设计、计划和进度，再进入实现。2026-06-06 基础修复已进入代码：日志、科目后置、候选框就地删除、API key 本机加密持久化和图标静态链路已完成。2026-06-07 Product Design 已产出流程控制塔、双栏复核工坊和资料库中枢三个方向，等待选择主方向后再进入原型或 React UI 改造。

## 2. 范围

本设计覆盖：

- Electron main process 的真实 AI 诊断日志。
- renderer 题目区域选择/识别过程的可见状态和错误反馈。
- 科目选择从上传前前置选择改为识别后确认/修正。
- 候选框画布内直接删除。
- Electron、favicon、应用内 logo 的图标链路审计。
- API key 本机持久化、变更和清除。
- 修复上述流程后，使用 Product Design workflow 重新设计整体界面和交互。

## 3. 非目标

- 本轮计划阶段已结束；基础修复已改代码并完成自动化验证。
- 不扩大真实 AI 供应商范围，不引入第二 provider。
- 不把 API key、原始图片、完整 OCR/provider 响应或完整 prompt 写入仓库、错题记录或日志。
- 不做账号系统、云同步、SaaS backend 或远端凭据托管。
- 不在 Product Design brief 未确认前直接重做整个 UI。

## 4. 产品决策

### 4.1 日志优先服务调试，不泄露敏感内容

真实 AI 模式必须能在开发后台看到关键事件：配置、授权、自动找题、识别、失败原因、耗时、候选数量和降级路径。日志不得输出 API key、完整图片 data URL、原始 provider 响应、完整 OCR 文本或儿童学习照片内容。

日志默认写到 Electron main process stdout/stderr，供 `npm run electron:dev` 终端查看；后续可以把最近诊断摘要展示到设置页，但第一步不要求做完整日志查看器。

### 4.2 科目应先由识别链路建议，再由用户确认

上传页提前选择科目会把用户从“上传照片”任务中打断，也让模型失败和用户选择混在一起。新的默认流程是：

1. 上传图片并确认隐私/外部 AI 授权。
2. 自动找题和选题区域不要求用户先选择科目。
3. 确认题目区域后，识别链路以 `auto` 作为默认输入，请 provider 返回 subject 建议。
4. 复核页展示模型建议科目和置信/需复核状态，用户可以改为语文、数学或英语。
5. 如果 provider 无法返回合法科目，复核页显示“待确认科目”，保存前要求用户选择科目。

保留显式科目只作为复核页修正和重新识别时的高级输入，而不是上传页必填步骤。

### 4.3 候选框操作必须就地可控

用户看到错误候选框时，应能直接在框上删除，而不是先理解侧边列表和选中状态。候选框右上角需要固定删除按钮，点击删除不能触发选中、拖拽或缩放。删除后仍保留手动画框和重新自动找题的恢复路径。

### 4.4 API key 本地持久化但继续受控

用户明确希望 key 输入一次后保存。新的策略是：

- Electron main process 在应用数据目录持久化 AI 配置。
- API key 使用 Electron `safeStorage` 加密后保存；renderer 只能看到 `configured: true`、provider、model 和保存状态，不能读回 key 明文。
- 设置页显示“已保存 key”，提供“更改 key”和“清除 key”。
- 更改 key 时用新输入覆盖旧加密值，并重置外部 AI 授权。
- 清除 key 时删除本地凭据，并回到 mock 或未配置状态。
- 如果当前平台 `safeStorage` 不可用，默认不做明文持久化，设置页提示只能在本次会话内使用。

### 4.5 图标链路需要从 dev 到 packaged 全面验收

需要同时检查：

- `build-resources/icon.icns` 是否仍是选定 EvoCraft 图标。
- `package.json` electron-builder mac icon 配置是否指向正确 `.icns`。
- `electron/main.cjs` dev 窗口是否正确设置 BrowserWindow icon。
- `public/favicon.*` 和 `index.html` 是否指向当前 logo。
- `src/assets/evocraft-logo.png` 是否仍用于应用内品牌位。
- macOS dev 模式和打包模式下 Dock/窗口/应用切换器是否显示一致。

## 5. 运行时设计

### 5.1 日志事件

建议新增 `electron/runtimeLogger.cjs` 或等价轻量 helper：

```ts
type RuntimeLogEvent =
  | "ai.config.load"
  | "ai.config.save"
  | "ai.config.clear"
  | "ai.authorization.update"
  | "ai.detectRegions.start"
  | "ai.detectRegions.success"
  | "ai.detectRegions.failure"
  | "ai.recognize.start"
  | "ai.recognize.success"
  | "ai.recognize.failure"
  | "records.load.failure"
  | "records.save.failure";
```

每条日志至少包含：

- ISO 时间。
- 事件名。
- provider/model。
- requestId。
- 耗时。
- 非敏感失败 reason。
- 候选数量或字段完整度等摘要。

日志必须先经过 redaction：

- `sk-*`、`DASHSCOPE_API_KEY`、Authorization header 统一显示为 `[redacted]`。
- 图片 data URL 只保留 MIME 和长度。
- 原始 provider JSON 不直接打印。

### 5.2 AI 配置存储

建议新增 main-process-only 模块：

```ts
type PersistedAiConfig = {
  provider: "aliyun_bailian";
  modelId: string;
  encryptedApiKey: string;
  encryption: "electron-safe-storage";
  updatedAt: string;
};

type AiConfigStatus = {
  configured: boolean;
  persisted: boolean;
  provider?: string;
  modelId?: string;
  canPersistSecret: boolean;
};
```

renderer IPC 只能调用：

- `ai:getRuntimeStatus`
- `ai:configure`
- `ai:clearConfig`
- `ai:updateExternalAuthorization`
- `ai:detectRegions`
- `ai:recognizeQuestion`

不增加任何“读取 key 明文”的 IPC。

### 5.3 科目状态

当前记录模型 `WrongQuestionRecord.subject` 只允许三科。复核草稿阶段需要引入待确认状态，但保存记录仍必须是合法科目。

建议拆分：

```ts
type RecognitionDraftSubject = "chinese" | "math" | "english" | "unknown";
type SavedRecordSubject = "chinese" | "math" | "english";
```

保存前如果 `draft.subject === "unknown"`，保存按钮禁用并提示用户选择科目。

## 6. UI 设计方向

### 6.1 当前修复前的最小交互改动

- 上传页移除前置科目 segmented control。
- 真实 AI 授权与本地隐私说明仍保留在上传/处理前。
- 进入选区页后，自动找题应显示“正在找题/已找到 N 个候选/失败可手动画框”。
- 点击候选框应立刻更新选中态，并显示当前候选摘要。
- 点击候选框删除按钮应直接删除该框。
- 确认区域并识别后，复核页展示科目建议和可编辑科目控件。
- 设置页显示已保存 key 的 masked 状态、保存时间、当前模型、更改/清除操作。

### 6.2 Product Design 重设计目标

修复上述基础问题后，再进入 Product Design 重设计。重设计应优先解决：

- 上传、授权、自动找题、选区、识别、复核、保存之间的阶段感。
- 真实 AI / mock / 未配置 / 未授权 / 处理中 / 失败的清晰状态。
- 桌面工作台的信息密度和可扫描性。
- 选区画布和候选列表的关系，避免用户不知道该点击哪里。
- 设置页的凭据安全表达和更改路径。

Product Design workflow 已基于 `docs/design/2026-06-06-product-design-redesign-brief.md` 完成三方向 ideation，方向文档位于 `docs/design/2026-06-07-product-design-directions.md`。下一步必须先选择主方向，再做原型或 React UI 改造。

## 7. 测试策略

必须补充或更新：

- Electron AI IPC 测试：配置读取、保存、清除、status 不泄露 key、safeStorage fallback。
- Electron 日志测试：日志事件存在、敏感字段 redaction。
- Qwen adapter contract：`auto` subject 可返回合法 subject；缺失 subject 时进入待确认而不是不可恢复失败。
- React reducer/UI 测试：上传页不再前置科目；复核页保存前要求确认科目；候选框上删除按钮可用。
- Playwright 或 Browser 验证：真实桌面窗口中选区点击、删除、确认识别、复核保存全链路。
- 图标验收：静态资源存在、配置路径正确、dev/packaged 图标视觉检查。

## 8. 风险

- `safeStorage` 在部分环境可能不可用，需要明确 fallback，不能 silently 明文保存。
- 科目后置会触及 adapter、draft、record save 的类型边界，测试必须覆盖保存前校验。
- 日志如果过度详细可能泄露儿童学习内容；日志 helper 必须默认 redaction。
- Product Design 重设计如果直接大改代码，会扩大回归面；应先完成基础 bug 修复，再重设计并截图验证。
