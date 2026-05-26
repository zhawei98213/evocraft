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
  const fakeIpcMain = createFakeIpcMain();

  registerAiIpc(
    {
      status: { enabled: true, provider: "qwen", mode: "real", message: "" },
      adapter: {
        detectRegions(input) {
          detectCalls += 1;
          return { ok: true, regions: [{ id: input.imageId }] };
        },
        recognizeQuestion(input) {
          recognizeCalls += 1;
          return { ok: true, draft: { id: input.regionId } };
        },
      },
    },
    { ipcMain: fakeIpcMain, isAllowedRendererUrl: trustOnlyAppUrl },
  );

  assert.deepEqual(
    await fakeIpcMain.handlers.get("ai:detect-regions")(trustedEvent, { imageId: "img-1" }),
    { ok: true, regions: [{ id: "img-1" }] },
  );
  assert.deepEqual(
    await fakeIpcMain.handlers.get("ai:recognize-question")(trustedEvent, { regionId: "region-1" }),
    { ok: true, draft: { id: "region-1" } },
  );
  assert.equal(detectCalls, 1);
  assert.equal(recognizeCalls, 1);
}
