const { app, BrowserWindow, dialog, ipcMain, session } = require("electron");
const { readFile } = require("node:fs/promises");
const { extname, join } = require("node:path");

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

  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.handle("dialog:select-image", async (event) => {
  assertAllowedSender(event);

  const result = await dialog.showOpenDialog({
    title: "选择错题照片",
    properties: ["openFile"],
    filters: [
      { name: "Images", extensions: ["png", "jpg", "jpeg", "webp", "bmp", "heic"] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

ipcMain.handle("file:read-image-data-url", async (event, filePath) => {
  assertAllowedSender(event);

  if (typeof filePath !== "string" || filePath.length === 0) {
    throw new Error("Invalid file path");
  }

  const extension = extname(filePath).toLowerCase();
  if (!allowedImageExtensions.has(extension)) {
    throw new Error("Unsupported image type");
  }

  const mime = getImageMimeType(extension);
  const bytes = await readFile(filePath);
  return `data:${mime};base64,${bytes.toString("base64")}`;
});

function assertAllowedSender(event) {
  const url = event.senderFrame?.url ?? "";
  if (!isAllowedRendererUrl(url)) {
    throw new Error("Blocked IPC from untrusted renderer");
  }
}

function isAllowedRendererUrl(url) {
  return isDev ? url.startsWith(devRendererUrl) : url.startsWith("file://");
}

function getImageMimeType(extension) {
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  if (extension === ".bmp") return "image/bmp";
  if (extension === ".heic") return "image/heic";
  return "image/png";
}
