const { contextBridge, ipcRenderer } = require("electron");

const api = {
  selectImage: () => ipcRenderer.invoke("dialog:select-image"),
  readImageAsDataUrl: (filePath) => ipcRenderer.invoke("file:read-image-data-url", filePath),
  loadRecords: () => ipcRenderer.invoke("records:load"),
  saveRecords: (records) => ipcRenderer.invoke("records:save", records),
  clearRecords: () => ipcRenderer.invoke("records:clear"),
};

contextBridge.exposeInMainWorld("evocraft", api);
