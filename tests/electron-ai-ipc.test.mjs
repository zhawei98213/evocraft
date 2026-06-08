import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const { createAiConfigStore, createAiRuntime, createRuntimeLogger, registerAiIpc, registerRecordIpc } =
  require("../electron/main.cjs");

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
const fakeSafeStorage = {
  isEncryptionAvailable: () => true,
  encryptString: (value) => Buffer.from(`sealed:${value}`, "utf8"),
  decryptString: (value) => value.toString("utf8").replace(/^sealed:/, ""),
};

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

  assert.equal(fakeIpcMain.handlers.size, 6);

  for (const channel of [
    "ai:runtime-status",
    "ai:configure",
    "ai:clear-config",
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
    persisted: false,
    canPersistSecret: false,
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
    persisted: false,
    canPersistSecret: false,
  });
  assert.equal(Object.hasOwn(configured.status, "apiKey"), false);

  await fakeIpcMain.handlers.get("ai:set-external-authorization")(trustedEvent, true);
  const result = await fakeIpcMain.handlers.get("ai:recognize-question")(
    trustedEvent,
    recognizeInput,
  );

  assert.equal(result.ok, true);
  assert.equal(providerCalls.length, 2);
  assert.match(providerCalls[0].init.headers.Authorization, /^Bearer dashscope-secret-key$/);
  assert.match(providerCalls[0].init.body, /qwen-vl-max/);
  assert.match(providerCalls[1].init.body, /qwen-plus/);
  assert.doesNotMatch(JSON.stringify(configured.status), /dashscope-secret-key/);
}

await runTempDirTest("persists and clears AI config without storing the plain API key", async (userDataDir) => {
  const store = createAiConfigStore(userDataDir, { safeStorage: fakeSafeStorage });
  const runtime = createAiRuntime({
    configStore: store,
    fetchImpl: async () => {
      throw new Error("provider should not be called in config persistence test");
    },
  });
  const fakeIpcMain = createFakeIpcMain();

  registerAiIpc(runtime, { ipcMain: fakeIpcMain, isAllowedRendererUrl: trustOnlyAppUrl });

  assert.equal(fakeIpcMain.handlers.get("ai:runtime-status")(trustedEvent).configured, false);

  const configured = await fakeIpcMain.handlers.get("ai:configure")(trustedEvent, {
    apiKey: "dashscope-secret-key",
    model: "qwen-vl-ocr-latest",
  });

  assert.equal(configured.ok, true);
  assert.equal(configured.status.configured, true);
  assert.equal(configured.status.persisted, true);
  assert.equal(configured.status.canPersistSecret, true);

  const stored = await readFile(join(userDataDir, "ai-runtime", "config.json"), "utf8");
  assert.doesNotMatch(stored, /dashscope-secret-key/);
  assert.match(stored, /qwen-vl-ocr-latest/);

  const restoreMessages = [];
  const restoredRuntime = createAiRuntime({
    configStore: createAiConfigStore(userDataDir, { safeStorage: fakeSafeStorage }),
    logger: createRuntimeLogger({
      write: (message) => restoreMessages.push(message),
      now: () => "2026-06-06T13:30:00.000Z",
    }),
    fetchImpl: async () => {
      throw new Error("provider should not be called while checking restored status");
    },
  });

  assert.deepEqual(restoredRuntime.status, {
    enabled: true,
    configured: true,
    provider: "qwen",
    model: "qwen-vl-ocr-latest",
    mode: "real",
    message: "",
    persisted: true,
    canPersistSecret: true,
    updatedAt: restoredRuntime.status.updatedAt,
  });
  assert.equal(typeof restoredRuntime.status.updatedAt, "string");
  assert.doesNotMatch(JSON.stringify(restoredRuntime.status), /dashscope-secret-key/);
  assert.match(restoreMessages.join("\n"), /"event":"ai.config.load"/);
  assert.doesNotMatch(restoreMessages.join("\n"), /dashscope-secret-key/);

  assert.deepEqual(await fakeIpcMain.handlers.get("ai:clear-config")(trustedEvent), {
    ok: true,
    status: {
      enabled: false,
      configured: false,
      provider: "qwen",
      model: "qwen-vl-ocr-latest",
      mode: "mock",
      message: "请在设置里填写 API Key 和 LLM 名称后启用真实 AI。",
      persisted: false,
      canPersistSecret: true,
    },
  });
});

{
  const messages = [];
  const logger = createRuntimeLogger({
    write: (message) => messages.push(message),
    now: () => "2026-06-06T13:30:00.000Z",
  });
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
          return { ok: true, candidates: [selectedRegion], echoedInput: input };
        },
        recognizeQuestion(input) {
          return {
            ok: true,
            draft: {
              id: "draft-1",
              subject: "math",
              title: "English choice question",
              questionText: "Where are you making a cake?",
              answerOptions: [
                { label: "A", text: "do; make" },
                { label: "B", text: "are; making" },
                { label: "C", text: "are; make" },
                { label: "D", text: "do; making" },
              ],
              studentAnswer: "学生圈了 B",
              correctAnswer: "",
              notes: "二阶段整理完成。",
              selectedRegion,
              selectedRegionImageUri: input.selectedRegionImageUri,
            },
          };
        },
      },
    },
    { ipcMain: fakeIpcMain, isAllowedRendererUrl: trustOnlyAppUrl, logger },
  );

  await fakeIpcMain.handlers.get("ai:set-external-authorization")(trustedEvent, true);
  await fakeIpcMain.handlers.get("ai:detect-regions")(trustedEvent, {
    imageUri: "data:image/png;base64,original-image-payload",
    apiKey: "dashscope-secret-key",
    authorization: "Authorization: Bearer dashscope-secret-key",
  });
  await fakeIpcMain.handlers.get("ai:recognize-question")(trustedEvent, {
    subject: "math",
    imageUri: "data:image/png;base64,original-image-payload",
    selectedRegion,
    selectedRegionImageUri: "data:image/png;base64,region-image-payload",
  });

  const serializedLogs = messages.join("\n");
  assert.match(serializedLogs, /"event":"ai.detectRegions.start"/);
  assert.match(serializedLogs, /"event":"ai.detectRegions.success"/);
  assert.match(serializedLogs, /"event":"ai.recognize.success"/);
  assert.match(serializedLogs, /Where are you making a cake/);
  assert.match(serializedLogs, /are; making/);
  assert.match(serializedLogs, /学生圈了 B/);
  assert.doesNotMatch(serializedLogs, /dashscope-secret-key/);
  assert.doesNotMatch(serializedLogs, /original-image-payload/);
  assert.doesNotMatch(serializedLogs, /region-image-payload/);
  assert.match(serializedLogs, /\[redacted/);
}

{
  const messages = [];
  const logger = createRuntimeLogger({
    write: (message) => messages.push(message),
    now: () => "2026-06-06T13:30:00.000Z",
  });
  const fakeIpcMain = createFakeIpcMain();

  registerRecordIpc(
    {
      load() {
        throw new Error("disk unavailable");
      },
      save() {
        return { ok: false, reason: "storage_write_failed" };
      },
      clear() {
        return { ok: false, reason: "storage_clear_failed" };
      },
    },
    { ipcMain: fakeIpcMain, isAllowedRendererUrl: trustOnlyAppUrl, logger },
  );

  await assert.rejects(
    fakeIpcMain.handlers.get("records:load")(trustedEvent),
    /disk unavailable/,
  );
  assert.deepEqual(await fakeIpcMain.handlers.get("records:save")(trustedEvent, []), {
    ok: false,
    reason: "storage_write_failed",
  });
  assert.deepEqual(await fakeIpcMain.handlers.get("records:clear")(trustedEvent), {
    ok: false,
    reason: "storage_clear_failed",
  });

  const serializedLogs = messages.join("\n");
  assert.match(serializedLogs, /"event":"records.load.failure"/);
  assert.match(serializedLogs, /"event":"records.save.failure"/);
  assert.match(serializedLogs, /"event":"records.clear.failure"/);
}

async function runTempDirTest(name, testFn) {
  const userDataDir = await mkdtemp(join(tmpdir(), "evocraft-ai-ipc-"));

  try {
    await testFn(userDataDir);
  } catch (error) {
    error.message = `${name}: ${error.message}`;
    throw error;
  } finally {
    await rm(userDataDir, { recursive: true, force: true });
  }
}
