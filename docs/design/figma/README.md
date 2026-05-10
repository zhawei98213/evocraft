# EvoCraft B 方案 Figma 导入包

创建日期：2026-05-10

## 用途

这个目录把蓝色主导的 B 方案 `未来学习工作台` 转成 Figma 可导入的 SVG 参考稿。它不是最终设计源文件，而是给 Figma 绘制原型和后续前端 coding 使用的矢量输入。

## 文件

- `evocraft-b-ui-board.svg`：四屏总览画板，适合先导入 Figma 看整体流程。
- `screens/01-app-hub.svg`：应用集合首页。
- `screens/02-wrong-question-upload.svg`：错题收集上传页。
- `screens/03-recognition-review.svg`：识别检查 / 去痕复核页。
- `screens/04-saved-record-detail.svg`：已保存错题详情页。
- `evocraft-b-tokens.json`：颜色、圆角、间距、字体层级 token，可用于建立 Figma variables。

## 导入 Figma 建议

1. 先把 `evocraft-b-ui-board.svg` 拖进 Figma，确认整体视觉方向。
2. 再分别拖入 `screens/*.svg`，把每个屏幕作为独立 Frame 的参考底稿。
3. 在 Figma 中按模块拆层：`App Rail`、`Main Workspace`、`AI Review Panel`、`Question Panel`、`Status Chip`、`Record Detail`。
4. 如果文字导入后字体不一致，统一替换为 Inter / Noto Sans SC。
5. 参考 `evocraft-b-tokens.json` 建立 Figma variables。
6. 不要把这套 SVG 当作唯一设计稿；后续应在 Figma 中整理 Auto Layout、组件、变量和交互原型。

## 设计约束

- B 方案主视觉必须是蓝色：`#2563EB`。
- 青色只作为 AI 处理、图形保留等辅助状态：`#06B6D4`。
- 复核风险使用玫红：`#E85D75`。
- 干净题面使用浅蓝底：`#F5F8FF`。
- 不使用绿色或 teal 作为主品牌/主按钮色。

## 重新生成

如果后续修改设计 token 或屏幕结构，运行：

```bash
node tools/generate-figma-ui.mjs
```

脚本会重新生成本目录下的 SVG 文件。
