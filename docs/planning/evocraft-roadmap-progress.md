# EvoCraft 路线图与进度

最后更新：2026-05-15

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
- `rg -n "TBD|TODO|待定|待补充|lorem|Lorem|PLACEHOLDER|implement later" AGENTS.md docs || true`
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
- `rg -n "TBD|TODO|待定|待补充|lorem|Lorem|PLACEHOLDER|implement later" AGENTS.md docs || true`
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
- `rg -n "TBD|TODO|待定|待补充|PLACEHOLDER|implement later" AGENTS.md docs || true`
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

## 下一步

1. 补强隐私授权、删除机制、失败恢复和模型调用失败状态。
2. 后续再决定是否接入阿里云百炼 Qwen 体系作为第一条国内 AI/OCR 链路。
3. 继续评估是否把静态 MVP 升级为 React/Vite、Electron/Tauri 或带后端的普通 Web 应用。

## 持续跟踪风险

- OCR 对手写中文、数学公式、英文、图形题的稳定性可能差异很大。
- 多题照片的候选框可能漏检或误框，必须保留手动画框兜底和整张原图溯源。
- 书写痕迹去除可能误删题干、图形或公式，需要保留原图并提供复核机制。
- 国内模型价格、模型名和能力会持续变化，真实接入前必须复核官方文档和当期价格。
- 顶层应用集合架构不能过度工程化；第一版只保留清晰入口和扩展方向，不实现复杂插件系统。
- 面向孩子的产品需要认真设计隐私、授权、照片存储、删除机制。
- 游戏化容易扩大范围；第一版不要让奖励系统拖慢错题收集闭环。
- 移动端要提前考虑信息架构，但不能让移动适配阻塞桌面 MVP。
