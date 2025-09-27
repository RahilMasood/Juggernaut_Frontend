import { contextBridge, ipcRenderer } from "electron";
import { SHAREPOINT_CHANNELS } from "./sharepoint-channels";

/**
 * SharePoint Context
 * Exposes SharePoint operations to the renderer process
 */

export function exposeSharePointContext() {
  contextBridge.exposeInMainWorld("sharePointAPI", {
    addRommEntry: (formData: {
      "romm-id": string;
      workspace: string;
      description: string;
      assertion: string;
    }) => ipcRenderer.invoke(SHAREPOINT_CHANNELS.ADD_ROMM_ENTRY, formData),
  updateRommEntry: (updateData: {
    rommId: string;
    assessment: string;
    documentation: string;
    controlIds?: string[];
    procedureIds?: string[];
  }) => ipcRenderer.invoke(SHAREPOINT_CHANNELS.UPDATE_ROMM_ENTRY, updateData),
    readRommLibrary: () => ipcRenderer.invoke(SHAREPOINT_CHANNELS.READ_ROMM_LIBRARY),
    readRommLibraryByWorkspace: (workspace: string) => ipcRenderer.invoke(SHAREPOINT_CHANNELS.READ_ROMM_LIBRARY_BY_WORKSPACE, workspace),
  });
}
