# 上传照片方向调整实施计划

日期：2026-06-07

状态：已完成并验证

目标：让用户在上传照片后、进入选区和识别前，可以手动左转/右转图片方向，避免颠倒或横向照片影响 AI 识别和人工框选。

## 文件范围

- `src/services/imageTransforms.ts`：新增本地 canvas 图片旋转 helper。
- `src/features/wrongQuestion/wrongQuestionReducer.ts`：新增上传图片旋转状态和 `IMAGE_ROTATED` action。
- `src/features/wrongQuestion/wrongQuestionReducer.test.ts`：锁住旋转后清空旧候选/草稿、替换图片后角度归零。
- `src/app/App.tsx`：上传页显示旋转控件，并把旋转后的图片写回主流程输入。
- `src/app/App.test.tsx`：锁住上传后可右转图片、预览更新、方向状态可见。
- `src/app/styles.css`：补上传页方向控件布局。
- `docs/prd/2026-05-10-wrong-question-capture-mvp-prd.md`、项目记忆、想法胶囊和进度记录：同步产品边界。

## 执行切片

- [x] 写 RED 测试：reducer 旋转状态和 App 上传后右转行为。
- [x] 实现本地图片旋转 helper。
- [x] 接入 reducer 和上传页 UI。
- [x] 跑聚焦测试到 GREEN。
- [x] 更新文档和截图证据。
- [x] 跑全量测试、构建和 Browser 验证。
- [x] 按 Lore commit protocol 提交并推送。

## 验证命令

```bash
PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" npm run test:react -- src/features/wrongQuestion/wrongQuestionReducer.test.ts
PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" npm run test:react -- src/app/App.test.tsx
PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" npm run test:react -- src/services/imageTransforms.test.ts
git diff --check
PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" npm test
PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" npm run build
PATH="/usr/local/bin:$PWD/node_modules/.bin:$PATH" node docs/design/desktop-trunk/capture-react-ui.mjs
```

## 最终验证记录

- `src/services/imageTransforms.test.ts`：1 个测试通过，确认图片解码失败时 helper 会 reject，让 UI 保留当前图片并显示可恢复提示。
- `src/features/wrongQuestion/wrongQuestionReducer.test.ts`：14 个测试通过。
- `src/app/App.test.tsx`：27 个测试通过；长流程回归在全量并发时显式使用 10 秒 timeout。
- `git diff --check`：通过。
- `npm test`：6 个 test files / 56 个测试通过。
- `npm run build`：通过，生成 `dist/`。
- `node docs/design/desktop-trunk/capture-react-ui.mjs`：通过，刷新 6 张桌面主干截图。
- Browser in-app 检查：`http://127.0.0.1:5173/` 桌面 1280x720 和移动 390x844 页面非空、无 Vite overlay、console warn/error 为空、横向溢出为 0。
- 补充 Chrome/CDP 移动上传验证：390x844 视口上传 PNG 后旋转控件可见，点击“右转照片”后显示“当前方向：右转 90度”，横向溢出为 0。
