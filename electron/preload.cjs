const { contextBridge, ipcRenderer } = require("electron");

const api = {
  selectImage: () => ipcRenderer.invoke("dialog:select-image"),
  readImageAsDataUrl: (filePath) => ipcRenderer.invoke("file:read-image-data-url", filePath),
  loadRecords: () => ipcRenderer.invoke("records:load"),
  saveRecords: (records) => ipcRenderer.invoke("records:save", records),
  clearRecords: () => ipcRenderer.invoke("records:clear"),
  getAiRuntimeStatus: () => ipcRenderer.invoke("ai:runtime-status"),
  detectRegions: (input) => ipcRenderer.invoke("ai:detect-regions", input),
  recognizeQuestion: (input) => ipcRenderer.invoke("ai:recognize-question", input),
};

contextBridge.exposeInMainWorld("evocraft", api);
