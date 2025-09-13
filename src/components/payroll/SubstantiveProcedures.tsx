"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import { Label } from "../ui/label";
import { Progress } from "../ui/progress";
import {
  Play,
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  File,
  X,
  Copy,
  ExternalLink,
} from "lucide-react";
import {
  usePayrollDocuments,
  type PayrollDocument,
} from "./PayrollDocumentsContext";

interface SubstantiveProceduresProps {
  onBack?: () => void;
}

type Module = {
  id: string;
  name: string;
  description: string;
  requiredFiles: string[];
  optionalFiles?: string[];
  status: "pending" | "running" | "completed" | "error";
  questions?: QuestionConfig[];
};

type QuestionConfig = {
  id: string;
  question: string;
  type: "radio" | "text" | "multi-select";
  options?: string[];
  required?: boolean;
};

type SelectedFile = {
  documentId: string;
  document: PayrollDocument;
};

const PAYROLL_MODULES: Module[] = [
  {
    id: "ipe_testing",
    name: "IPE Testing",
    description: "Integrity of Processing Environment Testing",
    requiredFiles: ["Pay Registrar", "CTC Report"],
    status: "pending",
    questions: [
      {
        id: "pay_registrar_sheet",
        question: "Pay Registrar Sheet Name",
        type: "text",
        required: true,
      },
      {
        id: "ctc_sheet",
        question: "CTC Report Sheet Name",
        type: "text",
        required: true,
      },
    ],
  },
  {
    id: "exception_testing",
    name: "Exception Testing",
    description: "Identify and analyze payroll exceptions",
    requiredFiles: ["Pay Registrar", "CTC Report"],
    status: "pending",
    questions: [
      {
        id: "pay_registrar_sheet",
        question: "Pay Registrar Sheet Name",
        type: "text",
        required: true,
      },
      {
        id: "ctc_sheet",
        question: "CTC Report Sheet Name",
        type: "text",
        required: true,
      },
    ],
  },
  {
    id: "headcount_reconciliation",
    name: "Headcount Reconciliation",
    description: "Reconcile headcount between periods",
    requiredFiles: [
      "Pay Registrar",
      "Additions List",
      "Deletions List",
      "CTC Report",
    ],
    status: "pending",
    questions: [
      {
        id: "pay_registrar_sheet",
        question: "Pay Registrar Sheet Name",
        type: "text",
        required: true,
      },
      {
        id: "ctc_sheet",
        question: "CTC Report Sheet Name",
        type: "text",
        required: true,
      },
      {
        id: "add_list_sheet",
        question: "Additions List Sheet Name",
        type: "text",
        required: false,
      },
      {
        id: "del_list_sheet",
        question: "Deletions List Sheet Name",
        type: "text",
        required: false,
      },
      {
        id: "opening_headcount",
        question: "Opening Headcount (April)",
        type: "text",
        required: true,
      },
      {
        id: "date_of_joining_column",
        question: "Date of Joining Column Name",
        type: "text",
        required: false,
      },
      {
        id: "date_of_leaving_column",
        question: "Date of Leaving Column Name",
        type: "text",
        required: false,
      },
    ],
  },
  {
    id: "mom_analysis",
    name: "Month-on-Month Analysis",
    description: "Analyze month-over-month payroll changes",
    requiredFiles: ["Pay Registrar", "CTC Report"],
    status: "pending",
    questions: [
      {
        id: "pay_registrar_sheet",
        question: "Pay Registrar Sheet Name",
        type: "text",
        required: true,
      },
      {
        id: "ctc_sheet",
        question: "CTC Report Sheet Name",
        type: "text",
        required: true,
      },
      {
        id: "mom_increment_month",
        question: "Month for Increment Analysis (e.g., Nov-24)",
        type: "text",
        required: true,
      },
      {
        id: "mom_display_cols",
        question: "Display Columns (comma-separated)",
        type: "text",
        required: false,
      },
      {
        id: "mom_calc_cols",
        question: "Calculation Columns (comma-separated)",
        type: "text",
        required: false,
      },
    ],
  },
  {
    id: "increment_analysis",
    name: "Increment Analysis",
    description: "Analyze salary increments year-over-year",
    requiredFiles: ["CTC Report", "CTC Report Previous Year"],
    status: "pending",
    questions: [
      {
        id: "ctc_sheet",
        question: "CTC Report Sheet Name",
        type: "text",
        required: true,
      },
      {
        id: "ctc_py_sheet",
        question: "CTC Previous Year Sheet Name",
        type: "text",
        required: true,
      },
      {
        id: "increment_columns",
        question: "Display Columns (comma-separated)",
        type: "text",
        required: false,
      },
      {
        id: "increment_cols_to_sum",
        question: "Columns to Sum (comma-separated)",
        type: "text",
        required: false,
      },
      {
        id: "increment_reconciliation_input",
        question: "Reconciliation Input Value",
        type: "text",
        required: false,
      },
    ],
  },
  {
    id: "pf_sal_analytics",
    name: "PF & Salary Analytics",
    description: "Provident Fund and Salary analytical procedures",
    requiredFiles: ["Combined JSON"],
    status: "pending",
    questions: [
      {
        id: "risk_assessment",
        question: "Assessment of risk",
        type: "radio",
        options: ["Lower", "Higher", "Significant"],
        required: true,
      },
      {
        id: "control_reliance",
        question: "Control reliance approach",
        type: "radio",
        options: ["Relying on controls", "Not relying on controls"],
        required: true,
      },
      {
        id: "percentage",
        question: "Percentage for analytical procedure",
        type: "text",
        required: true,
      },
      {
        id: "performance_materiality",
        question: "Performance Materiality Amount",
        type: "text",
        required: true,
      },
      {
        id: "weighted_avg_headcount_py",
        question: "Weighted Average Headcount (Previous Year)",
        type: "text",
        required: true,
      },
      {
        id: "i_input",
        question: "I Input Values (comma-separated numbers)",
        type: "text",
        required: false,
      },
      {
        id: "ii_input",
        question: "II Input Values (comma-separated numbers)",
        type: "text",
        required: false,
      },
    ],
  },
  {
    id: "actuary_testing",
    name: "Actuary Testing",
    description: "Test actuarial calculations and assumptions",
    requiredFiles: ["Actuary Testing File", "CTC Report"],
    status: "pending",
    questions: [
      {
        id: "actuary_sheet",
        question: "Actuary File Sheet Name",
        type: "text",
        required: true,
      },
      {
        id: "ctc_sheet",
        question: "CTC Report Sheet Name",
        type: "text",
        required: true,
      },
    ],
  },
  {
    id: "accuracy_check",
    name: "Accuracy Check",
    description: "Cross-check accuracy between CTC and Actuary data",
    requiredFiles: ["Actuary Testing File", "CTC Report"],
    status: "pending",
    questions: [
      {
        id: "actuary_sheet",
        question: "Actuary File Sheet Name",
        type: "text",
        required: true,
      },
      {
        id: "ctc_sheet",
        question: "CTC Report Sheet Name",
        type: "text",
        required: true,
      },
    ],
  },
];

export default function SubstantiveProcedures({
  onBack,
}: SubstantiveProceduresProps) {
  const { documents } = usePayrollDocuments();
  const [modules, setModules] = useState<Module[]>(PAYROLL_MODULES);
  const [selectedModule, setSelectedModule] = useState<string>(
    PAYROLL_MODULES[0]?.id || "",
  );
  const [selectedFiles, setSelectedFiles] = useState<
    Record<string, SelectedFile[]>
  >({});
  const [moduleAnswers, setModuleAnswers] = useState<
    Record<string, Record<string, string>>
  >({});

  type ProgressInfo = {
    runId?: string;
    progress: number;
    status: string;
    message?: string;
    error?: string;
    stdout?: string;
    stderr?: string;
  };

  const [progress, setProgress] = useState<ProgressInfo | null>(null);
  const [results, setResults] = useState<
    Array<{
      id: string;
      label: string;
      createdAt: number;
      filePath: string;
      size: number;
      mimeType?: string;
    }>
  >([]);

  const [showDebugInfo, setShowDebugInfo] = useState<boolean>(false);
  const [errorLogModal, setErrorLogModal] = useState<{
    isOpen: boolean;
    title: string;
    error: string;
    stdout: string;
    stderr: string;
    config?: Record<string, string | number | string[] | number[]>;
  }>({
    isOpen: false,
    title: "",
    error: "",
    stdout: "",
    stderr: "",
  });

  useEffect(() => {
    // Listen for progress updates
    const off = window.payroll?.onProgress?.((p) => {
      setProgress(p as ProgressInfo);
      if (p.status === "success" || p.status === "error") {
        // Show error popup if execution failed
        if (p.status === "error") {
          const module = modules.find((m) => m.id === selectedModule);
          const progressInfo = p as ProgressInfo;
          setErrorLogModal({
            isOpen: true,
            title: `${module?.name || selectedModule} - Execution Failed`,
            error: progressInfo.error || "Unknown error occurred",
            stdout: progressInfo.stdout || "",
            stderr: progressInfo.stderr || "",
          });
        }

        // Update module status
        setModules((prev) =>
          prev.map((m) =>
            m.id === selectedModule
              ? { ...m, status: p.status === "success" ? "completed" : "error" }
              : m,
          ),
        );
        // Refresh results
        loadResults();
      }
    });

    loadResults();
    return () => off?.();
  }, [selectedModule]);

  const loadResults = async () => {
    try {
      const resultsList = await window.payroll.listResults();
      setResults(resultsList);
    } catch (error) {
      console.error("Failed to load results:", error);
    }
  };

  const handleFileSelection = (fileType: string, document: PayrollDocument) => {
    setSelectedFiles((prev) => {
      const currentFiles = prev[fileType] || [];
      const isAlreadySelected = currentFiles.some(
        (f) => f.documentId === document.id,
      );

      if (isAlreadySelected) {
        return prev; // Already selected, do nothing
      }

      return {
        ...prev,
        [fileType]: [...currentFiles, { documentId: document.id, document }],
      };
    });
  };

  const handleFileRemoval = (fileType: string, documentId: string) => {
    setSelectedFiles((prev) => ({
      ...prev,
      [fileType]: (prev[fileType] || []).filter(
        (f) => f.documentId !== documentId,
      ),
    }));
  };

  const getAvailableDocuments = (fileType: string) => {
    const selectedIds = new Set(
      (selectedFiles[fileType] || []).map((f) => f.documentId),
    );
    return documents.filter((doc) => !selectedIds.has(doc.id));
  };

  const handleQuestionAnswer = (
    moduleId: string,
    questionId: string,
    answer: string,
  ) => {
    setModuleAnswers((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [questionId]: answer,
      },
    }));
  };

  const canRunModule = (module: Module): boolean => {
    const hasRequiredFiles = module.requiredFiles.every(
      (fileType) =>
        selectedFiles[fileType] && selectedFiles[fileType].length > 0,
    );

    const hasRequiredAnswers =
      !module.questions ||
      module.questions
        .filter((q) => q.required)
        .every((q) => moduleAnswers[module.id]?.[q.id]);

    return hasRequiredFiles && hasRequiredAnswers;
  };

  const runModule = async (moduleId: string) => {
    const module = modules.find((m) => m.id === moduleId);
    if (!module || !canRunModule(module)) return;

    setModules((prev) =>
      prev.map((m) => (m.id === moduleId ? { ...m, status: "running" } : m)),
    );

    setProgress({ progress: 0, status: "running" });

    try {
      // Collect all selected file paths and map them to expected parameter names
      const fileMapping: Record<string, string> = {};

      for (const fileType of module.requiredFiles) {
        const files = selectedFiles[fileType] || [];
        if (files.length > 0) {
          // Map file types to parameter names expected by Python script
          switch (fileType) {
            case "Pay Registrar":
              fileMapping.pay_registrar = files[0].document.filePath;
              break;
            case "CTC Report":
              fileMapping.ctc_file = files[0].document.filePath;
              break;
            case "CTC Report Previous Year":
              fileMapping.ctc_py_file = files[0].document.filePath;
              break;
            case "Additions List":
              fileMapping.add_list = files[0].document.filePath;
              break;
            case "Deletions List":
              fileMapping.del_list = files[0].document.filePath;
              break;
            case "Actuary Testing File":
              fileMapping.actuary_file = files[0].document.filePath;
              break;
            case "Combined JSON":
              fileMapping.combined_json_path = files[0].document.filePath;
              break;
          }
        }
      }

      // Prepare configuration with answers and file paths
      const config: Record<string, string | number | string[] | number[]> = {
        ...fileMapping,
        output_directory: "Outputs", // Default output directory
      };

      // Add answers from the configuration form
      if (module.questions) {
        const answers = moduleAnswers[moduleId] || {};
        for (const [key, value] of Object.entries(answers)) {
          // Process specific field types
          if (
            key.includes("_cols") ||
            key.includes("_columns") ||
            key.includes("_input")
          ) {
            // Convert comma-separated strings to arrays for column lists
            if (value && typeof value === "string") {
              config[key] = value
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s.length > 0);
            }
          } else if (
            key === "opening_headcount" ||
            key === "percentage" ||
            key === "performance_materiality" ||
            key === "weighted_avg_headcount_py" ||
            key === "increment_reconciliation_input"
          ) {
            // Convert numeric strings to numbers
            if (value) {
              config[key] =
                key === "weighted_avg_headcount_py"
                  ? parseFloat(value)
                  : parseInt(value, 10);
            }
          } else {
            // Keep as string for other fields
            config[key] = value;
          }
        }
      }

      // Set default values for missing optional parameters
      if (!config.add_list_sheet) config.add_list_sheet = "New joiners";
      if (!config.del_list_sheet) config.del_list_sheet = "Resignees";
      if (!config.date_of_joining_column)
        config.date_of_joining_column = "Date of joining";
      if (!config.date_of_leaving_column)
        config.date_of_leaving_column = "Leaving date";
      if (!config.mom_display_cols)
        config.mom_display_cols = ["Pernr", "Employee Name", "DOJ", "DOL"];
      if (!config.mom_calc_cols) config.mom_calc_cols = ["BASIC", "H R A"];
      if (!config.increment_columns)
        config.increment_columns = [
          "Emp. No",
          "Emp. Name",
          "DOJ",
          "Department",
        ];
      if (!config.increment_cols_to_sum)
        config.increment_cols_to_sum = ["Monthly CTC"];
      if (!config.i_input) config.i_input = [24, 62];
      if (!config.ii_input) config.ii_input = [25];
      if (!config.exclude_input) config.exclude_input = [];

      const result = await window.payroll.run(moduleId, {
        inputFiles: Object.values(fileMapping),
        options: config,
      });

      if (!result.ok) {
        setProgress({
          progress: 100,
          status: "error",
          error: result.error || "Failed to run module",
        });
        setModules((prev) =>
          prev.map((m) => (m.id === moduleId ? { ...m, status: "error" } : m)),
        );
      }
    } catch (error) {
      console.error("Failed to run module:", error);
      setProgress({
        progress: 100,
        status: "error",
        error: "Failed to run module",
      });
      setModules((prev) =>
        prev.map((m) => (m.id === moduleId ? { ...m, status: "error" } : m)),
      );
    }
  };

  const downloadResult = async (resultId: string) => {
    try {
      await window.payroll.downloadResult(resultId);
    } catch (error) {
      console.error("Failed to download result:", error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const copyAllLogs = () => {
    const allLogs = `
=== ERROR DETAILS ===
${errorLogModal.error}

=== PYTHON OUTPUT (STDOUT) ===
${errorLogModal.stdout}

=== PYTHON ERRORS (STDERR) ===
${errorLogModal.stderr}

=== GENERATED AT ===
${new Date().toISOString()}
    `.trim();

    copyToClipboard(allLogs);
  };

  const testPythonInstallation = async () => {
    try {
      const payrollApi = window.payroll as typeof window.payroll & {
        testPython: () => Promise<{
          ok: boolean;
          executable?: string;
          error?: string;
          message: string;
        }>;
      };
      const result = await payrollApi.testPython();
      if (result.ok) {
        alert(`✅ ${result.message}`);
      } else {
        alert(`❌ ${result.message}\n\nError: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ Failed to test Python: ${error}`);
    }
  };

  const getStatusIcon = (status: Module["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "running":
        return (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        );
      default:
        return (
          <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
        );
    }
  };

  const selectedModuleData = modules.find((m) => m.id === selectedModule);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Substantive Procedures
          </h2>
          <p className="text-gray-400">
            Execute payroll analysis modules with uploaded files
          </p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
        )}
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid h-[calc(100vh-200px)] grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column - Available Modules (35% width) */}
        <div className="space-y-4 lg:col-span-4">
          <Card className="h-full border-white/10 bg-black/40">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-white">
                <span>Available Modules</span>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-green-500/20 px-2 py-1 text-xs text-green-300">
                    {modules.filter((m) => m.status === "completed").length}{" "}
                    Completed
                  </span>
                  <span className="rounded bg-gray-500/20 px-2 py-1 text-xs text-gray-300">
                    {modules.length} Total
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[calc(100vh-300px)] space-y-3 overflow-y-auto">
              {modules.map((module) => (
                <div
                  key={module.id}
                  className={`cursor-pointer rounded-lg border p-4 transition-all duration-200 ${
                    selectedModule === module.id
                      ? "border-blue-500/50 bg-blue-500/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                  onClick={() => setSelectedModule(module.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-1 items-center gap-3">
                      <div className="relative">
                        {getStatusIcon(module.status)}
                        {module.status === "running" && (
                          <div className="absolute -inset-1 animate-pulse rounded-full border-2 border-blue-500/30" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">
                          {module.name}
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          {module.description}
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Files: {module.requiredFiles.length} required
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`rounded px-2 py-1 text-xs font-medium ${
                          module.status === "completed"
                            ? "bg-green-500/20 text-green-300"
                            : module.status === "running"
                              ? "bg-blue-500/20 text-blue-300"
                              : module.status === "error"
                                ? "bg-red-500/20 text-red-300"
                                : "bg-gray-500/20 text-gray-300"
                        }`}
                      >
                        {module.status}
                      </span>
                      {module.status === "error" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (progress && progress.status === "error") {
                              setErrorLogModal({
                                isOpen: true,
                                title: `${module.name} - Previous Error`,
                                error:
                                  progress.error || "Previous execution failed",
                                stdout: progress.stdout || "",
                                stderr: progress.stderr || "",
                              });
                            }
                          }}
                          className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                          title="Show error details"
                        >
                          <AlertCircle className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar for running modules */}
                  {module.status === "running" &&
                    progress &&
                    selectedModule === module.id && (
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-blue-300">
                            Progress: {progress.progress}%
                          </span>
                          <span className="text-gray-400">
                            ({progress.status})
                          </span>
                        </div>
                        <Progress
                          value={progress.progress}
                          className="h-1 bg-black/40"
                        />
                      </div>
                    )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Module Configuration (65% width) */}
        <div className="space-y-4 lg:col-span-8">
          <Card className="h-full border-white/10 bg-black/40">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-white">
                <span>
                  {selectedModule && selectedModuleData
                    ? `Configure ${selectedModuleData.name}`
                    : "Select a Module"}
                </span>
                {selectedModule && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      Results: {results.length}
                    </span>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[calc(100vh-300px)] overflow-y-auto">
              {selectedModule && selectedModuleData ? (
                <div className="space-y-6">
                  {/* Module Status and Overview */}
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="relative">
                        {getStatusIcon(selectedModuleData.status)}
                        {selectedModuleData.status === "running" && (
                          <div className="absolute -inset-1 animate-pulse rounded-full border-2 border-blue-500/30" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {selectedModuleData.name}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {selectedModuleData.description}
                        </p>
                      </div>
                      <span
                        className={`ml-auto rounded px-3 py-1 text-sm font-medium ${
                          selectedModuleData.status === "completed"
                            ? "bg-green-500/20 text-green-300"
                            : selectedModuleData.status === "running"
                              ? "bg-blue-500/20 text-blue-300"
                              : selectedModuleData.status === "error"
                                ? "bg-red-500/20 text-red-300"
                                : "bg-gray-500/20 text-gray-300"
                        }`}
                      >
                        {selectedModuleData.status}
                      </span>
                    </div>

                    {/* Progress indicator for running modules */}
                    {selectedModuleData.status === "running" &&
                      progress &&
                      selectedModule === selectedModuleData.id && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-blue-300">
                              Progress: {progress.progress}%
                            </span>
                            <span className="text-gray-400">
                              ({progress.status})
                            </span>
                          </div>
                          <Progress
                            value={progress.progress}
                            className="bg-black/40"
                          />
                          {progress.message && (
                            <div className="text-xs text-gray-400">
                              {progress.message}
                            </div>
                          )}
                        </div>
                      )}
                  </div>

                  {/* Required Files Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-white">Required Files</h4>
                      <span className="text-xs text-gray-400">
                        {selectedModuleData.requiredFiles.length} files required
                      </span>
                    </div>
                    <div className="mb-3 text-xs text-gray-400">
                      Select from documents uploaded in the main payroll
                      section.
                      {documents.length === 0 && (
                        <span className="text-amber-400">
                          {" "}
                          No documents uploaded yet - please upload documents
                          first.
                        </span>
                      )}
                      <br />
                      <span className="text-green-400">
                        ℹ Column mapping is automatically handled - no need to
                        upload column_map.json
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {selectedModuleData.requiredFiles.map((fileType) => (
                        <div
                          key={fileType}
                          className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-3"
                        >
                          <div className="flex items-center justify-between">
                            <Label className="font-medium text-white">
                              {fileType}
                            </Label>
                            <span className="text-xs text-gray-400">
                              Required
                            </span>
                          </div>
                          {selectedFiles[fileType] &&
                            selectedFiles[fileType].length > 0 && (
                              <div className="space-y-2">
                                <div className="text-xs font-medium text-green-400">
                                  Selected files:
                                </div>
                                {selectedFiles[fileType].map((selectedFile) => (
                                  <div
                                    key={selectedFile.documentId}
                                    className="flex items-center justify-between rounded border border-green-500/20 bg-green-500/10 p-2"
                                  >
                                    <div className="flex items-center gap-2">
                                      <File className="h-4 w-4 text-green-400" />
                                      <span className="text-sm text-white">
                                        {selectedFile.document.fileName}
                                      </span>
                                      <span className="text-xs text-gray-400">
                                        (
                                        {selectedFile.document.extension
                                          .replace(".", "")
                                          .toUpperCase()}
                                        )
                                      </span>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        handleFileRemoval(
                                          fileType,
                                          selectedFile.documentId,
                                        )
                                      }
                                      className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          {getAvailableDocuments(fileType).length > 0 ? (
                            <Select
                              onValueChange={(documentId) => {
                                const document = documents.find(
                                  (d) => d.id === documentId,
                                );
                                if (document) {
                                  handleFileSelection(fileType, document);
                                }
                              }}
                            >
                              <SelectTrigger className="border-white/10 bg-black/40 text-white">
                                <SelectValue
                                  placeholder={`Select ${fileType} file...`}
                                />
                              </SelectTrigger>
                              <SelectContent className="border-white/10 bg-black/90 text-white">
                                {getAvailableDocuments(fileType).map((doc) => (
                                  <SelectItem key={doc.id} value={doc.id}>
                                    <div className="flex items-center gap-2">
                                      <File className="h-4 w-4" />
                                      <span>{doc.fileName}</span>
                                      <span className="text-xs text-gray-400">
                                        (
                                        {doc.extension
                                          .replace(".", "")
                                          .toUpperCase()}
                                        )
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="rounded border border-white/10 bg-black/20 p-2 text-xs text-gray-500">
                              {documents.length === 0
                                ? "No documents uploaded. Please upload documents first."
                                : "All available documents are already selected."}
                            </div>
                          )}
                          <div className="mt-2 flex items-center justify-between text-xs">
                            {selectedFiles[fileType] &&
                            selectedFiles[fileType].length > 0 ? (
                              <span className="flex items-center gap-1 text-green-400">
                                <CheckCircle className="h-3 w-3" />
                                {selectedFiles[fileType].length} file(s)
                                selected
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-red-400">
                                <AlertCircle className="h-3 w-3" />
                                No files selected for {fileType}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Configuration Questions */}
                  {selectedModuleData.questions && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-white">
                          Configuration Parameters
                        </h4>
                        <span className="text-xs text-gray-400">
                          {
                            selectedModuleData.questions.filter(
                              (q) => q.required,
                            ).length
                          }{" "}
                          required fields
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {selectedModuleData.questions.map((question) => (
                          <div
                            key={question.id}
                            className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-3"
                          >
                            <Label className="font-medium text-white">
                              {question.question}
                              {question.required && (
                                <span className="ml-1 text-red-400">*</span>
                              )}
                            </Label>
                            {question.type === "radio" && question.options ? (
                              <Select
                                value={
                                  moduleAnswers[selectedModuleData.id]?.[
                                    question.id
                                  ] || ""
                                }
                                onValueChange={(value) =>
                                  handleQuestionAnswer(
                                    selectedModuleData.id,
                                    question.id,
                                    value,
                                  )
                                }
                              >
                                <SelectTrigger className="border-white/10 bg-black/40 text-white">
                                  <SelectValue placeholder="Select an option" />
                                </SelectTrigger>
                                <SelectContent className="border-white/10 bg-black/90 text-white">
                                  {question.options.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                type="text"
                                value={
                                  moduleAnswers[selectedModuleData.id]?.[
                                    question.id
                                  ] || ""
                                }
                                onChange={(e) =>
                                  handleQuestionAnswer(
                                    selectedModuleData.id,
                                    question.id,
                                    e.target.value,
                                  )
                                }
                                className="border-white/10 bg-black/40 text-white"
                                placeholder="Enter value..."
                              />
                            )}
                            {question.required &&
                              !moduleAnswers[selectedModuleData.id]?.[
                                question.id
                              ] && (
                                <div className="flex items-center gap-1 text-xs text-red-400">
                                  <AlertCircle className="h-3 w-3" />
                                  This field is required
                                </div>
                              )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Execution Section */}
                  <div className="border-t border-white/10 pt-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium text-white">
                          Execute Module
                        </h4>
                        <p className="text-xs text-gray-400">
                          All required files and parameters must be configured
                          before running
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {canRunModule(selectedModuleData) ? (
                          <span className="flex items-center gap-1 text-xs text-green-400">
                            <CheckCircle className="h-3 w-3" />
                            Ready to run
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-red-400">
                            <AlertCircle className="h-3 w-3" />
                            Configuration incomplete
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Execution Progress */}
                    {progress &&
                      selectedModule === selectedModuleData.id &&
                      progress.status === "running" && (
                        <div className="mb-4 space-y-3 rounded-lg border border-blue-500/20 bg-blue-900/10 p-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-blue-300">
                              Executing: {progress.progress}%
                            </span>
                            <span className="text-gray-400">
                              ({progress.status})
                            </span>
                          </div>
                          <Progress
                            value={progress.progress}
                            className="bg-black/40"
                          />
                          {progress.message && (
                            <div className="text-xs text-blue-200">
                              {progress.message}
                            </div>
                          )}

                          {/* Debug information toggle */}
                          {(progress.stdout || progress.stderr) && (
                            <div className="space-y-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setShowDebugInfo(!showDebugInfo)}
                                className="h-6 px-2 text-xs text-blue-400 hover:text-blue-300"
                              >
                                {showDebugInfo ? "Hide" : "Show"} Debug Info
                              </Button>
                              {showDebugInfo && (
                                <div className="space-y-2 rounded border border-gray-600 bg-gray-800/50 p-3">
                                  {progress.stdout && (
                                    <div>
                                      <div className="mb-1 text-xs font-medium text-green-300">
                                        Python Output (stdout):
                                      </div>
                                      <pre className="max-h-32 overflow-y-auto rounded bg-gray-900 p-2 text-xs text-green-200">
                                        {progress.stdout}
                                      </pre>
                                    </div>
                                  )}
                                  {progress.stderr && (
                                    <div>
                                      <div className="mb-1 text-xs font-medium text-red-300">
                                        Python Errors (stderr):
                                      </div>
                                      <pre className="max-h-32 overflow-y-auto rounded bg-gray-900 p-2 text-xs text-red-200">
                                        {progress.stderr}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                    {/* Run Button */}
                    <div className="flex justify-end">
                      <Button
                        onClick={() => runModule(selectedModuleData.id)}
                        disabled={
                          !canRunModule(selectedModuleData) ||
                          selectedModuleData.status === "running"
                        }
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        size="lg"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        {selectedModuleData.status === "running"
                          ? "Running..."
                          : "Run Module"}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-64 flex-col items-center justify-center text-center">
                  <div className="mb-4 text-gray-400">
                    <FileText className="mx-auto mb-2 h-12 w-12" />
                    <h3 className="mb-1 text-lg font-medium text-white">
                      Select a Module
                    </h3>
                    <p className="text-sm">
                      Choose a module from the left panel to configure and run
                      it
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="border-white/10 bg-black/40">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-white">
                <span>Recent Results</span>
                <span className="rounded bg-white/10 px-2 py-1 text-xs text-white/80">
                  {results.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {results.length === 0 ? (
                  <div className="py-8 text-center text-gray-400">
                    <FileText className="mx-auto mb-2 h-8 w-8" />
                    <p>
                      No results available. Run a module to see results here.
                    </p>
                  </div>
                ) : (
                  results.slice(0, 5).map((result) => (
                    <div
                      key={result.id}
                      className="flex items-center justify-between rounded border border-white/10 bg-white/5 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-white">
                            {result.label}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(result.createdAt).toLocaleString()} ·{" "}
                            {Math.round(result.size / 1024)} KB
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadResult(result.id)}
                        className="border-white/10"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Error Log Modal */}
      {errorLogModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() =>
              setErrorLogModal((prev) => ({ ...prev, isOpen: false }))
            }
          />
          <div className="relative z-10 max-h-[90vh] w-[95vw] max-w-4xl overflow-hidden rounded-lg border border-red-500/20 bg-black/95 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-red-500/20 bg-red-900/20 px-6 py-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-red-400" />
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {errorLogModal.title}
                  </h3>
                  <p className="text-sm text-red-300">
                    Python execution failed - see details below
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyAllLogs}
                  className="border-red-500/30 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy All Logs
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setErrorLogModal((prev) => ({ ...prev, isOpen: false }))
                  }
                  className="text-gray-300 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-[calc(90vh-120px)] space-y-6 overflow-y-auto p-6">
              {/* Error Summary */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <h4 className="font-medium text-red-300">Error Summary</h4>
                </div>
                <div className="rounded border border-red-500/20 bg-red-900/10 p-3">
                  <pre className="text-sm whitespace-pre-wrap text-red-200">
                    {errorLogModal.error}
                  </pre>
                </div>
              </div>

              {/* Python Output (stdout) */}
              {errorLogModal.stdout && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-green-400" />
                      <h4 className="font-medium text-green-300">
                        Python Output (stdout)
                      </h4>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(errorLogModal.stdout)}
                      className="h-6 px-2 text-xs text-green-400 hover:text-green-300"
                    >
                      <Copy className="mr-1 h-3 w-3" />
                      Copy
                    </Button>
                  </div>
                  <div className="rounded border border-green-500/20 bg-green-900/10 p-3">
                    <pre className="max-h-60 overflow-y-auto text-sm whitespace-pre-wrap text-green-200">
                      {errorLogModal.stdout}
                    </pre>
                  </div>
                </div>
              )}

              {/* Python Errors (stderr) */}
              {errorLogModal.stderr && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <h4 className="font-medium text-red-300">
                        Python Errors (stderr)
                      </h4>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(errorLogModal.stderr)}
                      className="h-6 px-2 text-xs text-red-400 hover:text-red-300"
                    >
                      <Copy className="mr-1 h-3 w-3" />
                      Copy
                    </Button>
                  </div>
                  <div className="rounded border border-red-500/20 bg-red-900/10 p-3">
                    <pre className="max-h-60 overflow-y-auto text-sm whitespace-pre-wrap text-red-200">
                      {errorLogModal.stderr}
                    </pre>
                  </div>
                </div>
              )}

              {/* Python Installation Help */}
              {errorLogModal.error.toLowerCase().includes("python") && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-yellow-400" />
                    <h4 className="font-medium text-yellow-300">
                      Python Installation Required
                    </h4>
                  </div>
                  <div className="rounded border border-yellow-500/20 bg-yellow-900/10 p-3 text-sm text-yellow-200">
                    <div className="space-y-2">
                      <p>
                        <strong>
                          Python 3.6+ is required to run payroll modules.
                        </strong>
                      </p>
                      <div>
                        <p className="font-medium">Quick Installation:</p>
                        <ul className="mt-1 list-inside list-disc space-y-1">
                          <li>
                            <strong>Windows:</strong> Download from{" "}
                            <a
                              href="https://www.python.org/downloads/"
                              target="_blank"
                              rel="noreferrer"
                              className="text-yellow-300 underline"
                            >
                              python.org
                            </a>{" "}
                            and check &quot;Add Python to PATH&quot;
                          </li>
                          <li>
                            <strong>macOS:</strong> Install via Homebrew:{" "}
                            <code className="rounded bg-yellow-800 px-1">
                              brew install python3
                            </code>
                          </li>
                          <li>
                            <strong>Linux:</strong>{" "}
                            <code className="rounded bg-yellow-800 px-1">
                              sudo apt install python3
                            </code>{" "}
                            (Ubuntu/Debian)
                          </li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium">Verify Installation:</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span>
                            Open terminal/command prompt and run:{" "}
                            <code className="rounded bg-yellow-800 px-1">
                              python --version
                            </code>{" "}
                            or{" "}
                            <code className="rounded bg-yellow-800 px-1">
                              python3 --version
                            </code>
                          </span>
                        </div>
                        <div className="mt-2">
                          <Button
                            size="sm"
                            onClick={testPythonInstallation}
                            className="bg-yellow-600 text-yellow-100 hover:bg-yellow-700"
                          >
                            Test Python Installation
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Troubleshooting Tips */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-400" />
                  <h4 className="font-medium text-blue-300">
                    Troubleshooting Tips
                  </h4>
                </div>
                <div className="rounded border border-blue-500/20 bg-blue-900/10 p-3 text-sm text-blue-200">
                  <ul className="list-inside list-disc space-y-1">
                    <li>
                      <strong>Python Installation:</strong> Ensure Python 3.6+
                      is installed and in your system PATH
                    </li>
                    <li>
                      <strong>Windows users:</strong> Try running{" "}
                      <code className="rounded bg-gray-700 px-1">
                        py --version
                      </code>{" "}
                      or{" "}
                      <code className="rounded bg-gray-700 px-1">
                        python --version
                      </code>{" "}
                      in Command Prompt
                    </li>
                    <li>
                      <strong>Mac/Linux users:</strong> Try{" "}
                      <code className="rounded bg-gray-700 px-1">
                        python3 --version
                      </code>{" "}
                      in Terminal
                    </li>
                    <li>
                      Check if all required files are uploaded and accessible
                    </li>
                    <li>
                      Verify that sheet names match exactly (case-sensitive)
                    </li>
                    <li>Ensure numeric fields contain valid numbers</li>
                    <li>
                      Check that file paths do not contain special characters
                    </li>
                    <li>Verify Python modules are properly installed</li>
                    <li>
                      <strong>Permission issues:</strong> Run as administrator
                      if errors persist
                    </li>
                    <li>
                      Check that antivirus software is not blocking file access
                    </li>
                  </ul>
                </div>
              </div>

              {/* Directory Information */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <h4 className="font-medium text-gray-300">File Locations</h4>
                </div>
                <div className="space-y-2 rounded border border-gray-500/20 bg-gray-900/20 p-3 text-sm text-gray-300">
                  <div>
                    <strong>Python logs:</strong>{" "}
                    <code className="rounded bg-gray-800 px-1">
                      payroll/encrypted/payroll_execution.log
                    </code>
                  </div>
                  <div>
                    <strong>Output files:</strong>{" "}
                    <code className="rounded bg-gray-800 px-1">
                      User Data/payroll/outputs/
                    </code>
                  </div>
                  <div>
                    <strong>Config files:</strong>{" "}
                    <code className="rounded bg-gray-800 px-1">
                      User Data/payroll/runs/
                    </code>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    If permission issues occur, temporary directories in your
                    system temp folder will be used automatically.
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-600 bg-gray-900/50 px-6 py-4">
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    setErrorLogModal((prev) => ({ ...prev, isOpen: false }))
                  }
                  className="border-gray-500/30"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
