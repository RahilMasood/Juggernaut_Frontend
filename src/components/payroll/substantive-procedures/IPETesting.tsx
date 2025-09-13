"use client";

import React, { useState } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Label } from "../../ui/label";
import { Progress } from "../../ui/progress";
import { Checkbox } from "../../ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Download,
  Play,
  File,
  FolderOpen,
  Calendar,
  Users,
  DollarSign,
} from "lucide-react";
// Removed usePayrollDocuments import as it's not needed for the new design

interface IPETestingProps {
  onBack?: () => void;
}

interface UploadedFile {
  id: string;
  type: string;
  file: File;
  status: "uploading" | "completed" | "error";
  progress: number;
}

interface ConsolidatedFile {
  id: string;
  name: string;
  type: "single" | "multiple";
  files: UploadedFile[];
  status: "pending" | "processing" | "completed" | "error";
  consolidatedPath?: string;
}

const FILE_TYPES = [
  {
    id: "payroll_register",
    name: "Payroll Register",
    description: "Consolidated or individual monthly payroll files",
    icon: <FileText className="h-4 w-4" />,
    required: true,
    multiple: true,
    formats: [".xlsx", ".xls"],
    help: "Upload either a single consolidated file or multiple monthly files (e.g., April-2024.xlsx, May-2024.xlsx)",
  },
  {
    id: "ctc_master",
    name: "CTC Master (Payroll Master)",
    description: "Employee master data as at period end",
    icon: <Users className="h-4 w-4" />,
    required: true,
    multiple: false,
    formats: [".xlsx", ".xls"],
    help: "Current year CTC master. For initial audit, both current and previous year files are required.",
  },
  {
    id: "ctc_master_py",
    name: "CTC Master (Previous Year)",
    description: "Previous year employee master data",
    icon: <Calendar className="h-4 w-4" />,
    required: false,
    multiple: false,
    formats: [".xlsx", ".xls"],
    help: "Required only for initial audit engagements. Subsequent engagements will use stored previous year data.",
  },
  {
    id: "additions_list",
    name: "Additions Listing",
    description: "List of employees hired during the year",
    icon: <Users className="h-4 w-4" />,
    required: false,
    multiple: false,
    formats: [".xlsx", ".xls"],
    help: "Excel file containing all new hires with date of joining information.",
  },
  {
    id: "deletions_list",
    name: "Deletions Listing",
    description: "List of employees who left during the year",
    icon: <Users className="h-4 w-4" />,
    required: false,
    multiple: false,
    formats: [".xlsx", ".xls"],
    help: "Excel file containing all employees who resigned with date of leaving information.",
  },
  {
    id: "employee_cost_dump",
    name: "Employee Cost Dump",
    description: "Total employee cost data from accounting system",
    icon: <DollarSign className="h-4 w-4" />,
    required: false,
    multiple: false,
    formats: [".xlsx", ".xls", ".csv"],
    help: "Employee cost data from your accounting system. Tally integration available.",
  },
];

export default function IPETesting({ onBack }: IPETestingProps) {
  // Removed usePayrollDocuments usage as it's not needed for the new design
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile[]>>({});
  const [consolidatedFiles, setConsolidatedFiles] = useState<Record<string, ConsolidatedFile>>({});
  const [selectedColumns, setSelectedColumns] = useState<Record<string, string>>({});
  const [processingStatus, setProcessingStatus] = useState<Record<string, string>>({});
  const [showTallyIntegration, setShowTallyIntegration] = useState(false);

  const handleFileUpload = async (fileType: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const newUploadedFiles: UploadedFile[] = fileArray.map((file, index) => ({
      id: `${fileType}_${Date.now()}_${index}`,
      type: fileType,
      file,
      status: "uploading",
      progress: 0,
    }));

    setUploadedFiles(prev => ({
      ...prev,
      [fileType]: [...(prev[fileType] || []), ...newUploadedFiles],
    }));

    // Simulate file upload progress
    for (const uploadedFile of newUploadedFiles) {
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setUploadedFiles(prev => ({
          ...prev,
          [fileType]: prev[fileType]?.map(f =>
            f.id === uploadedFile.id ? { ...f, progress } : f
          ) || [],
        }));
      }

      setUploadedFiles(prev => ({
        ...prev,
        [fileType]: prev[fileType]?.map(f =>
          f.id === uploadedFile.id ? { ...f, status: "completed", progress: 100 } : f
        ) || [],
      }));
    }
  };

  const handleFileRemove = (fileType: string, fileId: string) => {
    setUploadedFiles(prev => ({
      ...prev,
      [fileType]: prev[fileType]?.filter(f => f.id !== fileId) || [],
    }));
  };

  const handleConsolidatePayrollRegister = async () => {
    const payrollFiles = uploadedFiles.payroll_register || [];
    if (payrollFiles.length === 0) return;

    setProcessingStatus(prev => ({ ...prev, payroll_register: "processing" }));

    try {
      // Simulate consolidation process
      await new Promise(resolve => setTimeout(resolve, 2000));

      const consolidatedFile: ConsolidatedFile = {
        id: `consolidated_${Date.now()}`,
        name: "Consolidated Payroll Register",
        type: payrollFiles.length === 1 ? "single" : "multiple",
        files: payrollFiles,
        status: "completed",
        consolidatedPath: "Outputs/consolidated_payroll_register.xlsx",
      };

      setConsolidatedFiles(prev => ({
        ...prev,
        payroll_register: consolidatedFile,
      }));

      setProcessingStatus(prev => ({ ...prev, payroll_register: "completed" }));
    } catch (error) {
      setProcessingStatus(prev => ({ ...prev, payroll_register: "error" }));
    }
  };

  const handleColumnMapping = (fileType: string, column: string) => {
    setSelectedColumns(prev => ({
      ...prev,
      [fileType]: column,
    }));
  };

  const canRunIPETesting = () => {
    const hasRequiredFiles = FILE_TYPES.filter(ft => ft.required).every(ft => 
      uploadedFiles[ft.id] && uploadedFiles[ft.id].length > 0
    );
    
    const hasConsolidatedPayroll = consolidatedFiles.payroll_register?.status === "completed";
    
    return hasRequiredFiles && hasConsolidatedPayroll;
  };

  const runIPETesting = async () => {
    if (!canRunIPETesting()) return;

    setProcessingStatus(prev => ({ ...prev, ipe_testing: "running" }));

    try {
      // Simulate IPE testing process
      await new Promise(resolve => setTimeout(resolve, 3000));

      setProcessingStatus(prev => ({ ...prev, ipe_testing: "completed" }));
    } catch (error) {
      setProcessingStatus(prev => ({ ...prev, ipe_testing: "error" }));
    }
  };

  const getFileTypeConfig = (fileTypeId: string) => {
    return FILE_TYPES.find(ft => ft.id === fileTypeId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "processing":
      case "running":
        return <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">IPE Testing</h2>
          <p className="text-gray-400">
            Upload and process payroll files for integrity testing
          </p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
        )}
      </div>

      {/* File Upload Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {FILE_TYPES.map((fileType) => (
          <Card key={fileType.id} className="border-white/10 bg-black/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                {fileType.icon}
                <div>
                  <div className="flex items-center gap-2">
                    <span>{fileType.name}</span>
                    {fileType.required && (
                      <span className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-300">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-normal text-gray-400">
                    {fileType.description}
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Help Text */}
              <div className="rounded border border-blue-500/20 bg-blue-900/10 p-3 text-sm text-blue-200">
                {fileType.help}
              </div>

              {/* File Upload */}
              <div className="space-y-3">
                <Label className="text-white">Upload Files</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    multiple={fileType.multiple}
                    accept={fileType.formats.join(",")}
                    onChange={(e) => handleFileUpload(fileType.id, e.target.files)}
                    className="border-white/10 bg-black/40 text-white"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById(`file-${fileType.id}`)?.click()}
                    className="border-white/10"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Uploaded Files */}
              {uploadedFiles[fileType.id] && uploadedFiles[fileType.id].length > 0 && (
                <div className="space-y-2">
                  <Label className="text-white">Uploaded Files</Label>
                  {uploadedFiles[fileType.id].map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between rounded border border-white/10 bg-white/5 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <File className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-white">
                            {file.file.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {(file.file.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.status === "uploading" && (
                          <div className="w-16">
                            <Progress value={file.progress} className="h-1" />
                          </div>
                        )}
                        {file.status === "completed" && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleFileRemove(fileType.id, file.id)}
                          className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Special handling for Payroll Register */}
              {fileType.id === "payroll_register" && 
               uploadedFiles.payroll_register && 
               uploadedFiles.payroll_register.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Consolidation</Label>
                    <Button
                      size="sm"
                      onClick={handleConsolidatePayrollRegister}
                      disabled={processingStatus.payroll_register === "processing"}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {processingStatus.payroll_register === "processing" ? (
                        <>
                          <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <FolderOpen className="mr-2 h-3 w-3" />
                          Consolidate Files
                        </>
                      )}
                    </Button>
                  </div>

                  {consolidatedFiles.payroll_register && (
                    <div className="rounded border border-green-500/20 bg-green-500/10 p-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-green-300">
                          {consolidatedFiles.payroll_register.name}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-green-200">
                        Type: {consolidatedFiles.payroll_register.type}
                      </div>
                      <div className="mt-1 text-xs text-green-200">
                        Files: {consolidatedFiles.payroll_register.files.length}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Column Mapping for Additions/Deletions */}
              {(fileType.id === "additions_list" || fileType.id === "deletions_list") && 
               uploadedFiles[fileType.id] && 
               uploadedFiles[fileType.id].length > 0 && (
                <div className="space-y-3">
                  <Label className="text-white">
                    {fileType.id === "additions_list" ? "Date of Joining Column" : "Date of Leaving Column"}
                  </Label>
                  <Select
                    value={selectedColumns[fileType.id] || ""}
                    onValueChange={(value) => handleColumnMapping(fileType.id, value)}
                  >
                    <SelectTrigger className="border-white/10 bg-black/40 text-white">
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-black/90 text-white">
                      <SelectItem value="date_of_joining">Date of Joining</SelectItem>
                      <SelectItem value="joining_date">Joining Date</SelectItem>
                      <SelectItem value="doj">DOJ</SelectItem>
                      <SelectItem value="start_date">Start Date</SelectItem>
                      <SelectItem value="date_of_leaving">Date of Leaving</SelectItem>
                      <SelectItem value="leaving_date">Leaving Date</SelectItem>
                      <SelectItem value="dol">DOL</SelectItem>
                      <SelectItem value="end_date">End Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Tally Integration for Employee Cost Dump */}
              {fileType.id === "employee_cost_dump" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="tally-integration"
                      checked={showTallyIntegration}
                      onCheckedChange={setShowTallyIntegration}
                    />
                    <Label htmlFor="tally-integration" className="text-white">
                      Import from Tally
                    </Label>
                  </div>
                  {showTallyIntegration && (
                    <div className="rounded border border-yellow-500/20 bg-yellow-900/10 p-3 text-sm text-yellow-200">
                      <p className="font-medium">Tally Integration</p>
                      <p className="mt-1">
                        All ledgers mapped as 'Employee Benefit Expenses' in FS Sub Line will be extracted automatically.
                      </p>
                      <Button
                        size="sm"
                        className="mt-2 bg-yellow-600 hover:bg-yellow-700"
                      >
                        <Download className="mr-2 h-3 w-3" />
                        Import from Tally
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Execution Section */}
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
              <p className="text-sm text-gray-400">
                Run automated integrity tests on uploaded payroll data
              </p>
              {!canRunIPETesting() && (
                <p className="mt-1 text-xs text-red-400">
                  Please upload all required files and consolidate payroll register
                </p>
              )}
            </div>
            <Button
              onClick={runIPETesting}
              disabled={!canRunIPETesting() || processingStatus.ipe_testing === "running"}
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

          {/* Progress Indicator */}
          {processingStatus.ipe_testing === "running" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-blue-300">Processing IPE Tests...</span>
                <span className="text-gray-400">Please wait</span>
              </div>
              <Progress value={66} className="h-2" />
            </div>
          )}

          {/* Results */}
          {processingStatus.ipe_testing === "completed" && (
            <div className="rounded border border-green-500/20 bg-green-500/10 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <h4 className="font-medium text-green-300">IPE Testing Completed</h4>
                  <p className="text-sm text-green-200">
                    All integrity tests have been executed successfully
                  </p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" className="border-green-500/30 text-green-300">
                  <Download className="mr-2 h-3 w-3" />
                  Download Results
                </Button>
                <Button size="sm" variant="outline" className="border-green-500/30 text-green-300">
                  <FileText className="mr-2 h-3 w-3" />
                  View Report
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
