import {
  DOCS_ACCEPTED_TYPES_CHANNEL,
  DOCS_DELETE_CHANNEL,
  DOCS_DOWNLOAD_CHANNEL,
  DOCS_LIST_CHANNEL,
  DOCS_OPEN_CHANNEL,
  DOCS_PROGRESS_CHANNEL,
  DOCS_UPLOAD_CHANNEL,
} from "./document-channels";

export interface DocumentMetadata {
  id: string;
  fileName: string;
  fileSize: number;
  uploadTimestamp: number;
  category: string;
  mimeType: string;
  extension: string;
  thumbnailPath?: string;
  // Optional, to indicate granular context (e.g., planning question)
  contextId?: string;
  contextLabel?: string;
  groupKey?: string;
}

export interface UploadResult {
  ok: boolean;
  document?: DocumentMetadata;
  error?: string;
}

export function exposeDocumentContext() {
  const { contextBridge, ipcRenderer } = window.require("electron");

  contextBridge.exposeInMainWorld("documents", {
    list: (): Promise<DocumentMetadata[]> => ipcRenderer.invoke(DOCS_LIST_CHANNEL),
    acceptedTypes: (): Promise<string[]> =>
      ipcRenderer.invoke(DOCS_ACCEPTED_TYPES_CHANNEL),
    upload: (
      filePaths: string[],
      category: string,
      context?: { contextId?: string; contextLabel?: string; groupKey?: string },
    ): Promise<UploadResult[]> =>
      ipcRenderer.invoke(DOCS_UPLOAD_CHANNEL, { filePaths, category, context }),
    delete: (id: string): Promise<{ ok: boolean }> =>
      ipcRenderer.invoke(DOCS_DELETE_CHANNEL, { id }),
    download: (id: string): Promise<{ ok: boolean; filePath?: string }> =>
      ipcRenderer.invoke(DOCS_DOWNLOAD_CHANNEL, { id }),
    open: (id: string): Promise<{ ok: boolean }> =>
      ipcRenderer.invoke(DOCS_OPEN_CHANNEL, { id }),
    onProgress: (
      handler: (payload: {
        id: string;
        progress: number;
        status: "uploading" | "success" | "error";
        error?: string;
        fileName?: string;
        fileSize?: number;
        extension?: string;
        category?: string;
        contextId?: string;
        contextLabel?: string;
        groupKey?: string;
      }) => void,
    ) => {
      const listener = (_event: unknown, payload: any) => handler(payload);
      ipcRenderer.on(DOCS_PROGRESS_CHANNEL, listener);
      return () => ipcRenderer.removeListener(DOCS_PROGRESS_CHANNEL, listener);
    },
  });
}


