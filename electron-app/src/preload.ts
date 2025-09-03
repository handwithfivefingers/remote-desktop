import { contextBridge, desktopCapturer, ipcRenderer } from "electron";
interface IScreen {
  appIcon: string | null;
  display_id: string;
  id: string;
  name: string;
}
contextBridge.exposeInMainWorld("electronAPI", {
  getSources: () => desktopCapturer.getSources({ types: ["screen", "window"] }),
  getScreens: () => ipcRenderer.invoke("screens"),
  getScreenId: (callback: () => void) => ipcRenderer.on("SET_SOURCE_ID", callback),
  selectScreen: (screenId: string) => ipcRenderer.send("selectedScreen", screenId),
});
