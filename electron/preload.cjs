const { contextBridge, ipcRenderer } = require("electron");

const api = {
  selectImage: () => ipcRenderer.invoke("dialog:select-image"),
  readImageAsDataUrl: (filePath) => ipcRenderer.invoke("file:read-image-data-url", filePath),
};

contextBridge.exposeInMainWorld("evocraft", api);
