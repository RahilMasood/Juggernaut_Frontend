"use client";

import React, { useMemo, useState } from "react";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Label } from "../../ui/label";
import { Progress } from "../../ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Input } from "../../ui/input";
import { CheckCircle, AlertCircle, X, Download, Play, File, Link, Upload } from "lucide-react";
import { FileDropdown } from "../../ui/file-dropdown";
import { CloudFileEntry } from "../../../helpers/ipc/cloud/cloud-context";

interface IPETestingProps {
  onBack?: () => void;
}

interface UploadedFile {
  id: string;
  type: string;
  fileName: string;
  filePath?: string;
  status: "uploading" | "completed" | "error";
  progress: number;
  cloudFile?: CloudFileEntry;
}

// IPE Testing field names (from ipe_testing.py)
const IPE_FIELD_NAMES: string[] = [
  "employee_code",
  "employee_name", 
  "designation",
  "pay_month",
  "date_of_joining",
  "date_of_leaving",
  "pan",
  "gross_pay",
  "net_pay",
  "total_deductions",
  "pf",
  "esi",
];

// Example custom keys (from ipe_testing.py)
const EXAMPLE_CUSTOM_KEYS: string[] = [
  'Pernr', 'Employee Name', 'Design Code', 'MonthYear', 'DOJ', 'DOL',
  'PAN Number', 'Gross', 'Net Pay', 'Ded Tot', 'PROV. FUND', 'E.S.I'
];

export default function IPETesting({ onBack }: IPETestingProps) {
  // File management
  const [payrollFile, setPayrollFile] = useState<UploadedFile | null>(null);
  const [ctcFile, setCtcFile] = useState<UploadedFile | null>(null);
  
  // Sheet management
  const [payrollSheets, setPayrollSheets] = useState<string[]>([]);
  const [ctcSheets, setCtcSheets] = useState<string[]>([]);
  const [selectedPayrollSheet, setSelectedPayrollSheet] = useState<string>("");
  const [selectedCtcSheet, setSelectedCtcSheet] = useState<string>("");
  
  // Column management
  const [payrollColumns, setPayrollColumns] = useState<string[]>([]);
  const [customKeys, setCustomKeys] = useState<string[]>([]);
  
  // Processing status
  const [processingStatus, setProcessingStatus] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  // Manual input fallbacks
  const [manualPayrollSheet, setManualPayrollSheet] = useState<string>("");
  const [manualCtcSheet, setManualCtcSheet] = useState<string>("");
  const [manualCustomKeys, setManualCustomKeys] = useState<string[]>([]);

  // Handle file selection from cloud
  const handleCloudFileSelection = async (fileType: "payroll" | "ctc", file: CloudFileEntry) => {
    const selectedFile: UploadedFile = {
      id: `${fileType}_selected_${Date.now()}`,
      type: fileType,
      fileName: file.name,
      status: "completed",
      progress: 100,
      cloudFile: file,
    };

    if (fileType === "payroll") {
      setPayrollFile(selectedFile);
    } else {
      setCtcFile(selectedFile);
    }

    try {
      console.log("Downloading file from cloud:", file.name);
      console.log("File object:", file);
      console.log("File name type:", typeof file.name);
      console.log("File name value:", file.name);
      
      // Check if the payroll IPC is available
      if (!(window as any).payroll) {
        throw new Error("Payroll IPC not available");
      }
      
      if (!(window as any).payroll.downloadClientFile) {
        throw new Error("downloadClientFile function not available");
      }
      
      // Test the IPC connection
      console.log("Testing payroll IPC...");
      const testResult = await (window as any).payroll.testPython();
      console.log("Python test result:", testResult);
      
      // Validate filename before calling download
      if (!file.name || typeof file.name !== 'string') {
        throw new Error(`Invalid filename: ${file.name}`);
      }
      
      const dl = await (window as any).payroll.downloadClientFile(file.name);
      console.log("Download response:", dl);
      
      if (dl && dl.ok && dl.filePath) {
        selectedFile.filePath = dl.filePath;
        console.log("File downloaded to:", dl.filePath);
        
        // Load sheets using Python
        await loadSheetsFromFile(fileType, dl.filePath);
      } else {
        console.error("Download failed:", dl);
        setErrorMessage(`Failed to download file from cloud: ${dl?.error || 'Unknown error'}. Please try uploading the file locally or check if the file exists in the cloud.`);
        
        // Set the file anyway so user can proceed with manual input
        if (fileType === "payroll") {
          setPayrollFile(selectedFile);
        } else {
          setCtcFile(selectedFile);
        }
      }
    } catch (e) {
      console.error("Failed to download file:", e);
      setErrorMessage(`Failed to download file from cloud: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  // Handle local file upload
  const handleLocalFileUpload = async (fileType: "payroll" | "ctc", file: File) => {
    const selectedFile: UploadedFile = {
      id: `${fileType}_local_${Date.now()}`,
      type: fileType,
      fileName: file.name,
      status: "completed",
      progress: 100,
    };

    try {
      // Create a temporary file path for local files
      const tempPath = URL.createObjectURL(file);
      selectedFile.filePath = tempPath;
      
      if (fileType === "payroll") {
        setPayrollFile(selectedFile);
      } else {
        setCtcFile(selectedFile);
      }

      // For local files, we can't use Python to load sheets directly
      // User will need to type sheet names manually
      setErrorMessage("Local file selected. You'll need to type sheet names manually since Python can't access local files directly.");
      
    } catch (error) {
      console.error("Failed to handle local file:", error);
      setErrorMessage("Failed to process local file");
    }
  };

  // Load sheets from Excel file using Python
  const loadSheetsFromFile = async (fileType: "payroll" | "ctc", filePath: string) => {
    try {
      const sheets = await (window as any).payroll.listSheets({ filePath });
      console.log("Sheets response for", fileType, ":", sheets);
      
      if (sheets.ok && sheets.sheets) {
        if (fileType === "payroll") {
          setPayrollSheets(sheets.sheets);
        } else {
          setCtcSheets(sheets.sheets);
        }
        setErrorMessage("");
      } else {
        setErrorMessage("Python failed to load sheets. You can type sheet names manually.");
      }
    } catch (error) {
      console.warn("Python error loading sheets:", error);
      setErrorMessage("Python failed to load sheets. You can type sheet names manually.");
    }
  };

  // Load columns from Excel file using Python
  const loadColumnsFromFile = async (filePath: string, sheetName: string) => {
    try {
      const cols = await (window as any).payroll.listColumns({ filePath, sheet: sheetName });
      console.log("Columns response:", cols);
      
      if (cols.ok && cols.columns) {
        setPayrollColumns(cols.columns);
        setErrorMessage("");
      } else {
        setErrorMessage("Python failed to load columns. You can type column names manually.");
      }
    } catch (error) {
      console.warn("Python error loading columns:", error);
      setErrorMessage("Python failed to load columns. You can type column names manually.");
    }
  };

  // Handle custom key input changes
  const handleCustomKeyChange = (index: number, value: string) => {
    const newKeys = [...customKeys];
    newKeys[index] = value;
    setCustomKeys(newKeys);
  };

  // Handle manual custom key input
  const handleManualCustomKeyChange = (index: number, value: string) => {
    const newKeys = [...manualCustomKeys];
    newKeys[index] = value;
    setManualCustomKeys(newKeys);
  };

  // Validation functions
  const canLoadColumns = useMemo(() => {
    return !!(payrollFile && selectedPayrollSheet);
  }, [payrollFile, selectedPayrollSheet]);

  const canCreateColumnMap = useMemo(() => {
    const hasValidCustomKeys = customKeys.length === IPE_FIELD_NAMES.length && 
      customKeys.every(key => key.trim() !== "");
    return !!(payrollFile && selectedPayrollSheet && hasValidCustomKeys);
  }, [payrollFile, selectedPayrollSheet, customKeys]);

  const canRunIPETesting = useMemo(() => {
    return !!(payrollFile && ctcFile && selectedPayrollSheet && selectedCtcSheet && canCreateColumnMap);
  }, [payrollFile, ctcFile, selectedPayrollSheet, selectedCtcSheet, canCreateColumnMap]);

  // Create and upload column map to cloud (based on ipe_testing.py logic)
  const createAndUploadColumnMap = async () => {
    if (!canCreateColumnMap) return;

    try {
      setProcessingStatus(prev => ({ ...prev, columnMap: "creating" }));

      // Create column map using the same logic as ipe_testing.py
      const columnMap = Object.fromEntries(
        IPE_FIELD_NAMES.map((fieldName, index) => [fieldName, customKeys[index]])
      );

      // Create the output data structure as in ipe_testing.py
      const outputData = { column_map: columnMap };

      // Upload to cloud as "Execution_Payroll_ColumnMap.json"
      const filename = "Execution_Payroll_ColumnMap.json";
      const content = JSON.stringify(outputData, null, 2);
      
      await (window as any).cloud.directUpload(content, filename, "juggernaut", "Execution - Payroll Column Map", true);
      
      // Also save locally for the Python script to use
      try {
        await (window as any).payroll.writeExecutionColumnMap(columnMap);
      } catch (e) {
        console.warn("Failed to save column map locally:", e);
      }

      setProcessingStatus(prev => ({ ...prev, columnMap: "completed" }));
      setErrorMessage("");
      
      console.log("✅ Column map created and uploaded successfully");
      console.log("Column mapping:", columnMap);
      
    } catch (error) {
      console.error("Failed to create column map:", error);
      setErrorMessage("Failed to create and upload column map");
      setProcessingStatus(prev => ({ ...prev, columnMap: "error" }));
    }
  };

  // Run IPE Testing (based on ipe_testing.py logic)
  const runIPETesting = async () => {
    if (!canRunIPETesting) return;

    try {
      setProcessingStatus(prev => ({ ...prev, ipe_testing: "running" }));

      // First create and upload the column map
      await createAndUploadColumnMap();

      // Prepare input files
      const inputFiles: string[] = [];
      if (payrollFile?.filePath) inputFiles.push(payrollFile.filePath);
      if (ctcFile?.filePath) inputFiles.push(ctcFile.filePath);

      // Run the IPE testing script with the custom keys
      await (window as any).payroll.run("ipe_testing", {
        inputFiles,
        options: {
          pay_registrar_sheet: selectedPayrollSheet,
          ctc_sheet: selectedCtcSheet,
          ipe_custom_keys: customKeys,
        },
      });

      setProcessingStatus(prev => ({ ...prev, ipe_testing: "completed" }));
      setErrorMessage("");
      
    } catch (error) {
      console.error("IPE Testing failed:", error);
      setErrorMessage("IPE Testing execution failed");
      setProcessingStatus(prev => ({ ...prev, ipe_testing: "error" }));
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">IPE Testing</h2>
          <p className="text-gray-400">Select Pay Registrar and CTC Report files, map columns, and run IPE testing.</p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
        )}
      </div>

      {/* Error Display */}
      {errorMessage && (
        <Card className="border-red-500/20 bg-red-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <h4 className="font-medium text-red-300">Error</h4>
                <p className="text-sm text-red-200">{errorMessage}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Selection */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pay Registrar File */}
        <Card className="border-white/10 bg-black/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
              <span>Pay Registrar</span>
              <span className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-300">Required</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label className="text-white">Select File from Cloud</Label>
                      <FileDropdown fileType="payroll_register" onFileSelected={(fileType, file) => handleCloudFileSelection("payroll", file)} />
              
              <div className="text-xs text-gray-400 text-center">OR</div>
              
              <div className="space-y-2">
                <Label className="text-white">Upload Local File (Fallback)</Label>
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleLocalFileUpload("payroll", file);
                    }
                  }}
                  className="border-white/10 bg-black/40 text-white"
                />
              </div>
            </div>

            {payrollFile && (
              <div className="space-y-2">
                <Label className="text-white">Selected File</Label>
                <div className="flex items-center justify-between rounded border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center gap-3">
                    <Link className="h-4 w-4 text-blue-400" />
                <div>
                      <div className="text-sm font-medium text-white">{payrollFile.fileName}</div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setPayrollFile(null);
                      setPayrollSheets([]);
                      setSelectedPayrollSheet("");
                      setPayrollColumns([]);
                    }}
                    className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CTC Report File */}
        <Card className="border-white/10 bg-black/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <span>CTC Report</span>
              <span className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-300">Required</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label className="text-white">Select File from Cloud</Label>
                      <FileDropdown fileType="ctc_report" onFileSelected={(fileType, file) => handleCloudFileSelection("ctc", file)} />
              
              <div className="text-xs text-gray-400 text-center">OR</div>
              
              <div className="space-y-2">
                <Label className="text-white">Upload Local File (Fallback)</Label>
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleLocalFileUpload("ctc", file);
                    }
                  }}
                  className="border-white/10 bg-black/40 text-white"
                />
              </div>
            </div>

            {ctcFile && (
                <div className="space-y-2">
                  <Label className="text-white">Selected File</Label>
                <div className="flex items-center justify-between rounded border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center gap-3">
                          <Link className="h-4 w-4 text-blue-400" />
                        <div>
                      <div className="text-sm font-medium text-white">{ctcFile.fileName}</div>
                        </div>
                      </div>
                        <Button
                          size="sm"
                          variant="ghost"
                    onClick={() => {
                      setCtcFile(null);
                      setCtcSheets([]);
                      setSelectedCtcSheet("");
                    }}
                          className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sheet Selection */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">Select Sheets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Pay Registrar Sheet */}
            <div className="space-y-2">
              <Label className="text-white">Pay Registrar Sheet</Label>
                    <div className="space-y-2">
                      <Select
                  value={selectedPayrollSheet}
                  onValueChange={setSelectedPayrollSheet}
                  disabled={!payrollFile || payrollSheets.length === 0}
                      >
                        <SelectTrigger className="border-white/10 bg-black/40 text-white">
                    <SelectValue placeholder={payrollSheets.length ? "Select sheet..." : "Load sheets first"} />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-black/90 text-white">
                    {payrollSheets.map((sheet) => (
                      <SelectItem key={sheet} value={sheet}>{sheet}</SelectItem>
                    ))}
                        </SelectContent>
                      </Select>
                <div className="text-xs text-gray-400">Or type manually:</div>
                <Input
                  placeholder="Type sheet name manually..."
                  value={manualPayrollSheet}
                  onChange={(e) => setManualPayrollSheet(e.target.value)}
                  className="border-white/10 bg-black/40 text-white"
                />
                {manualPayrollSheet && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => setSelectedPayrollSheet(manualPayrollSheet)}
                  >
                    Use "{manualPayrollSheet}"
                  </Button>
                  )}
                </div>
            </div>

            {/* CTC Report Sheet */}
            <div className="space-y-2">
              <Label className="text-white">CTC Report Sheet</Label>
              <div className="space-y-2">
                <Select
                  value={selectedCtcSheet}
                  onValueChange={setSelectedCtcSheet}
                  disabled={!ctcFile || ctcSheets.length === 0}
                >
                  <SelectTrigger className="border-white/10 bg-black/40 text-white">
                    <SelectValue placeholder={ctcSheets.length ? "Select sheet..." : "Load sheets first"} />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-black/90 text-white">
                    {ctcSheets.map((sheet) => (
                      <SelectItem key={sheet} value={sheet}>{sheet}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-xs text-gray-400">Or type manually:</div>
                <Input
                  placeholder="Type sheet name manually..."
                  value={manualCtcSheet}
                  onChange={(e) => setManualCtcSheet(e.target.value)}
                  className="border-white/10 bg-black/40 text-white"
                />
                {manualCtcSheet && (
                    <Button
                      size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => setSelectedCtcSheet(manualCtcSheet)}
                  >
                    Use "{manualCtcSheet}"
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Load Columns Button */}
      {canLoadColumns && (
        <Card className="border-white/10 bg-black/40">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-white">Load Pay Registrar Columns</h4>
                <p className="text-sm text-gray-400">Get column names from the selected sheet to map to IPE fields</p>
              </div>
              <Button
                onClick={() => payrollFile?.filePath && loadColumnsFromFile(payrollFile.filePath, selectedPayrollSheet)}
                disabled={processingStatus.columns === "loading"}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                {processingStatus.columns === "loading" ? (
                        <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Loading...
                        </>
                      ) : (
                        <>
                    <Download className="mr-2 h-4 w-4" />
                    Load Columns
                        </>
                      )}
                    </Button>
                  </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Keys Input */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">IPE Custom Keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {IPE_FIELD_NAMES.map((fieldName, index) => (
              <div key={fieldName} className="space-y-1">
                <Label className="text-white">{fieldName}</Label>
                <div className="space-y-2">
                  <Select
                    value={customKeys[index] || ""}
                    onValueChange={(value) => handleCustomKeyChange(index, value)}
                    disabled={payrollColumns.length === 0}
                  >
                    <SelectTrigger className="border-white/10 bg-black/40 text-white">
                      <SelectValue placeholder={payrollColumns.length ? "Select column..." : "Load columns first"} />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-black/90 text-white max-h-64">
                      {payrollColumns.map((col) => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-gray-400">Or type manually:</div>
                  <Input
                    placeholder="Type column name manually..."
                    value={manualCustomKeys[index] || ""}
                    onChange={(e) => handleManualCustomKeyChange(index, e.target.value)}
                    className="border-white/10 bg-black/40 text-white"
                  />
                  {manualCustomKeys[index] && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleCustomKeyChange(index, manualCustomKeys[index])}
                    >
                      Use "{manualCustomKeys[index]}"
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Example Keys */}
          <div className="mt-4 p-3 rounded border border-blue-500/20 bg-blue-500/10">
            <h4 className="text-sm font-medium text-blue-300 mb-2">Example Custom Keys:</h4>
            <div className="text-xs text-blue-200 font-mono">
              {EXAMPLE_CUSTOM_KEYS.join(", ")}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Column Map */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">Create Column Map</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Create and upload Execution_Payroll_ColumnMap.json to cloud</p>
              {!canCreateColumnMap && (
                <p className="mt-1 text-xs text-red-400">Please select files, sheets, and provide all custom keys</p>
              )}
                  </div>
                      <Button
              onClick={createAndUploadColumnMap}
              disabled={!canCreateColumnMap || processingStatus.columnMap === "creating"}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {processingStatus.columnMap === "creating" ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Create & Upload Column Map
                </>
              )}
                      </Button>
                    </div>

          {processingStatus.columnMap === "completed" && (
            <div className="rounded border border-green-500/20 bg-green-500/10 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <h4 className="font-medium text-green-300">Column Map Created</h4>
                  <p className="text-sm text-green-200">Execution_Payroll_ColumnMap.json uploaded to juggernaut container</p>
                </div>
              </div>
                </div>
              )}
            </CardContent>
          </Card>

      {/* Run IPE Testing */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Play className="h-5 w-5" />
            Execute IPE Testing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Run IPE Testing using selected files and custom keys</p>
              {!canRunIPETesting && (
                <p className="mt-1 text-xs text-red-400">Please complete all steps above</p>
              )}
            </div>
            <Button
              onClick={runIPETesting}
              disabled={!canRunIPETesting || processingStatus.ipe_testing === "running"}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              {processingStatus.ipe_testing === "running" ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run IPE Testing
                </>
              )}
            </Button>
          </div>

          {processingStatus.ipe_testing === "running" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-blue-300">Processing IPE Tests...</span>
                <span className="text-gray-400">Please wait</span>
              </div>
              <Progress value={66} className="h-2" />
            </div>
          )}

          {processingStatus.ipe_testing === "completed" && (
            <div className="rounded border border-green-500/20 bg-green-500/10 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <h4 className="font-medium text-green-300">IPE Testing Completed</h4>
                  <p className="text-sm text-green-200">All integrity tests have been executed successfully</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
