const { app, BrowserWindow, dialog, ipcMain, safeStorage, session } = require("electron");
const { readFile } = require("node:fs/promises");
const { extname, join, resolve } = require("node:path");
const { createAiConfigStore } = require("./ai/configStore.cjs");
const { createQwenAdapter } = require("./ai/qwenAdapter.cjs");
const { createRuntimeLogger } = require("./ai/runtimeLogger.cjs");
const { isTrustedRendererUrl } = require("./security/rendererTrust.cjs");
const { createLocalRecordStore, isValidWrongQuestionRecordArray } = require("./storage/localRecordStore.cjs");

const isDev = Boolean(process.env.ELECTRON_RENDERER_URL);
const devRendererUrl = process.env.ELECTRON_RENDERER_URL ?? "http://127.0.0.1:5173";
const allowedImageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".bmp", ".heic"]);
const defaultAiProvider = "qwen";
const defaultAiModel = "qwen-vl-ocr-latest";
const missingAiConfigurationMessage = "请在设置里填写 API Key 和 LLM 名称后启用真实 AI。";

function createWindow() {
  const window = new BrowserWindow({
    title: "EvoCraft",
    width: 1440,
    height: 980,
    minWidth: 1180,
    minHeight: 760,
    icon: getDesktopIconPath(),
    webPreferences: {
      preload: join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event, url) => {
    if (!isAllowedRendererUrl(url)) event.preventDefault();
  });

  if (isDev) {
    void window.loadURL(devRendererUrl);
    if (process.env.ELECTRON_OPEN_DEVTOOLS === "1") {
      window.webContents.openDevTools({ mode: "detach" });
    }
  } else {
    void window.loadFile(join(__dirname, "../dist/index.html"));
  }
}

if (app?.whenReady) {
  app.whenReady().then(() => {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [createRendererContentSecurityPolicy()],
        },
      });
    });

    const userDataDir = app.getPath("userData");
    const recordStore = createLocalRecordStore(userDataDir);
    const runtimeLogger = createRuntimeLogger();
    registerFileIpc();
    registerRecordIpc(recordStore, { logger: runtimeLogger });
    registerAiIpc(
      createAiRuntime({
        configStore: createAiConfigStore(userDataDir, { safeStorage }),
        logger: runtimeLogger,
      }),
      { logger: runtimeLogger },
    );
    createWindow();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}

function registerFileIpc(options = {}) {
  const targetIpcMain = options.ipcMain ?? ipcMain;
  const targetDialog = options.dialog ?? dialog;
  const readFileImpl = options.readFileImpl ?? readFile;
  const selectedImagePaths = options.selectedImagePaths ?? new Set();
  const isRendererUrlAllowed = options.isAllowedRendererUrl ?? isAllowedRendererUrl;

  targetIpcMain.handle("dialog:select-image", async (event) => {
    assertAllowedSender(event, isRendererUrlAllowed);

    const result = await targetDialog.showOpenDialog({
      title: "选择错题照片",
      properties: ["openFile"],
      filters: [
        { name: "Images", extensions: ["png", "jpg", "jpeg", "webp", "bmp", "heic"] },
      ],
    });

    if (result.canceled || result.filePaths.length === 0) return null;

    const filePath = result.filePaths[0];
    selectedImagePaths.add(resolve(filePath));
    return filePath;
  });

  targetIpcMain.handle("file:read-image-data-url", async (event, filePath) => {
    assertAllowedSender(event, isRendererUrlAllowed);

    if (typeof filePath !== "string" || filePath.length === 0) {
      throw new Error("Invalid file path");
    }

    const resolvedFilePath = resolve(filePath);
    if (!selectedImagePaths.has(resolvedFilePath)) {
      throw new Error("Image path was not selected by the user");
    }

    selectedImagePaths.delete(resolvedFilePath);

    const extension = extname(filePath).toLowerCase();
    if (!allowedImageExtensions.has(extension)) {
      throw new Error("Unsupported image type");
    }

    const mime = getImageMimeType(extension);
    const bytes = await readFileImpl(filePath);
    return `data:${mime};base64,${bytes.toString("base64")}`;
  });
}

function registerRecordIpc(recordStore, options = {}) {
  const targetIpcMain = options.ipcMain ?? ipcMain;
  const isRendererUrlAllowed = options.isAllowedRendererUrl ?? isAllowedRendererUrl;
  const logger = options.logger;

  targetIpcMain.handle("records:load", async (event) => {
    assertAllowedSender(event, isRendererUrlAllowed);
    try {
      return await recordStore.load();
    } catch (error) {
      logRuntimeEvent(logger, "records.load.failure", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  });

  targetIpcMain.handle("records:save", async (event, records) => {
    assertAllowedSender(event, isRendererUrlAllowed);

    if (!isValidWrongQuestionRecordArray(records)) {
      logRuntimeEvent(logger, "records.save.failure", { reason: "invalid_records_payload" });
      throw new Error("Invalid records payload");
    }

    try {
      const result = await recordStore.save(records);
      if (result?.ok === false) {
        logRuntimeEvent(logger, "records.save.failure", {
          reason: result.reason,
        });
      }
      return result;
    } catch (error) {
      logRuntimeEvent(logger, "records.save.failure", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  });

  targetIpcMain.handle("records:clear", async (event) => {
    assertAllowedSender(event, isRendererUrlAllowed);
    try {
      const result = await recordStore.clear();
      if (result?.ok === false) {
        logRuntimeEvent(logger, "records.clear.failure", {
          reason: result.reason,
        });
      }
      return result;
    } catch (error) {
      logRuntimeEvent(logger, "records.clear.failure", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  });
}

function createAiRuntime(options = {}) {
  const hasOption = (key) => Object.prototype.hasOwnProperty.call(options, key);
  const configStore = options.configStore;
  const logger = options.logger;
  let storedConfig = null;
  if (!hasOption("apiKey") && configStore?.load) {
    try {
      storedConfig = configStore.load();
      logRuntimeEvent(logger, "ai.config.load", {
        configured: Boolean(storedConfig?.apiKey),
        persisted: Boolean(storedConfig?.persisted),
        provider: storedConfig?.provider,
        model: storedConfig?.model,
        canPersistSecret: Boolean(configStore?.canPersistSecret),
      });
    } catch (error) {
      logRuntimeEvent(logger, "ai.config.load.failure", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  const envEnabled = process.env.EVOCRAFT_AI_ENABLED === "1";
  const initialApiKey = hasOption("apiKey")
    ? options.apiKey
    : storedConfig?.apiKey
      ? storedConfig.apiKey
    : envEnabled
      ? process.env.DASHSCOPE_API_KEY ?? ""
      : "";
  let config = normalizeAiRuntimeConfig({
    apiKey: initialApiKey,
    model: hasOption("model")
      ? options.model
      : storedConfig?.model ??
        process.env.EVOCRAFT_AI_MODEL ??
        process.env.DASHSCOPE_MODEL ??
        defaultAiModel,
    provider: hasOption("provider")
      ? options.provider
      : storedConfig?.provider ?? process.env.EVOCRAFT_AI_PROVIDER ?? defaultAiProvider,
  });
  let configMeta = {
    persisted: Boolean(storedConfig?.persisted),
    canPersistSecret: Boolean(configStore?.canPersistSecret),
    updatedAt: storedConfig?.updatedAt || undefined,
  };
  const endpoint = options.endpoint;
  const fetchImpl = hasOption("fetchImpl") ? options.fetchImpl : globalThis.fetch;
  let adapter = createConfiguredQwenAdapter(config, { endpoint, fetchImpl });
  const runtime = {
    get status() {
      return createAiRuntimeStatus(config, configMeta);
    },
    get adapter() {
      return adapter;
    },
    configure(input) {
      const nextConfig = normalizeAiRuntimeConfig({
        provider: defaultAiProvider,
        apiKey: input?.apiKey,
        model: input?.model,
      });

      if (!nextConfig.apiKey || !nextConfig.model) {
        return {
          ok: false,
          message: "请填写 API Key 和 LLM 名称。",
          status: runtime.status,
        };
      }

      config = nextConfig;
      adapter = createConfiguredQwenAdapter(config, { endpoint, fetchImpl });
      const saveResult = configStore?.save ? configStore.save(nextConfig) : null;
      configMeta = {
        persisted: Boolean(saveResult?.ok),
        canPersistSecret: Boolean(configStore?.canPersistSecret),
        updatedAt: saveResult?.ok ? saveResult.updatedAt : undefined,
      };
      return {
        ok: true,
        status: runtime.status,
      };
    },
    clearConfig() {
      configStore?.clear?.();
      config = normalizeAiRuntimeConfig({
        provider: defaultAiProvider,
        apiKey: "",
        model: defaultAiModel,
      });
      configMeta = {
        persisted: false,
        canPersistSecret: Boolean(configStore?.canPersistSecret),
        updatedAt: undefined,
      };
      adapter = createConfiguredQwenAdapter(config, { endpoint, fetchImpl });
      return {
        ok: true,
        status: runtime.status,
      };
    },
  };

  return runtime;
}

function createConfiguredQwenAdapter(config, options = {}) {
  return createQwenAdapter({
    apiKey: config.apiKey,
    model: config.model,
    endpoint: options.endpoint,
    fetchImpl: options.fetchImpl,
  });
}

function normalizeAiRuntimeConfig(input = {}) {
  return {
    provider: normalizeString(input.provider, defaultAiProvider) || defaultAiProvider,
    apiKey: normalizeString(input.apiKey, ""),
    model: normalizeString(input.model, defaultAiModel) || defaultAiModel,
  };
}

function normalizeString(value, fallback) {
  return typeof value === "string" ? value.trim() : fallback;
}

function createAiRuntimeStatus(config, meta = {}) {
  const configured = Boolean(config.apiKey);
  const status = {
    enabled: configured,
    configured,
    provider: config.provider,
    model: config.model,
    mode: configured ? "real" : "mock",
    message: configured ? "" : missingAiConfigurationMessage,
    persisted: configured ? Boolean(meta.persisted) : false,
    canPersistSecret: Boolean(meta.canPersistSecret),
  };
  if (configured && meta.updatedAt) status.updatedAt = meta.updatedAt;
  return status;
}

function registerAiIpc(runtime, options = {}) {
  const targetIpcMain = options.ipcMain ?? ipcMain;
  const isRendererUrlAllowed = options.isAllowedRendererUrl ?? isAllowedRendererUrl;
  const logger = options.logger;
  let externalAiAuthorized = Boolean(options.externalAiAuthorized);

  targetIpcMain.handle("ai:runtime-status", (event) => {
    assertAllowedSender(event, isRendererUrlAllowed);
    return runtime.status;
  });

  targetIpcMain.handle("ai:configure", (event, input) => {
    assertAllowedSender(event, isRendererUrlAllowed);

    if (typeof runtime.configure !== "function") {
      return {
        ok: false,
        message: "真实 AI 配置桥接不可用。",
        status: runtime.status,
      };
    }

    externalAiAuthorized = false;
    logRuntimeEvent(logger, "ai.config.save", {
      provider: input?.provider,
      model: input?.model,
      apiKey: input?.apiKey,
    });
    const result = runtime.configure(input);
    logRuntimeEvent(logger, result.ok ? "ai.config.save.success" : "ai.config.save.failure", {
      ok: result.ok,
      status: result.status,
      message: result.message,
    });
    return result;
  });

  targetIpcMain.handle("ai:clear-config", (event) => {
    assertAllowedSender(event, isRendererUrlAllowed);

    externalAiAuthorized = false;
    const result =
      typeof runtime.clearConfig === "function"
        ? runtime.clearConfig()
        : {
            ok: false,
            message: "真实 AI 配置桥接不可用。",
            status: runtime.status,
          };
    logRuntimeEvent(logger, result.ok ? "ai.config.clear" : "ai.config.clear.failure", result);
    return result;
  });

  targetIpcMain.handle("ai:set-external-authorization", (event, acknowledged) => {
    assertAllowedSender(event, isRendererUrlAllowed);

    if (typeof acknowledged !== "boolean") {
      throw new Error("Invalid external AI authorization payload");
    }

    externalAiAuthorized = acknowledged;
    logRuntimeEvent(logger, "ai.authorization.update", { acknowledged });
    return { ok: true };
  });

  targetIpcMain.handle("ai:detect-regions", async (event, input) => {
    assertAllowedSender(event, isRendererUrlAllowed);

    if (!runtime.status.enabled) {
      return createRealAiDisabledFailure();
    }

    if (!externalAiAuthorized) {
      return createExternalAiNotAuthorizedFailure();
    }

    return logAdapterCall(logger, "ai.detectRegions", input, () => runtime.adapter.detectRegions(input));
  });

  targetIpcMain.handle("ai:recognize-question", async (event, input) => {
    assertAllowedSender(event, isRendererUrlAllowed);

    if (!runtime.status.enabled) {
      return createRealAiDisabledFailure();
    }

    if (!externalAiAuthorized) {
      return createExternalAiNotAuthorizedFailure();
    }

    return logAdapterCall(logger, "ai.recognize", input, () => runtime.adapter.recognizeQuestion(input));
  });
}

async function logAdapterCall(logger, eventPrefix, input, callAdapter) {
  const startedAt = Date.now();
  logRuntimeEvent(logger, `${eventPrefix}.start`, { input });

  try {
    const result = await callAdapter();
    const elapsedMs = Date.now() - startedAt;
    logRuntimeEvent(logger, result.ok ? `${eventPrefix}.success` : `${eventPrefix}.failure`, {
      elapsedMs,
      ...summarizeAdapterResult(result),
    });
    return result;
  } catch (error) {
    logRuntimeEvent(logger, `${eventPrefix}.failure`, {
      elapsedMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

function summarizeAdapterResult(result) {
  if (!result || typeof result !== "object") return { resultType: typeof result };
  if (!result.ok) {
    return {
      ok: false,
      reason: result.reason,
      message: result.message,
      retryable: result.retryable,
    };
  }

  if (Array.isArray(result.candidates)) {
    return { ok: true, candidateCount: result.candidates.length };
  }

  if (result.draft) {
    return {
      ok: true,
      subject: result.draft.subject,
      hasTitle: Boolean(result.draft.title),
      reviewItemCount: Array.isArray(result.draft.reviewItems) ? result.draft.reviewItems.length : 0,
    };
  }

  return { ok: true };
}

function logRuntimeEvent(logger, event, details) {
  if (!logger || typeof logger.log !== "function") return;
  logger.log(event, details);
}

function createRealAiDisabledFailure() {
  return {
    ok: false,
    reason: "real_ai_disabled",
    message: "真实 AI 未开启。",
    retryable: false,
  };
}

function createExternalAiNotAuthorizedFailure() {
  return {
    ok: false,
    reason: "external_ai_not_authorized",
    message: "请先确认外部 AI 识别授权。",
    retryable: false,
  };
}

function assertAllowedSender(event, isRendererUrlAllowed = isAllowedRendererUrl) {
  const url = event.senderFrame?.url ?? "";
  if (!isRendererUrlAllowed(url)) {
    throw new Error("Blocked IPC from untrusted renderer");
  }
}

function isAllowedRendererUrl(url) {
  return isTrustedRendererUrl(url, {
    appDirname: __dirname,
    devRendererUrl,
    isDev,
  });
}

function getImageMimeType(extension) {
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  if (extension === ".bmp") return "image/bmp";
  if (extension === ".heic") return "image/heic";
  return "image/png";
}

function createRendererContentSecurityPolicy(options = {}) {
  const policyIsDev = Object.prototype.hasOwnProperty.call(options, "isDev")
    ? Boolean(options.isDev)
    : isDev;
  const policyDevRendererUrl = options.devRendererUrl ?? devRendererUrl;

  return [
    "default-src 'self'",
    "img-src 'self' data: blob: file:",
    "style-src 'self' 'unsafe-inline'",
    policyIsDev ? "script-src 'self' 'unsafe-inline'" : "script-src 'self'",
    policyIsDev
      ? `connect-src 'self' ${getHttpOrigin(policyDevRendererUrl)} ${getWebSocketOrigin(policyDevRendererUrl)}`
      : "connect-src 'self'",
  ].join("; ");
}

function getHttpOrigin(url) {
  return new URL(url).origin;
}

function getWebSocketOrigin(url) {
  const parsedUrl = new URL(url);
  parsedUrl.protocol = parsedUrl.protocol === "https:" ? "wss:" : "ws:";
  return parsedUrl.origin;
}

function getDesktopIconPath() {
  return join(__dirname, "../build-resources/icon.icns");
}

module.exports = {
  assertAllowedSender,
  createAiConfigStore,
  createAiRuntime,
  createRendererContentSecurityPolicy,
  createRuntimeLogger,
  getDesktopIconPath,
  isAllowedRendererUrl,
  registerAiIpc,
  registerFileIpc,
  registerRecordIpc,
};
