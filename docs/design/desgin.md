# EvoCraft Design Baseline - B 方案：未来学习工作台

创建日期：2026-05-10

## Overview

B 方案将 EvoCraft 定义为一个面向孩子、家长和后续 AI 应用集合的现代学习工作台。第一屏不是营销页，而是可操作的应用集合入口：左侧显示 EvoCraft App Hub，中间进入当前可用的 `错题收集` 工作流，右侧保留 AI 状态、识别草稿和复核提示。

这个方向强调三件事：

- `AI 效率`：上传、识别、去痕、复核、保存的状态必须清楚，让用户知道 AI 正在做什么、哪些内容可信、哪些需要人工确认。
- `结构化复核`：原图、干净题面、识别草稿、图形片段要同时可见，但不能互相抢占注意力。
- `学习温度`：视觉上接近生产力工具，但色彩和文案要保持轻松、可靠，避免冷冰冰的后台系统感，也避免过度卡通和游戏大厅感。

核心画面采用强分栏布局：左侧窄导航保留应用集合身份，中间主工作区展示错题处理结果，右侧 AI 复核面板显示置信度、去痕状态、待确认项和保存动作。蓝绿色作为主功能色，清浅蓝、薄荷绿和少量暖黄色用于学习状态、奖励预留和儿童场景温度。

**Key Characteristics:**

- 桌面端优先的三栏工作台：App Hub rail / 错题工作区 / AI 复核面板。
- 蓝绿色主色，表达 AI、效率、清洁和可信整理。
- 状态标签清晰：`识别中`、`去痕需复核`、`图形已保留`、`可保存`。
- `原图` 与 `干净题面` 必须并列或一键切换，不能只展示处理后结果。
- 卡片和面板保持轻量边框，少用重阴影，避免复杂装饰。
- 未来应用入口保留，但第一版只有 `错题收集` 可用。
- 轻度成长感只作为小面积提示，不进入主任务流。

## Colors

### Brand & Primary

- **Primary Teal** (`{colors.primary}` / `#0F9F9A`)：主按钮、当前应用、关键进度节点。代表识别、清理、整理完成。
- **Primary Deep** (`{colors.primary-deep}` / `#08716F`)：按下态、重要文字链接、深色小面积强调。
- **Primary Soft** (`{colors.primary-soft}` / `#DDF5F1`)：状态标签、选中背景、轻量信息块。
- **Learning Blue** (`{colors.learning-blue}` / `#2563EB`)：AI 草稿、识别范围、可交互辅助信息。不要抢主 CTA。
- **Learning Blue Soft** (`{colors.learning-blue-soft}` / `#E8F0FF`)：AI 提示块、图形保留提示、轻量引导。
- **AI Cyan** (`{colors.ai-cyan}` / `#06B6D4`)：处理中状态、扫描线、识别步骤节点。

### Warm Learning Accents

- **Reward Amber** (`{colors.reward-amber}` / `#F6B743`)：后续金币、成长、保存成功的小面积点缀。
- **Reward Amber Soft** (`{colors.reward-amber-soft}` / `#FFF4D6`)：轻奖励提示、保存完成后的温和背景。
- **Trace Rose** (`{colors.trace-rose}` / `#E85D75`)：书写痕迹、批改痕迹、需要去除或复核的标记。
- **Trace Rose Soft** (`{colors.trace-rose-soft}` / `#FFE7EC`)：低置信度、去痕需复核、人工检查提示背景。
- **Subject Violet** (`{colors.subject-violet}` / `#7C3AED`)：英语/语文等科目辅助区分时的小面积标签，不作为主色。

### Surface

- **Canvas** (`{colors.canvas}` / `#F7FAF8`)：应用背景。带轻微绿色倾向，避免纯白刺眼。
- **Surface** (`{colors.surface}` / `#FFFFFF`)：主卡片、表单、题面、右侧面板。
- **Surface Soft** (`{colors.surface-soft}` / `#EEF7F4`)：分区背景、App Hub rail、工具条。
- **Surface Blue** (`{colors.surface-blue}` / `#F3F8FF`)：AI 识别草稿区域。
- **Surface Mint** (`{colors.surface-mint}` / `#F0FBF8`)：干净题面区域。
- **Hairline** (`{colors.hairline}` / `#DCE7E4`)：默认边框和分割线。
- **Hairline Strong** (`{colors.hairline-strong}` / `#BFD2CE`)：输入框、可编辑题面、当前步骤边框。

### Text

- **Ink** (`{colors.ink}` / `#17212B`)：主标题和正文。
- **Charcoal** (`{colors.charcoal}` / `#24313D`)：题目内容、面板标题。
- **Slate** (`{colors.slate}` / `#536171`)：说明文字、次级信息。
- **Steel** (`{colors.steel}` / `#72808E`)：元信息、时间、低优先级标签。
- **Muted** (`{colors.muted}` / `#9AA6B2`)：禁用、占位、未开放应用。
- **On Primary** (`{colors.on-primary}` / `#FFFFFF`)：主按钮文字。

### Semantic

- **Success** (`{colors.semantic-success}` / `#16A34A`)：保存成功、识别通过。
- **Warning** (`{colors.semantic-warning}` / `#F59E0B`)：需要复核、低置信度但可继续。
- **Error** (`{colors.semantic-error}` / `#DC2626`)：上传失败、无法识别、保存失败。
- **Info** (`{colors.semantic-info}` / `#2563EB`)：提示、说明、帮助入口。

### Color Rules

- 主操作只用 `Primary Teal`，不要让蓝色和黄色同时争夺主按钮。
- 蓝色用于 AI 信息，绿色用于已清理或已确认，玫红用于痕迹或风险，暖黄色用于成长和保存反馈。
- 背景必须以浅色为主，不做暗色主题。
- 任何状态不能只靠颜色表达，必须配合文字或图标。

## Typography

### Font Family

**Primary:** Inter, `Noto Sans SC`, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif.

EvoCraft 第一版需要中英文、数学符号和题面内容混排。Inter 保证桌面工具质感，`Noto Sans SC` 保证中文题面和说明清晰。不要使用装饰字体或手写字体承载正文。

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---:|---:|---:|---:|---|
| `{typography.display}` | 36px | 700 | 1.18 | 0 | App Hub 或页面主标题 |
| `{typography.heading-1}` | 28px | 700 | 1.25 | 0 | 工作区标题 |
| `{typography.heading-2}` | 22px | 650 | 1.30 | 0 | 面板标题、错题记录标题 |
| `{typography.heading-3}` | 18px | 650 | 1.35 | 0 | 卡片标题、步骤标题 |
| `{typography.body-lg}` | 17px | 400 | 1.65 | 0 | 干净题面正文 |
| `{typography.body-md}` | 15px | 400 | 1.55 | 0 | 常规正文和说明 |
| `{typography.body-sm}` | 13px | 400 | 1.50 | 0 | 次级信息、卡片摘要 |
| `{typography.label}` | 13px | 600 | 1.35 | 0 | 标签、表单 label、状态 chip |
| `{typography.caption}` | 12px | 500 | 1.35 | 0 | 元信息、置信度、时间 |
| `{typography.button}` | 14px | 650 | 1.30 | 0 | 按钮文字 |

### Principles

- 题面内容优先可读性，`干净题面` 正文使用 17px / 1.65。
- 工作台面板标题不做巨型字体，避免工具界面像营销页。
- 所有字距保持 0，避免中文和数学公式被压缩。
- 标签文字短、明确，避免一行内塞太多解释。

## Layout

### Spacing System

- **Base unit:** 4px。
- **Primary rhythm:** 8px / 12px / 16px / 24px / 32px / 48px。
- **Panel padding:** 20px desktop, 16px tablet/mobile。
- **Dense control gap:** 8px。
- **Card group gap:** 16px。
- **Major section gap:** 24px to 32px。

### Desktop App Shell

| Region | Width | Role |
|---|---:|---|
| `app-rail` | 236px | EvoCraft 应用集合入口、未来应用占位、当前应用状态 |
| `main-workspace` | fluid, min 640px | 上传、原图、干净题面、可编辑题目内容 |
| `ai-review-panel` | 360px | AI 识别草稿、去痕状态、待复核项、保存动作 |

主布局使用 `minmax(640px, 1fr)` 承载工作区，右侧复核面板在桌面端固定可见。上传或复核页面不允许出现水平滚动。

### Primary Screens

1. **App Hub / 应用集合首页**
   - 左侧或第一屏显示 EvoCraft 应用集合。
   - `错题收集` 是唯一可点击主应用。
   - 背单词、复习计划、成长装扮等只显示为 `即将开放`，不能抢当前任务。

2. **错题收集：上传**
   - 主区是上传 dropzone + 最近记录。
   - 右侧显示本次处理步骤：上传、识别、去痕、复核、保存。

3. **识别检查**
   - 主区左右并列：`原图` 和 `干净题面`。
   - 右侧显示 AI 草稿、科目判断、置信度、图形片段和待确认项。

4. **去痕复核**
   - 干净题面成为主视觉。
   - 原图以缩略图或切换 tab 保留。
   - 需要复核的痕迹区域用玫红 soft 标记，文案明确为 `去痕需复核`。

5. **保存后的错题记录**
   - 默认展示干净题面。
   - 保留 `查看原图`、`重新处理`、`编辑题面`。
   - 可显示轻量保存反馈，为后续奖励系统留入口。

### Whitespace Philosophy

B 方案不是卡片堆叠型 landing page。留白服务于复核任务：题面周围要有呼吸感，AI 面板可以更密，但状态和行动必须分组清楚。不要在主工作区加入装饰插画、渐变背景或大面积氛围图。

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 | no shadow, `1px solid {colors.hairline}` | rail、表格、普通输入区 |
| 1 | `0 1px 2px rgba(23, 33, 43, 0.06)` | 默认卡片、应用入口 |
| 2 | `0 8px 20px rgba(23, 33, 43, 0.08)` | 上传面板、当前记录卡 |
| 3 | `0 18px 44px rgba(23, 33, 43, 0.14)` | modal、确认保存、图片预览浮层 |

### Decorative Depth

- 只允许轻量扫描线、识别边框、步骤连接线作为功能性视觉反馈。
- 不使用渐变圆球、bokeh、复杂插画背景。
- 图片和题面面板靠边框、留白、局部高亮建立层级，不依赖重阴影。

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---:|---|
| `{rounded.xs}` | 4px | 图形片段角标、细粒度标记 |
| `{rounded.sm}` | 6px | 状态 chip、科目小标签 |
| `{rounded.md}` | 8px | 按钮、输入框、segment、工具条 |
| `{rounded.lg}` | 12px | 面板、上传卡、记录卡 |
| `{rounded.xl}` | 16px | 大型工作区容器、dropzone |
| `{rounded.full}` | 999px | 进度点、头像、少量 pill 状态 |

### Shape Rules

- 按钮使用 8px 圆角矩形，不做大 pill。
- 卡片控制在 12px 到 16px，避免过度可爱化。
- 状态 chip 可以使用 pill，但必须短文本。

## Components

### Navigation

**`app-shell`**：桌面工作台外壳。
- Background `{colors.canvas}`，布局为 `app-rail + main-workspace + ai-review-panel`。
- 顶部高度 56px，可放项目名、当前记录名、保存状态。

**`app-rail`**：应用集合导航。
- Background `{colors.surface-soft}`，border-right `1px solid {colors.hairline}`，padding 16px。
- 当前应用用 `{colors.primary-soft}` 背景和 `{colors.primary-deep}` 文字。
- 未来应用使用 `{colors.muted}`，并带 `即将开放` 标签。

**`app-tile-active`**：当前可用应用入口。
- Background `{colors.surface}`，border `1px solid {colors.primary}`，shadow Level 1，rounded `{rounded.lg}`。
- 左侧使用一致线性图标，右侧显示应用名、简短说明和状态。

**`app-tile-locked`**：未来应用占位。
- Background transparent 或 `{colors.surface}`，border `1px dashed {colors.hairline}`，text `{colors.steel}`。
- 不展示复杂预告玩法，不让未来功能抢 MVP 注意力。

### Buttons

**`button-primary`**：主操作，例如 `保存错题`、`开始识别`。
- Background `{colors.primary}`，text `{colors.on-primary}`，height 40px，padding `0 16px`，rounded `{rounded.md}`。
- Pressed 使用 `{colors.primary-deep}`。
- Disabled 使用 `{colors.hairline}` 背景和 `{colors.muted}` 文本。

**`button-secondary`**：次操作，例如 `重新上传`、`查看原图`。
- Background `{colors.surface}`，text `{colors.charcoal}`，border `1px solid {colors.hairline-strong}`，height 40px。

**`button-ghost`**：低优先级工具，例如 `展开详情`、`更多`。
- Background transparent，text `{colors.slate}`，height 36px。

**`icon-button`**：工具栏图标按钮。
- Size 36px desktop，44px touch layout，rounded `{rounded.md}`。
- 必须有 tooltip 或 aria-label。

### Inputs & Controls

**`subject-segmented-control`**：科目选择。
- Options: `自动`、`语文`、`数学`、`英语`。
- Active background `{colors.primary-soft}`，text `{colors.primary-deep}`，border `{colors.primary}`。
- 如果 AI 判断置信度低，显示 `待确认` chip。

**`text-field`**：题目标题、知识点、备注。
- Background `{colors.surface}`，border `1px solid {colors.hairline-strong}`，height 40px，rounded `{rounded.md}`。
- Focus border `{colors.primary}`，focus ring `0 0 0 3px {colors.primary-soft}`。

**`question-editor`**：干净题面编辑区。
- Background `{colors.surface-mint}`，border `1px solid {colors.hairline}`，rounded `{rounded.lg}`，padding 20px。
- 允许编辑文本块、保留图片片段、标记不确定区域。

### Cards & Panels

**`upload-dropzone`**：上传入口。
- Background `{colors.surface}`，border `1px dashed {colors.hairline-strong}`，rounded `{rounded.xl}`，min-height 280px。
- Active drag state border `{colors.primary}`，background `{colors.primary-soft}`。
- 不使用大插画，使用上传图标、短文案和文件限制提示。

**`source-image-panel`**：原图面板。
- Background `{colors.surface}`，border `1px solid {colors.hairline}`，rounded `{rounded.lg}`。
- Header 显示 `原图`、上传时间、缩放工具。
- 原图上可叠加识别框和痕迹区域，但默认不要遮挡题面。

**`clean-question-panel`**：干净题面面板。
- Background `{colors.surface-mint}`，border `1px solid {colors.primary-soft}`，rounded `{rounded.lg}`。
- Header 显示 `干净题面` 和状态 `去痕后` / `需复核`。
- 这是保存后默认展示的内容。

**`ai-review-panel`**：右侧 AI 复核面板。
- Background `{colors.surface}`，border-left `1px solid {colors.hairline}`，padding 18px。
- 分组：识别状态、科目判断、待复核项、保存动作。
- 每组之间使用 1px 分割线或 16px 间距，不嵌套多层卡片。

**`draft-block`**：AI 识别草稿。
- Background `{colors.surface-blue}`，border `1px solid {colors.learning-blue-soft}`，rounded `{rounded.lg}`，padding 14px。
- 显示为草稿，不要表现成最终正确答案。

**`visual-fragment-card`**：图形/公式/表格保留片段。
- Background `{colors.surface}`，border `1px solid {colors.hairline}`，rounded `{rounded.md}`。
- 标签为 `图形已保留`、`公式片段`、`表格片段` 等。

### Badges & Status

**`status-chip-ai`**：AI 处理中。
- Background `{colors.learning-blue-soft}`，text `{colors.learning-blue}`，icon 使用扫描或 sparkle 类线性图标。

**`status-chip-clean`**：去痕完成。
- Background `{colors.primary-soft}`，text `{colors.primary-deep}`，label `干净题面` 或 `去痕完成`。

**`status-chip-review`**：需要复核。
- Background `{colors.trace-rose-soft}`，text `{colors.trace-rose}`，label `去痕需复核`。

**`confidence-badge`**：置信度。
- 高：green soft + `可信`。
- 中：amber soft + `请检查`。
- 低：rose soft + `需人工确认`。
- 不能只显示百分比，必须有解释性文字。

**`subject-badge`**：科目。
- 数学可用 teal，语文可用 violet，英语可用 blue。
- 科目颜色只做小面积区分，不改变页面主色。

### Tables & Lists

**`record-list`**：已保存错题列表。
- 每条记录展示：干净题面缩略、科目、保存时间、复核状态。
- 默认按最近保存排序。

**`review-checklist`**：复核清单。
- 条目包含图标、状态、简短说明和动作。
- 示例：`题干文字已识别`、`学生作答已隐藏`、`几何图已保留`、`批改痕迹需确认`。

## Interaction States

### Upload Flow

- Empty：显示上传入口和最近记录。
- Dragging：dropzone 变为 `{colors.primary-soft}`，边框使用 `{colors.primary}`。
- Uploading：显示进度条和文件名。
- Failed：在 dropzone 内显示错误，保留重新上传按钮。

### Recognition Flow

- Processing：AI 面板显示步骤进度，主区可展示低透明扫描框。
- Draft Ready：原图和干净题面并列，右侧显示待复核项。
- Low Confidence：对应区域加 `status-chip-review`，保存按钮仍可见但文案变为 `复核后保存`。
- Saved：显示轻量成功反馈，主按钮变为 `查看记录` 或 `继续收集`。

### Editing Flow

- 题面编辑必须可撤销。
- 图片片段删除前需要确认。
- 用户手动改动后显示 `已人工修正`，避免后续误以为全部来自 AI。

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---:|---|
| Mobile | < 640px | 单列向导：上传 -> 原图 -> 干净题面 -> 复核保存 |
| Tablet | 640 - 1023px | 双栏：主区 + 抽屉式 AI 面板；App Hub 收起为顶部切换 |
| Desktop | 1024 - 1439px | 三栏工作台，右侧 AI 面板固定 |
| Wide Desktop | >= 1440px | 主工作区可并列展示原图与干净题面，AI 面板 360px |

### Touch Targets

- 手机和平板上按钮和图标按钮有效点击区域不小于 44px。
- 桌面工具栏视觉尺寸可为 36px，但 hover/focus 状态必须明确。
- 右侧 AI 面板在移动端改为底部 sheet，不遮挡当前确认的题面区域。

### Collapsing Strategy

- `app-rail` 在 tablet/mobile 收起为顶部应用切换。
- `ai-review-panel` 在 tablet 变抽屉，在 mobile 变底部 sheet。
- `source-image-panel` 与 `clean-question-panel` 在 mobile 使用分步 tab，不要横向并排压缩。
- 记录列表移动端只显示关键元信息，详情进入记录页。

## Accessibility & Usability

- 正文字号移动端不低于 16px；题面内容不低于 17px。
- 所有状态必须有文字说明，不能只靠颜色。
- 上传、保存、重新处理、删除图片片段等关键动作必须支持键盘聚焦。
- 焦点环使用 `{colors.primary-soft}` + `{colors.primary}`，不能移除。
- 错误信息必须靠近出错组件，而不是只放全局 toast。
- 对未成年人学习照片相关入口，后续真实 AI 上传前必须有隐私提示和删除能力。

## Do's and Don'ts

### Do

- 用蓝绿色建立 `AI 已整理 / 可保存 / 可信` 的主视觉。
- 保持三栏工作台结构，优先服务复核效率。
- 明确展示 `原图`、`干净题面`、`识别草稿` 的关系。
- 把 AI 输出称为草稿或建议，保留人工修正入口。
- 用小面积暖黄色为后续奖励系统留气质，不在 MVP 主流程里引入金币规则。
- 使用清晰状态 chip，让家长和孩子都能判断下一步。

### Don't

- 不做营销 hero，不用大幅插画占据第一屏。
- 不用暗色主题、霓虹赛博风或复杂玻璃拟态。
- 不让未来应用入口喧宾夺主。
- 不把带书写痕迹的原图当成默认复习材料。
- 不用颜色单独表达低置信度或错误。
- 不在主工作区堆叠卡片套卡片。

## UI Generation Prompt Seed

Use case: UI mockup design baseline.

Create a polished desktop app UI mockup for EvoCraft, an AI learning assistant app collection for Shanghai children. Use the selected B style direction: future learning workspace, modern AI productivity tool, structured three-panel layout, blue-green primary accents, clear status chips, efficient but warm.

Show the first usable app: 错题收集. The screen should not be a marketing landing page. It should look like a real desktop workspace with:

- left App Hub rail showing EvoCraft and app collection entries, with 错题收集 active and future apps locked;
- central workspace showing uploaded wrong-question photo, 原图, 干净题面, and editable question content;
- right AI review panel showing 识别草稿, 科目判断, 置信度, 去痕需复核, 图形已保留, and 保存错题 action;
- light background, white and mint surfaces, teal primary buttons, blue AI info blocks, rose review-needed chips, small amber success/reward hint;
- no dark theme, no cartoon mascot, no decorative blobs, no oversized hero text, no heavy gamification.

## Known Gaps

- 真实 OCR、多模态识别和书写痕迹去除的技术方案尚未确定。
- 第一版具体技术栈尚未确定，设计 token 需要在实现阶段映射到 CSS variables 或 design tokens。
- 移动端是未来方向，本文件先给响应式原则，不输出完整移动端页面细节。
- 游戏化只保留视觉余量，不定义金币和装扮机制。
