# EvoCraft B 方案正式 UI 图生成简报

创建日期：2026-05-10

## 目标

基于 PRD v1.0 和 B 方案 `未来学习工作台` 设计基线，生成可指导后续 coding 的正式桌面端 UI 图。图像应表现真实可实现的应用界面，而不是营销展示图或纯风格探索图。

## 输入依据

- PRD：`docs/prd/2026-05-10-wrong-question-capture-mvp-prd.md`
- 设计基线：`docs/design/desgin.md`
- 第一版应用：`错题收集`
- 产品壳：EvoCraft AI 学习助手应用集合

## 生成重点

- 保留 EvoCraft 是应用集合的身份，第一版只有 `错题收集` 可用。
- 第一屏必须像桌面工具，不像 landing page。
- 画面要明确区分 `原图` 与 `干净题面`。
- AI 输出必须表现为 `识别草稿` 和 `需复核`，不能像绝对正确的最终答案。
- `去痕需复核` 是重点状态：真实错题照片通常有书写、批改、圈画，需要在视觉上提示用户确认。
- UI 图要能指导前端拆分：App rail、主工作区、AI 复核面板、上传区、题面面板、状态 chip、记录详情。

## 必须出现的屏幕

1. `App Hub / 应用集合首页`
   - EvoCraft 标识。
   - 定位：`AI 学习助手应用集合`。
   - `错题收集` 标为 `当前可用`。
   - `背单词`、`复习计划`、`学习奖励` 弱化为 `规划中`。

2. `错题收集上传页`
   - 左侧 App Hub rail。
   - 中间上传 dropzone。
   - 科目 segmented control：`自动`、`语文`、`数学`、`英语`。
   - 主按钮：`开始整理`。
   - 右侧 AI 步骤：上传、识别、去痕、复核、保存。

3. `识别检查 / 去痕复核页`
   - 原图面板：有带书写或批改痕迹的错题照片预览。
   - 干净题面面板：展示去除作答痕迹后的题面。
   - AI 复核面板：`识别草稿`、`数学`、`可信`、`去痕需复核`、`图形已保留`。
   - 保存按钮：`复核后保存` 或 `保存错题`。

4. `已保存错题详情页`
   - 默认展示干净题面。
   - 提供 `查看原图`、`重新处理`、`编辑题面`。
   - 展示科目、创建时间、识别状态、去痕状态。
   - 预留后续分析入口，但不能实现完整分析功能。

## 视觉约束

- 采用 B 方案：未来学习工作台。
- 主色：蓝色 `#2563EB`。
- AI 信息：蓝色系 `#2563EB` / `#E8F0FF`。
- AI 辅助：青色系 `#06B6D4` / `#E6FAFD`，只用于处理中、图形保留等辅助提示。
- 干净题面：浅蓝 `#F5F8FF`。
- 复核提示：玫红浅底 `#FFE7EC` + 玫红文字 `#E85D75`。
- 轻奖励/保存反馈：暖黄色小面积点缀 `#F6B743`。
- 背景浅色，不做暗色主题。
- 使用 8px 按钮圆角、12px/16px 面板圆角。
- 清晰边框和轻阴影，不要重装饰。
- 不使用卡通吉祥物、复杂游戏大厅、霓虹赛博、装饰渐变圆球、bokeh、营销 hero。

## 正式 ImageGen Prompt

Use case: ui-mockup

Asset type: high-fidelity desktop app UI implementation board for product coding reference

Primary request: Create a polished high-fidelity 16:9 UI implementation board for EvoCraft, an AI learning assistant app collection for Shanghai children. Use the selected B style direction: "未来学习工作台" / future learning workspace. The board should show four real desktop app screens in a clean 2x2 layout, with each screen framed like a product screenshot and labeled in concise Chinese.

Product context: EvoCraft is an AI learning assistant app collection, not a single wrong-question tool. The first usable app is 错题收集. The MVP lets a student or parent upload one wrong-question photo, review AI recognition, remove handwriting and grading marks, keep the original image, and save a clean wrong-question record.

Screen 1 - App Hub / 应用集合首页:
- EvoCraft brand in a left-side or full app workspace shell.
- Positioning text: "AI 学习助手应用集合".
- A prominent active app tile: "错题收集", status "当前可用".
- Dim future app tiles: "背单词", "复习计划", "学习奖励", status "规划中".
- It should feel like a usable tool entry, not a marketing landing page.

Screen 2 - 错题收集上传:
- Three-panel desktop shell: left app rail, central main workspace, right AI review panel.
- Central upload dropzone with button "上传错题照片" and primary button "开始整理".
- Subject segmented control: "自动", "语文", "数学", "英语".
- Right panel step list: "上传", "识别", "去痕", "复核", "保存".
- Recent record list with small clean question thumbnails.

Screen 3 - 识别检查 / 去痕复核:
- Central workspace shows two clear panels side by side: "原图" and "干净题面".
- Original image panel should look like a photographed worksheet or exercise page with visible handwriting/correction marks; clean question panel should show the same question cleaned up for review, with handwriting removed.
- Include a geometry or diagram fragment retained in the clean question surface.
- Right AI review panel with cards/chips: "识别草稿", "数学", "可信", "去痕需复核", "图形已保留".
- Primary action: "复核后保存" or "保存错题".

Screen 4 - 已保存错题详情:
- Default view is the clean question surface, calm and readable.
- Actions: "查看原图", "重新处理", "编辑题面".
- Metadata chips: subject, created time, "去痕完成", "已人工修正".
- A small warm amber success/reward hint is allowed, but no actual gamification economy.
- Include a low-priority placeholder for future analysis, not a full analysis product.

Visual system:
- Light blue canvas background #F7F9FF.
- White panels, pale-blue clean question surface #F5F8FF.
- Primary blue #2563EB for active app, primary buttons, progress, selected states.
- Deep blue #1D4ED8 for pressed state and important links.
- Cyan #06B6D4 and #E6FAFD only for AI processing and retained visual fragment hints.
- Blue must dominate the visual impression; do not use green or teal as the primary brand/action color.
- Rose review chip #FFE7EC / #E85D75 for "去痕需复核".
- Small amber #F6B743 only for success or future growth hint.
- Inter / Noto Sans SC style typography, 8px buttons, 12px to 16px panels, light borders, subtle shadows.
- Use simple consistent line icons; no emoji icons.

Composition and fidelity:
- 16:9 board, high-resolution, clean enough for a developer to infer layout and component structure.
- Make main Chinese labels legible and avoid tiny unreadable text.
- Use realistic app spacing and component density; not a poster, not a hero section.
- No dark theme, no cartoon mascot, no decorative blobs, no neon cyber style, no glassmorphism, no heavy gamification, no watermark, no lorem ipsum.

## 后续可选迭代

- 如果首张 UI 图方向正确，再分别生成单屏细化图：上传页、识别复核页、保存详情页。
- 如果后续进入编码，可将本图拆成 App Shell、App Hub、Upload Dropzone、Question Review、AI Review Panel、Record Detail 六个实现模块。
