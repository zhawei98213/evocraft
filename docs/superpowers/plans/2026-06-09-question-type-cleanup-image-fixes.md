# 题型、去痕语义和错题图片修复实施计划

日期：2026-06-09

状态：执行中

目标：落实用户反馈，把“标题”改成“题型”，停止把未真实去痕的确认区域包装成干净题面，并修复桌面错题本图片不可见问题。

## 文件范围

- `src/domain/wrongQuestion.ts`：mock 题型、去痕状态和保存记录兼容。
- `src/app/App.tsx` / `src/app/App.test.tsx`：复核页、错题本、详情页文案与图片回退。
- `electron/ai/recognitionPrompt.cjs` / `electron/ai/qwenAdapter.cjs` / `tests/qwen-adapter-contract.test.mjs`：Qwen 结构化阶段输出题型并修正兜底。
- `electron/storage/localRecordStore.cjs` / `tests/electron-local-record-store.test.mjs`：本地资产水化为 data URL。
- `docs/prd/2026-05-10-wrong-question-capture-mvp-prd.md`、文档索引、想法胶囊、项目记忆、路线进度：同步产品边界。

## 执行切片

- [x] 写 RED：React 复核页使用“题型”且保存后详情展示题型。
- [x] 写 RED：Electron store 加载本地图片资产返回 data URL，路径穿越不返回 file URL。
- [x] 写 RED：Qwen prompt/schema 要求题型，空题型回退“待确认题型”。
- [x] 实现 App / domain / prompt / Qwen adapter / local record store。
- [x] 更新 PRD、想法胶囊、项目记忆、路线进度和 docs README。
- [x] 运行目标测试、全量测试、构建和 Browser 验证。
- [ ] 生成 handoff，按 Lore commit protocol 提交并推送。

## 验证命令

```bash
PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" npm run test:react -- src/app/App.test.tsx
PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" npm run test:electron-store
PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" npm run test:qwen-adapter
git diff --check
PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" npm test
PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" npm run build
PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" node docs/design/desktop-trunk/capture-react-ui.mjs
npm run codex:handoff
```

## 当前判断

- 需要换模型的是“真实图像去痕”这条能力，不是 OCR + 文本整理链路本身。本轮不仓促替换模型，先把 UI 和数据合同改为诚实状态，并把后续图像编辑/inpainting 模型接入作为单独评测任务。
- 图片不可见的优先修复点是本地 store 的加载合同，不是 React `<img>` 样式。

## 已执行验证

- `PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" npm run test:react -- src/app/App.test.tsx`：28 项通过。
- `PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" npm run test:electron-store`：通过。
- `PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" npm run test:qwen-adapter`：通过。
- `PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" npm test`：6 个 test files / 57 项通过。
- `PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" npm run build`：通过。
- `git diff --check`：通过。
- Browser in-app：`http://127.0.0.1:5173/` 上传页和错题本页文案正确，无破图，无应用 console error。
- `PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" node docs/design/desktop-trunk/capture-react-ui.mjs`：首次 Chrome target 超时，诊断后重跑成功，截图写入 `docs/design/desktop-trunk/screens/`。
