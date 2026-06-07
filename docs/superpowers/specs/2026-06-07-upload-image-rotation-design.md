# 上传照片方向调整设计

日期：2026-06-07

状态：已实施并待最终验证

相关文档：

- MVP PRD：`docs/prd/2026-05-10-wrong-question-capture-mvp-prd.md`
- 实施计划：`docs/superpowers/plans/2026-06-07-upload-image-rotation.md`
- 项目记忆：`docs/planning/evocraft-project-memory.md`
- 路线图与进度：`docs/planning/evocraft-roadmap-progress.md`

## 1. 背景

用户提供了一张真实样本照片，照片内容横向/倒向显示，EXIF orientation 为 `6`，需要顺时针旋转 90 度后才适合人工选区和 AI 识别。错题收集不能假设用户上传的照片天然方向正确；如果方向不对，候选框检测、OCR 和人工复核都会变差。

## 2. 范围

- 上传图片后，在上传页提供“左转照片”和“右转照片”操作。
- 旋转只在本地浏览器/renderer 中完成，生成新的图片 data URL。
- 后续自动找题、手动画框、确认区域截图和识别请求都使用当前旋转后的图片。
- 旋转后清空旧候选框和旧识别草稿，避免旧坐标套用到新方向图片。
- 替换新图片时旋转状态重置为原始方向。

## 3. 非目标

- 不把用户提供的真实样本照片入库。
- 不新增外部图像处理服务。
- 不做自动方向识别或 OCR 方向判断。
- 不改变现有 AI adapter、Electron IPC、记录存储 schema 或隐私授权 gate。
- 不在当前版本保存单独的旋转角度字段；当前记录保存的是用户确认后的图像结果。

## 4. UI 与数据流

上传页在图片预览下方显示照片方向控制：

- 当前方向：原始方向 / 右转 90度 / 旋转 180度 / 左转 90度。
- 左转照片。
- 右转照片。

点击旋转后：

1. `rotateImageDataUrl(imageUri, direction)` 在本地 canvas 中将当前上传图旋转 90 度。
2. reducer 接收 `IMAGE_ROTATED`，更新 `uploadedImageUri` 和 `uploadedImageRotationDegrees`。
3. reducer 清空 `regionCandidates`、`selectedRegionId` 和 `draft`。
4. `detectRegions`、`createSelectedRegionImage` 和 `recognizeQuestion` 继续读取 `state.uploadedImageUri`，因此自然使用已调整方向的图片。

## 5. 错误处理

- 如果浏览器不支持 canvas 或旋转失败，保留当前图片并显示可恢复提示。
- 旋转失败不清空已上传图片，不要求用户重新上传。
- 未上传图片时不显示旋转控件。

## 6. 测试策略

- Reducer 测试：旋转后更新图片、记录角度并清空旧候选/草稿；替换新图片后角度归零。
- React 测试：上传后显示旋转按钮；点击右转后调用本地图像旋转 helper，预览图更新，并显示当前方向。
- 截图/Browser 验证：上传页可见旋转控件，桌面和移动宽度无明显横向溢出。
