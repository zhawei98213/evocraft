const {
  buildQuestionStructurePrompt,
  buildRecognitionPrompt,
  buildRegionDetectionPrompt,
} = require("./recognitionPrompt.cjs");

const defaultEndpoint = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
const defaultModel = "qwen-vl-ocr-latest";
const defaultStructureModel = "qwen-plus";
const validSubjects = new Set(["chinese", "math", "english"]);
const validReviewStatuses = new Set(["可信", "需复核"]);

function createQwenAdapter({
  apiKey,
  endpoint = defaultEndpoint,
  model = defaultModel,
  structureModel = defaultStructureModel,
  fetchImpl = globalThis.fetch,
} = {}) {
  return {
    async detectRegions(input) {
      if (!input?.imageUri) {
        return {
          ok: false,
          reason: "image_missing",
          message: "请先选择一张错题照片。",
          retryable: true,
        };
      }

      if (!apiKey) {
        return {
          ok: false,
          reason: "provider_not_configured",
          message: "真实 AI 未配置 API Key。",
          retryable: false,
        };
      }

      if (typeof fetchImpl !== "function") {
        return {
          ok: false,
          reason: "provider_not_configured",
          message: "当前运行环境未提供可用的网络请求实现。",
          retryable: false,
        };
      }

      let response;
      try {
        response = await fetchImpl(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: "system",
                content: buildRegionDetectionPrompt(),
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "请检测题目区域候选框。",
                  },
                  {
                    type: "image_url",
                    image_url: { url: input.imageUri },
                  },
                ],
              },
            ],
            temperature: 0,
          }),
        });
      } catch {
        return {
          ok: false,
          reason: "provider_request_failed",
          message: "真实 AI 自动找题请求失败，请手动画框或稍后重试。",
          retryable: true,
        };
      }

      if (!response?.ok) {
        return {
          ok: false,
          reason: "provider_request_failed",
          message: "真实 AI 自动找题请求失败，请手动画框或稍后重试。",
          retryable: true,
        };
      }

      let payload;
      try {
        payload = await response.json();
      } catch {
        return {
          ok: true,
          candidates: [createFullImageRegionCandidate()],
        };
      }

      const content = payload?.choices?.[0]?.message?.content;
      const parsed = parseQwenJsonContent(content);
      return {
        ok: true,
        candidates: normalizeRegionCandidates(parsed),
      };
    },

    async recognizeQuestion(input) {
      if (!input?.imageUri) {
        return {
          ok: false,
          reason: "image_missing",
          message: "请先选择一张错题照片。",
          retryable: true,
        };
      }

      if (!input.selectedRegion) {
        return {
          ok: false,
          reason: "region_missing",
          message: "请先选择或手动画出一道题目区域。",
          retryable: true,
        };
      }

      if (!input.selectedRegionImageUri) {
        return {
          ok: false,
          reason: "region_image_missing",
          message: "题目区域截图生成失败，请重新确认区域。",
          retryable: true,
        };
      }

      if (!isProviderImageUri(input.selectedRegionImageUri)) {
        return {
          ok: false,
          reason: "region_image_unsupported",
          message: "题目区域图片必须是可发送给 AI 服务的数据 URL。",
          retryable: false,
        };
      }

      if (!apiKey) {
        return {
          ok: false,
          reason: "provider_not_configured",
          message: "真实 AI 未配置 API Key。",
          retryable: false,
        };
      }

      if (typeof fetchImpl !== "function") {
        return {
          ok: false,
          reason: "provider_not_configured",
          message: "当前运行环境未提供可用的网络请求实现。",
          retryable: false,
        };
      }

      const startedAt = Date.now();
      const ocrResult = await requestQwenJson({
        apiKey,
        endpoint,
        fetchImpl,
        model,
        messages: [
          {
            role: "system",
            content: buildRecognitionPrompt({ subject: input.subject }),
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "请只识别这张题目区域图片中的可见内容，并返回 JSON。",
              },
              {
                type: "image_url",
                image_url: { url: input.selectedRegionImageUri },
              },
            ],
          },
        ],
      });

      if (!ocrResult.ok && ocrResult.reason === "request_failed") {
        return {
          ok: false,
          reason: "provider_request_failed",
          message: "真实 AI 服务请求失败，请稍后重试。",
          retryable: true,
        };
      }

      if (!ocrResult.ok && ocrResult.reason === "response_invalid") {
        return {
          ok: false,
          reason: "provider_response_invalid",
          message: "真实 AI 返回格式异常，请重试或手动填写。",
          retryable: true,
        };
      }

      let structureResult = await requestQwenJson({
        apiKey,
        endpoint,
        fetchImpl,
        model: structureModel,
        messages: [
          {
            role: "system",
            content: buildQuestionStructurePrompt({ subject: input.subject }),
          },
          {
            role: "user",
            content: `请整理以下 OCR JSON，并只返回规范化 JSON：\n${JSON.stringify(ocrResult.parsed)}`,
          },
        ],
      });

      if (!structureResult.ok) {
        structureResult = {
          ok: true,
          parsed: null,
          payload: null,
          fallback: true,
        };
      }

      const now = new Date().toISOString();
      const structured = structureResult.parsed;
      const subject = resolveDraftSubject(input.subject, structured?.subject ?? ocrResult.parsed?.subject);
      const answerOptions = mergeAnswerOptions(
        normalizeAnswerOptions(structured?.answerOptions),
        normalizeAnswerOptions(ocrResult.parsed?.answerOptions),
      );
      const reviewItems = normalizeReviewItems(
        structured?.reviewItems ?? ocrResult.parsed?.reviewItems,
        structureResult.fallback,
      );

      return {
        ok: true,
        draft: {
          id: `draft-${Date.now()}`,
          appId: "wrong_question_capture",
          createdAt: now,
          updatedAt: now,
          subject,
          title: asNonBlankString(structured?.title ?? ocrResult.parsed?.title, "识别草稿"),
          questionText: asString(
            structured?.questionText ?? ocrResult.parsed?.questionText ?? ocrResult.parsed?.rawQuestionText,
            "",
          ),
          originalImageUri: input.imageUri,
          selectedRegion: input.selectedRegion,
          selectedRegionImageUri: input.selectedRegionImageUri,
          cleanedQuestionImageUri: input.selectedRegionImageUri,
          visualSnippetUri: input.selectedRegionImageUri,
          answerOptions,
          studentAnswer: asString(structured?.studentAnswer ?? ocrResult.parsed?.studentAnswer, ""),
          correctAnswer: asString(structured?.correctAnswer ?? ocrResult.parsed?.correctAnswer, ""),
          notes: asString(
            structured?.notes ?? ocrResult.parsed?.notes,
            structureResult.fallback
              ? "OCR 已完成，题面整理阶段失败，请人工复核。"
              : "真实 AI 识别草稿，请人工复核。",
          ),
          recognitionStatus: "needs_review",
          recognitionConfidence: structureResult.fallback ? 0.58 : 0.72,
          cleanupStatus: "needs_review",
          cleanupConfidence: 0.7,
          modelTraces: [
            { provider: "qwen", modelId: model, task: "ocr" },
            { provider: "qwen", modelId: structureModel, task: "structure" },
            { provider: "qwen", modelId: model, task: "cleanup" },
          ],
          reviewItems,
          providerMeta: {
            ocrUsage: ocrResult.payload?.usage ?? null,
            structureUsage: structureResult.payload?.usage ?? null,
            structureFallback: Boolean(structureResult.fallback),
            elapsedMs: Date.now() - startedAt,
          },
        },
      };
    },
  };
}

async function requestQwenJson({ apiKey, endpoint, fetchImpl, model, messages }) {
  let response;
  try {
    response = await fetchImpl(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0,
      }),
    });
  } catch {
    return { ok: false, reason: "request_failed" };
  }

  if (!response?.ok) {
    return { ok: false, reason: "request_failed" };
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    return { ok: false, reason: "response_invalid" };
  }

  const content = payload?.choices?.[0]?.message?.content;
  const parsed = parseQwenJsonContent(content);
  if (!parsed) {
    return { ok: false, reason: "response_invalid" };
  }

  return { ok: true, parsed, payload };
}

function isProviderImageUri(imageUri) {
  return /^data:image\/[a-z0-9.+-]+;base64,/i.test(imageUri);
}

function parseQwenJsonContent(content) {
  if (typeof content !== "string") {
    return null;
  }

  const cleaned = content
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");

  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function normalizeReviewItems(reviewItems, structureFallback = false) {
  if (!Array.isArray(reviewItems) || reviewItems.length === 0) {
    return [
      {
        label: structureFallback ? "题面整理" : "识别结果",
        status: "需复核",
      },
    ];
  }

  const normalized = reviewItems
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const label = asString(item.label, "").trim();
      const status = asString(item.status, "").trim();
      if (!label) {
        return null;
      }

      return {
        label,
        status: validReviewStatuses.has(status) ? status : "需复核",
      };
    })
    .filter(Boolean);

  return normalized.length > 0 ? normalized : [{ label: "识别结果", status: "需复核" }];
}

function normalizeAnswerOptions(answerOptions) {
  if (!Array.isArray(answerOptions)) {
    return [];
  }

  return answerOptions
    .map((option, index) => {
      if (typeof option === "string") {
        const trimmed = option.trim();
        if (!trimmed) {
          return null;
        }

        const parsed = parseOptionLine(option);
        return parsed ?? { label: String.fromCharCode(65 + index), text: trimmed };
      }

      if (!option || typeof option !== "object") {
        return null;
      }

      const rawText = asString(option.text ?? option.content ?? option.value, "").trim();
      if (!rawText) {
        return null;
      }

      const parsed = parseOptionLine(rawText);
      const label = asString(option.label ?? option.option, "").trim() || parsed?.label || String.fromCharCode(65 + index);
      const text = parsed && !option.label ? parsed.text : rawText;

      return {
        label: label.toUpperCase(),
        text,
      };
    })
    .filter((option) => option && option.text);
}

function parseOptionLine(value) {
  const trimmed = asString(value, "").trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^([A-Za-z0-9一二三四五六七八九十]+)[.．、:：）)]\s*(.*)$/);
  if (!match || !match[2].trim()) return null;
  return {
    label: match[1].toUpperCase(),
    text: match[2].trim(),
  };
}

function mergeAnswerOptions(primary, fallback) {
  return primary.length > 0 ? primary : fallback;
}

function normalizeRegionCandidates(parsed) {
  const rawCandidates = getRawRegionCandidates(parsed);
  const normalizedCandidates = rawCandidates
    .map(normalizeRegionCandidate)
    .filter(Boolean)
    .map((candidate, index) => ({
      ...candidate,
      id: `qwen-candidate-${index + 1}`,
      label: `AI 候选 ${index + 1}`,
    }));

  if (normalizedCandidates.length === 0) {
    return [createFullImageRegionCandidate()];
  }

  const candidates = [];
  const overallCandidate = createOverallRegionCandidate(normalizedCandidates);
  if (overallCandidate) {
    candidates.push(overallCandidate);
  }
  candidates.push(...normalizedCandidates, createFullImageRegionCandidate());
  return candidates;
}

function getRawRegionCandidates(parsed) {
  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (Array.isArray(parsed?.candidates)) {
    return parsed.candidates;
  }

  if (Array.isArray(parsed?.regions)) {
    return parsed.regions;
  }

  return [];
}

function normalizeRegionCandidate(candidate) {
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const rawX = asFiniteNumber(candidate.x ?? candidate.left);
  const rawY = asFiniteNumber(candidate.y ?? candidate.top);
  const rawWidth = asFiniteNumber(candidate.width);
  const rawHeight = asFiniteNumber(candidate.height);
  if (rawX === null || rawY === null || rawWidth === null || rawHeight === null) {
    return null;
  }

  const coordinateScale = getRegionCoordinateScale([rawX, rawY, rawWidth, rawHeight]);
  const y = clampNumber(rawY / coordinateScale - 0.03, 0, 0.98);
  const bottom = clampNumber(
    (rawY + rawHeight) / coordinateScale + 0.03,
    y + 0.02,
    1,
  );
  const height = bottom - y;
  if (height < 0.06) {
    return null;
  }

  // Qwen's horizontal boxes on worksheet photos are often too tight; keep
  // the model's vertical segmentation but preserve a broad readable width.
  return {
    id: "",
    label: "",
    x: 0.04,
    y: roundRatio(y),
    width: 0.92,
    height: roundRatio(height),
    unit: "ratio",
    source: "ai_candidate",
    confidence: clampNumber(asFiniteNumber(candidate.confidence) ?? 0.65, 0.1, 0.99),
  };
}

function createOverallRegionCandidate(candidates) {
  if (candidates.length < 2) {
    return null;
  }

  const top = Math.min(...candidates.map((candidate) => candidate.y));
  const bottom = Math.max(...candidates.map((candidate) => candidate.y + candidate.height));
  const maxConfidence = Math.max(...candidates.map((candidate) => candidate.confidence));

  return {
    id: "qwen-candidate-overall",
    label: "整题候选",
    x: 0.04,
    y: roundRatio(top),
    width: 0.92,
    height: roundRatio(clampNumber(bottom - top, 0.08, 1)),
    unit: "ratio",
    source: "ai_candidate",
    confidence: roundRatio(Math.min(0.97, maxConfidence + 0.04)),
  };
}

function createFullImageRegionCandidate() {
  return {
    id: "qwen-candidate-full",
    label: "整张图片候选",
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    unit: "ratio",
    source: "ai_candidate",
    confidence: 0.45,
  };
}

function resolveDraftSubject(inputSubject, parsedSubject) {
  if (validSubjects.has(parsedSubject)) {
    return parsedSubject;
  }

  if (validSubjects.has(inputSubject)) {
    return inputSubject;
  }

  return "unknown";
}

function asFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function getRegionCoordinateScale(values) {
  return Math.max(...values.map((value) => Math.abs(value))) > 1 ? 1000 : 1;
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundRatio(value) {
  return Number(value.toFixed(4));
}

function asString(value, fallback) {
  return typeof value === "string" ? value : fallback;
}

function asNonBlankString(value, fallback) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

module.exports = { createQwenAdapter, parseQwenJsonContent };
