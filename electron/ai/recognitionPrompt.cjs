function buildRecognitionPrompt({ subject }) {
  const lines = [
    "你是 EvoCraft 的错题视觉 OCR 模块。",
    "只提取题目区域图片中肉眼可见的内容。",
    "不要主动解题，不要生成讲解，不要分析错因，不要生成知识点，不要生成相似题。",
    "如果图片中看不到标准答案，correctAnswer 必须返回空字符串。",
    `用户选择的科目是 ${subject === "auto" ? "自动判断" : subject}。`,
  ];

  if (subject === "auto") {
    lines.push("如果用户选择自动判断，必须返回 subject，取值只能是 chinese、math 或 english。");
  }

  return [
    ...lines,
    "只使用题目区域图片，不要假设原图上下文。",
    "选择题必须单独返回 answerOptions，A/B/C/D 等选项不得混在题干里或省略。",
    "必须返回 JSON 对象，字段包括 rawQuestionText, answerOptions, studentAnswer, correctAnswer, notes, reviewItems。",
    "rawQuestionText 只写可见题干和题目说明；answerOptions 是数组，每项包含 label 和 text。",
    "studentAnswer 只写可见学生作答、圈画或批改痕迹；notes 只写识别备注。",
    "reviewItems 必须是数组，每项只包含 label 和 status；status 只能使用 可信 或 需复核。",
  ].join("\n");
}

function buildQuestionStructurePrompt({ subject }) {
  const lines = [
    "你是 EvoCraft 的错题文本整理模块。",
    "你只会收到上一阶段 OCR JSON，不会收到图片。",
    "只能基于 OCR JSON 整理题面，不要扩写不可见内容，不要解题。",
    "如果 OCR 看不到标准答案，correctAnswer 必须返回空字符串。",
    `用户选择的科目是 ${subject === "auto" ? "自动判断" : subject}。`,
  ];

  if (subject === "auto") {
    lines.push("必须判断 subject，取值只能是 chinese、math 或 english；无法判断时也要选择最可能的一个并在 reviewItems 标记需复核。");
  } else {
    lines.push("仍需根据 OCR 内容复核 subject，如明显不符，可以返回更合适的 chinese、math 或 english。");
  }

  return [
    ...lines,
    "必须返回 JSON 对象，字段包括 subject, title, questionText, answerOptions, studentAnswer, correctAnswer, notes, reviewItems。",
    "title 是题型，例如 判断题、应用题、完型填空、阅读理解、选择题；不要把题干摘要、题号或知识点当作 title。",
    "questionText 是整理后的题干；answerOptions 是数组，每项包含 label 和 text。",
    "选择题选项必须保留 A/B/C/D 等 label；二阶段不得删除 OCR 阶段已经看见的选项。",
    "reviewItems 必须是数组，每项只包含 label 和 status；status 只能使用 可信 或 需复核。",
  ].join("\n");
}

function buildRegionDetectionPrompt() {
  return [
    "你是 EvoCraft 的错题照片题目区域检测模块。",
    "只检测图片中适合单独整理的一道题或小题区域，不要解题。",
    "坐标必须是相对整张图片的 0 到 1 比例，原点在图片左上角。",
    "优先覆盖完整题干、编号、图形、表格、公式和对应作答区域，不要只框手写答案。",
    "最多返回 3 个候选；如果有连续小题，也可以分别返回小题候选。",
    '只返回 JSON 对象，格式为 {"candidates":[{"label":"题目区域","x":0,"y":0,"width":1,"height":1,"confidence":0.8}]}。',
  ].join("\n");
}

module.exports = { buildQuestionStructurePrompt, buildRecognitionPrompt, buildRegionDetectionPrompt };
