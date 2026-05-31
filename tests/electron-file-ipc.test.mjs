import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { registerFileIpc } = require("../electron/main.cjs");

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

{
  const fakeIpcMain = createFakeIpcMain();
  const selectedPath = "/Users/zha/Desktop/question.png";
  const fakeDialog = {
    async showOpenDialog() {
      return { canceled: false, filePaths: [selectedPath] };
    },
  };
  const readFileCalls = [];

  registerFileIpc({
    ipcMain: fakeIpcMain,
    dialog: fakeDialog,
    readFileImpl: async (filePath) => {
      readFileCalls.push(filePath);
      return Buffer.from("selected image");
    },
    isAllowedRendererUrl: trustOnlyAppUrl,
  });

  assert.equal(fakeIpcMain.handlers.size, 2);

  for (const channel of ["dialog:select-image", "file:read-image-data-url"]) {
    await assert.rejects(
      fakeIpcMain.handlers.get(channel)(untrustedEvent, selectedPath),
      /Blocked IPC from untrusted renderer/,
      `${channel} should reject untrusted renderer senders`,
    );
  }

  await assert.rejects(
    fakeIpcMain.handlers.get("file:read-image-data-url")(trustedEvent, "/Users/zha/Desktop/other.png"),
    /Image path was not selected by the user/,
  );
  assert.deepEqual(readFileCalls, []);

  assert.equal(await fakeIpcMain.handlers.get("dialog:select-image")(trustedEvent), selectedPath);
  assert.equal(
    await fakeIpcMain.handlers.get("file:read-image-data-url")(trustedEvent, selectedPath),
    "data:image/png;base64,c2VsZWN0ZWQgaW1hZ2U=",
  );
  assert.deepEqual(readFileCalls, [selectedPath]);

  await assert.rejects(
    fakeIpcMain.handlers.get("file:read-image-data-url")(trustedEvent, selectedPath),
    /Image path was not selected by the user/,
  );
}
