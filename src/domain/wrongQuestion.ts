export const APP_ID = "wrong_question_capture";
export const STORAGE_KEY = "evocraft.wrongQuestion.records.v1";

export const SUBJECTS = {
  chinese: "语文",
  math: "数学",
  english: "英语",
} as const;

export type Subject = keyof typeof SUBJECTS;
export type RegionSource = "ai_candidate" | "manual";
export type RegionUnit = "ratio";
export type AiTask = "region_detection" | "ocr" | "structure" | "cleanup";
export type ReviewStatus = "needs_review" | "reviewed";

export interface RegionCandidate {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  unit: RegionUnit;
  source: RegionSource;
  confidence: number;
}

export interface ModelTrace {
  provider: "mock" | string;
  modelId: string;
  task: AiTask;
}

export interface ReviewItem {
  label: string;
  status: string;
}

export interface WrongQuestionDraft {
  id: string;
  appId: typeof APP_ID;
  createdAt: string;
  updatedAt: string;
  subject: Subject;
  title: string;
  questionText: string;
  originalImageUri: string;
  selectedRegion: RegionCandidate;
  selectedRegionImageUri: string;
  cleanedQuestionImageUri: string;
  visualSnippetUri: string;
  studentAnswer: string;
  correctAnswer: string;
  notes: string;
  recognitionStatus: ReviewStatus;
  recognitionConfidence: number;
  cleanupStatus: ReviewStatus;
  cleanupConfidence: number;
  modelTraces: ModelTrace[];
  reviewItems: ReviewItem[];
}

export interface WrongQuestionRecord extends WrongQuestionDraft {
  id: string;
  recognitionStatus: "reviewed";
  cleanupStatus: "reviewed";
}

interface SubjectSample {
  title: string;
  question: string;
  answer: string;
}

interface CreateMockRecognitionOptions {
  subject?: Subject;
  imageUri?: string;
  selectedRegion?: RegionCandidate;
  selectedRegionImageUri?: string;
  now?: string;
}

interface CreateRecordOverrides {
  id?: string;
  now?: string;
  createdAt?: string;
  title?: string;
  subject?: Subject;
  questionText?: string;
  studentAnswer?: string;
  correctAnswer?: string;
  notes?: string;
}

const subjectSamples: Record<Subject, SubjectSample> = {
  chinese: {
    title: "阅读理解句子赏析题",
    question:
      "阅读短文第 3 段，结合上下文，说说画线句子表达了人物怎样的心情，并写出你的理由。",
    answer: "抓住关键词和人物动作，结合上下文作答。",
  },
  math: {
    title: "一次函数图像与坐标综合题",
    question:
      "23. 如图，在平面直角坐标系中，抛物线与 x 轴交于 A(-1,0)、B(3,0) 两点，与 y 轴交于点 C(0,3)，点 P 是抛物线在第一象限上的一点，连接 OP。\n(1) 求抛物线的解析式；\n(2) 当点 P 的横坐标为 1 时，求三角形 POC 的面积；\n(3) 连接 CP，当 CP 垂直 OP 时，求点 P 的坐标。",
    answer: "先由 A、B、C 三点求解析式，再代入 P 点坐标计算。",
  },
  english: {
    title: "完形填空语境判断题",
    question:
      "Read the passage and choose the best answer for each blank. Pay attention to the tense, pronouns and the meaning of the whole paragraph.",
    answer: "先通读段落，确认时态和上下文线索后再选择。",
  },
};

const defaultRegionCandidates: RegionCandidate[] = [
  {
    id: "candidate-1",
    label: "候选 1",
    x: 0.11,
    y: 0.18,
    width: 0.78,
    height: 0.18,
    unit: "ratio",
    source: "ai_candidate",
    confidence: 0.72,
  },
  {
    id: "candidate-2",
    label: "候选 2",
    x: 0.1,
    y: 0.4,
    width: 0.8,
    height: 0.28,
    unit: "ratio",
    source: "ai_candidate",
    confidence: 0.9,
  },
  {
    id: "candidate-3",
    label: "候选 3",
    x: 0.12,
    y: 0.72,
    width: 0.76,
    height: 0.16,
    unit: "ratio",
    source: "ai_candidate",
    confidence: 0.66,
  },
];

export function createMockRegionCandidates() {
  return defaultRegionCandidates.map((candidate) => ({ ...candidate }));
}

export function createManualRegion(): RegionCandidate {
  return {
    id: `manual-${Date.now()}`,
    label: "手动画框",
    x: 0.18,
    y: 0.28,
    width: 0.64,
    height: 0.34,
    unit: "ratio",
    source: "manual",
    confidence: 1,
  };
}

export function deleteRegionCandidate(
  regionCandidates: RegionCandidate[],
  regionId: string,
  selectedRegionId: string | null,
) {
  const deleteIndex = regionCandidates.findIndex((candidate) => candidate.id === regionId);
  if (deleteIndex === -1) {
    return {
      regionCandidates: regionCandidates.map((candidate) => ({ ...candidate })),
      selectedRegionId,
    };
  }

  const nextCandidates = regionCandidates.filter((candidate) => candidate.id !== regionId);
  if (selectedRegionId !== regionId) {
    return {
      regionCandidates: nextCandidates,
      selectedRegionId,
    };
  }

  const nextSelection = nextCandidates[deleteIndex]?.id ?? nextCandidates[deleteIndex - 1]?.id ?? null;
  return {
    regionCandidates: nextCandidates,
    selectedRegionId: nextSelection,
  };
}

export function deleteRecord(
  records: WrongQuestionRecord[],
  recordId: string,
  selectedRecordId: string | null,
) {
  const deleteIndex = records.findIndex((record) => record.id === recordId);
  if (deleteIndex === -1) {
    return {
      records: records.map(cloneRecord),
      selectedRecordId,
    };
  }

  const nextRecords = records.filter((record) => record.id !== recordId);
  const selectedStillExists = nextRecords.some((record) => record.id === selectedRecordId);
  const nextSelectedRecordId =
    selectedRecordId === recordId || !selectedStillExists
      ? nextRecords[deleteIndex]?.id ?? nextRecords[deleteIndex - 1]?.id ?? null
      : selectedRecordId;

  return {
    records: nextRecords,
    selectedRecordId: nextSelectedRecordId,
  };
}

export function createCleanQuestionImage(subject: Subject = "math") {
  const sample = subjectSamples[subject] ?? subjectSamples.math;
  const title = sample.title;
  const body = sample.question.split("\n").slice(0, 4);
  const bodyText = body
    .map(
      (line, index) =>
        `<text x="44" y="${108 + index * 34}" fill="#24313D" font-size="18">${escapeSvg(
          line,
        )}</text>`,
    )
    .join("");

  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="880" height="620" viewBox="0 0 880 620">
      <rect width="880" height="620" rx="20" fill="#F5F8FF"/>
      <rect x="24" y="24" width="832" height="572" rx="18" fill="#FFFFFF" stroke="#DCE6F5"/>
      <text x="44" y="70" fill="#17212B" font-family="Inter, Noto Sans SC, sans-serif" font-size="25" font-weight="700">${escapeSvg(
        title,
      )}</text>
      ${bodyText}
      <g transform="translate(118 340)">
        <line x1="0" y1="150" x2="360" y2="150" stroke="#17212B" stroke-width="3"/>
        <line x1="82" y1="178" x2="82" y2="12" stroke="#17212B" stroke-width="3"/>
        <path d="M28 150 C84 26 210 20 306 150" fill="none" stroke="#17212B" stroke-width="4"/>
        <line x1="82" y1="150" x2="240" y2="62" stroke="#17212B" stroke-width="3"/>
        <circle cx="82" cy="150" r="4" fill="#17212B"/>
        <circle cx="28" cy="150" r="4" fill="#17212B"/>
        <circle cx="306" cy="150" r="4" fill="#17212B"/>
        <circle cx="240" cy="62" r="5" fill="#17212B"/>
        <text x="16" y="174" fill="#17212B" font-size="20">A</text>
        <text x="300" y="174" fill="#17212B" font-size="20">B</text>
        <text x="60" y="28" fill="#17212B" font-size="20">C</text>
        <text x="252" y="58" fill="#17212B" font-size="20">P</text>
        <text x="96" y="174" fill="#17212B" font-size="20">O</text>
        <text x="370" y="154" fill="#17212B" font-size="20">x</text>
        <text x="74" y="0" fill="#17212B" font-size="20">y</text>
      </g>
      <rect x="580" y="354" width="206" height="74" rx="12" fill="#E8F0FF" stroke="#B8C8E6"/>
      <text x="604" y="386" fill="#1D4ED8" font-size="18" font-weight="700">AI 已生成干净题面</text>
      <text x="604" y="414" fill="#536171" font-size="15">红笔与作答痕迹已隐藏</text>
    </svg>
  `);
}

export function createOriginalPlaceholderImage() {
  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="880" height="620" viewBox="0 0 880 620">
      <rect width="880" height="620" rx="20" fill="#FFFDF7"/>
      <rect x="28" y="28" width="824" height="564" rx="18" fill="#FFFFFF" stroke="#E6D7C8"/>
      <text x="52" y="78" fill="#17212B" font-size="25" font-weight="700">原图预览</text>
      <text x="52" y="130" fill="#24313D" font-size="19">23. 如图，在平面直角坐标系中，抛物线与 x 轴交于 A、B 两点...</text>
      <text x="52" y="170" fill="#24313D" font-size="19">(1) 求抛物线的解析式；</text>
      <text x="52" y="208" fill="#24313D" font-size="19">(2) 当点 P 的横坐标为 1 时，求面积；</text>
      <g transform="translate(112 340)">
        <line x1="0" y1="150" x2="360" y2="150" stroke="#17212B" stroke-width="3"/>
        <line x1="82" y1="178" x2="82" y2="12" stroke="#17212B" stroke-width="3"/>
        <path d="M28 150 C84 26 210 20 306 150" fill="none" stroke="#17212B" stroke-width="4"/>
        <line x1="82" y1="150" x2="240" y2="62" stroke="#17212B" stroke-width="3"/>
      </g>
      <path d="M555 214 c44 20 72 12 92 -16" fill="none" stroke="#E85D75" stroke-width="8" stroke-linecap="round"/>
      <path d="M560 316 l26 28 l74 -90" fill="none" stroke="#E85D75" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="600" y="390" fill="#E85D75" font-size="31" font-weight="700" transform="rotate(-8 600 390)">解法正确!</text>
      <text x="612" y="454" fill="#E85D75" font-size="26" font-weight="700">a=-1  b=2  c=3</text>
    </svg>
  `);
}

export function createMockRecognition({
  subject = "math",
  imageUri,
  selectedRegion,
  selectedRegionImageUri,
  now,
}: CreateMockRecognitionOptions = {}): WrongQuestionDraft {
  const sample = subjectSamples[subject];
  const timestamp = now ?? new Date().toISOString();
  const fallbackRegion = selectedRegion ?? createMockRegionCandidates()[1];
  const originalImageUri = imageUri || createOriginalPlaceholderImage();

  return {
    id: `draft-${Date.now()}`,
    appId: APP_ID,
    createdAt: timestamp,
    updatedAt: timestamp,
    subject,
    title: sample.title,
    questionText: sample.question,
    originalImageUri,
    selectedRegion: fallbackRegion,
    selectedRegionImageUri: selectedRegionImageUri || originalImageUri,
    cleanedQuestionImageUri: createCleanQuestionImage(subject),
    visualSnippetUri: createCleanQuestionImage(subject),
    studentAnswer: "AI 识别到学生作答痕迹，已从干净题面中隐藏，请人工确认是否需要保留到备注。",
    correctAnswer: sample.answer,
    notes: "当前为本地 mock 识别结果；真实 AI/OCR 接入前不会上传儿童学习照片。",
    recognitionStatus: "needs_review",
    recognitionConfidence: 0.92,
    cleanupStatus: "needs_review",
    cleanupConfidence: 0.78,
    modelTraces: [
      { provider: "mock", modelId: "local-region-mock", task: "region_detection" },
      { provider: "mock", modelId: "local-ocr-mock", task: "ocr" },
      { provider: "mock", modelId: "local-structure-mock", task: "structure" },
      { provider: "mock", modelId: "local-cleanup-mock", task: "cleanup" },
    ],
    reviewItems: [
      { label: "题干文字已识别", status: "可信" },
      { label: "学生作答已隐藏", status: "请检查" },
      { label: "图形内容已保留", status: "可信" },
      { label: "批改痕迹需确认", status: "需复核" },
    ],
  };
}

export function createRecordFromDraft(
  draft: WrongQuestionDraft,
  overrides: CreateRecordOverrides = {},
): WrongQuestionRecord {
  const now = overrides.now || new Date().toISOString();

  return {
    ...draft,
    id: overrides.id || `wq-${Date.now()}`,
    createdAt: overrides.createdAt || now,
    updatedAt: now,
    title: overrides.title ?? draft.title,
    subject: overrides.subject ?? draft.subject,
    questionText: overrides.questionText ?? draft.questionText,
    studentAnswer: overrides.studentAnswer ?? draft.studentAnswer,
    correctAnswer: overrides.correctAnswer ?? draft.correctAnswer,
    notes: overrides.notes ?? draft.notes,
    recognitionStatus: "reviewed",
    cleanupStatus: "reviewed",
  };
}

export function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "刚刚";

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function svgDataUri(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeSvg(value: string) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function cloneRecord(record: WrongQuestionRecord): WrongQuestionRecord {
  return {
    ...record,
    selectedRegion: { ...record.selectedRegion },
    modelTraces: record.modelTraces.map((trace) => ({ ...trace })),
    reviewItems: record.reviewItems.map((item) => ({ ...item })),
  };
}
