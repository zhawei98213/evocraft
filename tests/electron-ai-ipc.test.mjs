import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createAiRuntime, registerAiIpc } = require("../electron/main.cjs");

function createFakeIpcMain() {
  const handlers = new Map();
  return {
    handlers,
    handle(channel, handler) {
      handlers.set(channel, handler);
    },
  };
}

const trustedEvent = { senderFrame: { url: "app://trusted" } };
const untrustedEvent = { senderFrame: { url: "https://evil.test/" } };
const trustOnlyAppUrl = (url) => url === trustedEvent.senderFrame.url;

async function callHandler(handler, event, input) {
  return handler(event, input);
}

{
  const fakeIpcMain = createFakeIpcMain();

  registerAiIpc(
    {
      status: {
        enabled: false,
        configured: false,
        provider: "qwen",
        model: "qwen-vl-ocr-latest",
        mode: "mock",
        message: "请在设置里填写 API Key 和 LLM 名称后启用真实 AI。",
      },
      adapter: {
        detectRegions() {
          throw new Error("detectRegions should not be called while real AI is disabled");
        },
        recognizeQuestion() {
          throw new Error("recognizeQuestion should not be called while real AI is disabled");
        },
      },
    },
    { ipcMain: fakeIpcMain, isAllowedRendererUrl: trustOnlyAppUrl },
  );

  assert.equal(fakeIpcMain.handlers.size, 5);

  for (const channel of [
    "ai:runtime-status",
    "ai:configure",
    "ai:set-external-authorization",
    "ai:detect-regions",
    "ai:recognize-question",
  ]) {
    await assert.rejects(
      callHandler(fakeIpcMain.handlers.get(channel), untrustedEvent, {}),
      /Blocked IPC from untrusted renderer/,
      `${channel} should reject untrusted renderer senders`,
    );
  }

  assert.deepEqual(fakeIpcMain.handlers.get("ai:runtime-status")(trustedEvent), {
    enabled: false,
    configured: false,
    provider: "qwen",
    model: "qwen-vl-ocr-latest",
    mode: "mock",
    message: "请在设置里填写 API Key 和 LLM 名称后启用真实 AI。",
  });

  assert.deepEqual(await fakeIpcMain.handlers.get("ai:detect-regions")(trustedEvent, {}), {
    ok: false,
    reason: "real_ai_disabled",
    message: "真实 AI 未开启。",
    retryable: false,
  });

  assert.deepEqual(await fakeIpcMain.handlers.get("ai:recognize-question")(trustedEvent, {}), {
    ok: false,
    reason: "real_ai_disabled",
    message: "真实 AI 未开启。",
    retryable: false,
  });
}

{
  let detectCalls = 0;
  let recognizeCalls = 0;
  let forwardedDetectInput = null;
  let forwardedRecognizeInput = null;
  const fakeIpcMain = createFakeIpcMain();
  const selectedRegion = {
    id: "candidate-1",
    label: "候选 1",
    x: 0.1,
    y: 0.2,
    width: 0.7,
    height: 0.3,
    unit: "ratio",
    source: "ai_candidate",
    confidence: 0.91,
  };
  const detectInput = { imageUri: "data:image/png;base64,original" };
  const recognizeInput = {
    subject: "math",
    imageUri: detectInput.imageUri,
    selectedRegion,
    selectedRegionImageUri: "data:image/png;base64,region",
  };
  const recognitionDraft = {
    id: "draft-1",
    subject: "math",
    selectedRegion,
    selectedRegionImageUri: recognizeInput.selectedRegionImageUri,
  };

  registerAiIpc(
    {
      status: {
        enabled: true,
        configured: true,
        provider: "qwen",
        model: "qwen-vl-ocr-latest",
        mode: "real",
        message: "",
      },
      adapter: {
        detectRegions(input) {
          detectCalls += 1;
          forwardedDetectInput = input;
          return { ok: true, candidates: [selectedRegion] };
        },
        recognizeQuestion(input) {
          recognizeCalls += 1;
          forwardedRecognizeInput = input;
          return { ok: true, draft: recognitionDraft };
        },
      },
    },
    { ipcMain: fakeIpcMain, isAllowedRendererUrl: trustOnlyAppUrl },
  );

  assert.deepEqual(await fakeIpcMain.handlers.get("ai:detect-regions")(trustedEvent, detectInput), {
    ok: false,
    reason: "external_ai_not_authorized",
    message: "请先确认外部 AI 识别授权。",
    retryable: false,
  });
  assert.deepEqual(
    await fakeIpcMain.handlers.get("ai:recognize-question")(trustedEvent, recognizeInput),
    {
      ok: false,
      reason: "external_ai_not_authorized",
      message: "请先确认外部 AI 识别授权。",
      retryable: false,
    },
  );
  assert.equal(detectCalls, 0);
  assert.equal(recognizeCalls, 0);

  assert.deepEqual(
    await fakeIpcMain.handlers.get("ai:set-external-authorization")(trustedEvent, true),
    { ok: true },
  );

  assert.deepEqual(
    await fakeIpcMain.handlers.get("ai:detect-regions")(trustedEvent, detectInput),
    { ok: true, candidates: [selectedRegion] },
  );
  assert.deepEqual(
    await fakeIpcMain.handlers.get("ai:recognize-question")(trustedEvent, recognizeInput),
    { ok: true, draft: recognitionDraft },
  );
  assert.deepEqual(forwardedDetectInput, detectInput);
  assert.deepEqual(forwardedRecognizeInput, recognizeInput);
  assert.equal(detectCalls, 1);
  assert.equal(recognizeCalls, 1);

  assert.deepEqual(
    await fakeIpcMain.handlers.get("ai:set-external-authorization")(trustedEvent, false),
    { ok: true },
  );
  assert.deepEqual(await fakeIpcMain.handlers.get("ai:detect-regions")(trustedEvent, detectInput), {
    ok: false,
    reason: "external_ai_not_authorized",
    message: "请先确认外部 AI 识别授权。",
    retryable: false,
  });
  assert.equal(detectCalls, 1);
}

{
  const providerCalls = [];
  const fakeIpcMain = createFakeIpcMain();
  const selectedRegion = {
    id: "candidate-1",
    label: "候选 1",
    x: 0.1,
    y: 0.2,
    width: 0.7,
    height: 0.3,
    unit: "ratio",
    source: "ai_candidate",
    confidence: 0.91,
  };
  const recognizeInput = {
    subject: "math",
    imageUri: "data:image/png;base64,original",
    selectedRegion,
    selectedRegionImageUri: "data:image/png;base64,region",
  };
  const runtime = createAiRuntime({
    apiKey: "",
    model: "qwen-vl-ocr-latest",
    fetchImpl: async (url, init) => {
      providerCalls.push({ url, init });
      return {
        ok: true,
        async json() {
          return {
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    subject: "math",
                    title: "模型配置题",
                    questionText: "请识别题目。",
                  }),
                },
              },
            ],
          };
        },
      };
    },
  });

  registerAiIpc(runtime, { ipcMain: fakeIpcMain, isAllowedRendererUrl: trustOnlyAppUrl });

  assert.deepEqual(fakeIpcMain.handlers.get("ai:runtime-status")(trustedEvent), {
    enabled: false,
    configured: false,
    provider: "qwen",
    model: "qwen-vl-ocr-latest",
    mode: "mock",
    message: "请在设置里填写 API Key 和 LLM 名称后启用真实 AI。",
  });

  const configured = await fakeIpcMain.handlers.get("ai:configure")(trustedEvent, {
    apiKey: "dashscope-secret-key",
    model: "qwen-vl-max",
  });
  assert.equal(configured.ok, true);
  assert.deepEqual(configured.status, {
    enabled: true,
    configured: true,
    provider: "qwen",
    model: "qwen-vl-max",
    mode: "real",
    message: "",
  });
  assert.equal(Object.hasOwn(configured.status, "apiKey"), false);

  await fakeIpcMain.handlers.get("ai:set-external-authorization")(trustedEvent, true);
  const result = await fakeIpcMain.handlers.get("ai:recognize-question")(
    trustedEvent,
    recognizeInput,
  );

  assert.equal(result.ok, true);
  assert.equal(providerCalls.length, 1);
  assert.match(providerCalls[0].init.headers.Authorization, /^Bearer dashscope-secret-key$/);
  assert.match(providerCalls[0].init.body, /qwen-vl-max/);
  assert.doesNotMatch(JSON.stringify(configured.status), /dashscope-secret-key/);
}
