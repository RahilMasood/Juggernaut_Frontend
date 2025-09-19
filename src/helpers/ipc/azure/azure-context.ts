import { contextBridge, ipcRenderer } from "electron";

const AZURE_UPLOAD_CHANNEL = "azure:upload-file";

export function exposeAzureContext() {
  const { contextBridge, ipcRenderer } = window.require("electron");
  
  contextBridge.exposeInMainWorld("electronAPI", {
    uploadFileToAzure: (request: {
      containerName: string;
      fileName: string;
      fileContent: string;
      contentType: string;
      reference?: string;
    }) => ipcRenderer.invoke(AZURE_UPLOAD_CHANNEL, request),
  });
}
