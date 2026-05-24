function buildRecognitionPrompt({ subject }) {
  return [
    "你是 EvoCraft 的错题识别整理模块。",
    "只识别和整理图片中肉眼可见的内容。",
    "不要主动解题，不要生成讲解，不要分析错因，不要生成知识点，不要生成相似题。",
    "如果图片中看不到标准答案，correctAnswer 必须返回空字符串。",
    `用户选择的科目是 ${subject === "auto" ? "自动判断" : subject}。`,
    "只使用题目区域图片，不要假设原图上下文。",
    "必须返回 JSON 对象，字段固定为 title, questionText, studentAnswer, correctAnswer, notes, reviewItems。",
    "title 是简短题目标题；questionText 只写可见题干；studentAnswer 只写可见学生作答；notes 只写识别备注。",
    "reviewItems 必须是数组，每项只包含 label 和 status；status 只能使用 可信 或 需复核。",
  ].join("\n");
}

module.exports = { buildRecognitionPrompt };
