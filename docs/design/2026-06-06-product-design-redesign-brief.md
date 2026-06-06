# EvoCraft 桌面错题收集 Product Design 重设计 Brief

日期：2026-06-06

状态：待 Product Design workflow 播放确认

## Product Design 预检

- Product Design user-context preflight 已运行。
- 保存的 Product Design 用户上下文不存在。
- 本次设计以项目内既有材料为准：当前 Electron 截图、`docs/design/desktop-trunk/`、`docs/design/implemented-mvp/`、EvoCraft logo 资产和当前 React/Electron 代码。

## 设计目标

重新设计 EvoCraft 桌面错题收集应用的整体界面和交互，让真实 AI 流程从“上传照片”到“选择题目区域”再到“识别复核保存”有清晰阶段感和可恢复状态。

必须解决：

- 真实 AI 已连接、未授权、mock fallback、处理中、失败和成功的状态表达。
- 上传页不再提前要求选科目。
- 科目在识别后作为 AI 建议 + 用户确认出现。
- 题目区域画布必须能直观选择、删除候选框、手动画框和重新自动找题。
- 设置页必须表达 API key 已本机保存、可更改、可清除，且不回显明文。
- 错题本和最近记录要像学习资料库，而不是临时 demo 列表。

## 视觉来源

- 当前 Electron 截图：左侧应用导航、中间工作流、右侧人物形象区域。
- 既有视觉基线：桌面端工作台、可信蓝、青绿色辅助提示、轻微儿童学习温度。
- Logo 资产：扫描框 + 打开笔记 + 整理完成方向。

## 交互层级

期望交互级别：Full interactivity。

重设计或实现时，上传、设置、选区、复核、保存、错题本、详情、错误恢复和状态切换都应可操作；不能只做静态视觉稿。

## 非目标

- 不做 marketing landing page。
- 不引入新的学习应用业务逻辑。
- 不做金币、装扮或完整游戏化系统。
- 不把真实儿童照片、API key 或 raw provider output 存为设计上下文。

## Product Design 下一步

在基础流程 bug 修复完成后，先向用户播放这个 brief，确认后进入 Product Design ideation。按 Product Design 规则，先提供三个视觉/交互方向，用户选定后再进入原型或代码改造。
