# EvoCraft 真实 AI 识别接入设计

日期：2026-05-23

文档状态：已确认设计，待实现计划拆分

适用阶段：Phase 1 错题收集应用真实 AI/OCR 接入

相关文档：

- `docs/prd/2026-05-10-wrong-question-capture-mvp-prd.md`
- `docs/superpowers/specs/2026-05-13-question-region-domestic-model-design.md`
- `docs/planning/evocraft-project-memory.md`
- `docs/planning/evocraft-roadmap-progress.md`
- `src/services/aiAdapter.ts`

## 1. 目标

本轮真实 AI 接入只解决“识别整理”，不解决“学习理解”。

需要达成：

- 从真实错题照片中识别候选题目区域。
- 用户确认题目区域后，只对该区域做 OCR 和结构化整理。
- 生成可编辑、可复核的错题草稿。
- 保留图形、公式、几何图、表格等视觉内容的可追溯片段。
- 记录模型调用、失败原因、耗时和需复核项。
- 在桌面应用中保持本地数据优先和明确外部 AI 授权。

明确不做：

- 不做模型训练、微调或本地模型部署。
- 不在第一版主动解题、讲解、生成相似题或做错因分析。
- 不把模型推理出的答案伪装成“识别结果”。
- 不在第一版做自动图像去痕或重绘。
- 不引入 SaaS backend、账号、云同步或云端数据存储。

## 2. 产品边界

第一版真实 AI 的职责是把照片整理成错题记录草稿。AI 可以识别图片中已经存在的题干、学生作答、老师批注、答案线索和批改痕迹，但不能主动推理一个新答案作为识别事实。

解题、讲解、错因、知识点和相似题进入 Phase 2 错题理解。这样可以把“看清楚题”和“理解题”拆开评测，避免识别错误和推理错误混在一起。

干净题面采用结构化重排策略：AI 提供题干、选项、可见答案线索、视觉片段和复核标记，由应用渲染干净题面。图形、公式、几何图和表格先保留为题目区域内的视觉片段或截图。图像去痕、重绘和 inpainting 作为后续专项评测，不进入第一版真实 AI 接入。

## 3. 架构原则

当前版本是桌面应用，本地优先。

- React renderer 只负责 UI、复核和状态展示。
- Electron preload 暴露最小 IPC API。
- Electron main process 负责本地文件、图片资产、配置读取和真实 AI 调用。
- API key 只能存在于本机配置或开发环境变量中，不进入 renderer，不写入错题记录。
- 业务层继续依赖 provider-agnostic `AiAdapter`，不直接绑定供应商 SDK。
- 未来走向 SaaS 时，把 AI adapter 和存储 adapter 迁移到 backend；当前不提前引入 backend。

当前数据不再把真实图片长期塞进 `localStorage`。真实 AI 接入前先建立桌面本地数据目录。

## 4. 本地持久化

第一版桌面本地持久化采用文件夹 + JSON 索引。

建议目录形态：

```text
EvoCraft/
  wrong-question/
    index.json
    records/
      <record-id>/
        record.json
        original.<ext>
        region.<ext>
        clean-render.json
        model-runs.jsonl
        assets/
          visual-1.<ext>
```

设计规则：

- 每条错题一个独立目录。
- `record.json` 是单条记录的权威数据。
- `index.json` 只存列表摘要、排序字段和检索摘要，可由记录目录重建。
- 图片文件以 hash、尺寸、mime、相对路径记录，不存大段 base64。
- 写入采用临时文件 + 原子 rename，避免半写入损坏。
- 所有记录包含 `schemaVersion`，后续可迁 SQLite 或 SaaS。
- 删除记录时删除记录目录，并重建或更新索引。
- 启动时可做轻量校验：索引缺失、记录缺图、JSON 解析失败都进入可恢复状态。

## 5. AI 能力分层

保留四类任务，但第一版只实现可评测的最小链路：

| 任务 | 输入 | 输出 | 第一版策略 |
| --- | --- | --- | --- |
| `region_detection` | 整张原图 | 候选题目区域 | 可先由视觉模型返回 1-5 个候选框；失败时用户手动画框 |
| `ocr` | 用户确认后的区域图 | 原始文字、公式/图形提示、可见作答痕迹 | 优先调用 OCR/视觉模型 |
| `structure` | OCR 结果和区域图 | 结构化错题草稿 JSON | 约束输出 schema，失败时保存 OCR 原文 |
| `cleanup` | 结构化草稿和视觉片段 | 可渲染干净题面数据 | 应用渲染为主，不做图像去痕 |

`AiAdapter` 需要扩展为能够返回：

- 识别草稿字段。
- 置信度或需复核项。
- 视觉片段引用。
- 模型调用 traces。
- 失败原因和用户可理解提示。
- 原始供应商响应摘要，供开发排查，不在儿童可见 UI 展示。

## 6. 供应商策略

默认第一候选是阿里云百炼 Qwen 体系。

当前评估原因：

- 阿里官方 `qwen-vl-ocr` 文档覆盖文档、表格、试卷、手写等 OCR 场景，和错题照片接近。
- 阿里视觉理解文档覆盖 Qwen 视觉模型和结构化输出能力，适合先做 OCR + JSON 草稿。
- 国内模型优先符合访问稳定性、成本和儿童学习照片边界的当前判断。

火山引擎豆包视觉理解作为第二供应商或后续 A/B，不和第一轮 Qwen 接入并行推进。

OpenAI 视觉能力可作为远期对照评测或极少数疑难 fallback 候选，不作为第一版常规生产链路。

模型名称、能力和价格会变化。实现前必须复核官方文档和当期价格：

- 阿里云百炼 Qwen OCR：<https://help.aliyun.com/zh/model-studio/qwen-vl-ocr>
- 阿里云百炼视觉理解：<https://help.aliyun.com/zh/model-studio/vision-model>
- 阿里云百炼模型价格：<https://help.aliyun.com/zh/model-studio/model-pricing>
- 火山引擎视觉理解最佳实践：<https://www.volcengine.com/docs/508/1398959>
- OpenAI 视觉能力：<https://platform.openai.com/docs/guides/images-vision>
- OpenAI 结构化输出：<https://platform.openai.com/docs/guides/structured-outputs>

## 7. 评测策略

本机评测不是训练模型，也不是本地跑模型。评测脚本在本机运行，通过云端 API 调用真实模型。

第一轮样本采用 10-15 张三科混合样本，确认评测格式和输出，再扩到 50 张。

样本覆盖：

- 数学：公式、几何图、坐标图、应用题。
- 语文：阅读题、填空题、主观题。
- 英语：选择题、完形填空、阅读理解。
- 图片状态：清晰、倾斜、阴影、局部模糊、多题同页、带批改和学生作答。

评测记录：

- 样本 id、科目、图片质量标签。
- 候选框是否覆盖目标题。
- OCR 题干准确性。
- 公式、图形、表格是否被保留。
- 学生作答和批改痕迹是否被识别为复核项。
- JSON schema 是否稳定。
- 是否出现编造答案、过度推理或漏识别。
- 延迟、失败类型、token/费用估算。
- 人工修正点。

通过门槛：

- 能稳定返回合法 JSON。
- 不主动编造解题答案。
- 手动画框兜底可恢复候选框失败。
- 主要题干可进入可编辑草稿。
- 对低置信度、图形、公式、表格给出需复核提示。

## 8. 桌面应用集成

应用内真实 AI 通过开发开关启用，默认继续走 mock。

推荐配置：

- `EVOCRAFT_AI_PROVIDER=qwen`
- `EVOCRAFT_AI_ENABLED=false`
- `DASHSCOPE_API_KEY=<local-only>`

实现时可使用更统一的实际变量名，但原则是：默认关闭，密钥本地读取，不写入仓库和用户记录。

UI 规则：

- 未开启真实 AI 时，继续显示 mock/本地识别状态。
- 开启真实 AI 后，用户必须看到外部 AI 上传授权提示。
- 儿童可见 UI 不展示 provider、model id、token 等技术词。
- 复核页仍使用“识别草稿”“需复核”“请检查”等表达。
- 模型失败时保留手动填写和保存路径。

## 9. 错误处理

必须处理：

- 未配置 API key：回退 mock 或提示开发配置缺失。
- 供应商网络失败：显示可恢复失败，不清空图片和选区。
- 图片过大：本地压缩或提示重新选择，不直接上传超限图片。
- OCR 失败：保留区域图，允许用户手动填写。
- 结构化 JSON 无效：保存 OCR 原文和失败 trace。
- 低置信度：进入复核，不阻断保存。
- 记录写入失败：停留复核页，不提示保存成功。
- 索引损坏：尝试从 records 目录重建。

## 10. 实施顺序

1. 设计并实现本地文件存储 port，替换真实桌面路径下的长期 `localStorage` 存储。
2. 定义 `AiAdapter v1` schema 和 contract tests。
3. 增加本机评测样本目录和评测脚本，不提交真实儿童照片。
4. 实现 Qwen adapter spike，在脚本里跑 10-15 张三科混合样本。
5. 根据评测结果收敛 prompt、图片预处理和 JSON schema。
6. 在 Electron main process 接入真实 AI adapter。
7. 通过 preload IPC 给 renderer 暴露最小识别请求。
8. 增加应用内开发开关和外部 AI 授权提示。
9. 扩样本到 50 张，形成稳定评测基线。

## 11. 后续计划

进入 Phase 2 后再做：

- 解题。
- 面向孩子的讲解。
- 错因分析。
- 知识点标注。
- 相似题生成。
- 复习计划。

图像去痕、重绘和 inpainting 另立专项评测。只有在结构化识别稳定后，才决定是否进入产品主流程。

## 12. 自检

- 没有把真实 AI 接入写成模型训练。
- 没有把第一版范围扩大到解题、讲解、相似题。
- 没有要求当前桌面阶段先上 backend。
- 没有把 API key 暴露到 renderer。
- 没有继续把真实图片长期存入 `localStorage`。
- 保留了 SQLite 和 SaaS 的后续迁移路径。
