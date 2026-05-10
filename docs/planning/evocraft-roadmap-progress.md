# EvoCraft 路线图与进度

最后更新：2026-05-10

## 路线图

### Phase 0：产品基础

目标：把最初想法沉淀为可持续维护的项目文档，保证长期开发不会丢上下文。

交付物：

- 原始想法胶囊。
- 错题收集应用 MVP PRD v1.0。
- 应用集合架构说明。
- 项目记忆文件。
- 进度记录文件。
- 后续：由 PRD 派生出的 UI 生成提示词或 UI 设计简报。

### Phase 1：错题收集应用 MVP

目标：在 EvoCraft 应用集合中推出第一个可用应用，让用户可以从一张上传照片中创建一个结构化错题记录。

预期能力：

- 上传一张图片。
- 预览图片。
- 识别或选择科目：语文、数学、英语。
- 尽可能提取题目文字。
- 对图形、公式、几何图、表格等不适合纯文本化的内容保留原图或截图。
- 生成或保存去除书写、批改、圈画痕迹后的干净题面。
- 用户可以编辑识别字段。
- 保存一个错题记录。
- 查看已保存记录。

### Phase 2：错题理解

目标：把收集到的错题变成可行动的学习帮助。

候选能力：

- 知识点标注。
- 错因分类。
- 面向孩子的讲解。
- 相似练习题生成。
- 面向家长的简要总结。

### Phase 3：学习陪伴循环

目标：让复习和练习形成长期动力。

候选能力：

- 复习队列。
- 连续学习记录。
- 轻量奖励。
- 金币。
- 虚拟人物装扮。
- 进度面板。

### Phase 4：更多学习应用

目标：让 EvoCraft 从“只有错题收集一个可用应用”的集合，成长为多应用学习助手。

候选能力：

- 背单词。
- 阅读辅助。
- 数学专项练习。
- 科学概念复习。
- 个性化每日学习计划。

## 进度记录规则

每一轮实质任务都要按时间线记录。记录必须包含：

- 本轮任务是什么
- 已完成什么
- 卡在哪里
- 执行的是什么命令
- 下一步的计划

如果没有卡点，写 `无`。命令不需要粘贴完整输出，但要保留足够复现的命令名称或关键命令。

## 当前进度

### 2026-05-10：产品文档基础与 PRD v1.0

本轮任务是什么：

- 建立 EvoCraft 的长期产品记忆，形成第一个可用于 UI 生成的错题收集应用 MVP PRD。

已完成什么：

- 创建项目文档索引、项目记忆、路线图与进度、想法胶囊。
- 明确 EvoCraft 是 AI 学习助手应用集合，`错题收集` 是第一个可用应用。
- 明确错题收集不只是保存照片，还要生成去除书写、批改、圈画痕迹后的干净题面。
- 生成正式 PRD v1.0，补齐本地优先、AI 能力契约、错误状态、隐私边界、验收标准和 UI 生成摘要。
- 初始化 git 仓库，绑定并推送到 `git@github.com:zhawei98213/evocraft.git`。

卡在哪里：

- 无。仍待后续确认技术栈、真实 AI/OCR 服务、App Hub 是否展示未来应用占位、第一批目标年级。

执行的是什么命令：

- `find docs -type f -maxdepth 4 -print`
- `rg` 占位词扫描命令，范围为 `docs`
- `rg -n "应用集合|App Hub|错题收集|干净题面|原图|本地优先|AI 能力契约|隐私|验收标准|决策边界" docs/prd/2026-05-10-wrong-question-capture-mvp-prd.md`
- `git init -b main`
- `git remote add origin git@github.com:zhawei98213/evocraft.git`
- `git add .gitignore docs`
- `git commit ...`
- `git push -u origin main`

下一步的计划：

- 把 PRD v1.0 转成 UI 生成简报，明确 App Hub、错题收集应用入口、屏幕、组件、文案、视觉方向。

### 2026-05-10：想法胶囊铁律

本轮任务是什么：

- 把“新增 PRD、更新 PRD 或出现明确产品想法时，必须同步更新想法胶囊”的规则写成仓库级铁律。

已完成什么：

- 新增项目级 `AGENTS.md`。
- 在 `AGENTS.md` 中写入想法胶囊铁律。
- 更新 README、项目记忆、路线图与进度。
- 在想法胶囊中新增“胶囊记录铁律”和按日期记录的想法时间线。
- 提交并推送到远端。

卡在哪里：

- 无。

执行的是什么命令：

- `find .. -maxdepth 2 -name AGENTS.md -print`
- `rg -n "铁律|想法胶囊|PRD|时间线|提炼|复制 PRD|copy" AGENTS.md docs/README.md docs/planning docs/ideas`
- `git diff --check`
- `git add AGENTS.md docs/README.md docs/ideas/2026-05-10-evocraft-seed-capsule.md docs/planning/evocraft-project-memory.md docs/planning/evocraft-roadmap-progress.md`
- `git commit ...`
- `git push`

下一步的计划：

- 后续任何 PRD 或明确产品想法变更，都先提炼观点写入想法胶囊，再提交。

### 2026-05-10：长期记忆与结构化进度机制

本轮任务是什么：

- 把长期记忆和进度机制写入 `AGENTS.md`，并让进度文件固定记录任务、完成、卡点、命令、下一步计划。

已完成什么：

- 在 `AGENTS.md` 中新增长期记忆、进度机制和 git 持久化规则。
- 在 README 和项目记忆中同步长期记忆规则。
- 在想法胶囊中提炼记录“长期开发不能依赖聊天上下文”的观点。
- 将当前进度从简单表格升级为结构化进度记录。

卡在哪里：

- 无。

执行的是什么命令：

- `sed -n '1,220p' AGENTS.md`
- `sed -n '1,180p' docs/planning/evocraft-roadmap-progress.md`
- `sed -n '1,140p' docs/planning/evocraft-project-memory.md`
- `sed -n '1,130p' docs/ideas/2026-05-10-evocraft-seed-capsule.md`
- `git status --short --branch`
- `rg` 长期记忆与进度机制关键词扫描命令，范围为 `AGENTS.md` 和 `docs`
- `rg` 占位词扫描命令，范围为 `AGENTS.md` 和 `docs`
- `git diff --check`
- `git diff --stat`
- `git add AGENTS.md docs/README.md docs/ideas/2026-05-10-evocraft-seed-capsule.md docs/planning/evocraft-project-memory.md docs/planning/evocraft-roadmap-progress.md`
- `git commit ...`
- `git push`

下一步的计划：

- 继续推进 PRD v1.0 到 UI 生成简报。

## 下一步

1. 把 PRD v1.0 转成 UI 生成简报，明确 App Hub、错题收集应用入口、屏幕、组件、文案、视觉方向。
2. 生成或绘制第一版桌面端 UI 图。
3. 选择技术栈。
4. 为错题收集 MVP 制定实现计划。

## 持续跟踪风险

- OCR 对手写中文、数学公式、英文、图形题的稳定性可能差异很大。
- 书写痕迹去除可能误删题干、图形或公式，需要保留原图并提供复核机制。
- 顶层应用集合架构不能过度工程化；第一版只保留清晰入口和扩展方向，不实现复杂插件系统。
- 面向孩子的产品需要认真设计隐私、授权、照片存储、删除机制。
- 游戏化容易扩大范围；第一版不要让奖励系统拖慢错题收集闭环。
- 移动端要提前考虑信息架构，但不能让移动适配阻塞桌面 MVP。
