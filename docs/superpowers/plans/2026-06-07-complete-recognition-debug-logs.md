# 完整识别与后台调试日志实施计划

日期：2026-06-07

状态：已实现，待提交推送

目标：解决真实试用反馈中的上传页无用按钮、选择题选项漏识别、缺少二阶段题目整理和后台完整识别内容日志。

## 文件范围

- `src/domain/wrongQuestion.ts`：新增 `AnswerOption` 数据结构、mock 数据和记录保存支持。
- `src/app/App.tsx` / `src/app/App.test.tsx`：移除上传页使用指南按钮；复核页展示并编辑选项。
- `electron/ai/recognitionPrompt.cjs`：拆分 OCR prompt 和题目整理 prompt。
- `electron/ai/qwenAdapter.cjs` / `tests/qwen-adapter-contract.test.mjs`：真实识别改为 OCR + structure 两阶段，补选项归一化和 fallback。
- `electron/main.cjs` / `tests/electron-ai-ipc.test.mjs`：成功日志打印完整规范化识别内容。
- `docs/prd/2026-05-10-wrong-question-capture-mvp-prd.md`、项目记忆、想法胶囊、路线进度和文档索引：同步产品边界。

## 执行切片

- [x] 写 RED：上传页不显示“使用指南”。
- [x] 写 RED：复核页显示并保存选择题选项。
- [x] 写 RED：Qwen prompt/schema 要求 `answerOptions`，并发起 OCR + structure 两次请求。
- [x] 写 RED：Electron 成功日志包含完整识别内容，但仍脱敏图片和凭据。
- [x] 实现 domain / App / Qwen adapter / main-process 日志。
- [x] 更新 PRD、想法胶囊、项目记忆、路线进度和 docs README。
- [x] 刷新桌面截图并跑 Browser 响应式验证。
- [x] 跑全量测试和构建。
- [ ] 按 Lore commit protocol 提交并推送。

## 验证命令

```bash
PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" npm run test:react -- src/app/App.test.tsx
PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" node tests/qwen-adapter-contract.test.mjs
PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" node tests/electron-ai-ipc.test.mjs
git diff --check
PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" npm test
PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" npm run build
PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" node docs/design/desktop-trunk/capture-react-ui.mjs
```

## 实施结果

- React：上传页移除“使用指南”；复核页新增可编辑“选项”字段；保存后详情页展示 `answerOptions`。
- Domain：`WrongQuestionDraft` / `WrongQuestionRecord` 新增 `answerOptions`，mock 和旧记录兼容空数组。
- Qwen adapter：`qwen-vl-ocr-latest` 负责视觉 OCR，`qwen-plus` 负责结构化整理；二阶段失败时保留 OCR 题干和选项。
- Electron：`ai.recognize.success` 日志输出规范化识别内容，仍不输出 API key、Authorization、图片 data URL 或 raw provider response。

## 已执行验证

- `PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" npm run test:react -- src/app/App.test.tsx`：28 项通过。
- `PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" node tests/qwen-adapter-contract.test.mjs`：通过。
- `PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" node tests/electron-ai-ipc.test.mjs`：通过。
- `git diff --check`：通过。
- `PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" npm test`：6 个 test files / 57 项通过。
- `PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" npm run build`：通过。
- `PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" node docs/design/desktop-trunk/capture-react-ui.mjs`：截图刷新成功。
- Browser in-app：`http://127.0.0.1:5173/` 桌面 1280x720 与移动 390x844 上传页均无横向溢出，且不再显示“使用指南”。
