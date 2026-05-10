import fs from "node:fs";
import nodePath from "node:path";

const outDir = nodePath.resolve("docs/design/figma");
const screenDir = nodePath.join(outDir, "screens");
fs.mkdirSync(screenDir, { recursive: true });

const C = {
  canvas: "#F7F9FF",
  surface: "#FFFFFF",
  surfaceSoft: "#EEF4FF",
  surfaceBlue: "#F3F8FF",
  surfaceClean: "#F5F8FF",
  primary: "#2563EB",
  primaryDeep: "#1D4ED8",
  primarySoft: "#E8F0FF",
  cyan: "#06B6D4",
  cyanSoft: "#E6FAFD",
  rose: "#E85D75",
  roseSoft: "#FFE7EC",
  amber: "#F6B743",
  amberSoft: "#FFF4D6",
  violet: "#7C3AED",
  ink: "#17212B",
  charcoal: "#24313D",
  slate: "#536171",
  steel: "#72808E",
  muted: "#9AA6B2",
  hairline: "#DCE6F5",
  hairlineStrong: "#B8C8E6",
  success: "#16A34A",
};

const font = "Inter, Noto Sans SC, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function attrs(input) {
  return Object.entries(input)
    .filter(([, value]) => value !== undefined && value !== null && value !== false)
    .map(([key, value]) => `${key}="${esc(value)}"`)
    .join(" ");
}

function tag(name, input = {}, children = "") {
  return `<${name} ${attrs(input)}>${children}</${name}>`;
}

function rect(x, y, w, h, fill = C.surface, stroke = "none", r = 12, extra = {}) {
  return `<rect ${attrs({ x, y, width: w, height: h, rx: r, fill, stroke, ...extra })}/>`;
}

function line(x1, y1, x2, y2, stroke = C.hairline, width = 1, extra = {}) {
  return `<line ${attrs({ x1, y1, x2, y2, stroke, "stroke-width": width, ...extra })}/>`;
}

function circle(cx, cy, r, fill, stroke = "none", extra = {}) {
  return `<circle ${attrs({ cx, cy, r, fill, stroke, ...extra })}/>`;
}

function text(content, x, y, size = 14, fill = C.ink, weight = 400, extra = {}) {
  return `<text ${attrs({
    x,
    y,
    fill,
    "font-family": font,
    "font-size": size,
    "font-weight": weight,
    "letter-spacing": 0,
    ...extra,
  })}>${esc(content)}</text>`;
}

function pill(label, x, y, fill, fg, w, h = 30, size = 13) {
  const width = w ?? Math.max(58, label.length * 14 + 24);
  return [
    rect(x, y, width, h, fill, "none", 999),
    text(label, x + width / 2, y + h / 2 + 5, size, fg, 650, { "text-anchor": "middle" }),
  ].join("");
}

function button(label, x, y, w, fill = C.primary, fg = "#FFFFFF") {
  return [
    rect(x, y, w, 42, fill, "none", 8),
    text(label, x + w / 2, y + 27, 14, fg, 700, { "text-anchor": "middle" }),
  ].join("");
}

function outlineButton(label, x, y, w) {
  return [
    rect(x, y, w, 40, C.surface, C.hairlineStrong, 8),
    text(label, x + w / 2, y + 26, 14, C.charcoal, 650, { "text-anchor": "middle" }),
  ].join("");
}

function iconBox(x, y, size, fill = C.primary, fg = "#FFFFFF", label = "▣") {
  return [
    rect(x, y, size, size, fill, "none", 10),
    text(label, x + size / 2, y + size / 2 + 7, 24, fg, 700, { "text-anchor": "middle" }),
  ].join("");
}

function windowFrame(title, body, width = 1440, height = 768) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#17212B" flood-opacity="0.10"/>
    </filter>
    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="2" stdDeviation="5" flood-color="#17212B" flood-opacity="0.08"/>
    </filter>
    <style>
      .mono { font-variant-numeric: tabular-nums; }
    </style>
  </defs>
  ${rect(0, 0, width, height, C.canvas, "none", 0)}
  ${rect(18, 18, width - 36, height - 36, C.surface, C.hairline, 16, { filter: "url(#shadow)" })}
  ${text(title, 132, 58, 18, C.ink, 700)}
  ${line(250, 18, 250, height - 18)}
  ${windowControls(width - 112, 48)}
  ${sidebar()}
  ${body}
</svg>`;
}

function windowControls(x, y) {
  return [
    line(x, y, x + 12, y, C.steel, 1.6),
    rect(x + 38, y - 8, 14, 14, "none", C.steel, 2),
    line(x + 78, y - 8, x + 90, y + 4, C.steel, 1.6),
    line(x + 90, y - 8, x + 78, y + 4, C.steel, 1.6),
  ].join("");
}

function sidebar(active = "应用集合") {
  const nav = [
    ["应用集合", "▦"],
    ["错题收集", "▣"],
    ["错题本", "▤"],
    ["学习资料", "▧"],
    ["复习计划", "□"],
    ["学习奖励", "☆"],
  ];
  const navItems = nav
    .map(([label, icon], index) => {
      const y = 132 + index * 47;
      const isActive = label === active;
      return [
        rect(46, y - 24, 166, 36, isActive ? C.primarySoft : "transparent", "none", 8),
        text(icon, 60, y, 16, isActive ? C.primary : C.slate, 700),
        text(label, 91, y, 14, isActive ? C.primaryDeep : C.slate, isActive ? 700 : 500),
      ].join("");
    })
    .join("");
  return [
    text("EvoCraft", 54, 83, 27, C.primary, 800),
    text("AI 学习助手应用集合", 54, 111, 14, C.slate, 500),
    navItems,
    line(54, 584, 212, 584),
    text("⚙", 60, 633, 17, C.slate, 500),
    text("设置", 91, 633, 14, C.slate, 500),
    rect(42, 664, 174, 52, C.surfaceSoft, "none", 10),
    circle(70, 690, 16, "#D8E2F3"),
    text("小明同学", 95, 695, 14, C.charcoal, 650),
    text("⌄", 194, 695, 16, C.slate, 600),
  ].join("");
}

function appHubScreen() {
  const cards = [
    ["错题收集", "拍照上传，AI 去痕整理", "当前可用", C.primary, C.primarySoft, "▣", true],
    ["背单词", "AI 助记，高效记忆", "规划中", "#C7CEDB", "#F1F4F9", "A", false],
    ["复习计划", "智能规划，科学复习", "规划中", "#C7CEDB", "#F1F4F9", "□", false],
    ["学习奖励", "成长激励，持续进步", "规划中", "#C7CEDB", "#F1F4F9", "⚙", false],
  ];
  const appCards = cards
    .map(([name, desc, status, color, soft, icon, active], index) => {
      const x = 294 + index * 240;
      return tag("g", { id: `app-card-${index + 1}` }, [
        rect(x, 150, 204, 250, C.surface, active ? C.primary : C.hairline, 12, {
          "stroke-width": active ? 2 : 1,
          filter: active ? "url(#softShadow)" : undefined,
        }),
        iconBox(x + 72, 193, 60, active ? C.primary : "#C9CEDA", "#FFFFFF", icon),
        text(name, x + 102, 292, 23, active ? C.ink : C.charcoal, 750, { "text-anchor": "middle" }),
        text(desc, x + 102, 326, 14, active ? C.slate : C.steel, 500, { "text-anchor": "middle" }),
        pill(status, x + 60, 354, active ? C.primary : "#EEF0F4", active ? "#FFFFFF" : C.steel, 84, 32),
      ].join(""));
    })
    .join("");

  const recent = [
    rect(294, 470, 1002, 118, C.surface, C.hairline, 12),
    worksheetThumb(326, 496, 110, 54, true),
    text("二次函数图像与性质综合题", 464, 516, 16, C.ink, 700),
    pill("数学", 464, 532, C.primarySoft, C.primaryDeep, 58, 26, 12),
    pill("去痕完成", 532, 532, C.cyanSoft, "#047A91", 86, 26, 12),
    text("今天 14:32", 638, 551, 13, C.steel, 500),
    outlineButton("打开", 1188, 508, 72),
  ].join("");

  return windowFrame("应用集合首页", [
    text("应用集合", 294, 98, 27, C.ink, 800),
    text("选择应用，开启高效学习", 294, 127, 15, C.slate, 500),
    appCards,
    text("最近使用", 294, 452, 19, C.ink, 750),
    text("查看全部 ›", 1210, 452, 14, C.slate, 600),
    recent,
  ].join(""));
}

function uploadScreen() {
  const steps = ["上传", "识别", "去痕", "复核", "保存"];
  const stepList = steps
    .map((s, i) => {
      const y = 154 + i * 78;
      const active = i === 0;
      return [
        circle(1254, y, 13, active ? C.primary : "#E8EDF5"),
        text(i + 1, 1254, y + 5, 12, active ? "#FFFFFF" : C.steel, 700, { "text-anchor": "middle" }),
        text(s, 1284, y - 3, 15, active ? C.primaryDeep : C.charcoal, 700),
        text(["等待上传照片", "识别题目内容与版式", "去除手写与批改痕迹", "检查识别与去痕结果", "保存到错题本"][i], 1284, y + 21, 12, C.steel, 500),
        i < 4 ? line(1254, y + 18, 1254, y + 58, "#CAD8EE", 1.4) : "",
      ].join("");
    })
    .join("");

  const records = [0, 1, 2].map((_, i) => {
    const y = 540 + i * 52;
    return [
      worksheetThumb(1254, y - 21, 50, 34, i === 0),
      text(["二次函数图像与性质…", "分数应用题（行程问题）", "阅读理解（说明文）"][i], 1314, y - 3, 12, C.charcoal, 600),
      text(["数学 · 今天 14:32", "数学 · 昨天 16:21", "语文 · 前天 10:05"][i], 1314, y + 15, 11, C.steel, 500),
      circle(1402, y, 10, C.primarySoft, C.primary),
      text("✓", 1402, y + 4, 11, C.primary, 800, { "text-anchor": "middle" }),
    ].join("");
  }).join("");

  return windowFrame("错题收集上传", [
    text("错题收集", 294, 88, 25, C.ink, 800),
    text("上传错题照片，AI 帮你整理成干净题面", 294, 116, 14, C.slate, 500),
    outlineButton("使用指南", 1152, 78, 96),
    rect(294, 148, 920, 430, C.surface, C.hairline, 12),
    rect(326, 198, 856, 232, C.surfaceBlue, "#AFC6F6", 14, {
      "stroke-dasharray": "8 7",
      "stroke-width": 1.5,
    }),
    text("▧+", 754, 282, 42, C.primary, 800, { "text-anchor": "middle" }),
    text("将错题照片拖拽到这里", 754, 333, 18, C.charcoal, 700, { "text-anchor": "middle" }),
    text("或", 754, 361, 13, C.steel, 500, { "text-anchor": "middle" }),
    button("上传错题照片", 672, 382, 164),
    text("支持 JPG / PNG / HEIC，单张不超过 20MB", 754, 452, 13, C.steel, 500, { "text-anchor": "middle" }),
    text("选择学科（可自动识别）", 326, 508, 16, C.charcoal, 700),
    segment(["自动", "语文", "数学", "英语"], 326, 528, 90, 40, 0),
    button("开始整理", 326, 612, 856),
    rect(1242, 72, 164, 488, C.surface, C.hairline, 12),
    text("AI 处理流程", 1262, 106, 16, C.ink, 750),
    stepList,
    rect(1242, 586, 164, 148, C.surface, C.hairline, 12),
    text("最近记录", 1262, 616, 16, C.ink, 750),
    records,
  ].join(""));
}

function reviewScreen() {
  return windowFrame("识别检查 / 去痕复核", [
    text("识别检查 / 去痕复核", 294, 86, 23, C.ink, 800),
    text("检查原图和干净题面效果，如果调整可修改后保存", 294, 113, 14, C.slate, 500),
    panelHeader("原图（含手写与批改）", 292, 142, 422, 546),
    worksheetFull(314, 190, 378, 418, true),
    miniToolbar(314, 625),
    panelHeader("干净题面（去痕效果）", 738, 142, 422, 546),
    worksheetFull(760, 190, 378, 418, false),
    miniToolbar(760, 625),
    text("→", 716, 418, 30, C.primary, 800, { "text-anchor": "middle" }),
    rect(1186, 142, 202, 546, C.surface, C.hairline, 12),
    text("AI 识别与去痕状态", 1206, 180, 16, C.ink, 750),
    statusCard(1206, 208, "识别草稿", "题目版式和内容已生成", C.primarySoft, C.primary, "i"),
    statusCard(1206, 276, "数学", "识别学科：数学", C.cyanSoft, "#047A91", "✓"),
    statusCard(1206, 344, "可信", "识别置信度：92%", C.primarySoft, C.primaryDeep, "i"),
    statusCard(1206, 412, "去痕需复核", "部分红笔批改区域需确认", C.roseSoft, C.rose, "⌁"),
    statusCard(1206, 480, "图形已保留", "题目中的图形已完整保留", C.primarySoft, C.primaryDeep, "□"),
    button("复核后保存", 1206, 570, 162),
    outlineButton("返回重传", 1206, 626, 162),
  ].join(""));
}

function detailScreen() {
  return windowFrame("已保存错题详情", [
    text("‹ 返回错题本", 294, 83, 14, C.slate, 650),
    outlineButton("查看原图", 1016, 56, 98),
    outlineButton("重新处理", 1130, 56, 98),
    outlineButton("编辑题面", 1244, 56, 98),
    rect(294, 114, 830, 450, C.surface, C.hairline, 12),
    text("题目（干净题面）", 326, 152, 17, C.ink, 750),
    rect(326, 176, 766, 330, C.surfaceClean, C.primarySoft, 10),
    cleanQuestion(360, 210, 698, 250),
    rect(1148, 114, 240, 450, C.surface, C.hairline, 12),
    text("题目信息", 1174, 152, 17, C.ink, 750),
    pill("数学", 1174, 176, C.primarySoft, C.primaryDeep, 70, 32),
    text("创建时间", 1174, 244, 13, C.steel, 500),
    text("2025-05-23 14:32", 1260, 244, 13, C.charcoal, 600),
    text("来源", 1174, 282, 13, C.steel, 500),
    text("上传图片", 1260, 282, 13, C.charcoal, 600),
    pill("去痕完成", 1174, 330, C.primarySoft, C.primaryDeep, 94, 32),
    pill("已人工修正", 1280, 330, C.amberSoft, "#9A6500", 100, 32),
    rect(1174, 410, 186, 106, C.amberSoft, "#F3D27A", 12),
    text("★", 1200, 472, 38, C.amber, 800),
    text("继续加油！", 1242, 452, 16, "#9A6500", 800),
    text("您已连续整理错题 3 天", 1242, 480, 12, "#9A6500", 500),
    rect(294, 590, 1094, 116, C.surfaceBlue, C.hairline, 12),
    text("AI 分析（规划中）", 326, 628, 17, C.ink, 750),
    text("未来将提供知识点识别、错因分析、同类题推荐等功能。敬请期待。", 326, 664, 14, C.slate, 500),
    text("了解更多 ›", 1236, 664, 14, C.primary, 750),
  ].join(""));
}

function panelHeader(label, x, y, w, h) {
  return [
    rect(x, y, w, h, C.surface, C.hairline, 12),
    text(label, x + 22, y + 38, 16, C.ink, 750),
  ].join("");
}

function statusCard(x, y, title, desc, fill, fg, icon) {
  return [
    rect(x, y, 162, 54, fill, "none", 8),
    circle(x + 20, y + 27, 11, "#FFFFFF", fg),
    text(icon, x + 20, y + 31, 11, fg, 800, { "text-anchor": "middle" }),
    text(title, x + 40, y + 23, 13, fg, 800),
    text(desc, x + 40, y + 41, 10, C.slate, 500),
  ].join("");
}

function segment(labels, x, y, w, h, activeIndex = 0) {
  return [
    rect(x, y, labels.length * w, h, C.surface, C.hairlineStrong, 8),
    labels.map((label, i) => [
      i === activeIndex ? rect(x + i * w, y, w, h, C.primary, "none", 8) : "",
      i > 0 ? line(x + i * w, y + 8, x + i * w, y + h - 8, C.hairline) : "",
      text(label, x + i * w + w / 2, y + h / 2 + 5, 13, i === activeIndex ? "#FFFFFF" : C.charcoal, 700, {
        "text-anchor": "middle",
      }),
    ].join("")).join(""),
  ].join("");
}

function miniToolbar(x, y) {
  return [
    text("⌕ 放大", x + 4, y, 12, C.steel, 500),
    text("⊖ 缩小", x + 74, y, 12, C.steel, 500),
    text("⟳ 旋转", x + 144, y, 12, C.steel, 500),
    text("裁剪", x + 214, y, 12, C.steel, 500),
    pill("1 / 1", x + 322, y - 18, C.surfaceSoft, C.slate, 58, 26, 11),
  ].join("");
}

function worksheetThumb(x, y, w, h, marks = false) {
  return [
    rect(x, y, w, h, "#FAFAFB", C.hairline, 4),
    line(x + 8, y + 12, x + w - 10, y + 12, "#C7CEDB"),
    line(x + 8, y + 24, x + w - 18, y + 24, "#C7CEDB"),
    line(x + 8, y + h - 14, x + w - 10, y + h - 14, "#C7CEDB"),
    polyline([[x + 14, y + h - 8], [x + 42, y + 28], [x + 72, y + h - 8]], "#17212B", 1.2),
    marks ? svgPath(`M ${x + 60} ${y + 16} q 12 18 32 -8`, C.rose, 2, "none") : "",
  ].join("");
}

function worksheetFull(x, y, w, h, marks = true) {
  return [
    rect(x, y, w, h, "#FBFBFD", C.hairline, 8),
    text("23. 如图，在平面直角坐标系中，抛物线 y = ax² + bx + c", x + 24, y + 38, 13, C.charcoal, 600),
    text("与 x 轴交于 A(-1,0)、B(3,0) 两点，与 y 轴交于点 C。", x + 24, y + 64, 13, C.charcoal, 600),
    text("(1) 求抛物线的解析式；", x + 24, y + 112, 13, C.charcoal, 600),
    text("(2) 当点 P 是抛物线上一点，求 △POC 的面积；", x + 24, y + 146, 13, C.charcoal, 600),
    text("(3) 连接 CP，当 CP ⟂ OP 时，求点 P 的坐标。", x + 24, y + 180, 13, C.charcoal, 600),
    coordinateGraph(x + 54, y + 234, 250, 150),
    marks ? [
      svgPath(`M ${x + 255} ${y + 260} q 18 22 52 -30`, C.rose, 2.8, "none"),
      text("a = -1", x + 260, y + 246, 21, C.rose, 700),
      text("b = 2", x + 260, y + 280, 21, C.rose, 700),
      text("c = 3", x + 260, y + 314, 21, C.rose, 700),
      text("解法正确！", x + 242, y + 366, 21, C.rose, 700, { transform: `rotate(-8 ${x + 242} ${y + 366})` }),
      svgPath(`M ${x + 235} ${y + 352} q 26 34 74 -20`, C.rose, 2.5, "none"),
    ].join("") : "",
  ].join("");
}

function cleanQuestion(x, y, w, h) {
  return [
    text("23. 如图，在平面直角坐标系中，抛物线 y = ax² + bx + c 与 x 轴交于 A(-1,0)、B(3,0)", x, y, 17, C.charcoal, 600),
    text("两点，与 y 轴交于点 C(0,3)，点 P 是抛物线在第一象限上的一点，连接 OP。", x, y + 34, 17, C.charcoal, 600),
    text("(1) 求抛物线的解析式；", x, y + 88, 17, C.charcoal, 600),
    text("(2) 当点 P 的横坐标为 1 时，求 △POC 的面积；", x, y + 124, 17, C.charcoal, 600),
    text("(3) 连接 CP，当 CP ⟂ OP 时，求点 P 的坐标。", x, y + 160, 17, C.charcoal, 600),
    coordinateGraph(x + 170, y + 190, 300, 154),
  ].join("");
}

function coordinateGraph(x, y, w, h) {
  const baseY = y + h - 20;
  const originX = x + 70;
  return [
    line(x, baseY, x + w, baseY, "#1F2937", 1.8),
    line(originX, y, originX, y + h, "#1F2937", 1.8),
    text("A", x + 2, baseY + 22, 13, C.charcoal, 600),
    text("O", originX - 6, baseY + 22, 13, C.charcoal, 600),
    text("B", x + w - 12, baseY + 22, 13, C.charcoal, 600),
    text("C", originX - 20, y + 22, 13, C.charcoal, 600),
    text("P", x + w - 60, y + 58, 13, C.charcoal, 600),
    svgPath(`M ${x + 14} ${baseY} C ${originX + 20} ${y - 6}, ${x + w - 98} ${y - 2}, ${x + w - 36} ${baseY}`, "#1F2937", 2, "none"),
    line(originX, baseY, x + w - 68, y + 62, "#1F2937", 1.5),
    circle(originX, baseY, 3, "#1F2937"),
  ].join("");
}

function polyline(points, stroke, width = 1, fill = "none") {
  return `<polyline ${attrs({
    points: points.map(([x, y]) => `${x},${y}`).join(" "),
    fill,
    stroke,
    "stroke-width": width,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  })}/>`;
}

function svgPath(d, stroke, width = 1, fill = "none") {
  return `<path ${attrs({
    d,
    fill,
    stroke,
    "stroke-width": width,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  })}/>`;
}

function board(screens) {
  const width = 3200;
  const height = 1840;
  const items = [
    ["1", "应用集合首页", screens.appHub, 40, 70],
    ["2", "错题收集上传", screens.upload, 1640, 70],
    ["3", "识别检查 / 去痕复核", screens.review, 40, 940],
    ["4", "已保存错题详情", screens.detail, 1640, 940],
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${rect(0, 0, width, height, "#F3F7FF", "none", 0)}
  ${items.map(([num, label, svgText, x, y]) => {
    const inner = svgText
      .replace(/^<svg[^>]*>/, "")
      .replace("</svg>", "");
    return [
      rect(x, y - 50, 34, 34, C.primary, "none", 4),
      text(num, x + 17, y - 26, 22, "#FFFFFF", 800, { "text-anchor": "middle" }),
      text(label, x + 48, y - 25, 30, C.ink, 800),
      `<g transform="translate(${x},${y}) scale(1.08)">${inner}</g>`,
    ].join("");
  }).join("")}
</svg>`;
}

const screens = {
  appHub: appHubScreen(),
  upload: uploadScreen(),
  review: reviewScreen(),
  detail: detailScreen(),
};

const files = [
  ["screens/01-app-hub.svg", screens.appHub],
  ["screens/02-wrong-question-upload.svg", screens.upload],
  ["screens/03-recognition-review.svg", screens.review],
  ["screens/04-saved-record-detail.svg", screens.detail],
  ["evocraft-b-ui-board.svg", board(screens)],
];

for (const [relative, data] of files) {
  fs.writeFileSync(nodePath.join(outDir, relative), data, "utf8");
}

console.log(`Generated ${files.length} SVG files in ${outDir}`);
