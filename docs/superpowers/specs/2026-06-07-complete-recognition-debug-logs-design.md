# 完整识别与后台调试日志设计

日期：2026-06-07

状态：已实现

相关文档：

- MVP PRD：`docs/prd/2026-05-10-wrong-question-capture-mvp-prd.md`
- 项目记忆：`docs/planning/evocraft-project-memory.md`
- 路线图与进度：`docs/planning/evocraft-roadmap-progress.md`
- 想法胶囊：`docs/ideas/2026-05-10-evocraft-seed-capsule.md`

## 1. 背景

用户在真实桌面试用中指出四个问题：上传页右上角“使用指南”无实际价值；选择题识别结果没有完整包含 A/B/C/D 选项；识别后应再调用模型做科目判断和题目内容整理；识别内容需要完整打印到后台日志，便于调试。

当前真实 AI 链路只有一次 `qwen-vl-ocr-latest` 视觉调用，prompt 和 schema 只要求 `questionText`，没有显式 `answerOptions` 字段，也没有独立的文本整理阶段。这会让选择题选项只能混在题干里，模型一旦省略，复核页没有结构化兜底。

## 2. 范围

- 去掉上传页 header 里的“使用指南”按钮。
- 给错题草稿新增结构化选项字段 `answerOptions`，复核页单独展示并允许编辑。
- Qwen 真实识别改为两阶段：
  1. 视觉 OCR 模型只提取题目区域内可见文本、选项、学生痕迹和备注。
  2. 文本整理模型根据 OCR 结果判断学科、补全题目标题、整理题干和选项结构。
- 默认文本整理模型使用 `qwen-plus`，与现有 DashScope OpenAI compatible endpoint 兼容；若二阶段失败，保留 OCR 阶段结果并标记需复核，不阻断用户保存。
- Electron main process 在 `ai.recognize.success` 后台日志中打印完整规范化识别内容：科目、标题、题干、A/B/C/D 选项、学生答案痕迹、可见正确答案、备注。日志仍不得包含 API key、Authorization header、图片 data URL 或 raw provider response。

## 3. 非目标

- 不做解题、讲解、错因分析、知识点标注或相似题生成。
- 不把完整识别内容展示到右侧 AI 诊断面板；该面板继续保持脱敏摘要。
- 不保存 raw provider JSON。
- 不新增第三方依赖。
- 不改变外部 AI 授权 gate 或 API key 存储策略。

## 4. 数据合同

新增字段：

```ts
interface AnswerOption {
  label: string; // A / B / C / D 等
  text: string;
}

interface WrongQuestionDraft {
  answerOptions: AnswerOption[];
}
```

复核表单用多行文本编辑选项，每行格式为 `A. 选项内容`。保存时解析回 `answerOptions`。旧记录缺少该字段时按空数组处理。

## 5. AI 流程

第一阶段视觉 OCR prompt 必须强调：

- 只识别可见内容，不解题。
- 选择题必须单独返回 `answerOptions`。
- 题干、选项、学生作答痕迹和可见答案分开。

第二阶段文本整理 prompt 必须强调：

- 只基于第一阶段 OCR JSON，不看图片，不扩写不可见内容。
- 判断 `subject`，取值只能是 `chinese`、`math`、`english`。
- 整理 `title`、`questionText`、`answerOptions`、`studentAnswer`、`correctAnswer`、`notes`、`reviewItems`。
- 如果二阶段没有返回选项，但一阶段 OCR 返回了选项，系统保留一阶段选项。

## 6. 日志边界

后台日志新增完整识别内容摘要，但仅输出文本字段：

- `subject`
- `title`
- `questionText`
- `answerOptions`
- `studentAnswer`
- `correctAnswer`
- `notes`

继续通过现有 redaction 层屏蔽：

- API key / token / Authorization
- 图片 data URL
- raw provider response

## 7. 测试策略

- Qwen contract test：prompt 要求选择题选项；真实识别成功时发起 OCR + structure 两次请求；二阶段整理保留 A/B/C/D；二阶段省略选项时保留 OCR 选项。
- Electron IPC test：`ai.recognize.success` 日志包含完整规范化识别内容，但不包含图片 payload 或 key。
- React test：上传页不再显示“使用指南”；复核页显示并保存选项字段。
- 全量验证：`git diff --check`、`npm test`、`npm run build`、桌面截图和 Browser 响应式检查。

## 8. 实施结果

- `answerOptions` 已进入 domain、真实 AI adapter、复核表单、保存记录和详情展示；旧记录缺少该字段时按空数组处理。
- Qwen 真实识别已拆成视觉 OCR 和 `qwen-plus` 文本整理两阶段；二阶段失败时保留 OCR 草稿并要求人工复核。
- Electron `ai.recognize.success` 日志已输出规范化识别内容，并继续通过 runtime logger 脱敏 API key、Authorization、图片 data URL 和 raw provider response。
- 已通过 React、Qwen adapter、Electron IPC、全量测试、构建、截图刷新和 Browser 桌面/移动响应式检查。
