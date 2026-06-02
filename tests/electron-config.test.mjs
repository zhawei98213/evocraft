import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { isTrustedRendererUrl } = require("../electron/security/rendererTrust.cjs");

assert.ok(existsSync("electron/main.cjs"), "electron/main.cjs should exist");
assert.ok(existsSync("electron/preload.cjs"), "electron/preload.cjs should exist");
assert.ok(existsSync("src/services/desktopBridge.ts"), "desktopBridge should exist");

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
assert.equal(pkg.main, "electron/main.cjs");
assert.equal(pkg.scripts["desktop:dev"], 'concurrently -k "npm run dev" "npm run electron:dev"');
assert.equal(pkg.scripts["desktop:build"], "npm run build && electron-builder --dir");
assert.equal(pkg.scripts["desktop:open"], "npm run desktop:build && open -n release/mac/EvoCraft.app");
assert.ok(pkg.devDependencies.electron, "electron should be a dev dependency");
assert.ok(pkg.devDependencies["electron-builder"], "electron-builder should be a dev dependency");
assert.equal(pkg.build.mac.icon, "build-resources/icon.icns");
assert.ok(existsSync("build-resources/icon.icns"), "macOS app icon should exist");

const main = readFileSync("electron/main.cjs", "utf8");
assert.match(main, /nodeIntegration:\s*false/);
assert.match(main, /contextIsolation:\s*true/);
assert.match(main, /sandbox:\s*true/);
assert.match(main, /createLocalRecordStore/);
assert.match(main, /setWindowOpenHandler/);
assert.match(main, /will-navigate/);
assert.match(main, /targetIpcMain\.handle\("dialog:select-image"/);
assert.match(main, /targetIpcMain\.handle\("file:read-image-data-url"/);
assert.match(main, /ipcMain\.handle\("records:load"/);
assert.match(main, /ipcMain\.handle\("records:save"/);
assert.match(main, /ipcMain\.handle\("records:clear"/);
assert.match(main, /targetIpcMain\.handle\("ai:runtime-status"/);
assert.match(main, /targetIpcMain\.handle\("ai:configure"/);
assert.match(main, /targetIpcMain\.handle\("ai:set-external-authorization"/);
assert.match(main, /targetIpcMain\.handle\("ai:detect-regions"/);
assert.match(main, /targetIpcMain\.handle\("ai:recognize-question"/);
assert.match(main, /EVOCRAFT_AI_ENABLED/);
assert.match(main, /DASHSCOPE_API_KEY/);
assert.match(
  main,
  /if \(process\.env\.ELECTRON_OPEN_DEVTOOLS === "1"\) \{\s*window\.webContents\.openDevTools/,
);

const preload = readFileSync("electron/preload.cjs", "utf8");
assert.match(preload, /contextBridge\.exposeInMainWorld\("evocraft"/);
assert.doesNotMatch(preload, /ipcRenderer\.send\(/);
assert.doesNotMatch(preload, /DASHSCOPE_API_KEY/);
assert.match(preload, /selectImage/);
assert.match(preload, /readImageAsDataUrl/);
assert.match(preload, /loadRecords/);
assert.match(preload, /saveRecords/);
assert.match(preload, /clearRecords/);
assert.match(preload, /getAiRuntimeStatus/);
assert.match(preload, /configureAiRuntime/);
assert.match(preload, /setExternalAiAuthorization/);
assert.match(preload, /detectRegions/);
assert.match(preload, /recognizeQuestion/);

const appDirname = join(process.cwd(), "electron");
const trustedProductionUrl = pathToFileURL(join(process.cwd(), "dist/index.html")).toString();

assert.equal(
  isTrustedRendererUrl("http://127.0.0.1:5173/", {
    devRendererUrl: "http://127.0.0.1:5173",
    isDev: true,
  }),
  true,
);
assert.equal(
  isTrustedRendererUrl("http://127.0.0.1:5173.evil.test/pwn", {
    devRendererUrl: "http://127.0.0.1:5173",
    isDev: true,
  }),
  false,
);
assert.equal(
  isTrustedRendererUrl("http://127.0.0.1:5173/other", {
    devRendererUrl: "http://127.0.0.1:5173",
    isDev: true,
  }),
  false,
);
assert.equal(isTrustedRendererUrl(trustedProductionUrl, { appDirname, isDev: false }), true);
assert.equal(isTrustedRendererUrl("file:///tmp/evil.html", { appDirname, isDev: false }), false);
