import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

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

const main = readFileSync("electron/main.cjs", "utf8");
assert.match(main, /nodeIntegration:\s*false/);
assert.match(main, /contextIsolation:\s*true/);
assert.match(main, /sandbox:\s*true/);
assert.match(main, /setWindowOpenHandler/);
assert.match(main, /will-navigate/);
assert.match(main, /ipcMain\.handle\("dialog:select-image"/);
assert.match(
  main,
  /if \(process\.env\.ELECTRON_OPEN_DEVTOOLS === "1"\) \{\s*window\.webContents\.openDevTools/,
);

const preload = readFileSync("electron/preload.cjs", "utf8");
assert.match(preload, /contextBridge\.exposeInMainWorld\("evocraft"/);
assert.doesNotMatch(preload, /ipcRenderer\.send\(/);
assert.match(preload, /selectImage/);
assert.match(preload, /readImageAsDataUrl/);
