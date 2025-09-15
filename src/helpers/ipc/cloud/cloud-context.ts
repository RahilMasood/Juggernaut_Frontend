import {
  CLOUD_UPLOAD_CHANNEL,
  CLOUD_DOWNLOAD_CHANNEL,
  CLOUD_LIST_CHANNEL,
  CLOUD_DELETE_CHANNEL,
  CLOUD_PROGRESS_CHANNEL,
} from "./cloud-channels";

export interface CloudFileEntry {
  name: string;
  code: string;
  reference: string;
}

export interface CloudUploadRequest {
  container: string;
  filePath: string;
  reference?: string;
}

export interface CloudDownloadRequest {
  container: string;
  filename: string;
  downloadPath: string;
}

export interface CloudListRequest {
  container: string;
}

export interface CloudDeleteRequest {
  container: string;
  filename: string;
}

export interface CloudProgressPayload {
  operation: "upload" | "download" | "delete";
  container: string;
  filename: string;
  progress: number;
  status: "started" | "progress" | "success" | "error";
  error?: string;
}

export interface CloudUploadResult {
  success: boolean;
  code?: string;
  error?: string;
}

export interface CloudDownloadResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export interface CloudListResult {
  success: boolean;
  files?: CloudFileEntry[];
  error?: string;
}

export interface CloudDeleteResult {
  success: boolean;
  error?: string;
}

export function exposeCloudContext() {
  const { contextBridge, ipcRenderer } = window.require("electron");

  contextBridge.exposeInMainWorld("cloud", {
    upload: (request: CloudUploadRequest): Promise<CloudUploadResult> =>
      ipcRenderer.invoke(CLOUD_UPLOAD_CHANNEL, request),
    
    download: (request: CloudDownloadRequest): Promise<CloudDownloadResult> =>
      ipcRenderer.invoke(CLOUD_DOWNLOAD_CHANNEL, request),
    
    list: (request: CloudListRequest): Promise<CloudListResult> =>
      ipcRenderer.invoke(CLOUD_LIST_CHANNEL, request),
    
    delete: (request: CloudDeleteRequest): Promise<CloudDeleteResult> =>
      ipcRenderer.invoke(CLOUD_DELETE_CHANNEL, request),
    
    // File operations
    writeTempFile: (content: string, filename: string): Promise<{ success: boolean; filePath?: string; error?: string }> =>
      ipcRenderer.invoke("cloud:write-temp-file", { content, filename }),
    
    readTempFile: (filePath: string): Promise<{ success: boolean; content?: string; error?: string }> =>
      ipcRenderer.invoke("cloud:read-temp-file", { filePath }),
    
    deleteTempFile: (filePath: string): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke("cloud:delete-temp-file", { filePath }),
    
    // Direct upload method
    directUpload: (content: string, filename: string, container: string, reference: string): Promise<CloudUploadResult> =>
      ipcRenderer.invoke("cloud:direct-upload", { content, filename, container, reference }),
    
    onProgress: (
      handler: (payload: CloudProgressPayload) => void,
    ) => {
      const listener = (_event: unknown, payload: CloudProgressPayload) => handler(payload);
      ipcRenderer.on(CLOUD_PROGRESS_CHANNEL, listener);
      return () => ipcRenderer.removeListener(CLOUD_PROGRESS_CHANNEL, listener);
    },
  });
}


