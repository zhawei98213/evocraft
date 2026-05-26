import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { registerAiIpc } = require("../electron/main.cjs");

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
      status: { enabled: false, provider: "qwen", mode: "mock", message: "" },
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

  assert.equal(fakeIpcMain.handlers.size, 3);

  for (const channel of ["ai:runtime-status", "ai:detect-regions", "ai:recognize-question"]) {
    await assert.rejects(
      callHandler(fakeIpcMain.handlers.get(channel), untrustedEvent, {}),
      /Blocked IPC from untrusted renderer/,
      `${channel} should reject untrusted renderer senders`,
    );
  }

  assert.deepEqual(fakeIpcMain.handlers.get("ai:runtime-status")(trustedEvent), {
    enabled: false,
    provider: "qwen",
    mode: "mock",
    message: "",
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
      status: { enabled: true, provider: "qwen", mode: "real", message: "" },
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
}
