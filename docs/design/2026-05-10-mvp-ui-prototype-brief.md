# EvoCraft MVP UI Prototype Brief

创建日期：2026-05-10

## 目标

基于 PRD v1.0 生成第一版桌面端 UI 原型图，用于确认 EvoCraft 的产品气质、核心页面结构和错题收集应用的主流程。

## 设计方向

- EvoCraft 是 AI 学习助手应用集合，不是单一错题工具。
- 第一版只有 `错题收集` 可用，但 App Hub 要保留后续应用扩展空间。
- 第一屏是工具入口，不是营销落地页。
- 整体应安静、清楚、可信，带一点面向孩子的温暖感，但不能玩具化。
- 桌面端优先，重点是上传、识别、去痕、复核、保存。
- UI 必须清楚区分 `原图` 与 `干净题面`。
- AI 识别结果是草稿，界面要表达“需复核”，不要表现成绝对正确。

## 原型画面

生成一张 16:9 的高保真 UI 原型板，包含四个桌面界面：

1. `App Hub / 应用集合首页`
   - EvoCraft 标识。
   - “AI 学习助手应用集合”定位。
   - `错题收集` 当前可用。
   - `背单词`、`复习计划`、`学习奖励` 以弱化方式显示为规划中。

2. `错题上传页`
   - 大上传区。
   - 图片预览。
   - 科目选择：语文、数学、英语。
   - 主按钮：`开始整理`。

3. `识别检查页`
   - 左侧原图/干净题面切换。
   - 右侧可编辑字段：科目、标题、题目文字、学生答案、正确答案、备注。
   - 状态：`识别草稿`、`去痕需复核`。
   - 主按钮：`保存错题`。

4. `已保存详情页`
   - 默认展示干净题面。
   - 提供 `查看原图` 入口。
   - 展示题目文字、科目、创建时间、备注。
   - 后续分析入口只作为轻量占位，不实现复杂分析。

## 文案建议

- EvoCraft
- AI 学习助手应用集合
- 错题收集
- 当前可用
- 规划中
- 上传错题照片
- 语文
- 数学
- 英语
- 开始整理
- 原图
- 干净题面
- 识别草稿
- 去痕需复核
- 保存错题
- 已保存
- 查看原图

## 视觉约束

- 使用清爽的浅色背景。
- 色彩可以温暖，但避免过度卡通。
- 用柔和绿色、蓝色、暖黄色作为功能提示色。
- 信息密度适合桌面端复核，不要做大面积营销 hero。
- 不使用复杂 3D 吉祥物。
- 不使用过强渐变或装饰性光斑。

## ImageGen Prompt

Use case: ui-mockup
Asset type: desktop app UI prototype board
Primary request: Create a polished high-fidelity 16:9 desktop UI prototype board for EvoCraft, an AI learning assistant app collection for Shanghai children. Show four desktop screens side by side or in a clean 2x2 product design board: App Hub, wrong-question upload, recognition review, and saved record detail.
Style/medium: modern desktop web app mockup, high-fidelity product design, clean educational SaaS tool with child-friendly warmth, not toy-like.
Composition/framing: 16:9 presentation board with four clearly separated desktop screen mockups, consistent navigation, realistic spacing, crisp components, readable hierarchy.
Color palette: warm white background, soft green and blue action accents, small warm yellow reward accent, restrained neutral text.
Text: include concise simplified Chinese UI labels: "EvoCraft", "AI 学习助手应用集合", "错题收集", "当前可用", "规划中", "上传错题照片", "语文", "数学", "英语", "开始整理", "原图", "干净题面", "识别草稿", "去痕需复核", "保存错题", "已保存", "查看原图".
Screen details:
1. App Hub: show EvoCraft name, app collection positioning, a prominent Wrong Question Capture app entry, and dim future app entries for vocabulary, review plan, and learning rewards.
2. Upload screen: large upload zone, subject selector, image preview of a worksheet question.
3. Review screen: two-pane desktop layout with image preview on the left and editable fields on the right; tabs for original image and clean question surface; visible draft/review status.
4. Detail screen: saved record view that defaults to clean question surface, includes a view-original action, subject tag, title, question text, notes, and light future-analysis placeholder.
Constraints: first screen must feel like a usable tool entry, not a marketing landing page. Make original image and clean question surface visually distinct. Keep future apps low priority. No cartoon mascot, no heavy gamification, no dark theme, no decorative blobs, no watermark, no lorem ipsum.
