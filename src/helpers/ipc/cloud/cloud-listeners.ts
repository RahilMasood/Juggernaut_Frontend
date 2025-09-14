import { BrowserWindow, ipcMain } from "electron";
import {
  CLOUD_UPLOAD_CHANNEL,
  CLOUD_DOWNLOAD_CHANNEL,
  CLOUD_LIST_CHANNEL,
  CLOUD_DELETE_CHANNEL,
  CLOUD_PROGRESS_CHANNEL,
} from "./cloud-channels";
import {
  uploadFile,
  downloadFile,
  listFiles,
  deleteFile,
  CONTAINERS,
} from "../../../utils/cloud-storage";
import {
  CloudUploadRequest,
  CloudDownloadRequest,
  CloudListRequest,
  CloudDeleteRequest,
  CloudProgressPayload,
  CloudUploadResult,
  CloudDownloadResult,
  CloudListResult,
  CloudDeleteResult,
} from "./cloud-context";

function emitProgress(
  mainWindow: BrowserWindow,
  payload: CloudProgressPayload
) {
  mainWindow.webContents.send(CLOUD_PROGRESS_CHANNEL, payload);
}

export function addCloudEventListeners(mainWindow: BrowserWindow) {
  // Upload file to cloud
  ipcMain.handle(
    CLOUD_UPLOAD_CHANNEL,
    async (_event, request: CloudUploadRequest): Promise<CloudUploadResult> => {
      try {
        emitProgress(mainWindow, {
          operation: "upload",
          container: request.container,
          filename: request.filePath.split(/[/\\]/).pop() || "unknown",
          progress: 0,
          status: "started",
        });

        const result = await uploadFile(
          request.container,
          request.filePath,
          request.reference || ""
        );

        if (result.success) {
          emitProgress(mainWindow, {
            operation: "upload",
            container: request.container,
            filename: request.filePath.split(/[/\\]/).pop() || "unknown",
            progress: 100,
            status: "success",
          });
        } else {
          emitProgress(mainWindow, {
            operation: "upload",
            container: request.container,
            filename: request.filePath.split(/[/\\]/).pop() || "unknown",
            progress: 0,
            status: "error",
            error: result.error,
          });
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        emitProgress(mainWindow, {
          operation: "upload",
          container: request.container,
          filename: request.filePath.split(/[/\\]/).pop() || "unknown",
          progress: 0,
          status: "error",
          error: errorMessage,
        });

        return {
          success: false,
          error: errorMessage,
        };
      }
    }
  );

  // Download file from cloud
  ipcMain.handle(
    CLOUD_DOWNLOAD_CHANNEL,
    async (_event, request: CloudDownloadRequest): Promise<CloudDownloadResult> => {
      try {
        emitProgress(mainWindow, {
          operation: "download",
          container: request.container,
          filename: request.filename,
          progress: 0,
          status: "started",
        });

        const result = await downloadFile(
          request.container,
          request.filename,
          request.downloadPath
        );

        if (result.success) {
          emitProgress(mainWindow, {
            operation: "download",
            container: request.container,
            filename: request.filename,
            progress: 100,
            status: "success",
          });
        } else {
          emitProgress(mainWindow, {
            operation: "download",
            container: request.container,
            filename: request.filename,
            progress: 0,
            status: "error",
            error: result.error,
          });
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        emitProgress(mainWindow, {
          operation: "download",
          container: request.container,
          filename: request.filename,
          progress: 0,
          status: "error",
          error: errorMessage,
        });

        return {
          success: false,
          error: errorMessage,
        };
      }
    }
  );

  // List files in cloud container
  ipcMain.handle(
    CLOUD_LIST_CHANNEL,
    async (_event, request: CloudListRequest): Promise<CloudListResult> => {
      try {
        const files = await listFiles(request.container);
        return {
          success: true,
          files,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );

  // Delete file from cloud
  ipcMain.handle(
    CLOUD_DELETE_CHANNEL,
    async (_event, request: CloudDeleteRequest): Promise<CloudDeleteResult> => {
      try {
        emitProgress(mainWindow, {
          operation: "delete",
          container: request.container,
          filename: request.filename,
          progress: 0,
          status: "started",
        });

        const success = await deleteFile(request.container, request.filename);

        if (success) {
          emitProgress(mainWindow, {
            operation: "delete",
            container: request.container,
            filename: request.filename,
            progress: 100,
            status: "success",
          });
        } else {
          emitProgress(mainWindow, {
            operation: "delete",
            container: request.container,
            filename: request.filename,
            progress: 0,
            status: "error",
            error: "File not found or deletion failed",
          });
        }

        return { success };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        emitProgress(mainWindow, {
          operation: "delete",
          container: request.container,
          filename: request.filename,
          progress: 0,
          status: "error",
          error: errorMessage,
        });

        return {
          success: false,
          error: errorMessage,
        };
      }
    }
  );
}

// Export available containers for UI components
export { CONTAINERS };


