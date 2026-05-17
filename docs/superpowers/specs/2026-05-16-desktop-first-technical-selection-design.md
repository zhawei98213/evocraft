# 桌面优先技术选型设计

日期：2026-05-16

最近更新：2026-05-17，桌面壳从 Tauri-first 调整为 Electron-first。

## 背景

错题收集 MVP 已完成上传、选题区域、复核、保存、错题本、详情、本地隐私确认、删除/清空和失败恢复闭环。下一阶段不再只是验证静态原型，而是要把 EvoCraft 变成可以持续迭代的桌面版产品，同时给后续 Web、平板和手机版本留下清晰边界。

用户先确认采用推荐路线：先做桌面版，后续按平台和功能做区分。2026-05-17 进一步明确桌面壳使用 Electron，而不是 Tauri-first。

## 一句话结论

采用 `React + Vite + TypeScript` 作为下一阶段前端工程基线，先抽 provider-agnostic AI adapter 与 contract tests，再用 `Electron` 做第一版可安装桌面壳；当前静态 Web MVP 保留为行为和视觉基线，不再继续作为长期工程主干扩张。

## 目标

- 让桌面版成为 Phase 1 之后的主交付形态，适合家长或孩子在大屏上复核照片、选题区域和识别结果。
- 把 UI、AI adapter、数据模型和本地持久化从静态原型状态迁移到可测试、可演进的工程结构。
- 保留同一套 Web 前端核心，使后续桌面 Web 预览、平板 Web 或移动端探索不会从零开始。
- 为未来不同平台定义不同职责，不强求桌面、平板和手机做完全一样的功能。

## 非目标

- 本轮技术选型不直接实现代码迁移。
- 不立即引入账号、云同步、付费、多人协作或远端后端。
- 不把手机端做成桌面端的缩小版。
- 不把 Electron 自动更新、签名、公证、安装包发布、本地数据库和复杂系统集成一次性做满。
- 不把真实儿童学习照片默认上传到外部服务；真实 AI/OCR 仍需单独授权与供应商数据边界评审。

## 推荐技术栈

### 前端核心

- `React`：用于拆分 App Hub、上传、选题区域、复核、错题本、详情、设置和后续错题理解等状态复杂页面。
- `Vite`：作为 React/TypeScript 开发和构建基线，使用官方 `react-ts` 模板方向。
- `TypeScript`：先保护错题记录、选题区域、AI adapter 输入输出、失败状态和本地存储边界。

### 桌面壳

- `Electron`：作为第一版可安装桌面壳的首选。
- 首批桌面能力只纳入真正服务错题收集的部分：本地图片选择、应用数据目录、窗口状态、本地资料库和基础打包验证。
- Electron 必须采用安全默认值：renderer 不启用 Node integration，启用 context isolation 和 sandbox，通过 preload 暴露最小 API，IPC 必须校验来源和输入。
- Tauri 暂不作为第一路线，仅保留为未来轻量化、安装体积或权限面优化的再评估方向。

### AI 能力层

- 继续采用 provider-agnostic AI adapter，不让 UI 直接依赖 Qwen、豆包或任何单一 SDK。
- adapter 能力分层为 `region_detection`、`ocr`、`structure`、`cleanup`。
- 先写 mock contract tests，再接真实供应商；真实接入前复核模型名称、价格、隐私、日志、数据保留和删除边界。

### 本地数据

- 当前静态 MVP 的 `localStorage` 只作为原型基线。
- 桌面版需要迁移到 Electron main process 管理的本地应用数据目录；具体使用 JSON store、SQLite 或文件夹索引，应在实现计划中按数据量和查询需求选择。
- 图片原图、确认区域和干净题面要保留清晰引用关系，避免只存 base64 字符串导致数据迁移困难。

## 平台与功能区分

| 平台 | 首要职责 | 适合功能 | 暂不适合 |
| --- | --- | --- | --- |
| 桌面版 | 主生产力入口 | 上传/拖拽、选题区域精修、AI 复核、错题本管理、本地资料库、后续批量导入 | 过重的游戏化、手机拍照即时流 |
| 桌面 Web | 试用与演示入口 | 快速体验、设计验证、老师或家长远程查看轻量页面 | 本地资料库、系统文件集成 |
| 平板版 | 复核与练习入口 | 触控选区、手写/划线复核、孩子复习、题目讲解 | 复杂资料管理和批量文件整理 |
| 手机版 | 快速采集入口 | 拍照、上传到待处理队列、查看少量复习卡片 | 大量字段编辑、精细框选、多列工作台 |

平台策略：桌面版先把收集和整理能力做深；平板和手机后续围绕拍照、复习、讲解和轻交互重新设计，不照搬桌面三栏工作台。

## 迁移路径

### 1. 保留静态 MVP 基线

- `app/` 继续作为已完成 MVP 的行为参考和视觉回归基线。
- 不在静态 MVP 上继续堆复杂 AI 状态、设置页和资料库能力。

### 2. 新建 React/Vite/TypeScript 工程主干

- 先迁移页面壳、路由、共享组件和错题记录数据模型。
- 再迁移上传、选题区域、复核、错题本和详情流程。
- 迁移期间不改变产品范围，避免把框架迁移和新功能混在一起。

### 3. 抽 AI adapter 与 contract tests

- 先以 mock adapter 固定输入输出和失败状态。
- UI 只面向 adapter contract，不面向具体模型 SDK。
- contract tests 覆盖候选框、OCR 结果、结构化字段、清理题面、低置信度和失败恢复。

### 4. 接入 Electron 桌面壳

- 用同一套 React/Vite 前端进入 Electron BrowserWindow。
- 第一轮只接最小桌面能力：文件选择、本地数据路径、应用窗口、基础打包验证。
- 使用 main/preload/renderer 三层边界：renderer 不直接访问 Node；preload 只暴露 `selectImage`、`readImageAsDataUrl`、`saveRecords`、`loadRecords` 这类最小 API；main process 负责文件系统访问。
- 本地数据库、系统截图、自动更新、签名、公证和多平台安装包放到后续可独立验证的任务。

### 5. 再决定其他平台

- Web 版本从同一套前端核心导出轻量模式。
- 平板和手机先做信息架构与场景 PRD，再决定 PWA、原生、React Native 或其他路线。
- 账号、云同步和远端 AI 代理只在跨设备、托管密钥、审计或协作需求明确后进入后端选型。

## Electron 优先的理由

- EvoCraft 的桌面版会重度依赖图片预览、Canvas 框选、拖拽、文件选择和后续图像处理；Electron 自带 Chromium，渲染目标一致，比系统 WebView 差异更可控。
- 项目下一阶段已经采用 React/Vite/TypeScript，Electron 能让桌面 shell、preload、IPC 和本地文件能力继续留在 JS/TS 生态中，减少 Rust/Tauri 工具链的不确定性。
- Electron 的 Node/Chromium 生态成熟，适合快速验证本地资料库、文件导入、窗口管理、调试和后续打包发布。
- 对 MVP 后的桌面产品来说，开发速度、调试稳定性和渲染一致性优先级高于安装包体积。

Electron 的代价必须显式接受并控制：

- Electron 会带来更大的安装包和运行时内存占用。
- Electron 安全边界必须认真设计，不能让 renderer 直接拿到 Node 能力。
- 所有桌面 API 必须通过 preload + IPC 白名单暴露，并配合 CSP、导航限制、窗口打开限制和依赖安全审查。

Tauri 保留为备选，是为了防止未来出现这些情况：

- Electron 包体积、内存或安全审核成本明显影响分发。
- 桌面版能力稳定后，需要更轻量的长期运行时。
- 团队愿意承担 Rust/Tauri 工具链，以换取更小权限面和安装体积。

## 验收标准

- 技术路线文档明确桌面版优先，并把桌面壳更新为 React/Vite 主干稳定后的 Electron 分阶段接入。
- 下一阶段 implementation plan 可以直接围绕 React/Vite/TypeScript 迁移、AI adapter contract tests 和 Electron shell 三条线拆任务。
- 项目记忆、想法胶囊、进度记录和文档索引同步到同一结论。
- 没有把现有静态 MVP 或用户已有文件删除状态混入本轮技术选型变更。

## 官方参考

- React 官方文档：<https://react.dev/learn/add-react-to-an-existing-project>
- Vite 官方文档：<https://vite.dev/guide/>
- Electron 官方介绍：<https://www.electronjs.org/docs/latest/>
- Electron 进程模型：<https://www.electronjs.org/docs/latest/tutorial/process-model>
- Electron IPC：<https://www.electronjs.org/docs/latest/tutorial/ipc>
- Electron 安全指南：<https://www.electronjs.org/docs/latest/tutorial/security>
- Tauri 2 官方文档：<https://v2.tauri.app/start/>
