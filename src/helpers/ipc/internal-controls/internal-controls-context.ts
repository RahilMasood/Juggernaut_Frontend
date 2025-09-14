import { contextBridge, ipcRenderer } from "electron";

const INTERNAL_CONTROLS_READ_TEMPLATE_CHANNEL = "internal-controls:read-template";

export function exposeInternalControlsContext() {
  contextBridge.exposeInMainWorld("internalControls", {
    readTemplate: (): Promise<any> => ipcRenderer.invoke(INTERNAL_CONTROLS_READ_TEMPLATE_CHANNEL),
  });
}
