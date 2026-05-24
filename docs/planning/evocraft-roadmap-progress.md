# EvoCraft 路线图与进度

最后更新：2026-05-24

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

### 2026-05-10：MVP UI 原型生成

本轮任务是什么：

- 根据 PRD v1.0 准备并生成第一版桌面端 UI 原型。

已完成什么：

- 读取项目级 `AGENTS.md`、项目记忆、路线图进度、想法胶囊和 PRD v1.0。
- 创建 `docs/design/2026-05-10-mvp-ui-prototype-brief.md`，沉淀 UI 原型生成简报和 ImageGen Prompt。
- 更新 README，把 UI 原型简报加入文档索引。
- 更新想法胶囊，提炼第一版 UI 原型的产品观点：桌面端工具感、App Hub、四屏流程、去痕复核。
- 准备在文档提交后调用内置 `image_gen` 生成 UI 原型图。

卡在哪里：

- 无。图片会先作为会话中的原型预览；若后续需要纳入仓库资产，需要再基于生成结果保存到项目目录。

执行的是什么命令：

- `sed -n '1,140p' AGENTS.md`
- `sed -n '1,120p' docs/planning/evocraft-project-memory.md`
- `sed -n '1,210p' docs/planning/evocraft-roadmap-progress.md`
- `sed -n '1,130p' docs/ideas/2026-05-10-evocraft-seed-capsule.md`
- `sed -n '1,460p' docs/prd/2026-05-10-wrong-question-capture-mvp-prd.md`
- `mkdir -p docs/design`

下一步的计划：

- 提交并推送 UI 原型简报。
- 调用内置 `image_gen` 生成 UI 原型图。
- 根据生成的 UI 原型判断是否需要二次迭代。
- 如果原型方向确认，再进入 UI 实现或更细的页面设计稿拆分。

### 2026-05-10：UI 风格探索

本轮任务是什么：

- 使用 `imagegen` 再生成几套 EvoCraft UI 风格方向，供后续选择视觉基线。

已完成什么：

- 新增 `docs/design/2026-05-10-ui-style-options-brief.md`，定义四套风格方向：清爽学习桌、未来学习工作台、纸面笔记本、成长收集册。
- 更新 README，把 UI 风格探索简报加入文档索引。
- 更新想法胶囊，记录 UI 风格探索的产品观点：风格要服务错题收集的可信复核流程。

卡在哪里：

- 无。图片会先作为会话中的风格对比预览；如果后续选定某一套，再沉淀为正式视觉基线。

执行的是什么命令：

- `git status --short --branch`
- `sed -n '1,120p' AGENTS.md`
- `sed -n '1,120p' docs/planning/evocraft-project-memory.md`
- `sed -n '1,260p' docs/planning/evocraft-roadmap-progress.md`
- `sed -n '1,120p' docs/ideas/2026-05-10-evocraft-seed-capsule.md`
- `sed -n '1,220p' docs/design/2026-05-10-mvp-ui-prototype-brief.md`
- `rg` 占位词扫描命令，范围为 `docs` 和 `AGENTS.md`
- `git diff --check`
- `git add docs/README.md docs/ideas/2026-05-10-evocraft-seed-capsule.md docs/planning/evocraft-roadmap-progress.md docs/design/2026-05-10-ui-style-options-brief.md`
- `git commit ...`
- `git push`

下一步的计划：

- 调用内置 `image_gen` 生成四套 UI 风格对比图。
- 用户选择一个方向后，将其沉淀为正式 UI 视觉基线。

### 2026-05-10：B 方案设计基线

本轮任务是什么：

- 根据用户选择的 B 方案 `未来学习工作台`，参考 `docs/design/temlpalte-notion.md` 的设计系统拆分方式，组装 EvoCraft 第一版 MVP 的设计基线文档。

已完成什么：

- 新增 `docs/design/desgin.md`，把 B 方案沉淀为正式设计基线。
- 保留模板的拆分方式：Overview、Colors、Typography、Layout、Elevation、Shapes、Components、Responsive Behavior、Do's and Don'ts。
- 将色系统一改为 B 方案：蓝绿色主功能色、蓝色 AI 信息、玫红复核提示、暖黄色轻成长点缀。
- 明确桌面端三栏工作台结构：App Hub rail、错题主工作区、AI 复核面板。
- 更新 README、项目记忆和想法胶囊，记录 B 方案已成为当前视觉方向。

卡在哪里：

- 无。文件名按用户请求保留为 `desgin.md`，后续如需标准化可另行改名为 `design.md`。暂存检查发现参考模板末尾多一个空白行，已只清理该空白行；提交钩子要求 OmX co-author trailer，已补齐后提交。

执行的是什么命令：

- `sed -n '1,260p' docs/design/temlpalte-notion.md`
- `sed -n '261,620p' docs/design/temlpalte-notion.md`
- `sed -n '1,260p' docs/design/2026-05-10-ui-style-options-brief.md`
- `sed -n '1,220p' docs/ideas/2026-05-10-evocraft-seed-capsule.md`
- `sed -n '1,260p' docs/planning/evocraft-roadmap-progress.md`
- `sed -n '1,240p' docs/planning/evocraft-project-memory.md`
- `git status --short --branch`
- `find docs/design -maxdepth 1 -type f -print | sort`
- `rg -n "未来学习工作台|B 方案|desgin|蓝绿色|去痕需复核|App Hub" docs/README.md docs/design docs/ideas docs/planning`
- `rg` 占位词扫描命令，范围为 `AGENTS.md` 和 `docs`
- `git diff --check`
- `git diff --stat`
- `git diff --cached --check`
- `git diff --cached --stat`
- `tail -n 8 docs/design/temlpalte-notion.md | nl -ba`
- `git add docs/README.md docs/design/desgin.md docs/design/temlpalte-notion.md docs/ideas/2026-05-10-evocraft-seed-capsule.md docs/planning/evocraft-project-memory.md docs/planning/evocraft-roadmap-progress.md`
- `git commit ...`
- `git push`

下一步的计划：

- 用 `docs/design/desgin.md` 作为 UI 图细化和前端实现的视觉输入。
- 进入技术栈选择与第一版 App Shell / 错题收集页面实现计划。

### 2026-05-10：B 方案正式 UI 图生成

本轮任务是什么：

- 根据 PRD v1.0 和 B 方案 `未来学习工作台` 设计基线，生成可指导后续 coding 的正式桌面端 UI 图。

已完成什么：

- 新增 `docs/design/2026-05-10-b-style-ui-generation-brief.md`，沉淀正式 ImageGen Prompt。
- 将 UI 图目标从风格探索收敛为 coding reference：四屏 2x2 图板，覆盖 App Hub、上传页、识别复核页、已保存详情页。
- 更新 README 和想法胶囊，记录正式 UI 图必须服务后续组件拆分和实现。
- 准备调用内置 `imagegen` 生成正式 UI 图。

卡在哪里：

- 无。生成图像会先作为会话预览；如果后续需要纳入仓库资产，应从生成结果中选择后再保存到项目目录。

执行的是什么命令：

- `sed -n '1,260p' docs/prd/2026-05-10-wrong-question-capture-mvp-prd.md`
- `sed -n '261,560p' docs/prd/2026-05-10-wrong-question-capture-mvp-prd.md`
- `sed -n '1,260p' docs/design/desgin.md`
- `sed -n '261,520p' docs/design/desgin.md`
- `sed -n '1,260p' docs/planning/evocraft-roadmap-progress.md`
- `sed -n '261,380p' docs/planning/evocraft-roadmap-progress.md`
- `sed -n '1,180p' docs/ideas/2026-05-10-evocraft-seed-capsule.md`
- `sed -n '1,220p' /Users/zha/.codex/skills/.system/imagegen/SKILL.md`
- `git status --short --branch`
- `rg -n "正式 UI 图|coding|ImageGen Prompt|App Hub|识别检查|去痕复核|未来学习工作台" docs/design/2026-05-10-b-style-ui-generation-brief.md docs/README.md docs/ideas/2026-05-10-evocraft-seed-capsule.md docs/planning/evocraft-roadmap-progress.md`
- `rg` 占位词扫描命令，范围为 `AGENTS.md` 和 `docs`
- `git diff --check`
- `git add docs/README.md docs/design/2026-05-10-b-style-ui-generation-brief.md docs/ideas/2026-05-10-evocraft-seed-capsule.md docs/planning/evocraft-roadmap-progress.md`
- `git commit ...`
- `git push`

下一步的计划：

- 提交并推送正式 UI 图生成简报。
- 调用内置 `imagegen` 生成正式 UI 图。
- 根据生成结果选择是否继续生成单屏细化图。

### 2026-05-10：B 方案蓝色主视觉修正

本轮任务是什么：

- 根据用户反馈修正 B 方案视觉方向：B 方案应为蓝色主导，而不是偏绿色或蓝绿色主导，并重新生成 UI 图。

已完成什么：

- 更新 `docs/design/desgin.md`，将主色从 `Primary Teal` 修正为 `Primary Blue #2563EB`。
- 将青绿色降级为 AI 处理中、图形保留等辅助提示色，不再作为主 CTA 或主视觉。
- 将干净题面、App rail、背景等 surface 从偏薄荷绿改为浅蓝体系。
- 更新 `docs/design/2026-05-10-b-style-ui-generation-brief.md` 的正式 ImageGen Prompt，避免再次生成偏绿色 UI。
- 更新 `docs/design/2026-05-10-ui-style-options-brief.md`、项目记忆和想法胶囊，统一记录 B 方案是蓝色主导。

卡在哪里：

- 无。之前生成的 UI 图偏绿，不能作为后续 coding 参考；本轮会基于修正后的蓝色主视觉重新生成。

执行的是什么命令：

- `sed -n '1,220p' AGENTS.md`
- `sed -n '1,220p' docs/planning/evocraft-project-memory.md`
- `sed -n '1,380p' docs/planning/evocraft-roadmap-progress.md`
- `rg -n "蓝绿|蓝绿色|green|teal|Teal|mint|Mint|#0F9F9A|#08716F|#DDF5F1|#F0FBF8|#EEF7F4|#F7FAF8|Primary" docs/design/desgin.md docs/design/2026-05-10-b-style-ui-generation-brief.md docs/design/2026-05-10-ui-style-options-brief.md docs/ideas/2026-05-10-evocraft-seed-capsule.md docs/planning/evocraft-project-memory.md`
- `sed -n '1,120p' docs/design/desgin.md`
- `sed -n '230,410p' docs/design/desgin.md`
- `sed -n '45,115p' docs/design/2026-05-10-b-style-ui-generation-brief.md`
- `rg -n "#2563EB|#1D4ED8|Primary Blue|蓝色主|Blue must dominate|青绿色只|pale-blue|#F5F8FF|#06B6D4" docs/design/desgin.md docs/design/2026-05-10-b-style-ui-generation-brief.md docs/design/2026-05-10-ui-style-options-brief.md docs/ideas/2026-05-10-evocraft-seed-capsule.md docs/planning/evocraft-project-memory.md`
- `rg -n "蓝绿色主色|Primary Teal|#0F9F9A|#08716F|#DDF5F1|#F0FBF8|mint clean|Primary teal|teal primary|blue-green primary|蓝绿色功能色" docs/design/desgin.md docs/design/2026-05-10-b-style-ui-generation-brief.md docs/design/2026-05-10-ui-style-options-brief.md docs/ideas/2026-05-10-evocraft-seed-capsule.md docs/planning/evocraft-project-memory.md || true`
- `rg` 占位词扫描命令，范围为 `AGENTS.md` 和 `docs`
- `git diff --check`
- `git add docs/design/desgin.md docs/design/2026-05-10-b-style-ui-generation-brief.md docs/design/2026-05-10-ui-style-options-brief.md docs/ideas/2026-05-10-evocraft-seed-capsule.md docs/planning/evocraft-project-memory.md docs/planning/evocraft-roadmap-progress.md`
- `git commit ...`
- `git push`

下一步的计划：

- 验证文档中不再存在 B 方案偏绿色主视觉描述。
- 提交并推送修正后的设计文档。
- 调用内置 `imagegen` 重新生成蓝色主导的正式 UI 图。

### 2026-05-10：Figma 可导入 UI 矢量稿

本轮任务是什么：

- 根据蓝色 B 方案 UI 图，绘制可导入 Figma 的完整 UI 参考稿，方便后续在 Figma 中继续绘制原型并指导 coding。

已完成什么：

- 新增 `tools/generate-figma-ui.mjs`，用当前设计 token 和屏幕结构生成 Figma 友好的 SVG。
- 生成四屏总览 SVG：`docs/design/figma/evocraft-b-ui-board.svg`。
- 生成四个独立页面 SVG：App Hub、上传页、识别复核页、已保存详情页。
- 新增 `docs/design/figma/README.md`，说明如何导入 Figma、如何拆组件和如何重新生成。
- 新增 `docs/design/figma/evocraft-b-tokens.json`，方便在 Figma 中建立颜色、圆角、间距和字体变量。
- 更新 README、项目记忆和想法胶囊，记录 Figma 输入包已成为后续原型绘制参考。

卡在哪里：

- 生成脚本第一次运行时，Node `path` 模块和 SVG path helper 命名冲突，已改为 `nodePath` / `svgPath` 后恢复。

执行的是什么命令：

- `find /Users/zha/.codex/generated_images/019e0fb7-8d9d-7d70-8279-ecfba4d479e2 -maxdepth 1 -type f -print | sort -r | head -20`
- `ls -lt /Users/zha/.codex/generated_images/019e0fb7-8d9d-7d70-8279-ecfba4d479e2 | head -20`
- `sed -n '1,180p' docs/design/desgin.md`
- `sed -n '180,420p' docs/design/desgin.md`
- `sed -n '1,160p' docs/design/2026-05-10-b-style-ui-generation-brief.md`
- `sed -n '1,180p' docs/ideas/2026-05-10-evocraft-seed-capsule.md`
- `git status --short --branch`
- `node tools/generate-figma-ui.mjs`
- `find docs/design/figma -type f -maxdepth 3 -print | sort`
- `wc -c docs/design/figma/evocraft-b-ui-board.svg docs/design/figma/screens/*.svg`
- `xmllint --noout docs/design/figma/evocraft-b-ui-board.svg docs/design/figma/screens/*.svg`
- `qlmanage -t -s 1800 -o docs/design/figma/preview docs/design/figma/evocraft-b-ui-board.svg`
- `rm -rf docs/design/figma/preview`
- `node --check tools/generate-figma-ui.mjs`
- `node -e 'JSON.parse(require("fs").readFileSync("docs/design/figma/evocraft-b-tokens.json", "utf8")); console.log("tokens json ok")'`
- `find docs/design/figma tools -type f -print | sort`
- `rg -n "Figma|evocraft-b-ui-board|evocraft-b-tokens|generate-figma|SVG|Auto Layout" docs/README.md docs/design/figma docs/ideas docs/planning tools/generate-figma-ui.mjs`
- `rg -n "#0F9F9A|Primary Teal|teal primary|blue-green primary|绿色主" docs/design/figma docs/design/desgin.md docs/design/2026-05-10-b-style-ui-generation-brief.md || true`
- `git diff --check`
- `git add docs/README.md docs/design/figma tools/generate-figma-ui.mjs docs/ideas/2026-05-10-evocraft-seed-capsule.md docs/planning/evocraft-project-memory.md docs/planning/evocraft-roadmap-progress.md`
- `git commit ...`
- `git push`

下一步的计划：

- 在 Figma 中导入总览 SVG 和四个独立页面 SVG。
- 将 SVG 参考稿整理为 Figma 组件、变量和 Auto Layout。
- 之后基于 Figma 原型或 SVG 结构进入前端实现计划。

### 2026-05-10：第一版静态 Web MVP

本轮任务是什么：

- 根据 PRD v1.0 和 `docs/design/desgin.md`、`docs/design/design.png` 生成 EvoCraft 错题收集第一个 MVP。

已完成什么：

- 新增零依赖静态 Web 应用：`app/index.html`、`app/styles.css`、`app/main.js`、`app/state.js`。
- 实现 App Hub、错题上传、识别检查 / 去痕复核、已保存错题详情四个主屏。
- 实现图片上传预览、科目选择、mock AI 识别草稿、原图 / 干净题面展示、可编辑字段、保存记录和 `localStorage` 本地持久化。
- 新增 `tests/static-mvp.test.mjs` 和 `package.json` 的 `npm test` 脚本，锁住核心数据形态和静态入口。
- 更新项目记忆和文档索引，记录第一个 MVP 采用静态 Web 与本地 mock 识别。

卡在哪里：

- Browser 插件连接两次超时，未能使用 in-app Browser 完成验证；已回退到本地 Playwright 进行等价渲染与交互验证。

执行的是什么命令：

- `sed -n` 读取 `docs/planning/evocraft-project-memory.md`、`docs/planning/evocraft-roadmap-progress.md`、`docs/ideas/2026-05-10-evocraft-seed-capsule.md`、PRD 和设计基线。
- `view_image` 查看 `docs/design/design.png`。
- `node tests/static-mvp.test.mjs`
- `npm test`
- `python3 -m http.server 4173`
- `NODE_PATH=... node` 运行 Playwright smoke 脚本，验证 `http://127.0.0.1:4173/app/index.html` 的上传、识别、保存、详情和移动端截图。
- `git diff --check`

下一步的计划：

- 决定是否把静态 MVP 升级为 React/Vite 或桌面应用外壳。
- 在接入真实 AI/OCR 前，先补隐私授权、删除机制、失败状态和手动保存细节。
- 继续细化真实题目图片处理、干净题面生成和复核交互。

### 2026-05-11：补齐错题本查看入口

本轮任务是什么：

- 解决用户反馈：“光收集完错题，在哪里查看？”第一版 MVP 缺少明确的已保存错题查看入口。

已完成什么：

- 在左侧导航新增可点击的 `错题本`。
- 新增 `data-screen="records"` 的错题本列表页，展示保存数量、默认复习材料、本地保存状态和全部错题列表。
- 将 `查看全部` / `查看更多` 从跳单条详情改为进入错题本列表。
- 将详情页返回入口改为 `返回错题本`，让“列表 -> 详情 -> 返回列表”路径闭合。
- 更新静态测试，要求 HTML 中存在错题本屏、记录列表容器和 `go-records` 导航动作。
- 更新想法胶囊和项目记忆，记录错题本是收集与复习/分析之间的桥梁。

卡在哪里：

- Browser 插件再次连接超时，未能直接驱动 in-app Browser；已回退到本地 Playwright 进行等价验证。

执行的是什么命令：

- `sed -n` 读取 `app/index.html`、`app/main.js`、`tests/static-mvp.test.mjs` 和项目记忆文件。
- `npm test`
- `git diff --check`
- `curl -I http://127.0.0.1:4173/app/index.html`
- `NODE_PATH=... node` 运行 Playwright 验证脚本，覆盖空错题本、上传保存、左侧错题本入口、列表打开详情和移动端截图。
- `view_image` 查看 `/tmp/evocraft-records-list.png` 和 `/tmp/evocraft-records-mobile.png`。

下一步的计划：

- 继续补强错题本的筛选、搜索、删除和重新处理能力。
- 为真实 AI/OCR 接入前补充隐私授权、删除机制和失败恢复设计。

### 2026-05-11：补功能反馈同步 PRD 规则

本轮任务是什么：

- 根据用户明确反馈，补充执行规则：当用户指出缺失功能或要求补功能时，必须同步更新 PRD 和想法胶囊。

已完成什么：

- 更新 `AGENTS.md`，新增独立 `Feature Gap Feedback Protocol / 缺失功能反馈协议`，明确缺失功能/补功能反馈必须同步 PRD 和想法胶囊，且实现不能先提交完再遗漏需求文档。
- 将 `docs/prd/2026-05-10-wrong-question-capture-mvp-prd.md` 从 v1.0 更新为 v1.1，补入 `错题本` 列表入口、核心流程、页面信息架构、功能需求、成功指标、验收标准和 UI 生成摘要。
- 更新想法胶囊，记录“用户指出缺功能意味着产品需求边界变化，代码、PRD、产品意图必须同步”的原则。
- 更新项目记忆和 README，记录新的执行规则和 PRD 版本。

卡在哪里：

- 无。

执行的是什么命令：

- `sed -n` 读取 `AGENTS.md`、项目记忆、路线图进度、想法胶囊和 PRD。
- `rg -n "错题本|详情|查看|验收|保存|UI 生成输入摘要|后续决策点|记录" docs/prd/2026-05-10-wrong-question-capture-mvp-prd.md`

下一步的计划：

- 后续任何明确补功能/缺功能反馈，都先判断是否改变 PRD 范围；如改变，代码、PRD、想法胶囊和进度记录同轮同步。

### 2026-05-13：选题区域与国内模型策略设计

本轮任务是什么：

- 根据用户新反馈，设计多题照片中先选择一道题再识别的核心能力，并明确真实 AI/OCR 接入不默认使用 GPT-5.5，而采用国内模型优先策略。

已完成什么：

- 将 `docs/prd/2026-05-10-wrong-question-capture-mvp-prd.md` 更新为 v1.2，补入独立 `选择题目区域` 步骤、手动画框兜底、整张原图和题目区域双保留、国内模型优先与分层调用策略。
- 新增 `docs/superpowers/specs/2026-05-13-question-region-domestic-model-design.md`，记录已确认设计、页面结构、数据字段、AI 能力契约、错误处理和测试重点。
- 新增 `docs/superpowers/plans/2026-05-13-question-region-mvp.md`，将选题区域 MVP 拆成测试、数据、页面、交互、详情联动、浏览器验证和项目记录更新八个实现任务。
- 更新想法胶囊，记录“多题照片必须先确认本次识别区域”和“国内模型优先、Qwen 优先评估、分层调用”的产品判断。
- 更新项目记忆和文档索引，记录 PRD v1.2、选题区域流程和模型供应商策略。
- 更新 `.gitignore`，排除 `.superpowers/` 视觉伴随运行态，避免误提交。

卡在哪里：

- 无。视觉伴随服务多次因空闲超时退出，已重启并继续用于讨论；这些运行态不进入 git。

执行的是什么命令：

- `sed -n` 读取 `AGENTS.md`、项目记忆、路线图进度、想法胶囊、PRD、设计基线和当前静态 MVP 文件。
- `view_image` 查看 `docs/design/design.png`。
- `curl` 检查视觉伴随本地页面。
- `rg` 搜索 PRD、文档索引和设计/模型相关条目。
- Web 检索阿里云百炼、火山引擎豆包视觉理解等官方资料，用于模型策略判断。
- `sed -n` 读取 `app/index.html`、`app/main.js`、`app/state.js` 和 `tests/static-mvp.test.mjs`，用于制定实现计划。

下一步的计划：

- 执行 `docs/superpowers/plans/2026-05-13-question-region-mvp.md`：先补静态 MVP 的选题区域页面和数据结构，再考虑真实国内 AI/OCR 接入。

### 2026-05-15：选题区域静态 MVP 实现

本轮任务是什么：

- 执行 `docs/superpowers/plans/2026-05-13-question-region-mvp.md`，实现上传后的独立 `选择题目区域` 步骤，让多题照片可以先确认一道题再识别。

已完成什么：

- 新增 `select-region` 屏幕，将上传页主操作改为 `下一步：选择题目区域`。
- 实现 mock 候选框、手动画框、拖动/缩放调整、确认后识别。
- 扩展本地记录数据，保存 `selectedRegion`、`selectedRegionImageUri` 和 mock `modelTraces`。
- 保存记录同时保留整张原图、确认后的题目区域和干净题面。
- 详情页支持在干净题面、题目区域和整张原图之间切换。
- 浏览器验证中发现手动画框与候选框重叠时可能抓错框，已通过提高选中框层级修复。

卡在哪里：

- Browser 插件可加载本地页面并确认页面结构，但当前暴露的 Playwright surface 不支持文件上传；完整上传/拖动/保存闭环已回退到本地 Playwright 验证。

执行的是什么命令：

- `node tests/static-mvp.test.mjs`
- `node --check app/main.js`
- `git diff --check`
- `python3 -m http.server 4173`
- Browser 插件打开 `http://127.0.0.1:4173/app/index.html` 并检查上传页、`下一步：选择题目区域` 和侧栏流程。
- 使用 bundled Playwright 运行上传、选题区域、手动画框、拖动、缩放、确认、复核、保存、详情切换和错题本验证脚本，截图输出到 `/tmp/evocraft-region-selection.png`、`/tmp/evocraft-detail-cycle.png`、`/tmp/evocraft-records-region.png`。

下一步的计划：

- 补隐私授权、删除机制和模型调用失败状态。
- 后续再接阿里云百炼 Qwen 体系作为第一条国内 AI/OCR 链路。

### 2026-05-15：补候选框删除逻辑

本轮任务是什么：

- 根据用户反馈，为 `选择题目区域` 补候选框删除逻辑，避免 AI 候选框和后续手动画框重叠时造成操作混乱。

已完成什么：

- 在区域数据层新增候选框删除 helper，并用测试锁住删除当前框、删除末尾框、删光候选框和删除非选中框的选中态迁移。
- 在候选列表和当前选中框上新增删除入口。
- 删除当前选中框后自动选择剩余候选框；删除全部候选框后进入未选择状态，确认识别不可用。
- 保留 `手动画框` 和 `重新自动找题` 恢复路径。
- 将 PRD 更新为 v1.3，补充候选框删除需求、验收标准和 UI 摘要。
- 更新想法胶囊、项目记忆和文档索引，记录候选框删除是选题区域可控性的组成部分。

卡在哪里：

- 无。

执行的是什么命令：

- `node tests/static-mvp.test.mjs`
- `node --check app/main.js`
- `git diff --check`
- 使用 bundled Playwright 运行删除候选框、删光候选框、确认按钮禁用、手动画框恢复、删除手动画框、重新自动找题恢复和确认识别验证脚本，截图输出到 `/tmp/evocraft-region-delete-empty.png`、`/tmp/evocraft-region-delete-rerun.png`。

下一步的计划：

- 继续补隐私授权、删除机制和模型调用失败状态。

### 2026-05-16：MVP 收尾加固与技术路线决策

本轮任务是什么：

- 按照“先把 MVP 收尾加固做好，再快速进入技术路线决策”的方向，补齐隐私确认、本地删除/清空、失败恢复，并落档当前技术路线。

已完成什么：

- 上传页新增本地隐私确认；未确认前不能进入 `选择题目区域`。
- 错题本新增单条记录删除和清空本地数据入口；详情页新增删除当前记录入口。
- 选题区域新增未选择/候选框清空的错误提示，保存失败会停留在复核页提示本地存储问题。
- `app/state.js` 新增 `deleteRecord`、`persistRecords` 结果返回和 `clearStoredRecords`，并用测试锁定删除选中态迁移、存储写入失败和清空逻辑。
- PRD 更新为 v1.4，想法胶囊记录 MVP 收尾原则，项目记忆同步当前技术路线。
- 新增 `docs/planning/2026-05-16-mvp-technical-route-decision.md`，决策当前继续静态 Web，下一阶段先做 AI adapter，React/Vite 等复杂度触发后迁移，Electron/Tauri 和后端延后。
- 新增 `docs/superpowers/specs/2026-05-16-mvp-hardening-tech-route-design.md` 和 `docs/superpowers/plans/2026-05-16-mvp-hardening.md`，沉淀本轮设计与执行计划。

卡在哪里：

- 无。

执行的是什么命令：

- `git status --short --branch`
- `npm test`
- `node --check app/main.js`
- `node --check app/state.js`
- `git diff --check`
- 使用 bundled Playwright 验证隐私确认 gate、上传、选区确认、保存、详情删除、错题本清空和空状态恢复。

下一步的计划：

- 进入 AI adapter 设计：定义区域检测、OCR、结构化整理、去痕和失败状态的 provider-agnostic contract，并继续用 mock contract tests 保护真实 Qwen 接入前的业务边界。

### 2026-05-16：PRD 编写规范与 MVP PRD 对齐

本轮任务是什么：

- 根据 `docs/prd/2026-05-16-prd-writing-standards.md` 重整错题收集 MVP PRD；同时把原 PRD 中规范未提炼但应复用的结构和原则反向补进 PRD 编写规范，并把后续 PRD 必须遵循规范写入 `AGENTS.md`。

已完成什么：

- 将 `docs/prd/2026-05-10-wrong-question-capture-mvp-prd.md` 更新为 v1.5，按规范补齐元信息、相关文档、变更摘要、目标用户与场景、默认决策与决策边界、功能需求表、非功能需求、风险/依赖/开放问题、设计与实现交接摘要。
- 将原 PRD 中的应用集合定位、产品反馈同步、技术路线决策、国内模型策略、UI 生成输入摘要、本地删除/清空和失败恢复等内容提炼回 `docs/prd/2026-05-16-prd-writing-standards.md`，更新为 v1.1。
- 在 `AGENTS.md` 新增 PRD 编写规范原则，要求后续新建或重大更新 PRD 都遵循规范，并在发现规范缺口时同步更新规范。
- 更新文档索引、项目记忆和想法胶囊，记录 PRD 标准成为后续需求工作的强制入口。

卡在哪里：

- 无。

执行的是什么命令：

- `git status --short --branch`
- `rg --files | rg '2026-05-16-prd-writing-standards|wrong-question-capture|AGENTS|project-memory|roadmap-progress|seed-capsule|README.md'`
- `sed -n` 读取 PRD 编写规范、错题收集 MVP PRD、项目记忆、路线图进度、想法胶囊、AGENTS 和 README。
- `rg -n "^#|^##|^###|文档状态|版本|责任|相关文档|MVP 默认|产品反馈|UI 生成|后续决策|风险|非功能"` 对比规范与 PRD 结构。
- `rg` 占位词扫描命令，范围为本轮更新文档。
- `rg -n "PRD v1[.]4|编写规范 v1[.]0|PRD 编写规范 v1[.]0" AGENTS.md docs`
- `npm test`
- `git diff --check`

下一步的计划：

- 进入 AI adapter 设计前，先以 PRD 编写规范为入口，补一份独立的 AI adapter / OCR 链路 PRD 或功能 PRD，再进入实现计划。

### 2026-05-16：已实现 MVP UI 设计图与技术路线决策

本轮任务是什么：

- 在进入技术路线决策前，把当前静态 Web MVP 的真实实现保存为 UI 设计图；随后基于 PRD v1.5、UI 基线和当前代码复杂度更新技术路线决策。

已完成什么：

- 新增 `docs/design/implemented-mvp/capture-ui.mjs`，用当前 `app/` 实现自动跑通 App Hub、上传隐私确认、选题区域、复核、保存、详情和错题本流程。
- 生成并保存 `docs/design/implemented-mvp/screens/01-app-hub.png` 到 `06-records-notebook.png` 六张 UI 设计图，并新增 `docs/design/implemented-mvp/2026-05-16-implemented-mvp-ui-design.md` 作为设计图索引。
- 截图检查中发现错题本列表布局回归：父级记录行被设为三列导致标题竖排。已先写失败测试，再修复 `.records-list .record-open` 的内部三列布局。
- 重写 `docs/planning/2026-05-16-mvp-technical-route-decision.md`，确认当前继续静态 Web，下一步先做 provider-agnostic AI adapter 与 mock contract tests；React/Vite 设置为复杂度触发后的迁移目标；Electron/Tauri、后端、账号和云同步延后。
- 更新 README、项目记忆和想法胶囊，把已实现 UI 设计图和技术路线决策作为后续 AI adapter 前的基线。

卡在哪里：

- 无。Browser 插件可打开本地页面，但当前页面上下文不适合预置本地存储数据；已改用可复现的 Chrome headless 截图脚本生成 UI 设计图。

执行的是什么命令：

- `sed -n` 读取 Superpowers 技能、项目记忆、路线图进度、想法胶囊、PRD、技术路线文档、app 源码和测试文件。
- `python3 -m http.server 4174 --bind 127.0.0.1`
- Browser 插件打开 `http://127.0.0.1:4174/app/index.html` 并尝试预置截图数据。
- `node docs/design/implemented-mvp/capture-ui.mjs`
- `view_image` 查看 `03-region-selection.png`、`04-recognition-review.png`、`05-saved-record-detail.png`、`06-records-notebook.png`。
- `npm test`
- `git diff --check`
- Web 检索 React、Vite、Tauri、Electron 官方文档用于技术路线外部参考。

下一步的计划：

- 按 PRD 编写规范补 AI adapter / OCR 链路 PRD，明确输入输出、失败降级、隐私授权、模型分层、供应商数据边界和 contract tests。

### 2026-05-16：技能产物入库铁律

本轮任务是什么：

- 根据用户明确要求，把 `@superpowers` 或任何技能/工具 workflow 产生的项目相关结果必须放入项目目录的规则写入仓库级 `AGENTS.md`，并同步长期记忆。

已完成什么：

- 在 `AGENTS.md` 新增 `Iron Rule: Skill Outputs Live In Project / 技能产物入库铁律`。
- 明确技能产物不能只留在聊天、临时目录、浏览器状态、外部工具或 scratch 位置。
- 明确 specs、plans、screenshots、diagrams、research summaries、generated assets、verification artifacts、handoff notes 等项目相关结果必须保存到项目目录中的合适位置，并随目标提交保存。
- 更新 README 和项目记忆，把该规则纳入后续工作入口。

卡在哪里：

- 无。

执行的是什么命令：

- `git status --short --branch`
- `sed -n` 读取 `AGENTS.md`、项目记忆、路线图进度、想法胶囊和 Superpowers 使用说明。
- `apply_patch` 更新 `AGENTS.md`、`docs/README.md`、`docs/planning/evocraft-project-memory.md` 和 `docs/planning/evocraft-roadmap-progress.md`。
- `git diff --check`
- `npm test`
- `rg -n "Skill Outputs Live In Project|技能产物入库|技能产物|superpowers|workflow" AGENTS.md docs/README.md docs/planning/evocraft-project-memory.md docs/planning/evocraft-roadmap-progress.md`
- `rg` 占位词扫描命令，范围为 `AGENTS.md`、README、项目记忆和进度文档。

下一步的计划：

- 后续使用任何技能产出项目相关内容时，先确认 durable 输出路径，完成后再提交和推送。

### 2026-05-16：同步技能产物到主项目目录

本轮任务是什么：

- 根据用户纠正，明确“项目目录”不是 Superpowers worktree，而是 `/Users/zha/Documents/CodeSpaces/evo-craft`，并把上一轮 `@superpowers` 产物同步回主项目目录。

已完成什么：

- 将 `origin/codex/question-region-mvp` 中的 MVP 实现、PRD 规范同步、UI 设计图、截图脚本、技术路线决策、Superpowers specs/plans、测试和长期文档定向恢复到 `/Users/zha/Documents/CodeSpaces/evo-craft`。
- 保留主目录中既有的 `docs/design/figma/*` 删除状态，未恢复或改动这些用户已有变更。
- 更新 `AGENTS.md`，把技能产物入库铁律中的 canonical project directory 明确写成 `/Users/zha/Documents/CodeSpaces/evo-craft`。
- 更新 README 和项目记忆，明确技能产物不能只留在 worktree、聊天、临时目录或外部工具状态里。

卡在哪里：

- `main` 不能 fast-forward 到 `origin/codex/question-region-mvp`，因为 `main` 上已有独立提交 `ba85667`；已改用定向恢复文件的方式同步成果。

执行的是什么命令：

- `git status --short --branch`
- `git merge --ff-only origin/codex/question-region-mvp`
- `git merge-base main origin/codex/question-region-mvp`
- `git log --oneline --left-right --cherry-pick main...origin/codex/question-region-mvp`
- `git diff --name-status main..origin/codex/question-region-mvp`
- `git restore --source=origin/codex/question-region-mvp -- ...`
- `apply_patch` 更新 `AGENTS.md`、README、项目记忆和进度记录。

下一步的计划：

- 在主项目目录完成验证、提交并推送；后续不再把项目相关技能成果只留在 `/Users/zha/.config/superpowers/worktrees/...`。

### 2026-05-16：桌面优先技术选型

本轮任务是什么：

- 根据用户确认“按建议来”，把下一阶段技术路线从“继续观察是否迁移”更新为“桌面版优先”：先迁移 `React + Vite + TypeScript` 工程主干，抽 AI adapter 和 contract tests，再接入 `Tauri 2` 桌面壳。

已完成什么：

- 新增 `docs/superpowers/specs/2026-05-16-desktop-first-technical-selection-design.md`，明确桌面优先技术栈、平台功能分工、Tauri 优先理由、Electron fallback 条件和迁移路径。
- 更新 `docs/planning/2026-05-16-mvp-technical-route-decision.md`，把旧的“桌面壳延后”改为“React/Vite 主干稳定后接入 Tauri 2”。
- 更新项目记忆、应用集合架构、想法胶囊和文档索引，确保桌面版优先、Web 保留基线、平板/手机后续按场景区分的结论一致。
- 复核 React、Vite、Tauri、Electron 官方文档作为技术选型外部参考。

卡在哪里：

- 无。当前工作树中已有 `docs/design/figma/*` 删除状态不是本轮产生，本轮未恢复、未修改、未纳入技术选型变更。当前 shell 没有 `npm` 命令，本轮用 Codex 自带 `node` 直接运行现有测试。

执行的是什么命令：

- `sed -n` 读取 Superpowers brainstorming 技能、项目记忆、路线图进度、想法胶囊、技术路线决策、应用集合架构和 README。
- `rg -n "desktop|桌面|Electron|Tauri|平台|MVP|技术选型|architecture|架构"` 检索现有技术路线和平台相关记录。
- Web 打开 React、Vite、Tauri、Tauri + Vite、Electron 官方文档。
- `apply_patch` 新增桌面优先技术选型 spec，并更新技术路线、项目记忆、想法胶囊、应用集合架构、README 和进度记录。
- `command -v node && node --version`
- `command -v npm && npm --version`
- `rg` 技术路线冲突和占位词扫描命令，范围为本轮更新文档。
- `node tests/static-mvp.test.mjs`
- `git diff --check`

下一步的计划：

- 用户 review 桌面优先技术选型 spec 后，进入 implementation plan：拆分 React/Vite/TypeScript 迁移、AI adapter contract tests 和 Tauri shell 三条实施线。

### 2026-05-17：桌面优先迁移实施计划

本轮任务是什么：

- 按 Superpowers writing-plans 流程，把已确认的桌面优先技术选型 spec 转成可执行 implementation plan。

已完成什么：

- 读取 `superpowers:writing-plans` 技能、项目记忆、路线图进度、想法胶囊和桌面优先技术选型 spec。
- 新增 `docs/superpowers/plans/2026-05-17-desktop-first-migration.md`，按 React/Vite/TypeScript 主干、typed domain、AI adapter contract、storage port、React UI 迁移、截图验证、Tauri shell 和 durable records 拆成任务。
- 在计划中记录当前 shell 的工具链事实：Codex bundled `node` 可用，`npm` 需通过 `/usr/local/bin` 加入 PATH。
- 更新 `docs/README.md`，把桌面优先迁移实施计划加入文档索引。

卡在哪里：

- 无。当前工作树中仍有既有 `docs/design/figma/*` 删除状态，不属于本轮计划产物，本轮未恢复、未暂存。

执行的是什么命令：

- `sed -n` 读取 Superpowers writing-plans 技能、项目记忆、进度、想法胶囊、桌面优先 spec、app 源码和测试。
- `load_workspace_dependencies`
- `command -v corepack && corepack --version`
- `command -v pnpm && pnpm --version`
- `command -v yarn && yarn --version`
- `ls -l /usr/local/bin/npm`
- `/usr/local/bin/npm --version`
- `/Users/zha/.nvm/versions/node/v26.1.0/bin/node --version`
- `apply_patch` 新增实施计划并更新 README、路线图进度。
- `rg` 占位词和模板残留扫描命令，范围为桌面优先迁移实施计划。

下一步的计划：

- 由用户选择执行方式：Subagent-Driven 或 Inline Execution，然后按计划从 Task 0 开始执行。

### 2026-05-17：桌面壳路线调整为 Electron

本轮任务是什么：

- 根据用户明确决策，把桌面壳技术路线从 Tauri-first 调整为 Electron-first，并暂停已开始的 Subagent-Driven 执行。

已完成什么：

- 关闭执行 Task 1 的子代理，确认其只在隔离 worktree `/Users/zha/.config/superpowers/worktrees/evo-craft/desktop-first-migration` 留下未提交半成品，未进入主项目提交。
- 更新 `docs/superpowers/specs/2026-05-16-desktop-first-technical-selection-design.md`，将第一版桌面壳改为 Electron，并补充 main/preload/renderer 安全边界。
- 更新 `docs/planning/2026-05-16-mvp-technical-route-decision.md`，将 Tauri 改为未来轻量化备选，Electron 成为当前桌面壳实施路线。
- 更新 `docs/superpowers/plans/2026-05-17-desktop-first-migration.md`，将 Task 8 从 Tauri shell 改为 Electron shell，并改用 Electron config test、main/preload、desktop bridge 和 electron-builder 验证。
- 更新 README、项目记忆、应用集合架构和想法胶囊，确保当前路线一致为 `React + Vite + TypeScript` 主干后接 Electron。
- 复核 Electron 官方进程模型和安全指南，确认 Electron 路线必须默认启用 context isolation、禁用 renderer Node integration，并通过 preload + IPC 白名单暴露桌面能力。

卡在哪里：

- 无。隔离 worktree 仍有上一轮被中断的未提交半成品：`package.json`、`package-lock.json`、`node_modules/`、`src/`。主项目 `main` 未包含这些半成品。

执行的是什么命令：

- `git status --short --branch`
- `rg -n "Tauri|Electron|desktop shell|桌面壳|桌面版|React/Vite" docs/planning docs/superpowers docs/ideas docs/README.md package.json`
- Web 打开 Electron 官方文档、进程模型和安全指南。
- `apply_patch` 更新桌面优先 spec、技术路线决策、项目记忆、想法胶囊、应用集合架构、README 和迁移实施计划。

下一步的计划：

- 清理或重建隔离 worktree 后，按更新后的 Electron-first 计划重新从 Task 1 执行；不要复用已中断的 Tauri-era 半成品。

### 2026-05-17：桌面优先迁移实施

本轮任务是什么：

- 按 Electron-first 桌面优先迁移计划，建立 React/Vite/TypeScript 主干、typed domain、AI adapter contract tests、storage port、React UI 迁移、桌面 trunk 截图验证和 Electron 桌面壳。

已完成什么：

- 新增 React/Vite/TypeScript 工程主干，保留 `app/` 静态 MVP 作为行为和视觉基线。
- 迁移 wrong-question 纯领域行为到 `src/domain/wrongQuestion.ts`，并用 Vitest 锁住候选区域、记录生成、删除和 storage key 行为。
- 新增 provider-agnostic `AiAdapter` contract 与 `mockAiAdapter`，UI 不直接依赖任何真实供应商 SDK。
- 新增 browser-compatible storage port，后续 Electron 本地持久化可以替换此边界。
- 将上传、选题区域、识别复核、保存、详情和错题本主流程迁移到 React，并用 Testing Library 覆盖完整用户流。
- 新增 `docs/design/desktop-trunk/` 截图脚本和六张 React trunk UI 截图，作为接 Electron 前的视觉基线。
- 新增 Electron main/preload/renderer bridge：禁用 renderer Node access，启用 context isolation 和 sandbox，通过 preload 暴露最小 `selectImage` / `readImageAsDataUrl` API，main process 校验 IPC 来源和图片类型。
- `electron-builder --dir` 已通过；本轮显式禁用 macOS 自动签名，生产签名、公证和自动更新不进入本轮。

卡在哪里：

- 无。首次 Electron runtime 下载从 GitHub 很慢且 `install-electron` 解压结果不完整；已改为使用完整缓存手动解压出的本地 `node_modules/electron/dist`，并让 `electron-builder` 使用 `build.electronDist`。这是本地构建环境处理，不进入源码提交。

执行的是什么命令：

- `git switch -c codex/electron-desktop-trunk`
- `node --version`
- `export PATH="/usr/local/bin:$PATH" && npm --version && node tests/static-mvp.test.mjs`
- `npm install react react-dom`
- `npm install --save-dev @vitejs/plugin-react typescript vite vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom @types/react @types/react-dom`
- `npm run test:react -- src/app/App.test.tsx`
- `npm run test:react -- src/domain/wrongQuestion.test.ts`
- `npm run test:react -- src/services/aiAdapter.test.ts`
- `npm run test:react -- src/services/storage.test.ts`
- `npm run test:react -- src/features/wrongQuestion/wrongQuestionReducer.test.ts`
- `npm test`
- `npm run build`
- `node docs/design/desktop-trunk/capture-react-ui.mjs`
- `npm install --save-dev electron electron-builder concurrently wait-on`
- `node tests/electron-config.test.mjs`
- `npm run desktop:build`
- `git diff --check`

下一步的计划：

- 进入真实 AI/OCR provider 评估前，先补 AI adapter provider PRD，明确供应商数据边界、授权文案、模型分层和失败降级。
- Electron 下一轮优先把 preload 的图片选择能力接进 React 上传流，并补应用数据目录、窗口状态或本地持久化方案选择。
- 生产签名、公证、自动更新和安装包发布流程另开任务，不和当前 directory build 混在一起。

### 2026-05-17：桌面应用启动纠偏与选题区域补齐

本轮任务是什么：

- 纠正“只打开浏览器而不是桌面应用”的启动方式，并处理用户指出的 React 桌面主干缺口：`选择题目区域` 缺少删除候选框、删光后的恢复路径和手动画框操作；同时删除不应恢复的 `docs/design/figma/` 旧目录。

已完成什么：

- 确认 PRD v1.5、项目记忆和 implemented-mvp 设计基线都已经要求候选框删除、手动画框、删光后恢复提示和确认按钮禁用；当前问题是 React/Electron 迁移漏搬了静态 MVP 行为。
- 用 Vitest/Testing Library 先补红灯测试，覆盖删除当前候选框后自动选下一框、删光后禁用确认并提示恢复、通过手动画框恢复确认流程。
- 在 React reducer 和 UI 中补回候选框删除、手动画框、重新自动找题、区域拖动/缩放、删光后的空状态和确认按钮禁用。
- 删除 `docs/design/figma/` 下旧 Figma SVG 导入包，并更新 README、项目记忆和想法胶囊，明确后续不再恢复该目录，当前设计基线以 `docs/design/implemented-mvp/` 和 `docs/design/desktop-trunk/` 为准。
- 验证本地 Vite 服务仍在 `http://127.0.0.1:5173/`，并通过 `npm run electron:dev` 启动 Electron 桌面窗口加载 React 桌面主干。

卡在哪里：

- 无。

执行的是什么命令：

- `sed -n` 读取 Superpowers TDD/verification 技能、项目记忆、路线图进度、想法胶囊、PRD、implemented-mvp 设计基线、React App、reducer、测试和 storage。
- `rg -n "custom|区域|delete|删除|select|选区|implemented"` 检索选区和删除相关实现。
- `npm run test:react -- src/features/wrongQuestion/wrongQuestionReducer.test.ts src/app/App.test.tsx`
- `npm test`
- `npm run build`
- `npm run test:electron-config`
- `npm run desktop:build`
- `git diff --check`
- `find docs/design/figma -maxdepth 3 -type f -print`
- `rm -rf docs/design/figma`
- `curl -I http://127.0.0.1:5173/`
- `npm run electron:dev`
- `pgrep -fl "Electron|electron"`
- `apply_patch` 更新 React 实现、测试、测试 setup、文档索引、项目记忆、想法胶囊和进度记录。

下一步的计划：

- 在桌面窗口中继续手动试用选区删除、手动画框和恢复路径；下一轮优先把 Electron preload 图片选择能力接入 React 上传流。

### 2026-05-17：桌面打开方式修复

本轮任务是什么：

- 修复“打开应用直接报错”的启动问题；定位并消除由 AppleScript 激活窗口触发的 macOS `System Events` 权限弹窗，改为直接打开打包后的 EvoCraft 桌面应用。

已完成什么：

- 按 systematic debugging 流程抓取当前屏幕和 Electron 进程证据，确认遮挡窗口的是 Codex 通过 AppleScript 控制 `System Events.app` 触发的 macOS 权限提示，不是 EvoCraft renderer 的业务错误。
- 新增 `desktop:open` 脚本：先执行 Electron directory build，再用 `open -n release/mac/EvoCraft.app` 打开真正的 `EvoCraft.app`，不再依赖 AppleScript 或默认 Electron 空壳。
- 调整 Electron dev 行为：开发模式默认不再自动打开 detached DevTools；只有显式设置 `ELECTRON_OPEN_DEVTOOLS=1` 时才打开。
- 更新 Electron 配置测试，锁住 `desktop:open` 脚本和 DevTools 显式开关。
- 用受控远程调试端口验证打包后的 `EvoCraft.app` 页面已加载：标题为 `EvoCraft Desktop`，URL 指向 `release/mac/EvoCraft.app/.../dist/index.html`，页面状态为 `hub`，无 console exception。

卡在哪里：

- 无。之前遗留的 macOS `System Events` 权限弹窗来自调试时的 AppleScript 激活窗口命令；后续打开路径不再使用 AppleScript。

执行的是什么命令：

- `screencapture -x /tmp/evocraft-debug/screen.png`
- `killall "System Events"`
- `npm run test:electron-config`
- `npm run desktop:open`
- `ps -axo pid,comm,args | rg "release/mac/EvoCraft.app|EvoCraft.app/Contents/MacOS/EvoCraft"`
- `release/mac/EvoCraft.app/Contents/MacOS/EvoCraft --remote-debugging-port=9238`
- `curl -s http://127.0.0.1:9238/json/list`
- `node --input-type=module` 连接 CDP 并读取 title、URL、body 文本、screen 状态和 console 日志。

下一步的计划：

- 使用 `npm run desktop:open` 作为本地打开桌面应用的标准方式；下一轮再把 Electron preload 图片选择能力接入 React 上传流。

### 2026-05-18：Electron 图片选择接入 React 上传流

本轮任务是什么：

- 继续桌面迁移，把 Electron preload 暴露的本地图片选择和读取能力接到 React 错题上传流程中，避免桌面版仍只能走浏览器文件输入语义。

已完成什么：

- 先补 React 红灯测试，覆盖桌面选择成功、用户取消文件选择、读取本地图片失败三个分支。
- 上传页在 Electron 环境下新增 `从电脑选择图片` 按钮，通过 `window.evocraft.selectImage()` 获取本地路径，再用 `readImageAsDataUrl()` 读取为 renderer 可展示的 data URL。
- 成功读取后沿用 `IMAGE_SELECTED` 状态迁移，显示真实文件名并可继续进入题目区域选择；取消选择时保持上传页原状态。
- 新增 `UPLOAD_FAILED` 状态迁移，读取失败时清空半成品上传态并提示 `桌面图片读取失败，请重新选择图片。`。
- `desktopBridge` 增加非浏览器环境保护，避免服务端/测试环境误读 `window`。

卡在哪里：

- 无。

执行的是什么命令：

- `npm run test:react -- src/app/App.test.tsx`
- `npm test`
- `npm run build`
- `npm run test:electron-config`
- `npm run desktop:build`
- `npm run desktop:open`
- `pgrep -fl "EvoCraft.app|Contents/MacOS/EvoCraft"`
- `git diff --check`

下一步的计划：

- 提交并推送本轮 Electron 上传流接入；下一轮补应用数据目录、窗口状态和本地持久化方案。

### 2026-05-18：EvoCraft Logo 首轮方向探索

本轮任务是什么：

- 为 EvoCraft app 设计几个 logo 候选方向，并把项目相关设计产物保存到仓库内。

已完成什么：

- 读取项目记忆、路线图进度和想法胶囊，确认当前品牌气质是“可信 AI 学习工作台 + 轻度成长/Craft 感”。
- 使用内置 imagegen 生成四宫格 logo 方向图。
- 将生成图保存到 `docs/design/logo/2026-05-18-evocraft-logo-options.png`。
- 新增 `docs/design/logo/2026-05-18-evocraft-logo-options.md`，解释四个方向、风险和推荐。
- 更新文档索引、项目记忆和想法胶囊，记录总品牌与子应用图标的区分原则。

卡在哪里：

- 无。当前只是首轮视觉探索，最终生产 logo 仍需矢量化、小尺寸测试和 app icon 导出。

执行的是什么命令：

- `sed -n '1,220p' /Users/zha/.codex/skills/.system/imagegen/SKILL.md`
- `sed -n '1,220p' /Users/zha/.codex/superpowers/skills/brainstorming/SKILL.md`
- `sed -n '1,220p' docs/planning/evocraft-project-memory.md`
- `sed -n '1,220p' docs/planning/evocraft-roadmap-progress.md`
- `sed -n '1,220p' docs/ideas/2026-05-10-evocraft-seed-capsule.md`
- `find /Users/zha/.codex/generated_images -type f`
- `sips -g pixelWidth -g pixelHeight /Users/zha/.codex/generated_images/019e3a6e-732a-7272-aba7-c953c91a703b/ig_0a89ebd0d289b9b6016a0add771918819083ff922e8e2b5240.png`
- `mkdir -p docs/design/logo`
- `cp /Users/zha/.codex/generated_images/019e3a6e-732a-7272-aba7-c953c91a703b/ig_0a89ebd0d289b9b6016a0add771918819083ff922e8e2b5240.png docs/design/logo/2026-05-18-evocraft-logo-options.png`

下一步的计划：

- 选择一个总品牌方向后，做矢量化精修、16/32/64/256/512 尺寸可读性测试，并导出 Electron app icon 所需资源。

### 2026-05-18：EvoCraft 左上扫描笔记 Logo 精修

本轮任务是什么：

- 按用户要求，沿首轮四宫格左上 A 方向继续优化一版 EvoCraft / 错题收集 app logo。

已完成什么：

- 复查 logo 首轮说明、项目记忆、想法胶囊和路线图进度，确认左上 A 方向对应 `错题收集` 子应用图标语义。
- 使用内置 imagegen 生成单枚精修图标，保留扫描框、打开笔记、星光和勾选，减少页面细节并强化小尺寸识别。
- 将精修图保存到 `docs/design/logo/2026-05-18-evocraft-logo-scan-notebook-v2.png`。
- 更新 `docs/design/logo/2026-05-18-evocraft-logo-options.md`，追加 A 方向精修版说明和生成提示词。
- 更新项目记忆和想法胶囊，记录错题收集子应用图标继续沿扫描笔记方向打磨。

卡在哪里：

- 无。当前仍是生成图阶段，尚未做矢量重绘、透明背景、macOS `.icns` / Electron icon 资源导出。

执行的是什么命令：

- `sed -n '1,160p' /Users/zha/.codex/skills/.system/imagegen/SKILL.md`
- `sed -n '1,120p' docs/planning/evocraft-project-memory.md`
- `tail -90 docs/planning/evocraft-roadmap-progress.md`
- `sed -n '1,80p' docs/ideas/2026-05-10-evocraft-seed-capsule.md`
- `sed -n '1,140p' docs/design/logo/2026-05-18-evocraft-logo-options.md`
- `find /Users/zha/.codex/generated_images -type f ...`
- `cp /Users/zha/.codex/generated_images/019e3a6e-732a-7272-aba7-c953c91a703b/ig_0a89ebd0d289b9b6016a0adf2485748190970f7e0ec7b0c0b9.png docs/design/logo/2026-05-18-evocraft-logo-scan-notebook-v2.png`

下一步的计划：

- 如果确认使用这版，下一步做矢量化重绘、小尺寸截图对比、透明/圆角背景版本和 Electron/macOS icon 导出。

### 2026-05-18：EvoCraft 扫描笔记 Logo 选定稿

本轮任务是什么：

- 按用户“精修一轮，就是它了”的要求，对扫描笔记 logo 再做最后一轮精修，并把它记录为当前选定稿。

已完成什么：

- 以 `docs/design/logo/2026-05-18-evocraft-logo-scan-notebook-v2.png` 为参考，使用内置 imagegen 精修最终候选图。
- 将选定稿保存为 `docs/design/logo/2026-05-18-evocraft-logo-scan-notebook-final.png`。
- 生成 16/32/64/128 小尺寸预览，保存到 `docs/design/logo/previews/`。
- 更新 `docs/design/logo/2026-05-18-evocraft-logo-options.md`，追加选定稿、调整点、预览文件和生成提示词。
- 更新项目记忆和想法胶囊，记录扫描笔记方向已成为当前 logo 选定方向。

卡在哪里：

- 无。仍待下一轮生产化：矢量化重绘、透明/圆角版本、macOS `.icns`、Windows `.ico` 和 Electron builder 图标接入。

执行的是什么命令：

- `sed -n '1,150p' /Users/zha/.codex/skills/.system/imagegen/SKILL.md`
- `sed -n '1,130p' docs/planning/evocraft-project-memory.md`
- `tail -100 docs/planning/evocraft-roadmap-progress.md`
- `sed -n '1,80p' docs/ideas/2026-05-10-evocraft-seed-capsule.md`
- `sed -n '55,135p' docs/design/logo/2026-05-18-evocraft-logo-options.md`
- `cp /Users/zha/.codex/generated_images/019e3a6e-732a-7272-aba7-c953c91a703b/ig_0a89ebd0d289b9b6016a0ae05ec7e88190a936f0c503022cbd.png docs/design/logo/2026-05-18-evocraft-logo-scan-notebook-final.png`
- `sips -z 16 16 docs/design/logo/previews/2026-05-18-evocraft-logo-scan-notebook-final-16.png`
- `sips -z 32 32 docs/design/logo/previews/2026-05-18-evocraft-logo-scan-notebook-final-32.png`
- `sips -z 64 64 docs/design/logo/previews/2026-05-18-evocraft-logo-scan-notebook-final-64.png`
- `sips -z 128 128 docs/design/logo/previews/2026-05-18-evocraft-logo-scan-notebook-final-128.png`

下一步的计划：

- 进入图标生产化：用选定稿重绘矢量源文件，导出平台图标资源，并接入 Electron app icon 配置。

### 2026-05-18：EvoCraft Logo 生产化接入

本轮任务是什么：

- 按用户要求，把新设计的扫描笔记 logo 从设计产物接入当前 React/Electron 桌面应用。

已完成什么：

- 先补红灯测试，锁住 React 应用壳必须显示真实 `EvoCraft logo` 图片，Electron builder 必须指向 macOS app icon。
- 从选定稿 `docs/design/logo/2026-05-18-evocraft-logo-scan-notebook-final.png` 导出应用资源：`src/assets/evocraft-logo.png`、`public/evocraft-logo.png`、`public/favicon.png` 和 `build-resources/icon.icns`。
- React 侧栏品牌位从文字 `E` 替换为真实 logo 图片，App Hub 的错题收集卡片也使用同一图标。
- `index.html` 接入 favicon，`package.json` 的 Electron builder mac 配置接入 `build-resources/icon.icns`。
- 更新 logo 设计说明、文档索引、项目记忆和想法胶囊，记录当前 logo 已从设计稿进入产品壳。

卡在哪里：

- 无。仍待后续发布前补矢量重绘、透明背景版本、Windows `.ico` 和真实 dock/installer 视觉验收。

执行的是什么命令：

- `npm run test:react -- src/app/App.test.tsx`
- `npm run test:electron-config`
- `sips -z 256 256 docs/design/logo/2026-05-18-evocraft-logo-scan-notebook-final.png --out src/assets/evocraft-logo.png`
- `sips -z 256 256 docs/design/logo/2026-05-18-evocraft-logo-scan-notebook-final.png --out public/evocraft-logo.png`
- `sips -z 32 32 docs/design/logo/2026-05-18-evocraft-logo-scan-notebook-final.png --out public/favicon.png`
- `iconutil -c icns build-resources/icon.iconset -o build-resources/icon.icns`
- `npm test`
- `npm run build`
- `npm run desktop:build`
- `npm run desktop:open`
- `plutil -p release/mac/EvoCraft.app/Contents/Info.plist | rg "CFBundleIconFile|CFBundleName"`
- `pgrep -fl "EvoCraft.app|Contents/MacOS/EvoCraft"`
- `git diff --check`

下一步的计划：

- 提交并推送本轮 logo 接入；后续发布前补矢量重绘、Windows `.ico` 和真实 dock/installer 视觉验收。

### 2026-05-18：Logo 圆角与错题收集入口回退

本轮任务是什么：

- 修正用户指出的两个视觉问题：logo 应该是圆角矩形；App Hub 的错题收集图片不应被品牌 logo 替换。

已完成什么：

- 补回归测试：React 测试锁住错题收集卡片继续显示原来的 `题` 标识；新增 `tests/logo-assets.test.mjs` 检查 logo PNG 是 RGBA，并且四个角透明、中心不透明。
- 重新导出 `src/assets/evocraft-logo.png`、`public/evocraft-logo.png` 和 `public/favicon.png`，全部改为透明圆角矩形 PNG。
- 重新生成 `build-resources/icon.icns`，让 Electron macOS app icon 使用同一圆角资源。
- 恢复 App Hub 中错题收集卡片的原始 `题` 功能标识，品牌 logo 只保留在侧栏品牌位、favicon 和桌面 app icon。
- 更新 logo 设计说明、项目记忆、想法胶囊和进度记录，明确品牌 logo 不替换已有业务入口图标。

卡在哪里：

- 无。

执行的是什么命令：

- `npm run test:react -- src/app/App.test.tsx`
- `node tests/logo-assets.test.mjs`
- `sips -z 256 256 docs/design/logo/2026-05-18-evocraft-logo-scan-notebook-final.png --out /tmp/evocraft-rounded-logo/evocraft-logo-256.png`
- `sips -z 32 32 docs/design/logo/2026-05-18-evocraft-logo-scan-notebook-final.png --out /tmp/evocraft-rounded-logo/favicon-32.png`
- `node --input-type=module` 读取 PNG、添加圆角透明 alpha、写回 RGBA PNG。
- `iconutil -c icns build-resources/icon.iconset -o build-resources/icon.icns`
- `npm test`
- `npm run build`
- `npm run test:electron-config`
- `npm run desktop:build`
- `npm run desktop:open`
- `plutil -p release/mac/EvoCraft.app/Contents/Info.plist | rg "CFBundleIconFile|CFBundleName"`
- `pgrep -fl "EvoCraft.app|Contents/MacOS/EvoCraft"`
- `git diff --check`

下一步的计划：

- 提交并推送本轮视觉修正；后续发布前继续补 Windows `.ico` 与真实 dock/installer 视觉验收。

### 2026-05-20：上传入口与真实预览修正

本轮任务是什么：

- 解释并修复用户指出的上传页问题：桌面版出现两个上传入口；点击上方上传区后，预览仍像 mock 占位图而不是真实选择的图片。

已完成什么：

- 按 systematic debugging 追到根因：Electron 图片选择接入时新增了独立 `从电脑选择图片` 按钮，但原 Web 上传 label 仍可见；同时 `handleFileSelected()` 仍 dispatch `createOriginalPlaceholderImage()`，没有读取真实文件。
- 先补 React 红灯测试，锁住浏览器上传必须显示真实 data URL，桌面版 `从电脑选择图片` 必须是主上传区本身，而不是第二个按钮。
- 上传页改为单一主上传区：桌面环境点击主上传区调用 `window.evocraft.selectImage()`，浏览器环境点击同一位置触发隐藏 file input。
- 选择图片后，主上传区直接展示真实图片预览；下方只保留文件名和大小/来源信息，避免预览和入口混在一起。
- 更新 PRD、想法胶囊和项目记忆，明确“平台实现差异不能变成两个并列上传入口”和“上传预览必须是真实选择图片”。

卡在哪里：

- 无。

执行的是什么命令：

- `npm run test:react -- src/app/App.test.tsx`
- `npm test`
- `npm run build`
- `npm run test:electron-config`
- `npm run desktop:build`
- `npm run desktop:open`
- `plutil -p release/mac/EvoCraft.app/Contents/Info.plist | rg "CFBundleIconFile|CFBundleName"`
- `pgrep -fl "EvoCraft.app|Contents/MacOS/EvoCraft"`
- `git diff --check`

下一步的计划：

- 提交并推送本轮上传入口和真实预览修正。

### 2026-05-23：真实 AI 识别接入设计收敛

本轮任务是什么：

- 在进入真实 AI/OCR 接入前，先明确技术路线、产品边界、模型选型、评测策略、本地持久化和后续阶段切分。

已完成什么：

- 按 Superpowers brainstorming 流程收敛方案，并写入 `docs/superpowers/specs/2026-05-23-real-ai-recognition-design.md`。
- 确认第一版真实 AI 只做识别整理：候选题目区域、OCR、科目判断、结构化错题草稿、视觉片段、需复核项和模型调用记录。
- 确认解题、讲解、错因、知识点和相似题进入后续 Phase 2 错题理解，不混入第一版识别接入。
- 确认干净题面第一版采用结构化重排，由应用渲染；图像去痕、重绘和 inpainting 后置专项评测。
- 确认桌面版本地优先：真实 AI 调用放在 Electron main process，renderer 不接触 API key；当前阶段不引入 SaaS backend。
- 确认本地持久化采用文件夹 + JSON 索引，每条错题独立目录保存 `record.json`、原图、区域图、渲染数据和模型调用日志，后续保留迁 SQLite 或 SaaS 的路径。
- 确认本机评测脚本调用云端模型，不做模型训练或本地模型部署；先跑 10-15 张三科混合脱敏样本，再扩到 50 张。
- 更新 MVP PRD 到 v1.6，并同步想法胶囊、项目记忆和文档索引。

卡在哪里：

- 无。仍需后续实现计划拆分，并在真实接入前最终确认外部 AI 授权文案、API key 本机配置方式和 Qwen 小样本评测素材。

执行的是什么命令：

- `sed -n '1,260p' docs/prd/2026-05-16-prd-writing-standards.md`
- `sed -n '80,150p' docs/superpowers/specs/2026-05-13-question-region-domestic-model-design.md`
- `sed -n '430,575p' docs/prd/2026-05-10-wrong-question-capture-mvp-prd.md`
- `sed -n '1,220p' docs/planning/evocraft-project-memory.md`
- `sed -n '1,120p' docs/ideas/2026-05-10-evocraft-seed-capsule.md`
- `sed -n '1,220p' docs/README.md`
- `rg -n "localStorage|GPT-5.5|解题|相似题|去痕|SQLite|文件夹|JSON|backend|后端" docs/prd/2026-05-10-wrong-question-capture-mvp-prd.md docs/superpowers/specs/2026-05-23-real-ai-recognition-design.md docs/planning/evocraft-project-memory.md`

下一步的计划：

- 进入实现计划拆分：本地文件存储 port、图片资产管理、AiAdapter v1 schema/contract tests、本机评测脚本、Qwen adapter spike、Electron main IPC、开发开关和授权提示。

### 2026-05-23：真实 AI 识别实施计划

本轮任务是什么：

- 用户确认 `docs/superpowers/specs/2026-05-23-real-ai-recognition-design.md` 后，按 Superpowers writing-plans 流程把真实 AI 识别接入拆成可执行任务。

已完成什么：

- 创建 `docs/superpowers/plans/2026-05-23-real-ai-recognition.md`。
- 将实施拆成 9 个任务：基线检查、异步 RecordStore、Electron 本地文件存储、记录 IPC、React 使用桌面存储、AI adapter v1、AI 评测脚本、Qwen adapter spike、真实 AI IPC 与应用内开发开关。
- 明确每个任务的修改文件、测试命令、预期结果和 Lore commit 信息。
- 更新文档索引，挂载新的真实 AI 识别实施计划。

卡在哪里：

- 无。下一步需要选择执行方式：subagent-driven 或 inline execution。

执行的是什么命令：

- `sed -n '1,260p' /Users/zha/.codex/superpowers/skills/writing-plans/SKILL.md`
- `sed -n '1,260p' docs/superpowers/specs/2026-05-23-real-ai-recognition-design.md`
- `sed -n '1,220p' docs/planning/evocraft-project-memory.md`
- `tail -n 170 docs/planning/evocraft-roadmap-progress.md`
- `ls docs/superpowers/plans`
- `sed -n '1,220p' docs/superpowers/plans/2026-05-17-desktop-first-migration.md`
- `cat package.json`
- `find electron src tests -maxdepth 3 -type f | sort`
- `sed -n '1,260p' electron/main.cjs`
- `sed -n '1,220p' electron/preload.cjs`
- `sed -n '1,220p' src/services/storage.ts`
- `sed -n '1,260p' src/app/App.tsx`
- `sed -n '1,220p' src/services/aiAdapter.ts`
- `sed -n '1,220p' tests/electron-config.test.mjs`
- `rg` 占位词和计划自检扫描命令，范围为真实 AI 识别实施计划、进度文件和文档索引。
- `git diff --check`

下一步的计划：

- 根据用户选择进入执行：推荐 subagent-driven，每个任务一个独立执行单元并在任务间 review。

### 2026-05-23：设计文档体系与 Agent 进度记录协议

本轮任务是什么：

- 在执行真实 AI 识别实施计划前，先把详细设计文档体系、subagent-driven 前置 gate、每个 agent 的工作计划和进度记录要求写入仓库规则和项目文档。

已完成什么：

- 更新 `AGENTS.md`，新增“详细设计文档先行铁律”和“子代理工作计划与进度记录铁律”。
- 新增 `docs/planning/2026-05-23-design-documentation-system.md`，定义产品意图层、详细设计层、实施计划层、Agent 执行层和验证归档层。
- 新增 `docs/superpowers/agent-runs/README.md`，定义 subagent-driven run ledger 和 per-agent task log 协议。
- 新增 `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/README.md`，为真实 AI 识别接入准备 run ledger。
- 新增 `docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/agent-log-template.md` 和 `agents/.gitkeep`，为后续每个 agent 的工作计划与进度记录预留结构。
- 同步更新文档索引、项目记忆、想法胶囊和路线图进度。

卡在哪里：

- 无。下一步可以在这些文档提交后再进入 `superpowers:subagent-driven-development`。

执行的是什么命令：

- `sed -n '1,260p' /Users/zha/.codex/superpowers/skills/brainstorming/SKILL.md`
- `sed -n '1,260p' AGENTS.md`
- `sed -n '1,220p' docs/README.md`
- `sed -n '1,240p' docs/planning/evocraft-project-memory.md`
- `tail -n 220 docs/planning/evocraft-roadmap-progress.md`
- `find docs -maxdepth 3 -type f | sort`

下一步的计划：

- 提交并推送本轮文档体系更新；随后按新协议启动 subagent-driven，并为每个 agent 创建/更新对应 task log。

### 2026-05-23：真实 AI 识别 Task 0 基线与 Reviewer 日志补齐

本轮任务是什么：

- 按 subagent-driven 规则启动真实 AI 识别实施分支，并完成 Task 0 基线验证；同时把 reviewer agent 的独立日志补齐，满足“每一个 agent 的工作计划和进度都要记录”的要求。

已完成什么：

- 创建实现分支 `codex/real-ai-recognition-implementation`。
- Task 0 implementer 已完成基线验证并提交 `02c1c03`。
- `npm test`、`npm run test:electron-config`、`npm run build` 均已通过。
- 补充 Task 0 spec reviewer 和 code quality reviewer 的独立 task log，并在 run ledger 增加 Agent Ledger。
- 明确后续每个实现任务都要保留 implementer、spec reviewer、code quality reviewer 三类独立 agent log。

卡在哪里：

- 无。

执行的是什么命令：

- `sed -n '1,220p' /Users/zha/.codex/superpowers/skills/subagent-driven-development/SKILL.md`
- `git status --short --branch`
- `git log --oneline --decorate -5`
- `sed -n '1,260p' docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/README.md`
- `sed -n '1,260p' docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/agents/task-00-preflight.md`
- `sed -n '1,240p' docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/agent-log-template.md`
- `rg --files docs/superpowers/agent-runs`

下一步的计划：

- 派发 Task 0 spec reviewer；通过后再派发 Task 0 code quality reviewer，然后进入 Task 1 异步 RecordStore 改造。

### 2026-05-23：真实 AI 识别 Task 1 派发准备

本轮任务是什么：

- 在 Task 0 完成 implementer、spec reviewer、code quality reviewer 三段审查后，准备 Task 1 异步 RecordStore 改造的 agent 日志和派发边界。

已完成什么：

- Task 0 已关闭：基线验证、spec review、quality review 均通过，当前实现分支同步到 `origin/codex/real-ai-recognition-implementation`。
- 创建 Task 1 implementer、spec reviewer、code quality reviewer 三份独立 task log。
- 更新 run ledger，将 Task 1 标记为 `assigned`，并记录三类 agent 的工作计划与状态。
- 明确 Task 1 只做 async RecordStore、Reducer 加载动作和 App 异步 load/save，不进入 Electron 文件存储、IPC 或真实 AI。

卡在哪里：

- 无。

执行的是什么命令：

- `git status --short --branch`
- `git log --oneline --decorate -6`
- `sed -n '1,180p' docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/README.md`
- `sed -n '1,260p' docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/agents/task-00-code-quality-review.md`
- `sed -n '180,330p' docs/superpowers/plans/2026-05-23-real-ai-recognition.md`

下一步的计划：

- 提交并推送 Task 1 派发准备日志；随后派出 Task 1 implementer subagent。

### 2026-05-24：真实 AI 识别 Task 1 关闭与 Task 2 派发准备

本轮任务是什么：

- 完成 Task 1 异步 RecordStore 的实现、审查、返工和复审，并为 Task 2 Electron 本地文件存储创建 agent 日志。

已完成什么：

- Task 1 implementer 将 browser `RecordStore` 改为 Promise 契约，并让 `App` 通过 `RECORDS_LOADED` 异步加载记录。
- Task 1 spec review 通过。
- Task 1 code quality review 发现真实异步延迟下的 hydration/save race，阻止进入 Task 2。
- Task 1 implementer 返工：保存按钮在初始 hydration 完成前不可用，并补充 delayed-load + early-save 回归测试。
- Task 1 code quality re-review 通过，阻塞解除。
- 创建 Task 2 implementer、spec reviewer、code quality reviewer 三份独立 task log。
- 更新 run ledger，将 Task 2 标记为 `assigned`，并明确 Task 2 只能实现 Electron main 侧本地文件存储和 Node 测试。

卡在哪里：

- 无。

执行的是什么命令：

- `git status --short --branch`
- `git log --oneline --decorate -10`
- `sed -n '1,280p' docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/README.md`
- `sed -n '1,380p' docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/agents/task-01-code-quality-review.md`
- `sed -n '330,560p' docs/superpowers/plans/2026-05-23-real-ai-recognition.md`

下一步的计划：

- 提交并推送 Task 2 派发准备日志；随后派出 Task 2 implementer subagent。

### 2026-05-24：真实 AI 识别 Task 2 关闭与 Task 3 派发准备

本轮任务是什么：

- 完成 Task 2 Electron main 本地文件存储的实现、审查、返工和复审，并为 Task 3 Record Store IPC 创建 agent 日志。

已完成什么：

- Task 2 implementer 新增 `electron/storage/localRecordStore.cjs`、`tests/electron-local-record-store.test.mjs` 和 `test:electron-store`。
- Task 2 spec review 通过。
- Task 2 code quality review 发现路径逃逸和外部 `file://` 资产透传问题，阻止进入 Task 3。
- Task 2 implementer 返工：限制相对路径 hydration 的 recordDir containment，外部 `file://` 会复制到当前记录 `assets/`，并补充 traversal、external file、prune、broken record、updatedAt 排序测试。
- Task 2 code quality re-review 通过，阻塞解除。
- 创建 Task 3 implementer、spec reviewer、code quality reviewer 三份独立 task log。
- 更新 run ledger，将 Task 3 标记为 `assigned`，并明确 Task 3 只做 Electron record IPC、preload API、typed bridge 和 renderer-side desktop store adapter，不进入 React app 自动选择。

卡在哪里：

- 无。

执行的是什么命令：

- `git status --short --branch`
- `git log --oneline --decorate -10`
- `sed -n '1,340p' docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/README.md`
- `sed -n '1,380p' docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/agents/task-02-code-quality-review.md`
- `sed -n '560,760p' docs/superpowers/plans/2026-05-23-real-ai-recognition.md`

下一步的计划：

- 提交并推送 Task 3 派发准备日志；随后派出 Task 3 implementer subagent。

### 2026-05-24：真实 AI 识别 Task 3 安全返工

本轮任务是什么：

- 根据 Task 3 code quality review 结果，修复 Electron record-store IPC 的信任边界和 payload 校验问题，避免在进入 Task 4 前把本地错题数据暴露给过宽的 renderer IPC surface。

已完成什么：

- Task 3 spec review 已通过，但 code quality review 阻止继续：原 sender allowlist 接受 dev URL 前缀和任意 `file://`，`records:save` 只校验数组不校验记录形状。
- 新增 `electron/security/rendererTrust.cjs`，把 dev renderer URL 收紧为精确 origin/path/search，把生产 renderer 收紧为 packaged `dist/index.html` 文件 URL。
- 更新 `electron/main.cjs`，所有 record IPC 继续走 `assertAllowedSender(event)`，并在 `records:save` 写入前逐条验证 `WrongQuestionRecord` 形状。
- 更新 `electron/storage/localRecordStore.cjs`，直接调用 store 时也拒绝 malformed record arrays，避免绕过 IPC 后写坏本地数据。
- 给 `tests/electron-config.test.mjs` 增加运行时 URL trust 回归测试，覆盖近似恶意 dev URL 和任意生产 `file://`。
- 给 `tests/electron-local-record-store.test.mjs` 增加 malformed save 回归测试。
- 更新 Task 3 implementer log 和 run ledger，Task 3 当前等待 code-quality re-review，Task 4 仍未启动。

卡在哪里：

- 无实现卡点；Task 3 需要 code-quality re-review 通过后才能进入 Task 4。

执行的是什么命令：

- `npm run test:electron-config`
- `npm run test:electron-store`
- `npm run test:react -- src/services/storage.test.ts src/app/App.test.tsx`
- `npm run build`
- `npm test`
- `git diff --check`
- `git status --short --ignored`

下一步的计划：

- 提交并推送 Task 3 follow-up fix。
- 派出 Task 3 code-quality re-review agent；通过后再创建并派发 Task 4 React Desktop Store。

### 2026-05-24：真实 AI 识别 Task 3 sparse-array 返工

本轮任务是什么：

- 根据 Task 3 code-quality re-review 结果，修复 malformed record payload 中 sparse array 会绕过 `every(...)` 校验并导致部分写入的问题。

已完成什么：

- 复审确认 `rendererTrust` 和 dense malformed-array 修复有效，但 sparse arrays 仍会让 `records.every(isValidWrongQuestionRecord)` 跳过空洞。
- 先在 `tests/electron-local-record-store.test.mjs` 添加 sparse-array 回归测试，并确认 `npm run test:electron-store` 在修复前失败，失败证据显示 `valid-before-hole` 已被部分写入。
- 在 `electron/storage/localRecordStore.cjs` 新增 `isValidWrongQuestionRecordArray(...)`，使用 index + `hasOwnProperty` 逐项检查，任何空洞或非法记录都会在写入前整体拒绝。
- 更新 `electron/main.cjs` 和 local store direct save boundary，共用 sparse-safe validation helper。
- 验证通过：`npm run test:electron-store`、`npm run test:electron-config`、`npm run test:react -- src/services/storage.test.ts src/app/App.test.tsx`、`npm run build`、`npm test`、`git diff --check`。

卡在哪里：

- 无实现卡点；Task 3 仍需 code-quality re-review 通过后才能启动 Task 4。

执行的是什么命令：

- `npm run test:electron-store`（修复前失败，修复后通过）
- `npm run test:electron-config`
- `npm run test:react -- src/services/storage.test.ts src/app/App.test.tsx`
- `npm run build`
- `npm test`
- `git diff --check`
- `git status --short --branch`

下一步的计划：

- 提交并推送 sparse-array follow-up fix。
- 再次派出 Task 3 code-quality re-review；通过后进入 Task 4 React Desktop Store。

### 2026-05-24：真实 AI 识别 Task 4 派发准备

本轮任务是什么：

- 在 Task 3 record-store IPC 通过质量复审后，为 Task 4 React desktop store selection 创建 agent 日志和派发边界。

已完成什么：

- Task 3 已完成：renderer trust、record payload validation、sparse malformed arrays 均通过验证和质量复审记录。
- 创建 Task 4 implementer、spec reviewer、code quality reviewer 三份独立 task log。
- 更新 run ledger，将 Task 4 标记为 `assigned`。
- 明确 Task 4 只做 `src/app/App.tsx` 桌面 record store 选择和 `src/app/App.test.tsx` 覆盖，不进入 AI adapter、Electron main/preload 或存储格式变更。

卡在哪里：

- 无。此前 code-quality reviewer 复用时遇到平台 usage limit；如 Task 4 新 subagent 仍不可用，将按同一 checklist 做 leader fallback 并记录。

执行的是什么命令：

- `sed -n '760,940p' docs/superpowers/plans/2026-05-23-real-ai-recognition.md`
- `sed -n '1,280p' src/app/App.tsx`
- `sed -n '1,360p' src/app/App.test.tsx`
- `sed -n '1,160p' src/services/desktopRecordStore.ts`
- `git status --short --branch`

下一步的计划：

- 提交并推送 Task 4 派发准备日志。
- 派出 Task 4 implementer；如果 subagent 受 usage limit 阻塞，则由 leader 按 TDD fallback 实现并记录。

### 2026-05-24：真实 AI 识别 Task 4 关闭与 Task 5 派发准备

本轮任务是什么：

- 完成 Task 4 React desktop store selection 的实现、spec review、code quality review，并为 Task 5 AI Adapter Contract 创建 agent 日志。

已完成什么：

- Task 4 implementer 新增桌面 store 回归测试，先验证 RED：`App` 原先不会调用 `window.evocraft.loadRecords()`。
- Task 4 实现后，`App` 的记录存储选择顺序变为 injected `recordStore` -> Electron desktop bridge -> browser `localStorage` fallback。
- Task 4 spec review 通过，确认没有进入 Electron main/preload、disk storage、AI adapter 或依赖变更。
- Task 4 code-quality review 通过，确认 hydration guard、browser fallback、desktop upload bridge 覆盖仍然成立。
- 创建 Task 5 implementer、spec reviewer、code quality reviewer 三份独立 task log。
- 更新 run ledger，将 Task 5 标记为 `assigned`。

卡在哪里：

- 无。

执行的是什么命令：

- `git status --short --branch`
- `sed -n '820,920p' docs/superpowers/plans/2026-05-23-real-ai-recognition.md`
- `sed -n '1,220p' src/services/aiAdapter.ts`
- `sed -n '1,260p' src/services/mockAiAdapter.ts`
- `sed -n '1,220p' src/services/aiAdapter.test.ts`
- `sed -n '1,260p' src/domain/wrongQuestion.test.ts`

下一步的计划：

- 提交并推送 Task 5 派发准备日志。
- 派出 Task 5 implementer，按 TDD 扩展 adapter contract 和 mock recoverable failure，不接真实 AI。

### 2026-05-24：真实 AI 识别 Task 5 关闭与 Task 6 派发准备

本轮任务是什么：

- 完成 Task 5 AI Adapter Contract 的实现、spec review、code quality review，并为 Task 6 本机 AI 评测脚手架创建 agent 日志。

已完成什么：

- Task 5 implementer 扩展 `AiAdapterFailureReason`，加入 `region_image_missing` 和后续真实 provider 所需失败原因。
- mock adapter 现在会在题目区域截图缺失时返回可恢复、用户可读的 `region_image_missing`，而不是伪造成功 draft。
- Task 5 spec review 通过，确认未接入真实 AI、未改 Electron/storage/UI runtime。
- Task 5 code-quality review 通过，确认 contract、mock 行为、测试覆盖和范围边界均满足要求。
- 创建 Task 6 implementer、spec reviewer、code quality reviewer 三份独立 task log。
- 更新 run ledger，将 Task 6 标记为 `assigned`。

卡在哪里：

- 无。

执行的是什么命令：

- `git status --short --branch`
- `sed -n '920,1120p' docs/superpowers/plans/2026-05-23-real-ai-recognition.md`
- `sed -n '1120,1260p' docs/superpowers/plans/2026-05-23-real-ai-recognition.md`
- `sed -n '1,360p' docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/README.md`
- `tail -n 130 docs/planning/evocraft-roadmap-progress.md`
- `ls -la`

下一步的计划：

- 提交并推送 Task 6 派发准备日志。
- 派出 Task 6 implementer，按 TDD 创建默认禁用的本机评测脚手架和隐私保护 ignore 规则。

### 2026-05-24：真实 AI 识别 Task 6 隐私边界返工

本轮任务是什么：

- 根据 Task 6 code-quality review 的失败结论，修复本机 AI 评测脚手架在 `.env*` 凭据文件、git ignore 行为验证和默认测试套件里的隐私边界缺口。

已完成什么：

- 复核 reviewer 反馈：Task 6 harness 默认禁用、API key gate 和 placeholder 输出方向正确，但 `.env`、`.env.local`、`.env.*` 未被 git ignore 保护。
- 在 `.gitignore` 添加 `.env`、`.env.local`、`.env.*`，覆盖根目录和 nested `ai-eval/.env*` 本地配置文件。
- 扩展 `tests/ai-eval-config.test.mjs`，用 `git check-ignore --quiet` 验证 `.env*`、私有样本、私有 manifest、generated results 被忽略，同时确认 `.gitkeep`、`manifest.example.json`、`results/.gitignore` 不被误忽略。
- 将 `node tests/ai-eval-config.test.mjs` 纳入默认 `npm test`，避免真实 provider 接入后隐私边界测试被跳过。
- 更新 Task 6 implementer log、code-quality review log 和 run ledger，把 Task 6 状态从误标完成调整为等待 code-quality re-review。

卡在哪里：

- 无实现卡点；Task 6 必须在 follow-up commit/push 后通过 code-quality re-review，才能进入 Task 7 Qwen Adapter Spike。

执行的是什么命令：

- `npm run test:ai-eval-config`（修复前按预期失败，修复后通过）
- `git diff --check`
- `git check-ignore -v .env .env.local .env.production ai-eval/.env ai-eval/.env.local ai-eval/samples/manifest.local.json ai-eval/samples/private/math.jpg ai-eval/results/result-123.jsonl`
- `npm test`
- `node scripts/evaluate-ai-samples.mjs`
- `EVOCRAFT_AI_EVAL_ENABLED=1 node scripts/evaluate-ai-samples.mjs`
- `EVOCRAFT_AI_EVAL_ENABLED=1 DASHSCOPE_API_KEY=dummy node scripts/evaluate-ai-samples.mjs ai-eval/samples/manifest.example.json /tmp/evocraft-ai-eval-test.jsonl`

下一步的计划：

- 提交并推送 Task 6 follow-up fix。
- 派发 Task 6 code-quality re-review；通过后再创建并派发 Task 7 Qwen Adapter Spike。

### 2026-05-24：真实 AI 识别 Task 6 质量复审通过

本轮任务是什么：

- 记录 Task 6 follow-up fix 的 code-quality re-review 结果，并关闭 AI evaluation harness 阶段。

已完成什么：

- Harvey 对 follow-up commit `85028ee` 返回 `PASS`。
- 复审确认 `.env*`、nested `ai-eval/.env*`、私有样本、私有 manifest 和 generated results 均被 git ignore 保护。
- 复审确认 `.gitkeep`、`manifest.example.json`、`results/.gitignore` 仍可追踪。
- 复审确认 `tests/ai-eval-config.test.mjs` 使用 `git check-ignore` 做真实 ignore 行为回归，并且默认 `npm test` 会运行 ai-eval config test。
- 复审确认 runner 仍默认禁用，只有显式 `EVOCRAFT_AI_EVAL_ENABLED=1` 后才要求 `DASHSCOPE_API_KEY`，dummy-key smoke 只写 `not-run` placeholder 行，没有真实 provider call。
- 更新 Task 6 run ledger、implementer log 和 code-quality review log，把 Task 6 标记为完成。

卡在哪里：

- 无。

执行的是什么命令：

- `git status --short --branch`
- `git diff --check`
- `npm run test:ai-eval-config`
- `npm test`
- `git check-ignore -v .env .env.local .env.production ai-eval/.env ai-eval/.env.local ai-eval/samples/manifest.local.json ai-eval/samples/private/math.jpg ai-eval/results/result-123.jsonl`
- `node scripts/evaluate-ai-samples.mjs`
- `EVOCRAFT_AI_EVAL_ENABLED=1 node scripts/evaluate-ai-samples.mjs`
- `EVOCRAFT_AI_EVAL_ENABLED=1 DASHSCOPE_API_KEY=dummy node scripts/evaluate-ai-samples.mjs ai-eval/samples/manifest.example.json /tmp/evocraft-ai-eval-review.jsonl`
- `git diff --name-only 58c827a..85028ee`
- `git ls-files -- .env .env.local '.env.*' ai-eval/.env ai-eval/.env.local 'ai-eval/.env.*' ai-eval/samples/manifest.local.json ai-eval/samples/private/math.jpg ai-eval/results/result-123.jsonl`
- `npx tsc --noEmit --pretty false --project tsconfig.json`

下一步的计划：

- 提交并推送 Task 6 review-complete docs。
- 创建 Task 7 Qwen Adapter Spike 的 implementer、spec reviewer 和 code-quality reviewer 日志，然后按 TDD 开始真实 provider adapter spike。

### 2026-05-24：真实 AI 识别 Task 7 派发准备

本轮任务是什么：

- 在 Task 6 AI evaluation harness 通过质量复审后，为 Task 7 Qwen Adapter Spike 创建 agent 日志和派发边界。

已完成什么：

- 创建 Task 7 implementer、spec reviewer、code-quality reviewer 三份独立 task log。
- 更新 run ledger，将 Task 7 标记为 `assigned`。
- 明确 Task 7 只做 Electron/Node 侧 Qwen adapter spike、fake-fetch contract test、local evaluation runner 接入和 `package.json` script。
- 明确 Task 7 不改 Electron main/preload IPC、renderer runtime、storage format，不引入依赖，不提交 API key、`.env`、private samples 或 generated results。
- 明确 Task 8 才负责 real AI IPC 和 renderer adapter wiring。

卡在哪里：

- 无。

执行的是什么命令：

- `git status --short --branch`
- `sed -n '1120,1320p' docs/superpowers/plans/2026-05-23-real-ai-recognition.md`
- `sed -n '1320,1520p' docs/superpowers/plans/2026-05-23-real-ai-recognition.md`
- `ls docs/superpowers/agent-runs/2026-05-23-real-ai-recognition/agents`
- `find src -maxdepth 3 -type f`
- `sed -n '1,240p' src/services/aiAdapter.ts`
- `sed -n '1,220p' src/services/mockAiAdapter.ts`
- `sed -n '1,260p' src/services/aiAdapter.test.ts`

下一步的计划：

- 提交并推送 Task 7 派发准备日志。
- 派出 Task 7 implementer，按 TDD 添加 Qwen adapter fake-fetch contract test、recognition prompt、Node adapter、eval runner 接入和 `test:qwen-adapter`。

### 2026-05-24：真实 AI 识别 Task 7 实现与测试跟进

本轮任务是什么：

- 完成 Task 7 Qwen Adapter Spike 的实现，并在 leader review 中修复评测 runner 静态测试仍沿用 Task 6 placeholder 断言的问题。

已完成什么：

- Task 7 implementer 按 TDD 新增 `tests/qwen-adapter-contract.test.mjs`，先验证缺少 `electron/ai/qwenAdapter.cjs` 时 RED。
- 新增 `electron/ai/recognitionPrompt.cjs` 和 `electron/ai/qwenAdapter.cjs`，支持 fake-fetch 注入、DashScope compatible endpoint、`qwen-vl-ocr-latest` 默认模型、识别-only prompt、失败原因映射、JSON/fenced JSON 解析和 draft 映射。
- `scripts/evaluate-ai-samples.mjs` 在原有 `EVOCRAFT_AI_EVAL_ENABLED=1` 和 `DASHSCOPE_API_KEY` gate 之后，改为通过 `createQwenAdapter(...).recognizeQuestion(...)` 评测样本。
- 新增 `test:qwen-adapter` package script。
- Leader review 发现 `tests/ai-eval-config.test.mjs` 仍匹配 Task 6 的 `status: "not-run"` placeholder 注释，已先写 failing assertion，再移除 stale comments，并改为验证 runner 使用共享 Qwen adapter。

卡在哪里：

- 无实现卡点；Task 7 仍需 spec review 和 code-quality review 通过后才能进入 Task 8。

执行的是什么命令：

- `node tests/qwen-adapter-contract.test.mjs`（修复前 RED，修复后 GREEN）
- `npm run test:qwen-adapter`
- `npm run test:ai-eval-config`（leader follow-up 前按预期失败，修复后通过）
- `git diff --check`
- `node scripts/evaluate-ai-samples.mjs`
- `EVOCRAFT_AI_EVAL_ENABLED=1 node scripts/evaluate-ai-samples.mjs`
- `npm test`

下一步的计划：

- 提交并推送 Task 7 leader follow-up fix。
- 派发 Task 7 spec reviewer；通过后再派 code-quality reviewer。

## 下一步

1. 按 `docs/planning/2026-05-23-design-documentation-system.md` 和 `docs/superpowers/agent-runs/README.md` 的规则执行 `docs/superpowers/plans/2026-05-23-real-ai-recognition.md`。
2. 真实 AI 接入前先建立桌面本地数据目录和文件夹 + JSON 索引，避免真实图片和模型日志继续依赖 `localStorage`。
3. 使用 10-15 张三科混合脱敏样本跑 Qwen 小样本评测，确认 schema、prompt、失败边界、成本和编造答案风险。
4. 生产签名、公证、自动更新和安装包发布流程另开任务。
5. 平板和手机版本先补独立场景/信息架构 PRD，再决定 PWA、原生、React Native 或其他路线。

## 持续跟踪风险

- OCR 对手写中文、数学公式、英文、图形题的稳定性可能差异很大。
- 多题照片的候选框可能漏检或误框，必须保留手动画框兜底和整张原图溯源。
- 图像去痕可能误删题干、图形或公式，第一版先采用结构化重排和视觉片段渲染，不把去痕放进主链路。
- 国内模型价格、模型名和能力会持续变化，真实接入前必须复核官方文档和当期价格。
- 顶层应用集合架构不能过度工程化；第一版只保留清晰入口和扩展方向，不实现复杂插件系统。
- 面向孩子的产品需要认真设计隐私、授权、照片存储、删除机制。
- 游戏化容易扩大范围；第一版不要让奖励系统拖慢错题收集闭环。
- 移动端要提前考虑信息架构，但不能让移动适配阻塞桌面 MVP。
