import { contextBridge, desktopCapturer, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  getSources: () => desktopCapturer.getSources({ types: ["screen", "window"] }),
  getScreenId: (callback: () => void) => ipcRenderer.on("SET_SOURCE_ID", callback),
});
