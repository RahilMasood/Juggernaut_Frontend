import {
  PAYROLL_ACCEPTED_INPUTS_CHANNEL,
  PAYROLL_DOWNLOAD_RESULT_CHANNEL,
  PAYROLL_LIST_RESULTS_CHANNEL,
  PAYROLL_PROGRESS_CHANNEL,
  PAYROLL_RUN_SCRIPT_CHANNEL,
  PAYROLL_OPEN_DIALOG_CHANNEL,
  PAYROLL_UPLOAD_FILE_CHANNEL,
  PAYROLL_LOAD_EXCEL_COLUMNS_CHANNEL,
} from "./payroll-channels";

export function exposePayrollContext() {
  const { contextBridge, ipcRenderer } = (window as any).require("electron");
  contextBridge.exposeInMainWorld("payroll", {
    acceptedInputs: (): Promise<string[]> =>
      ipcRenderer.invoke(PAYROLL_ACCEPTED_INPUTS_CHANNEL),
    testPython: (): Promise<{ ok: boolean; executable?: string; error?: string; message: string }> =>
      ipcRenderer.invoke("payroll:test-python"),
    run: (
      scriptKey: string,
      args: {
        inputFiles: string[];
        options?: Record<string, unknown>;
      },
    ): Promise<{ ok: boolean; runId?: string; error?: string }> =>
      ipcRenderer.invoke(PAYROLL_RUN_SCRIPT_CHANNEL, { scriptKey, ...args }),
    listResults: (): Promise<
      Array<{
        id: string;
        label: string;
        createdAt: number;
        filePath: string;
        size: number;
        mimeType?: string;
      }>
    > => ipcRenderer.invoke(PAYROLL_LIST_RESULTS_CHANNEL),
    downloadResult: (
      id: string,
    ): Promise<{ ok: boolean; filePath?: string; error?: string }> =>
      ipcRenderer.invoke(PAYROLL_DOWNLOAD_RESULT_CHANNEL, { id }),
    openDialog: async (): Promise<string[]> => {
      const res = await ipcRenderer.invoke(PAYROLL_OPEN_DIALOG_CHANNEL);
      return Array.isArray(res) ? res : [];
    },
    uploadFile: (): Promise<{
      ok: boolean;
      files?: Array<{ originalPath: string; savedPath: string; fileName: string }>;
      message?: string;
      error?: string;
    }> => ipcRenderer.invoke(PAYROLL_UPLOAD_FILE_CHANNEL),
    listSheets: (filePath: string): Promise<{ ok: boolean; sheets?: string[]; error?: string }> =>
      ipcRenderer.invoke("payroll:list-sheets", { filePath }),
    listColumns: (filePath: string, sheet: string): Promise<{ ok: boolean; columns?: string[]; error?: string }> =>
      ipcRenderer.invoke("payroll:list-columns", { filePath, sheet }),
    writeExecutionColumnMap: (mapping: Record<string, string>): Promise<{ ok: boolean; error?: string }> =>
      ipcRenderer.invoke("payroll:write-exec-column-map", { mapping }),
    writeIpeSelection: (payload: { filePath: string; sheet: string }): Promise<{ ok: boolean; error?: string }> =>
      ipcRenderer.invoke("payroll:write-ipe-selection", payload),
    readIpeSelection: (): Promise<{ ok: boolean; filePath?: string; sheet?: string; error?: string }> =>
      ipcRenderer.invoke("payroll:read-ipe-selection"),
    downloadClientFile: (filename: string): Promise<{ ok: boolean; filePath?: string; error?: string }> =>
      ipcRenderer.invoke("payroll:download-client-file", { filename }),
    loadExcelColumns: (fileName: string): Promise<{ ok: boolean; columns?: string[]; error?: string }> =>
      ipcRenderer.invoke(PAYROLL_LOAD_EXCEL_COLUMNS_CHANNEL, { fileName }),
    onProgress: (
      handler: (payload: {
        runId: string;
        progress: number;
        status: "running" | "success" | "error";
        message?: string;
        error?: string;
        stdout?: string;
        stderr?: string;
      }) => void,
    ) => {
      const listener = (_event: unknown, payload: any) => handler(payload);
      ipcRenderer.on(PAYROLL_PROGRESS_CHANNEL, listener);
      return () => ipcRenderer.removeListener(PAYROLL_PROGRESS_CHANNEL, listener);
    },
  });
}


