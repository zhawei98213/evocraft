import assert from "node:assert/strict";

import { buildRecognitionPrompt } from "../electron/ai/recognitionPrompt.cjs";
import { createQwenAdapter, parseQwenJsonContent } from "../electron/ai/qwenAdapter.cjs";

const explicitSubjectPrompt = buildRecognitionPrompt({ subject: "chinese" });
assert.match(explicitSubjectPrompt, /用户选择的科目是 chinese/);
assert.doesNotMatch(explicitSubjectPrompt, /自动判断，必须返回 subject/);

const autoSubjectPrompt = buildRecognitionPrompt({ subject: "auto" });
assert.match(autoSubjectPrompt, /用户选择的科目是 自动判断/);
assert.match(autoSubjectPrompt, /自动判断，必须返回 subject/);

const rawParsed = parseQwenJsonContent('{"title":"一元一次方程","questionText":"2x=4"}');
assert.equal(rawParsed.title, "一元一次方程");
assert.equal(rawParsed.questionText, "2x=4");

const fencedParsed = parseQwenJsonContent(
  '```json\n{"title":"阅读理解","questionText":"请概括文章主要内容。"}\n```',
);
assert.equal(fencedParsed.title, "阅读理解");
assert.equal(fencedParsed.questionText, "请概括文章主要内容。");

assert.equal(parseQwenJsonContent("not-json"), null);
assert.equal(parseQwenJsonContent(null), null);

const missingImageAdapter = createQwenAdapter({ apiKey: "test-key", fetchImpl: async () => ({ ok: true }) });
assert.deepEqual(await missingImageAdapter.detectRegions({ imageUri: "" }), {
  ok: false,
  reason: "image_missing",
  message: "请先选择一张错题照片。",
  retryable: true,
});

let detectFetchCalls = 0;
const detectAdapter = createQwenAdapter({
  apiKey: "test-key",
  fetchImpl: async (url, init) => {
    detectFetchCalls += 1;
    assert.equal(url, "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions");
    assert.match(init.headers.Authorization, /^Bearer test-key$/);
    assert.match(init.body, /请检测题目区域候选框/);
    assert.match(init.body, /data:image\/png;base64,b3JpZ2luYWw=/);
    return {
      ok: true,
      async json() {
        return {
          choices: [
            {
              message: {
                content:
                  "```json\n" +
                  JSON.stringify({
                    candidates: [
                      {
                        label: "(1) long provider label should not enter UI",
                        x: 408,
                        y: 256,
                        width: 759,
                        height: 129,
                        confidence: 0.8,
                      },
                      {
                        label: "(2) long provider label should not enter UI",
                        x: 414,
                        y: 600,
                        width: 751,
                        height: 129,
                        confidence: 0.8,
                      },
                    ],
                  }) +
                  "\n```",
              },
            },
          ],
        };
      },
    };
  },
});

const detectResult = await detectAdapter.detectRegions({
  imageUri: "data:image/png;base64,b3JpZ2luYWw=",
});
assert.equal(detectResult.ok, true);
assert.equal(detectFetchCalls, 1);
assert.deepEqual(
  detectResult.candidates.map(({ id, label, x, y, width, height, source }) => ({
    id,
    label,
    x,
    y,
    width,
    height,
    source,
  })),
  [
    {
      id: "qwen-candidate-overall",
      label: "整题候选",
      x: 0.04,
      y: 0.226,
      width: 0.92,
      height: 0.533,
      source: "ai_candidate",
    },
    {
      id: "qwen-candidate-1",
      label: "AI 候选 1",
      x: 0.04,
      y: 0.226,
      width: 0.92,
      height: 0.189,
      source: "ai_candidate",
    },
    {
      id: "qwen-candidate-2",
      label: "AI 候选 2",
      x: 0.04,
      y: 0.57,
      width: 0.92,
      height: 0.189,
      source: "ai_candidate",
    },
    {
      id: "qwen-candidate-full",
      label: "整张图片候选",
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      source: "ai_candidate",
    },
  ],
);
assert.equal(detectResult.candidates[0].confidence > detectResult.candidates[1].confidence, true);

const invalidDetectResult = await createQwenAdapter({
  apiKey: "test-key",
  fetchImpl: async () => ({
    ok: true,
    async json() {
      return {
        choices: [{ message: { content: "not-json" } }],
      };
    },
  }),
}).detectRegions({
  imageUri: "data:image/png;base64,b3JpZ2luYWw=",
});
assert.equal(invalidDetectResult.ok, true);
assert.deepEqual(invalidDetectResult.candidates, [
  {
    id: "qwen-candidate-full",
    label: "整张图片候选",
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    unit: "ratio",
    source: "ai_candidate",
    confidence: 0.45,
  },
]);

const placeholderRegion = {
  id: "candidate-1",
  label: "候选 1",
  x: 0.1,
  y: 0.1,
  width: 0.5,
  height: 0.5,
  unit: "ratio",
  source: "manual",
  confidence: 1,
};

assert.deepEqual(
  await missingImageAdapter.recognizeQuestion({
    subject: "chinese",
    imageUri: "",
    selectedRegion: placeholderRegion,
    selectedRegionImageUri: "data:image/png;base64,cmVnaW9u",
  }),
  {
    ok: false,
    reason: "image_missing",
    message: "请先选择一张错题照片。",
    retryable: true,
  },
);

assert.deepEqual(
  await missingImageAdapter.recognizeQuestion({
    subject: "chinese",
    imageUri: "data:image/png;base64,b3JpZ2luYWw=",
    selectedRegion: null,
    selectedRegionImageUri: "data:image/png;base64,cmVnaW9u",
  }),
  {
    ok: false,
    reason: "region_missing",
    message: "请先选择或手动画出一道题目区域。",
    retryable: true,
  },
);

assert.deepEqual(
  await missingImageAdapter.recognizeQuestion({
    subject: "chinese",
    imageUri: "data:image/png;base64,b3JpZ2luYWw=",
    selectedRegion: placeholderRegion,
    selectedRegionImageUri: "",
  }),
  {
    ok: false,
    reason: "region_image_missing",
    message: "题目区域截图生成失败，请重新确认区域。",
    retryable: true,
  },
);

let fileUrlFetchCalls = 0;
const fileUrlResult = await createQwenAdapter({
  apiKey: "test-key",
  fetchImpl: async () => {
    fileUrlFetchCalls += 1;
    return { ok: true };
  },
}).recognizeQuestion({
  subject: "chinese",
  imageUri: "file:///tmp/original.png",
  selectedRegion: placeholderRegion,
  selectedRegionImageUri: "file:///tmp/region.png",
});
assert.deepEqual(fileUrlResult, {
  ok: false,
  reason: "region_image_unsupported",
  message: "题目区域图片必须是可发送给 AI 服务的数据 URL。",
  retryable: false,
});
assert.equal(fileUrlFetchCalls, 0);

assert.deepEqual(
  await createQwenAdapter({ fetchImpl: async () => ({ ok: true }) }).recognizeQuestion({
    subject: "chinese",
    imageUri: "data:image/png;base64,b3JpZ2luYWw=",
    selectedRegion: placeholderRegion,
    selectedRegionImageUri: "data:image/png;base64,cmVnaW9u",
  }),
  {
    ok: false,
    reason: "provider_not_configured",
    message: "真实 AI 未配置 API Key。",
    retryable: false,
  },
);

const calls = [];
const adapter = createQwenAdapter({
  apiKey: "test-key",
  fetchImpl: async (url, init) => {
    calls.push({ url, init });
    return {
      ok: true,
      status: 200,
      async json() {
        return {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  title: "阅读理解",
                  questionText: "请概括文章主要内容。",
                  studentAnswer: "图片中可见学生作答，需复核。",
                  correctAnswer: "",
                  notes: "未主动解题。",
                  reviewItems: [{ label: "答案", status: "需复核" }],
                }),
              },
            },
          ],
          usage: { total_tokens: 128 },
        };
      },
    };
  },
});

const result = await adapter.recognizeQuestion({
  subject: "chinese",
  imageUri: "data:image/png;base64,b3JpZ2luYWw=",
  selectedRegion: placeholderRegion,
  selectedRegionImageUri: "data:image/png;base64,cmVnaW9u",
});

assert.equal(result.ok, true);
assert.equal(result.draft.title, "阅读理解");
assert.equal(result.draft.questionText, "请概括文章主要内容。");
assert.equal(result.draft.studentAnswer, "图片中可见学生作答，需复核。");
assert.equal(result.draft.correctAnswer, "");
assert.equal(result.draft.notes, "未主动解题。");
assert.deepEqual(result.draft.reviewItems, [{ label: "答案", status: "需复核" }]);
assert.equal(result.draft.modelTraces.every((trace) => trace.provider === "qwen"), true);
assert.equal(result.draft.providerMeta.usage.total_tokens, 128);

assert.equal(calls.length, 1);
assert.equal(calls[0].url, "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions");
assert.match(calls[0].init.headers.Authorization, /^Bearer test-key$/);
assert.match(calls[0].init.body, /qwen-vl-ocr-latest/);
assert.match(calls[0].init.body, /"temperature":0/);
assert.match(calls[0].init.body, /data:image\/png;base64,cmVnaW9u/);
assert.doesNotMatch(calls[0].init.body, /data:image\/png;base64,b3JpZ2luYWw=/);

const requestFailureResult = await createQwenAdapter({
  apiKey: "test-key",
  fetchImpl: async () => {
    throw new Error("network");
  },
}).recognizeQuestion({
  subject: "chinese",
  imageUri: "data:image/png;base64,b3JpZ2luYWw=",
  selectedRegion: placeholderRegion,
  selectedRegionImageUri: "data:image/png;base64,cmVnaW9u",
});
assert.equal(requestFailureResult.ok, false);
assert.equal(requestFailureResult.reason, "provider_request_failed");

const nonOkResponseResult = await createQwenAdapter({
  apiKey: "test-key",
  fetchImpl: async () => ({
    ok: false,
    status: 429,
    async json() {
      return { error: "rate limited" };
    },
  }),
}).recognizeQuestion({
  subject: "chinese",
  imageUri: "data:image/png;base64,b3JpZ2luYWw=",
  selectedRegion: placeholderRegion,
  selectedRegionImageUri: "data:image/png;base64,cmVnaW9u",
});
assert.equal(nonOkResponseResult.ok, false);
assert.equal(nonOkResponseResult.reason, "provider_request_failed");

const invalidResponseResult = await createQwenAdapter({
  apiKey: "test-key",
  fetchImpl: async () => ({
    ok: true,
    async json() {
      return {
        choices: [{ message: { content: "not-json" } }],
      };
    },
  }),
}).recognizeQuestion({
  subject: "chinese",
  imageUri: "data:image/png;base64,b3JpZ2luYWw=",
  selectedRegion: placeholderRegion,
  selectedRegionImageUri: "data:image/png;base64,cmVnaW9u",
});
assert.equal(invalidResponseResult.ok, false);
assert.equal(invalidResponseResult.reason, "provider_response_invalid");

const badReviewStatusResult = await createQwenAdapter({
  apiKey: "test-key",
  fetchImpl: async () => ({
    ok: true,
    async json() {
      return {
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: "阅读理解",
                questionText: "请概括文章主要内容。",
                reviewItems: [{ label: "答案", status: "模型长篇解释而不是状态" }],
              }),
            },
          },
        ],
      };
    },
  }),
}).recognizeQuestion({
  subject: "chinese",
  imageUri: "data:image/png;base64,b3JpZ2luYWw=",
  selectedRegion: placeholderRegion,
  selectedRegionImageUri: "data:image/png;base64,cmVnaW9u",
});
assert.equal(badReviewStatusResult.ok, true);
assert.deepEqual(badReviewStatusResult.draft.reviewItems, [{ label: "答案", status: "需复核" }]);

const emptyTitleResult = await createQwenAdapter({
  apiKey: "test-key",
  fetchImpl: async () => ({
    ok: true,
    async json() {
      return {
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: "",
                questionText: "写出符合要求的小数。",
                reviewItems: [{ label: "标题", status: "需复核" }],
              }),
            },
          },
        ],
      };
    },
  }),
}).recognizeQuestion({
  subject: "math",
  imageUri: "data:image/png;base64,b3JpZ2luYWw=",
  selectedRegion: placeholderRegion,
  selectedRegionImageUri: "data:image/png;base64,cmVnaW9u",
});
assert.equal(emptyTitleResult.ok, true);
assert.equal(emptyTitleResult.draft.title, "识别草稿");

const autoSubjectWithoutProviderSubjectResult = await createQwenAdapter({
  apiKey: "test-key",
  fetchImpl: async () => ({
    ok: true,
    async json() {
      return {
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: "阅读理解",
                questionText: "请概括文章主要内容。",
                reviewItems: [{ label: "科目", status: "需复核" }],
              }),
            },
          },
        ],
      };
    },
  }),
}).recognizeQuestion({
  subject: "auto",
  imageUri: "data:image/png;base64,b3JpZ2luYWw=",
  selectedRegion: placeholderRegion,
  selectedRegionImageUri: "data:image/png;base64,cmVnaW9u",
});
assert.equal(autoSubjectWithoutProviderSubjectResult.ok, true);
assert.equal(autoSubjectWithoutProviderSubjectResult.draft.subject, "unknown");
assert.deepEqual(autoSubjectWithoutProviderSubjectResult.draft.reviewItems[0], {
  label: "科目",
  status: "需复核",
});

const autoSubjectResult = await createQwenAdapter({
  apiKey: "test-key",
  fetchImpl: async () => ({
    ok: true,
    async json() {
      return {
        choices: [
          {
            message: {
              content: JSON.stringify({
                subject: "english",
                title: "Reading",
                questionText: "Choose the best answer.",
                reviewItems: [{ label: "科目", status: "可信" }],
              }),
            },
          },
        ],
      };
    },
  }),
}).recognizeQuestion({
  subject: "auto",
  imageUri: "data:image/png;base64,b3JpZ2luYWw=",
  selectedRegion: placeholderRegion,
  selectedRegionImageUri: "data:image/png;base64,cmVnaW9u",
});
assert.equal(autoSubjectResult.ok, true);
assert.equal(autoSubjectResult.draft.subject, "english");
