# EvoCraft 项目记忆

最后更新：2026-05-26

## 一句话产品意图

EvoCraft 是面向上海孩子的 AI 学习助手应用集合。第一阶段从桌面端 MVP 做起，只实现集合里的第一个应用：用户上传一张错题照片，系统帮助识别并整理成一个结构化错题记录。

## 产品方向

- 产品形态：AI 学习助手应用集合，顶层保留应用入口和共享能力架构。
- 第一平台：先做桌面版；下一阶段以 `React + Vite + TypeScript` 为前端工程主干，并在主干稳定后接入 `Electron` 桌面壳。当前静态 Web 保留为 MVP 行为和视觉基线。
- 未来平台：平板和智能手机。
- 初始用户：上海孩子，以及协助孩子整理学习资料的家长或老师。
- 初始场景：从练习册、试卷、作业本、课堂练习照片中选择一道错题并收集；照片可能包含多道题。
- 初始科目：语文、数学、英语。
- 识别需求：照片上传、候选题目区域检测、手动画框兜底、OCR、科目判断、题目区域提取、图形/表格/几何图/公式等视觉内容保留，以及去除学生书写、批改、圈画等痕迹后的干净题面生成。
- 后续扩展：错题分析、背单词、游戏经济、金币收集、虚拟人物装扮，以及更多可插入 EvoCraft 应用集合的学习应用。

## 当前产品阶段

阶段：`1 - 错题收集应用 MVP`

当前目标：MVP 收集闭环已完成；桌面优先迁移第一阶段已落地，当前有 `React + Vite + TypeScript` 工程主干、typed wrong-question domain、provider-agnostic mock AI adapter contract、storage port、React UI 迁移、截图验证、最小 `Electron` 桌面壳、Electron 本地记录存储、Qwen 评测/adapter spike、main-process real AI IPC，以及应用内真实 AI 测试模式和外部 AI 授权提示。下一阶段应先用脱敏样本验证真实识别效果，再决定是否扩大样本和第二供应商 A/B。

当前 MVP 边界：只完成 EvoCraft 应用集合中第一个应用“错题收集”的核心闭环，也就是“从一张可能包含多道题的上传图片中，确认一道题区域并收集成错题记录”。本轮已把隐私确认、本地删除/清空和失败恢复纳入 MVP 收尾范围。保留应用集合的顶层结构，但暂不实现整卷批量拆题、其他学习应用、完整游戏化经济或复杂多应用平台能力。

## 已确认决策

- 产品名称：`EvoCraft`。
- 第一个可用应用：`错题收集`。
- EvoCraft 顶层应保留应用集合架构；错题收集是第一个应用，不是整个产品的终点。
- PRD v1.5 按 `docs/prd/2026-05-16-prd-writing-standards.md` 重整，采用本地优先、国内模型优先和 provider-agnostic AI 能力契约；UI 阶段可以先使用 mock 识别结果，并把隐私确认、本地删除/清空和失败恢复作为 MVP 收尾要求。
- 后续所有新建 PRD、重要更新 PRD 和产品缺口反馈触发的 PRD 更新，都必须遵循 `docs/prd/2026-05-16-prd-writing-standards.md`。
- 如果既有 PRD 中有规范尚未覆盖但应复用的结构、产品原则、AI/隐私/数据边界或验收方式，必须在同一次变更中反向提炼进 PRD 编写规范。
- 通过 `@superpowers`、Superpowers 技能或其他 Codex 技能/工具流程产生的项目相关结果，必须保存到主项目目录 `/Users/zha/Documents/CodeSpaces/evo-craft` 内；不能只留在聊天、临时目录、worktree、浏览器状态、外部工具或 scratch 位置。
- 任何新 PRD、PRD 重要更新或明确产品想法，都必须同步更新想法胶囊；想法胶囊记录提炼后的观点，不复制 PRD 原文。
- 每次有实质进度变化时，必须更新 `docs/planning/evocraft-roadmap-progress.md`，并记录本轮任务、已完成、卡点、执行命令、下一步计划。
- 聊天上下文不能作为唯一记忆；长期状态必须写入仓库文档并提交到远端。
- 第一版设计目标：桌面优先，同时在结构上为平板和手机预留空间。
- AI 识别结果必须允许用户编辑，因为 OCR、手写识别、图形识别都可能出错。
- 原图或题目截图必须作为错题记录的一部分保留。
- 错题记录默认用于复习和分析时，应优先展示去除书写痕迹后的干净题面；原图保留用于溯源、校验和重新处理。
- 游戏化是长期身份的一部分，但不进入第一个 MVP 的核心功能；最多体现在轻微的视觉气质上。
- UI 视觉基线选定 B 方案 `未来学习工作台`：桌面端三栏工作台、蓝色主功能色、青绿色辅助提示、清晰 AI 状态标签、工具感中保留儿童学习温度。
- Logo 首轮方向已保存到 `docs/design/logo/2026-05-18-evocraft-logo-options.md`。用户已确认沿左上 A 的“扫描框 + 打开笔记 + 整理完成”方向作为当前选定 logo 方向，final candidate 保存为 `docs/design/logo/2026-05-18-evocraft-logo-scan-notebook-final.png`。当前已接入 React 应用内品牌位、renderer favicon 和 Electron macOS `.icns`，导出资源已处理为透明圆角矩形；App Hub 的错题收集卡片保持原来的业务入口图标。后续发布前仍需矢量化、Windows `.ico` 和真实 dock/installer 视觉验收。
- `docs/design/figma/` 已按用户要求删除并废弃，不再恢复为当前设计基线；当前设计基线以 `docs/design/implemented-mvp/` 和 `docs/design/desktop-trunk/` 的截图与说明为准。
- 第一个 MVP 采用零依赖静态 Web 实现，入口为 `app/index.html`；当前用本地 mock AI 识别和浏览器 `localStorage` 保存错题记录。
- MVP 必须提供独立 `错题本` 入口和全部记录列表；保存后的错题不能只藏在最近记录或单条详情里。
- 当用户明确指出缺失功能或要求补功能时，必须同步更新相关 PRD 和想法胶囊；实现不能只停留在代码层。
- 多题照片进入识别前必须有独立 `选择题目区域` 步骤：AI 先给候选框，用户可选择、微调或手动画框；第一版不做多框合并和批量拆题。
- `选择题目区域` 必须允许删除误识别或干扰手动画框的候选框；删除全部候选框后，用户应能通过手动画框或重新自动找题恢复流程。
- 上传进入题目区域前必须有本地隐私确认；当前 MVP 不上传真实照片，未来外部 AI/OCR 上传必须单独授权。
- 错题本必须支持删除单条本地记录和清空当前浏览器本地数据，避免原型测试数据污染后续流程。
- 保存、本地存储、自动找题和选区确认失败必须停留在可恢复状态，不应让用户误以为记录已保存或流程不可继续。
- 错题记录必须同时保留整张原图和用户确认后的题目区域；详情页可溯源，默认复习仍看干净题面。
- 静态 Web MVP 已实现 `选择题目区域` 闭环：mock 候选框、删除候选框、手动画框、拖动/缩放、确认后识别、保存题目区域，以及详情页在干净题面、确认区域和整张原图之间切换。
- 静态 Web MVP 已完成收尾加固：上传前本地隐私确认、单条记录删除、清空本地错题本、候选框清空提示、保存失败提示和本地存储 helper 失败结果。
- 已实现 MVP UI 设计图保存在 `docs/design/implemented-mvp/2026-05-16-implemented-mvp-ui-design.md` 和 `docs/design/implemented-mvp/screens/*.png`，作为技术路线决策和后续视觉回归基线。
- 技术路线决策：桌面版优先；当前静态 Web 只保留为 MVP 行为和视觉基线，下一阶段迁移到 `React + Vite + TypeScript`，同步抽 provider-agnostic AI adapter 与 mock contract tests，再接入 `Electron` 做第一版可安装桌面壳。Tauri 仅作为未来轻量化、安装体积或权限面优化的备选；后端 Web、账号和云同步继续延后。
- React/Vite 迁移不再只是未来复杂度门槛；用户已确认桌面版优先，下一阶段直接把 `React + Vite + TypeScript` 作为工程主干迁移目标。
- 桌面优先迁移已完成第一阶段工程落地：React/Vite/TypeScript 主干、typed wrong-question domain、mock AI adapter contract、storage port、React UI 迁移、desktop trunk 截图基线和 Electron shell。
- Electron shell 当前只接最小桌面能力边界：main/preload/renderer 分层、禁用 renderer Node access、context isolation、sandbox、CSP、图片选择 IPC、React 上传流中的单一主上传区和 Electron directory build；自动更新、签名、公证、本地数据库和生产安装包另列后续任务。
- 上传页交互要求：桌面版只能露出一个主上传区，点击主上传区调用 Electron 系统文件选择；浏览器版点击同一主上传区走 `<input type=file>`。上传后的预览必须显示真实选择的图片，mock 占位图只保留给 AI/mock 结果兜底，不用于上传反馈。
- 真实 AI/OCR 接入默认采用国内模型优先，不把 GPT-5.5 作为常规运行时投入；第一候选链路是阿里云百炼 Qwen 体系，火山引擎豆包视觉理解作为备选或后续 A/B。
- 模型调用必须分层：常规题用低成本视觉 OCR/轻量结构化模型，复杂公式、几何图和低置信度场景再升级到更强模型。
- 第一版真实 AI 接入只做识别整理：候选题目区域、OCR、科目判断、结构化错题草稿、视觉片段保留、需复核项和模型调用记录；解题、讲解、错因、知识点和相似题进入 Phase 2 错题理解。
- 干净题面第一版采用结构化重排策略，由应用根据 AI 输出渲染可编辑题面；图像去痕、重绘和 inpainting 作为后续专项能力，不进入首轮真实 AI 接入。
- 桌面版真实 AI 调用放在 Electron main process，React renderer 只通过 preload IPC 请求识别，不接触 API key；当前阶段不引入 SaaS backend，未来有账号、同步、多端协作或云端数据价值时再迁移。
- 应用层真实 AI 仍默认关闭并回到本地 mock；只有 Electron main 报告 real mode 且用户显式勾选外部 AI 授权后，renderer 才会通过 preload 调用 desktop AI adapter。缺少授权时必须保留已选图片和可恢复状态，不让用户重新上传。
- 桌面本地持久化第一版采用文件夹 + JSON 索引：每条错题一个目录，保存 `record.json`、原图、确认区域图、干净题面渲染数据和模型调用日志；`index.json` 只做列表摘要，可从记录目录重建，后续保留迁 SQLite 或 SaaS 的路径。
- 真实 AI 效果验证采用本机评测脚本调用云端模型，不做模型训练或本地模型部署；第一轮用 10-15 张三科混合脱敏样本验证 schema、prompt、成本、失败边界和人工修正点，再扩到 50 张。
- 重要实现前必须先有详细设计文档体系：PRD/产品边界、详细设计、实施计划、agent run ledger 和验证记录要按 `docs/planning/2026-05-23-design-documentation-system.md` 组织。
- 使用 subagent-driven 前必须创建 run ledger，并为每个 agent 维护工作计划和进度记录；当前真实 AI 识别接入 run ledger 位于 `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/README.md`。
- subagent-driven 的“每个 agent”包含实现 agent、spec reviewer 和 code quality reviewer；reviewer 不能只留在聊天或总表里，必须有独立 agent log。

## 开放问题

- 第一批目标年级是小学低年级、小学高年级、初中，还是更宽泛的 K12？
- Phase 2 错题理解中，解题、讲解、错因、知识点和相似题的优先级如何排序？
- 第一条真实 AI/OCR 链路从 mock 切到阿里云百炼 Qwen 体系时，外部 AI 授权文案、样本脱敏规则和本地配置方式如何最终呈现？
- 火山引擎豆包视觉理解是否作为第二供应商接入，何时做 A/B。

## 记忆更新协议

这个文件记录稳定背景和长期决策；进度变化写入路线图文件。

当后续工作改变产品方向时：

1. 在 `已确认决策` 中新增或修改决策。
2. 已回答的问题从 `开放问题` 中移除或改写为决策。
3. 如果变更涉及 PRD 或明确想法，先在 `docs/ideas/2026-05-10-evocraft-seed-capsule.md` 的时间线中添加提炼后的观点。
4. 如果用户明确指出缺失功能或要求补功能，更新相关 PRD，并同步更新想法胶囊。
5. 在 `docs/planning/evocraft-roadmap-progress.md` 添加具体进度记录，包含本轮任务、已完成、卡点、执行命令、下一步计划。
6. PRD 保持聚焦：一个 PRD 尽量只覆盖一个主要能力。
7. 创建或更新 PRD 前，必须读取 `docs/prd/2026-05-16-prd-writing-standards.md`；如果 PRD 更新暴露规范缺口，同步更新该规范。
8. 使用技能或工具 workflow 产生项目相关产物时，必须把 durable 输出保存到 `/Users/zha/Documents/CodeSpaces/evo-craft` 中的合适位置，并纳入同一次提交。
9. 进入 subagent-driven 前，必须确认详细设计文档、实施计划和 agent run ledger 已存在；每个 agent 的任务计划、进度、命令、验证和 review 必须写入 `docs/superpowers/agent-runs/`。

## 文档与注释标准

- 产品文档要区分“原始想法”和“已收敛需求”。
- PRD 应遵循 `docs/prd/2026-05-16-prd-writing-standards.md`，并包含用户目标、范围、非目标、流程、页面、数据形态、验收标准、风险、交接摘要和必要的规范反向提炼。
- 开发计划要能切成小步，每个功能切片都可以独立实现和验证。
- 代码注释要解释不明显的产品规则、AI/OCR 假设、隐私敏感处理、状态迁移。不要写只是复述语法的注释。
