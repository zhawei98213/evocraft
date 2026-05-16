# 2026-05-16 MVP 技术路线决策

## 决策状态

状态：已更新，用于桌面版技术选型和 AI adapter 设计前的工程路线基线。

决策时间：2026-05-16

输入材料：

- MVP PRD v1.5：`docs/prd/2026-05-10-wrong-question-capture-mvp-prd.md`
- 已实现 MVP UI 设计图：`docs/design/implemented-mvp/2026-05-16-implemented-mvp-ui-design.md`
- 当前静态 Web 入口：`app/index.html`
- 收尾加固设计：`docs/superpowers/specs/2026-05-16-mvp-hardening-tech-route-design.md`
- 选题区域与国内模型策略设计：`docs/superpowers/specs/2026-05-13-question-region-domestic-model-design.md`
- 桌面优先技术选型设计：`docs/superpowers/specs/2026-05-16-desktop-first-technical-selection-design.md`

## 一句话结论

当前 MVP 继续保留零依赖静态 Web 作为行为和 UI 基线；下一阶段把工程主干迁到 `React + Vite + TypeScript`，同步抽 provider-agnostic AI adapter 与 mock contract tests，然后用 `Tauri 2` 做第一版可安装桌面壳。Electron 保留为桌面壳 fallback；后端 Web、账号和云同步继续等跨设备、托管密钥或协作需求明确后再启动。

## 当前技术基线

当前实现：

- `app/index.html`：页面结构、应用集合导航、上传、选题区域、复核、错题本、详情。
- `app/styles.css`：桌面优先的工作台 UI、侧栏、卡片、区域框、记录列表和响应式布局。
- `app/main.js`：浏览器交互、页面状态、上传预览、选区状态、复核表单、记录删除和清空。
- `app/state.js`：可测试的纯函数、mock AI 识别、mock 候选框、本地存储 helper。
- `tests/static-mvp.test.mjs`：结构、纯函数和关键 CSS 布局回归检查。
- `docs/design/implemented-mvp/screens/*.png`：由当前实现自动生成的 UI 设计图。

当前能力已经覆盖：

- App Hub 与第一个应用入口。
- 上传图片与本地隐私确认。
- AI 候选框、候选框删除、手动画框入口、拖动和缩放。
- 复核编辑、保存、本地错题本、详情查看。
- 单条删除、清空本地数据和本地保存失败提示。

## 方案对比

| 方案 | 适合点 | 不适合点 | 本轮结论 |
| --- | --- | --- | --- |
| 继续静态 Web + AI adapter | 变更最小；现有 UI 可试用；能先把 AI 契约和隐私边界做稳 | 长期组件复用、路由、复杂异步状态会吃力；不适合继续承接桌面版主干 | 保留为基线，不再作为长期主干扩张 |
| 迁移 React/Vite/TypeScript | 组件化、状态拆分、测试生态更完整；Vite 官方支持快速创建 React/TS 项目；适合作为 Web 与桌面共享前端核心 | 需要一次受控迁移，不能混入新功能 | 采用，作为下一阶段主干 |
| React/Vite 后接 Tauri 2 桌面壳 | 桌面文件访问、本地资料库、系统集成和安装包交付更清晰；比 Electron 更轻 | 会增加 Rust/Tauri 工具链、打包和平台测试成本 | 采用，作为第一版桌面壳 |
| Electron 桌面壳 | Chromium/Node 生态成熟，调试和插件多 | 运行时更重，安装体积和攻击面更大 | 仅作为 fallback |
| 立即做后端 Web | 适合账号、云同步、远端 AI 代理、多人协作 | 当前隐私策略是本地 mock；过早上后端会扩大合规和数据安全责任 | 延后 |

## 正式决策

### 1. 当前静态 Web 保留为 MVP 基线

静态 Web 已经完成 MVP 试用、流程验证和设计图沉淀。它继续作为行为参考、视觉回归基线和轻量演示入口，但不再继续承接复杂 AI 状态、设置页、本地资料库或桌面能力扩张。

保留条件：

- 不破坏已完成 MVP。
- 后续迁移时用于对照主流程和视觉基线。
- 避免在旧结构上继续堆新页面和复杂状态。

### 2. React/Vite/TypeScript 成为下一阶段工程主干

桌面版优先后，迁移不再只由复杂度触发，而是下一阶段交付前置：

- `React` 承接 App Hub、上传、选题区域、复核、错题本、详情、设置和后续错题理解等页面拆分。
- `Vite` 承接开发服务器、构建和未来 Tauri 前端集成。
- `TypeScript` 保护错题记录、选题区域、AI adapter、失败状态和本地数据边界。

迁移原则：

- 先迁移外壳、路由、共享组件和数据模型。
- 再迁移上传、选题区域、复核、错题本和详情流程。
- 保留现有 UI 设计图作为视觉回归基线。
- 迁移时不改变产品范围，不顺手加入错题分析、账号或云同步。

### 3. AI adapter 与 mock contract tests 同步抽出

真实 AI/OCR 接入前，先把业务层与供应商隔离：

- `region_detection`：从整张图返回候选题目区域。
- `ocr`：对确认题目区域做文字、公式、图表和手写相关识别。
- `structure`：把识别结果整理成可编辑题目 JSON。
- `cleanup`：生成或辅助生成干净题面。

adapter 必须先有 mock contract tests，证明 UI 不直接依赖 Qwen、豆包或任何单一 SDK。真实供应商接入前再复核官方文档、模型名称、价格、隐私和数据保留边界。

### 4. 桌面壳采用 Tauri 2 优先

桌面版是下一阶段主交付形态，因此桌面壳从“延后评估”改为“React/Vite 主干稳定后接入”：

- 优先评估并采用 Tauri 2。
- 第一轮只接必要桌面能力：文件选择、本地应用数据目录、窗口状态和基础打包验证。
- 本地数据库、系统截图、自动更新、签名、公证和多平台安装包拆成后续独立任务。
- Electron 保留为 fallback：当 Tauri 的系统 WebView 差异、插件能力或调试效率阻碍关键能力时再重新评估。

### 5. 后端与账号继续延后

启动后端的触发条件：

- 需要跨设备云同步。
- 需要家长、学生、老师多角色协作。
- 需要远端 AI 调用代理以保护供应商密钥。
- 需要统一计费、用量控制、审计或内容安全策略。
- 需要把儿童学习照片上传到受控服务端处理。

在这些条件出现前，不把后端作为 MVP 的前置复杂度。

## AI/OCR 技术路线边界

默认方向：

- 国内模型优先。
- Qwen 体系优先评估。
- 豆包视觉理解作为第二供应商或 A/B 备选。
- GPT-5.5 或海外旗舰模型不作为常规运行时默认链路，只能作为远期对照评测或极少数疑难 fallback。

分层调用：

- 常规题：低成本视觉 OCR 或轻量结构化模型。
- 复杂公式、几何图、低置信度或高价值题目：升级到更强视觉/多模态模型。
- 失败或低置信度：返回可恢复状态，不让 UI 假装识别成功。

隐私边界：

- 当前 MVP 不上传真实照片。
- 真实外部 AI/OCR 前必须有单独授权文案。
- adapter PRD 必须写清供应商数据保留、删除、日志、脱敏和失败重试策略。

## 下一步实施顺序

1. 评审 `docs/superpowers/specs/2026-05-16-desktop-first-technical-selection-design.md`。
2. 写桌面优先实施计划，拆成 React/Vite/TypeScript 迁移、AI adapter contract tests、Tauri shell 三条线。
3. 迁移静态 MVP 到 React/Vite/TypeScript，保持产品范围和视觉基线不变。
4. 抽 AI adapter 设计规格和 mock contract tests。
5. 在 React/Vite 主干稳定后接入 Tauri 2 桌面壳。
6. 小样本验证 Qwen 视觉/OCR 链路前，复核阿里云百炼和豆包官方文档、价格、隐私边界。

## 外部参考

- React 官方文档：<https://react.dev/learn/add-react-to-an-existing-project>
- Vite 官方文档：<https://vite.dev/guide/>
- Tauri 官方文档：<https://v2.tauri.app/start/>
- Electron 官方文档：<https://www.electronjs.org/docs/latest/tutorial/quick-start>
