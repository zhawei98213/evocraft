const { app, BrowserWindow, dialog, ipcMain, session } = require("electron");
const { readFile } = require("node:fs/promises");
const { extname, join, resolve } = require("node:path");
const { createQwenAdapter } = require("./ai/qwenAdapter.cjs");
const { isTrustedRendererUrl } = require("./security/rendererTrust.cjs");
const { createLocalRecordStore, isValidWrongQuestionRecordArray } = require("./storage/localRecordStore.cjs");

const isDev = Boolean(process.env.ELECTRON_RENDERER_URL);
const devRendererUrl = process.env.ELECTRON_RENDERER_URL ?? "http://127.0.0.1:5173";
const allowedImageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".bmp", ".heic"]);

function createWindow() {
  const window = new BrowserWindow({
    title: "EvoCraft",
    width: 1440,
    height: 980,
    minWidth: 1180,
    minHeight: 760,
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
          "Content-Security-Policy": [
            [
              "default-src 'self'",
              "img-src 'self' data: blob: file:",
              "style-src 'self' 'unsafe-inline'",
              "script-src 'self'",
              "connect-src 'self' http://127.0.0.1:5173 ws://127.0.0.1:5173",
            ].join("; "),
          ],
        },
      });
    });

    const recordStore = createLocalRecordStore(app.getPath("userData"));
    registerFileIpc();
    registerRecordIpc(recordStore);
    registerAiIpc(createAiRuntime());
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

function registerRecordIpc(recordStore) {
  ipcMain.handle("records:load", async (event) => {
    assertAllowedSender(event);
    return recordStore.load();
  });

  ipcMain.handle("records:save", async (event, records) => {
    assertAllowedSender(event);

    if (!isValidWrongQuestionRecordArray(records)) {
      throw new Error("Invalid records payload");
    }

    return recordStore.save(records);
  });

  ipcMain.handle("records:clear", async (event) => {
    assertAllowedSender(event);
    return recordStore.clear();
  });
}

function createAiRuntime() {
  const enabledFlag = process.env.EVOCRAFT_AI_ENABLED === "1";
  const provider = process.env.EVOCRAFT_AI_PROVIDER ?? "qwen";
  const apiKey = process.env.DASHSCOPE_API_KEY ?? "";
  const enabled = enabledFlag && Boolean(apiKey);

  return {
    status: {
      enabled,
      provider,
      mode: enabled ? "real" : "mock",
      message: enabledFlag && !apiKey ? "真实 AI 已开启但缺少 API Key。" : "",
    },
    adapter: createQwenAdapter({ apiKey }),
  };
}

function registerAiIpc(runtime, options = {}) {
  const targetIpcMain = options.ipcMain ?? ipcMain;
  const isRendererUrlAllowed = options.isAllowedRendererUrl ?? isAllowedRendererUrl;
  let externalAiAuthorized = Boolean(options.externalAiAuthorized);

  targetIpcMain.handle("ai:runtime-status", (event) => {
    assertAllowedSender(event, isRendererUrlAllowed);
    return runtime.status;
  });

  targetIpcMain.handle("ai:set-external-authorization", (event, acknowledged) => {
    assertAllowedSender(event, isRendererUrlAllowed);

    if (typeof acknowledged !== "boolean") {
      throw new Error("Invalid external AI authorization payload");
    }

    externalAiAuthorized = acknowledged;
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

    return runtime.adapter.detectRegions(input);
  });

  targetIpcMain.handle("ai:recognize-question", async (event, input) => {
    assertAllowedSender(event, isRendererUrlAllowed);

    if (!runtime.status.enabled) {
      return createRealAiDisabledFailure();
    }

    if (!externalAiAuthorized) {
      return createExternalAiNotAuthorizedFailure();
    }

    return runtime.adapter.recognizeQuestion(input);
  });
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

module.exports = {
  assertAllowedSender,
  createAiRuntime,
  isAllowedRendererUrl,
  registerAiIpc,
  registerFileIpc,
};
