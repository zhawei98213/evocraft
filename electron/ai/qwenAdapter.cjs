const {
  buildRecognitionPrompt,
  buildRegionDetectionPrompt,
} = require("./recognitionPrompt.cjs");

const defaultEndpoint = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
const defaultModel = "qwen-vl-ocr-latest";
const validSubjects = new Set(["chinese", "math", "english"]);
const validReviewStatuses = new Set(["可信", "需复核"]);

function createQwenAdapter({
  apiKey,
  endpoint = defaultEndpoint,
  model = defaultModel,
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
            temperature: 0,
          }),
        });
      } catch {
        return {
          ok: false,
          reason: "provider_request_failed",
          message: "真实 AI 服务请求失败，请稍后重试。",
          retryable: true,
        };
      }

      if (!response?.ok) {
        return {
          ok: false,
          reason: "provider_request_failed",
          message: "真实 AI 服务请求失败，请稍后重试。",
          retryable: true,
        };
      }

      let payload;
      try {
        payload = await response.json();
      } catch {
        return {
          ok: false,
          reason: "provider_response_invalid",
          message: "真实 AI 返回格式异常，请重试或手动填写。",
          retryable: true,
        };
      }

      const content = payload?.choices?.[0]?.message?.content;
      const parsed = parseQwenJsonContent(content);
      if (!parsed) {
        return {
          ok: false,
          reason: "provider_response_invalid",
          message: "真实 AI 返回格式异常，请重试或手动填写。",
          retryable: true,
        };
      }

      const now = new Date().toISOString();
      const subject = resolveDraftSubject(input.subject, parsed.subject);

      return {
        ok: true,
        draft: {
          id: `draft-${Date.now()}`,
          appId: "wrong_question_capture",
          createdAt: now,
          updatedAt: now,
          subject,
          title: asNonBlankString(parsed.title, "识别草稿"),
          questionText: asString(parsed.questionText, ""),
          originalImageUri: input.imageUri,
          selectedRegion: input.selectedRegion,
          selectedRegionImageUri: input.selectedRegionImageUri,
          cleanedQuestionImageUri: input.selectedRegionImageUri,
          visualSnippetUri: input.selectedRegionImageUri,
          studentAnswer: asString(parsed.studentAnswer, ""),
          correctAnswer: asString(parsed.correctAnswer, ""),
          notes: asString(parsed.notes, "真实 AI 识别草稿，请人工复核。"),
          recognitionStatus: "needs_review",
          recognitionConfidence: 0.7,
          cleanupStatus: "needs_review",
          cleanupConfidence: 0.7,
          modelTraces: [
            { provider: "qwen", modelId: model, task: "ocr" },
            { provider: "qwen", modelId: model, task: "structure" },
            { provider: "qwen", modelId: model, task: "cleanup" },
          ],
          reviewItems: normalizeReviewItems(parsed.reviewItems),
          providerMeta: {
            usage: payload?.usage ?? null,
            elapsedMs: Date.now() - startedAt,
          },
        },
      };
    },
  };
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

function normalizeReviewItems(reviewItems) {
  if (!Array.isArray(reviewItems) || reviewItems.length === 0) {
    return [{ label: "识别结果", status: "需复核" }];
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
  if (validSubjects.has(inputSubject)) {
    return inputSubject;
  }

  if (inputSubject === "auto" && validSubjects.has(parsedSubject)) {
    return parsedSubject;
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
