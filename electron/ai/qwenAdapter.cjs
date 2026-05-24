const { buildRecognitionPrompt } = require("./recognitionPrompt.cjs");

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

      return {
        ok: true,
        candidates: [
          {
            id: "qwen-candidate-1",
            label: "AI 候选 1",
            x: 0.08,
            y: 0.08,
            width: 0.84,
            height: 0.42,
            unit: "ratio",
            source: "ai_candidate",
            confidence: 0.7,
          },
        ],
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
      if (!subject) {
        return {
          ok: false,
          reason: "provider_response_invalid",
          message: "真实 AI 未返回有效科目，请手动选择科目后重试。",
          retryable: true,
        };
      }

      return {
        ok: true,
        draft: {
          id: `draft-${Date.now()}`,
          appId: "wrong_question_capture",
          createdAt: now,
          updatedAt: now,
          subject,
          title: asString(parsed.title, "识别草稿"),
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

function resolveDraftSubject(inputSubject, parsedSubject) {
  if (validSubjects.has(inputSubject)) {
    return inputSubject;
  }

  if (inputSubject === "auto" && validSubjects.has(parsedSubject)) {
    return parsedSubject;
  }

  return null;
}

function asString(value, fallback) {
  return typeof value === "string" ? value : fallback;
}

module.exports = { createQwenAdapter, parseQwenJsonContent };
