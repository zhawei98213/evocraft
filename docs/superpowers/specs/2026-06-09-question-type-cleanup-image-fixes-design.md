# 题型、去痕语义和错题图片修复设计

日期：2026-06-09

状态：执行中

相关文档：

- MVP PRD：`docs/prd/2026-05-10-wrong-question-capture-mvp-prd.md`
- PRD 编写规范：`docs/prd/2026-05-16-prd-writing-standards.md`
- 项目记忆：`docs/planning/evocraft-project-memory.md`
- 路线图与进度：`docs/planning/evocraft-roadmap-progress.md`
- 想法胶囊：`docs/ideas/2026-05-10-evocraft-seed-capsule.md`

## 1. 背景

2026-06-09 试用反馈指出三处影响复核可信度的问题：

- 复核页的“标题”字段不符合真实错题整理习惯，应改为“题型”，例如判断题、应用题、完型填空。
- 当前“去痕”效果很差，本质上没有真实图像去痕通道，不应把确认区域或 mock 图包装成已经去痕的题面。
- 错题本中已保存记录的图片不可见，导致用户无法回看原图、确认区域或复习材料。

这三处都属于产品需求边界变化，而不只是文案修补：题型影响 AI 输出 schema 和复核信息架构；去痕语义影响 AI 能力承诺；图片不可见影响本地持久化合同。

## 2. 范围

- 将用户可见的“标题”字段改为“题型”，并要求 AI 结构化阶段返回题型而不是泛化标题。
- 保持旧记录兼容：内部现有 `title` 字段先作为题型显示值继续使用，避免本轮引入大规模数据迁移。
- 当没有真实图像去痕结果时，复核页和详情页展示为“确认区域 / 待去痕”，不再声称已生成去痕图。
- Qwen 第一版继续只做 OCR + 文本整理，不把 `qwen-vl-ocr-latest` 伪装成图像修复模型；真实去痕需要后续单独接入图像编辑或 inpainting 模型并评测。
- Electron 本地记录加载时，把记录目录内的图片资产安全水化为 `data:image/...;base64,...`，使 renderer 和网页预览都能稳定渲染，同时不暴露任意本地路径。

## 3. 非目标

- 本轮不新增外部模型、不增加第三方依赖、不改变 API key 配置方式。
- 本轮不实现真正图像去痕、图像重绘或 inpainting。
- 本轮不迁移全部历史 JSON 字段名；`title` 的语义迁移到题型先通过 UI、prompt 和文档约束完成。
- 本轮不保存 raw provider response、图片 data URL 或敏感 OCR 原文到 handoff。

## 4. 数据与显示合同

- `WrongQuestionDraft.title` / `WrongQuestionRecord.title` 在 UI 中解释为题型。
- 识别 prompt 明确要求 `title` 填“题型”，不是题干摘要或题目编号。
- 记录列表、详情页、复核表单和错误提示都使用“题型”。
- 对于没有真实去痕图的记录，默认复习图使用确认区域，状态文案显示“待去痕”或“确认区域”，避免误导。
- 已保存的本地资产仍以相对路径保存在 `record.json`，加载到 renderer 前由 main-process store 读取为 data URL。

## 5. 错题图片水化策略

本地记录保存仍采用文件夹 + JSON 索引：

```text
wrong-question/
  records/<record-id>/
    record.json
    assets/<field>-<hash>.png
```

加载时只允许解析 `./assets/...` 这类记录目录内相对路径：

- 如果路径仍在当前记录目录内，读取文件并按扩展名生成 image data URL。
- 如果路径越界、文件缺失或类型不支持，删除该图片字段，让 UI 回退到可用来源。
- 不返回 `file://` URL 给 renderer，避免桌面 sandbox、CSP 或网页预览差异导致图片不可见。

## 6. 错误处理

- 本地资产读取失败不阻断整个错题本；坏图字段被移除，坏记录 JSON 继续按现有逻辑跳过。
- 详情页如果当前模式图片缺失，应回退到确认区域，再回退原图，最后才为空。
- 去痕状态未完成时，保存仍允许继续，因为本轮目标是可复核保存，不是假装自动去痕完成。

## 7. 隐私与安全

- 图片 data URL 只在 renderer 运行态用于展示，不写入日志、handoff 或评测汇总。
- `record.json` 继续保存相对资产路径，避免把大图片 base64 长期写入 JSON。
- 水化函数必须做路径 containment 检查，禁止 `../../../` 越界读取。

## 8. 测试策略

- React 测试：复核页使用“题型”标签，保存后错题本和详情以题型展示；去痕未真实完成时 UI 显示“待去痕/确认区域”而不是“去痕完成”。
- Qwen contract test：结构化 prompt 要求 `title` 是题型，空题型兜底为“待确认题型”。
- Electron store test：保存后加载的图片字段是 `data:image/...;base64,...`，外部文件会复制进记录目录并水化为 data URL，路径穿越不会变成 `file://`。
- 全量验证：`npm run test:react -- src/app/App.test.tsx`、`npm run test:electron-store`、`npm run test:qwen-adapter`、`npm test`、`npm run build`、`git diff --check`、Browser 验证。
