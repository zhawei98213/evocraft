# 2026-05-16 MVP 技术路线决策

## 决策状态

状态：已确认，用于 AI adapter 设计前的工程路线基线。

决策时间：2026-05-16

输入材料：

- MVP PRD v1.5：`docs/prd/2026-05-10-wrong-question-capture-mvp-prd.md`
- 已实现 MVP UI 设计图：`docs/design/implemented-mvp/2026-05-16-implemented-mvp-ui-design.md`
- 当前静态 Web 入口：`app/index.html`
- 收尾加固设计：`docs/superpowers/specs/2026-05-16-mvp-hardening-tech-route-design.md`
- 选题区域与国内模型策略设计：`docs/superpowers/specs/2026-05-13-question-region-domestic-model-design.md`

## 一句话结论

当前 MVP 继续保留零依赖静态 Web 作为可试用产品和 UI 基线；下一步先做 provider-agnostic AI adapter 与 mock contract tests。React/Vite 是下一阶段迁移目标，但只有当 AI 状态、页面数量、共享组件或表单复杂度达到触发条件后再启动。Electron/Tauri、后端 Web、账号和云同步继续延后。

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
| 继续静态 Web + AI adapter | 变更最小；现有 UI 可试用；能先把 AI 契约和隐私边界做稳 | 长期组件复用、路由、复杂异步状态会吃力 | 采用 |
| 立即迁移 React/Vite | 组件化、状态拆分、测试生态更完整；Vite 官方支持快速创建 React/TS 项目 | 会中断当前 MVP 收尾；迁移本身不直接提高 OCR 质量或隐私可信度 | 准备触发条件，不立即迁移 |
| 立即做 Electron/Tauri 桌面壳 | 桌面文件访问、本地资料库、系统集成更强 | 当前还没有本地文件库、轻量数据库或离线资料管理需求；Tauri/Electron 会增加打包与分发成本 | 延后 |
| 立即做后端 Web | 适合账号、云同步、远端 AI 代理、多人协作 | 当前隐私策略是本地 mock；过早上后端会扩大合规和数据安全责任 | 延后 |

## 正式决策

### 1. 当前阶段继续静态 Web

静态 Web 已经足够承载 UI 试用、流程验证和设计图沉淀。本轮不为了“看起来更工程化”而迁移框架。

保留条件：

- 只服务单个错题收集应用。
- 仍以本地 mock AI 为主。
- 页面数量、组件复用和异步状态还没有压垮维护。
- 还没有账号、云同步、本地文件库或外部 AI 代理。

### 2. 下一步先做 AI adapter，而不是先换栈

真实 AI/OCR 接入前，先把业务层与供应商隔离：

- `region_detection`：从整张图返回候选题目区域。
- `ocr`：对确认题目区域做文字、公式、图表和手写相关识别。
- `structure`：把识别结果整理成可编辑题目 JSON。
- `cleanup`：生成或辅助生成干净题面。

adapter 必须先有 mock contract tests，证明 UI 不直接依赖 Qwen、豆包或任何单一 SDK。真实供应商接入前再复核官方文档、模型名称、价格、隐私和数据保留边界。

### 3. React/Vite 作为下一阶段迁移目标

不立即迁移，但现在开始把迁移目标定为 `React + Vite + TypeScript`。

触发条件：满足任意两项即启动迁移计划。

- `app/main.js` 状态继续膨胀，新增 AI 进度、重试、供应商切换或队列状态后难以局部理解。
- 新增错题理解、复习队列、分析页或设置页，导致页面分支明显增加。
- 同类 UI 组件在三个以上页面重复出现，例如记录卡片、状态 chip、AI 任务面板、图像对比面板。
- 表单校验、异步错误恢复、保存草稿和本地持久化状态需要更清晰的状态边界。
- 需要组件级测试或更可靠的 UI 回归测试，而静态 DOM 字符串开始阻碍测试。

迁移原则：

- 先迁移外壳、路由和共享组件，再迁移 AI adapter 调用。
- 保留现有 UI 设计图作为视觉回归基线。
- 迁移时不改变产品范围，不顺手加入错题分析、账号或云同步。

### 4. 桌面壳延后，但保留 Tauri/Electron 评估位

延后原因：

- 当前本地持久化仍是原型级 `localStorage`。
- 没有明确需要系统文件夹、离线资料库、系统截图、打印、自动更新或本地数据库。
- 桌面壳会带来签名、更新、安装包和跨平台兼容成本。

未来评估顺序：

- 优先评估 Tauri：当需要轻量桌面壳、本地文件访问和较小安装体积时。
- 再评估 Electron：当需要 Chromium/Node 生态、现成桌面插件或更快 JS 桌面集成时。

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

1. 以 PRD 编写规范写一份 AI adapter / OCR 链路 PRD，明确输入输出、失败降级、隐私授权、模型分层和验收标准。
2. 写 AI adapter 设计规格和 mock contract tests。
3. 在静态 Web 中接入 mock adapter，保持当前 UI 行为不变。
4. 小样本验证 Qwen 视觉/OCR 链路前，复核阿里云百炼和豆包官方文档、价格、隐私边界。
5. 只有当 React/Vite 触发条件满足后，再写迁移计划并执行框架迁移。

## 外部参考

- React 官方文档：<https://react.dev/learn/add-react-to-an-existing-project>
- Vite 官方文档：<https://vite.dev/guide/>
- Tauri 官方文档：<https://v2.tauri.app/start/>
- Electron 官方文档：<https://www.electronjs.org/docs/latest/tutorial/quick-start>
