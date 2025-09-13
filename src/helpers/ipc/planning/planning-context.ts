import { PLANNING_READ_SECTION_CHANNEL, PLANNING_SAVE_SECTION_CHANNEL, PLANNING_READ_COMBINED_DATA_CHANNEL } from "./planning-channels";

export function exposePlanningContext() {
  const { contextBridge, ipcRenderer } = (window as any).require("electron");
  contextBridge.exposeInMainWorld("planning", {
    readSection: (companyName: string, sectionKey: string) =>
      ipcRenderer.invoke(PLANNING_READ_SECTION_CHANNEL, { companyName, sectionKey }),
    saveSection: (
      companyName: string,
      sectionKey: string,
      content: unknown,
    ) => ipcRenderer.invoke(PLANNING_SAVE_SECTION_CHANNEL, { companyName, sectionKey, content }),
    readCombinedData: () => ipcRenderer.invoke(PLANNING_READ_COMBINED_DATA_CHANNEL),
  });
}


