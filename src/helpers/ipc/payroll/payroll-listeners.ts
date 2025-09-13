import { BrowserWindow, app, dialog, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import fsp from "fs/promises";
import { randomUUID } from "crypto";
import { spawn } from "child_process";
import {
  PAYROLL_ACCEPTED_INPUTS_CHANNEL,
  PAYROLL_DOWNLOAD_RESULT_CHANNEL,
  PAYROLL_LIST_RESULTS_CHANNEL,
  PAYROLL_PROGRESS_CHANNEL,
  PAYROLL_RUN_SCRIPT_CHANNEL,
  PAYROLL_OPEN_DIALOG_CHANNEL,
  PAYROLL_UPLOAD_FILE_CHANNEL,
} from "./payroll-channels";

type ScriptMap = Record<string, { file: string; label: string; produces?: string[] }>;

// Use app.getPath to get a writable directory
function getPayrollDirectories() {
  const userDataDir = app.getPath("userData");
  const payrollBaseDir = path.join(userDataDir, "payroll");
  const outputsDir = path.join(payrollBaseDir, "outputs");
  
  // Get the actual workspace directory dynamically
  const workspaceDir = process.cwd(); // This should be the project root
  const codesDir = path.join(workspaceDir, "payroll", "encrypted");
  
  return {
    payrollBaseDir,
    outputsDir,
    codesDir,
    workspaceDir
  };
}

const { payrollBaseDir: PAYROLL_BASE_DIR, outputsDir: PAYROLL_OUTPUTS_DIR, codesDir: PAYROLL_CODES_DIR } = getPayrollDirectories();

async function findPythonExecutable(): Promise<string> {
  // List of possible Python executable names, in order of preference
  const pythonCandidates = [
    process.env.PYTHON_PATH, // User-specified path takes precedence
    'python3',
    'python',
    'py', // Windows Python Launcher
    'python3.exe',
    'python.exe',
  ].filter(Boolean); // Remove any undefined values

  for (const candidate of pythonCandidates) {
    try {
      // Test if the executable exists and can run
      await new Promise<void>((resolve, reject) => {
        const testProcess = spawn(candidate as string, ['--version'], { 
          stdio: 'pipe',
          timeout: 5000 // 5 second timeout
        });
        
        testProcess.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Python executable test failed with code ${code}`));
          }
        });
        
        testProcess.on('error', (error) => {
          reject(error);
        });
      });
      
      console.log(`Found Python executable: ${candidate}`);
      return candidate as string;
    } catch (error) {
      console.log(`Python candidate '${candidate}' not available:`, error);
      continue;
    }
  }
  
  // If no Python executable found, throw an error with helpful message
  throw new Error(
    'No Python executable found. Please install Python or set PYTHON_PATH environment variable. ' +
    'Tried: ' + pythonCandidates.join(', ')
  );
}

// Map logical keys to actual Python runner scripts in the repo.
const SCRIPTS: ScriptMap = {
  "ipe_testing": {
    file: path.join(PAYROLL_CODES_DIR, "main.py"),
    label: "IPE Testing",
    produces: ["ipe_output.json"],
  },
  "exception_testing": {
    file: path.join(PAYROLL_CODES_DIR, "main.py"),
    label: "Exception Testing",
    produces: ["Exception Testing.xlsx"],
  },
  "headcount_reconciliation": {
    file: path.join(PAYROLL_CODES_DIR, "main.py"),
    label: "Headcount Reconciliation",
    produces: ["Headcount Reconcilation.json"],
  },
  "mom_analysis": {
    file: path.join(PAYROLL_CODES_DIR, "main.py"),
    label: "Month-on-Month Analysis",
    produces: ["Mom Increment.xlsx"],
  },
  "increment_analysis": {
    file: path.join(PAYROLL_CODES_DIR, "main.py"),
    label: "Increment Analysis",
    produces: ["Increment_Analysis.json"],
  },
  "pf_sal_analytics": {
    file: path.join(PAYROLL_CODES_DIR, "main.py"),
    label: "PF & Salary Analytics",
    produces: ["pf_calculations.json", "salary_calculations.json"],
  },
  "actuary_testing": {
    file: path.join(PAYROLL_CODES_DIR, "main.py"),
    label: "Actuary Testing",
    produces: ["actuary_testing.json"],
  },
  "accuracy_check": {
    file: path.join(PAYROLL_CODES_DIR, "main.py"),
    label: "Accuracy Check",
    produces: ["CTC_Actuary.xlsx"],
  },
};



function getRunsDir(): string {
  const dir = path.join(PAYROLL_BASE_DIR, "runs");
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (error) {
    console.error("Failed to create runs directory:", error);
    // Fallback to temp directory
    const tempDir = path.join(app.getPath("temp"), "payroll-runs");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    return tempDir;
  }
  return dir;
}

function getResultsDir(): string {
  const dir = path.join(PAYROLL_BASE_DIR, "results");
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (error) {
    console.error("Failed to create results directory:", error);
    // Fallback to temp directory
    const tempDir = path.join(app.getPath("temp"), "payroll-results");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    return tempDir;
  }
  return dir;
}

function getIndexPath(): string {
  return path.join(getResultsDir(), "index.json");
}

async function readIndex(): Promise<
  Array<{ id: string; label: string; createdAt: number; filePath: string; size: number; mimeType?: string }>
> {
  try {
    const raw = await fsp.readFile(getIndexPath(), "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeIndex(items: Array<{ id: string; label: string; createdAt: number; filePath: string; size: number; mimeType?: string }>) {
  await fsp.writeFile(getIndexPath(), JSON.stringify(items, null, 2), "utf-8");
}

function detectMime(ext: string): string | undefined {
  const lower = ext.toLowerCase();
  if (lower === ".xlsx") return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (lower === ".json") return "application/json";
  return undefined;
}

export function addPayrollEventListeners(mainWindow: BrowserWindow) {
  ipcMain.handle(PAYROLL_ACCEPTED_INPUTS_CHANNEL, async () => [".xlsx", ".xls", ".csv", ".json"]);

  // Add Python test handler
  ipcMain.handle("payroll:test-python", async () => {
    try {
      const pythonCmd = await findPythonExecutable();
      return { 
        ok: true, 
        executable: pythonCmd,
        message: `Python found: ${pythonCmd}` 
      };
    } catch (error) {
      return { 
        ok: false, 
        error: (error as Error).message,
        message: "Python not found or not working" 
      };
    }
  });

  ipcMain.handle(PAYROLL_OPEN_DIALOG_CHANNEL, async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openFile", "multiSelections"],
      filters: [
        { name: "Excel/CSV", extensions: ["xlsx", "xls", "csv"] },
        { name: "JSON", extensions: ["json"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });
    if (canceled) return [];
    return filePaths || [];
  });

  ipcMain.handle(
    PAYROLL_RUN_SCRIPT_CHANNEL,
    async (_evt, args: { scriptKey: string; inputFiles: string[]; options?: Record<string, unknown> }) => {
      const { scriptKey, inputFiles, options } = args;
      const mapping = SCRIPTS[scriptKey];
      if (!mapping) return { ok: false, error: "Unknown script" };

      const runId = randomUUID();

      // Find available Python executable
      let pythonCmd: string;
      try {
        pythonCmd = await findPythonExecutable();
      } catch (error) {
        console.error("Python executable not found:", error);
        return { 
          ok: false, 
          error: `Python not found: ${(error as Error).message}. Please install Python 3.6+ and ensure it's in your system PATH.` 
        };
      }

      // Environment override
      const env = { ...process.env };
      env["PYTHONIOENCODING"] = "utf-8";
      const cwd = PAYROLL_CODES_DIR;

      // Create output directory with error handling
      let outputs = PAYROLL_OUTPUTS_DIR;
      try {
        if (!fs.existsSync(outputs)) {
          fs.mkdirSync(outputs, { recursive: true });
          console.log("Created outputs directory:", outputs);
        }
      } catch (error) {
        console.error("Failed to create outputs directory:", error);
        const tempOutputs = path.join(app.getPath("temp"), "payroll-outputs");
        try {
          if (!fs.existsSync(tempOutputs)) {
            fs.mkdirSync(tempOutputs, { recursive: true });
          }
          console.log("Using temp outputs directory:", tempOutputs);
          outputs = tempOutputs; // Use temp directory instead
        } catch (tempError) {
          console.error("Failed to create temp outputs directory:", tempError);
          return { ok: false, error: `Cannot create output directory: ${(error as Error).message}` };
        }
      }
      
      // Create configuration JSON file
      const configPath = path.join(getRunsDir(), `${runId}_config.json`);
      const config: Record<string, string | number | string[] | number[]> = {
        output_directory: outputs,
        ...(options || {}),
      };

      // Add input files to config based on their names/types
      if (inputFiles && inputFiles.length > 0) {
        inputFiles.forEach((filePath, index) => {
          const fileName = path.basename(filePath).toLowerCase();
          const ext = path.extname(filePath).toLowerCase();
          
          // Map files based on common naming patterns
          if (fileName.includes("pay") && fileName.includes("registrar")) {
            config.pay_registrar = filePath;
          } else if (fileName.includes("ctc") && fileName.includes("prev")) {
            config.ctc_py_file = filePath;
          } else if (fileName.includes("ctc")) {
            config.ctc_file = filePath;
          } else if (fileName.includes("addition")) {
            config.add_list = filePath;
          } else if (fileName.includes("deletion")) {
            config.del_list = filePath;
          } else if (fileName.includes("actuary")) {
            config.actuary_file = filePath;
          } else if (ext === ".json" && fileName.includes("combined")) {
            config.combined_json_path = filePath;
          } else {
            // Fallback mapping based on position for modules that need specific files
            if (scriptKey === "ipe_testing" || scriptKey === "exception_testing" || scriptKey === "mom_analysis") {
              if (index === 0) config.pay_registrar = filePath;
              if (index === 1) config.ctc_file = filePath;
            } else if (scriptKey === "headcount_reconciliation") {
              if (index === 0) config.pay_registrar = filePath;
              if (index === 1) config.add_list = filePath;
              if (index === 2) config.del_list = filePath;
              if (index === 3) config.ctc_file = filePath;
            } else if (scriptKey === "increment_analysis") {
              if (index === 0) config.ctc_file = filePath;
              if (index === 1) config.ctc_py_file = filePath;
            } else if (scriptKey === "actuary_testing" || scriptKey === "accuracy_check") {
              if (index === 0) config.actuary_file = filePath;
              if (index === 1) config.ctc_file = filePath;
            }
          }
        });
      }

      // Write config file
      await fsp.writeFile(configPath, JSON.stringify(config, null, 2));

      // Build command arguments: python main.py <module_id> <config_path>
      const argsList: string[] = [mapping.file, scriptKey, configPath];

      console.log("=== Payroll Execution Debug Info ===");
      console.log("Working directory:", cwd);
      console.log("Outputs directory:", outputs);
      console.log("Config path:", configPath);
      console.log("Running Python script:", pythonCmd, argsList);
      console.log("Config:", config);
      console.log("=====================================");

      // Progress emitter
      const emit = (progress: number, status: "running" | "success" | "error", message?: string, error?: string, stdout?: string, stderr?: string) => {
        mainWindow.webContents.send(PAYROLL_PROGRESS_CHANNEL, { runId, progress, status, message, error, stdout, stderr });
      };

      emit(0, "running", "Starting execution...");

      // Spawn Python process
      const child = spawn(pythonCmd, argsList, { cwd, env });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (d) => {
        const text = String(d);
        stdout += text;
        
        // Parse different types of log messages
        if (text.includes("ERROR") || text.includes("FATAL ERROR")) {
          emit(90, "error", "Python execution error detected", undefined, stdout, stderr);
        } else if (text.includes("WARNING")) {
          emit(30, "running", "Warning encountered", undefined, stdout, stderr);
        } else if (text.includes("INFO")) {
          emit(20, "running", "Processing...", undefined, stdout, stderr);
        } else {
          emit(10, "running", text.trim(), undefined, stdout, stderr);
        }
      });
      
      child.stderr.on("data", (d) => {
        const text = String(d);
        stderr += text;
        emit(50, "running", "Error output received", text, stdout, stderr);
      });

      const exitCode: number = await new Promise((resolve) => child.on("close", resolve));
      if (exitCode !== 0) {
        emit(100, "error", "Python script failed", `Script exited with code ${exitCode}`, stdout, stderr);
        return { ok: false, error: `Script failed (${exitCode}). Check logs for details.` };
      }

      // Collect produced files based on convention or mapping
      const produced: string[] = [];
      if (mapping.produces && mapping.produces.length > 0) {
        for (const name of mapping.produces) {
          const p = path.join(outputs, name);
          if (fs.existsSync(p)) produced.push(p);
        }
      } else {
        if (fs.existsSync(outputs)) {
          for (const f of fs.readdirSync(outputs)) produced.push(path.join(outputs, f));
        }
      }

      const index = await readIndex();
      for (const p of produced) {
        const id = randomUUID();
        const dest = path.join(getResultsDir(), `${id}${path.extname(p)}`);
        await fsp.copyFile(p, dest);
        const stat = await fsp.stat(dest);
        index.push({
          id,
          label: mapping.label,
          createdAt: Date.now(),
          filePath: dest,
          size: stat.size,
          mimeType: detectMime(path.extname(dest)),
        });
      }
      await writeIndex(index);

      emit(100, "success", "Completed successfully", undefined, stdout, stderr);
      return { ok: true, runId };
    },
  );

  ipcMain.handle(PAYROLL_LIST_RESULTS_CHANNEL, async () => readIndex());

  ipcMain.handle(PAYROLL_DOWNLOAD_RESULT_CHANNEL, async (_evt, { id }: { id: string }) => {
    const items = await readIndex();
    const item = items.find((i) => i.id === id);
    if (!item) return { ok: false, error: "Not found" };
    const result = await dialog.showSaveDialog({ defaultPath: path.basename(item.filePath) });
    if (result.canceled || !result.filePath) return { ok: false };
    await fsp.copyFile(item.filePath, result.filePath);
    return { ok: true, filePath: result.filePath };
  });

  // Handle file upload to Cloud/Client folder
  ipcMain.handle(PAYROLL_UPLOAD_FILE_CHANNEL, async () => {
    try {
      // Show file selection dialog
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'Select files to upload',
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'All Files', extensions: ['*'] },
          { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'] },
          { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'] },
          { name: 'Text Files', extensions: ['txt', 'csv', 'json', 'xml'] }
        ]
      });

      if (canceled || filePaths.length === 0) {
        return { ok: false, error: 'No files selected' };
      }

      // Create Cloud/Client directory if it doesn't exist
      const cloudClientPath = path.join(process.cwd(), 'Cloud', 'Client');
      if (!fs.existsSync(cloudClientPath)) {
        fs.mkdirSync(cloudClientPath, { recursive: true });
      }

      const uploadedFiles: Array<{ originalPath: string; savedPath: string; fileName: string }> = [];

      // Copy each selected file to Cloud/Client folder
      for (const selectedFile of filePaths) {
        try {
          const fileName = path.basename(selectedFile);
          const timestamp = Date.now();
          const uniqueFileName = `${timestamp}_${fileName}`;
          const destPath = path.join(cloudClientPath, uniqueFileName);

          // Copy the file
          await fsp.copyFile(selectedFile, destPath);

          uploadedFiles.push({
            originalPath: selectedFile,
            savedPath: destPath,
            fileName: uniqueFileName
          });

          console.log(`✅ File copied to: ${destPath}`);
        } catch (error) {
          console.error(`❌ Error copying file ${selectedFile}:`, error);
        }
      }

      return { 
        ok: true, 
        files: uploadedFiles,
        message: `Successfully uploaded ${uploadedFiles.length} file(s) to Cloud/Client folder`
      };
    } catch (error) {
      console.error('❌ Error in file upload handler:', error);
      return { ok: false, error: 'Failed to upload files' };
    }
  });
}


