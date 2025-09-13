import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { File, Play, X } from "lucide-react";
import { usePayrollDocuments, type PayrollDocument } from "@/components/payroll/PayrollDocumentsContext";
import { type Module } from "@/components/payroll/SubstantiveProcedures";

const MODULES: Module[] = [
  {
    id: "ipe_testing",
    name: "IPE Testing",
    description: "Integrity of Processing Environment Testing",
    requiredFiles: ["Pay Registrar"],
    status: "pending",
  },
  {
    id: "exception_testing",
    name: "Exception Testing",
    description: "Identify and analyze payroll exceptions",
    requiredFiles: ["Pay Registrar"],
    status: "pending",
  },
  {
    id: "headcount_reconciliation",
    name: "Headcount Reconciliation",
    description: "Reconcile headcount between periods",
    requiredFiles: ["Pay Registrar", "Additions List", "Deletions List", "CTC Report"],
    status: "pending",
  },
  {
    id: "mom_analysis",
    name: "Month-on-Month Analysis",
    description: "Analyze month-over-month payroll changes",
    requiredFiles: ["Pay Registrar"],
    status: "pending",
  },
  {
    id: "increment_analysis",
    name: "Increment Analysis",
    description: "Analyze salary increments year-over-year",
    requiredFiles: ["CTC Report", "CTC Report Previous Year"],
    status: "pending",
  },
  {
    id: "pf_sal_analytics",
    name: "PF & Salary Analytics",
    description: "Provident Fund and Salary analytical procedures",
    requiredFiles: ["Combined JSON", "Headcount Output", "Increment Output"],
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
    ],
  },
  {
    id: "actuary_testing",
    name: "Actuary Testing",
    description: "Test actuarial calculations and assumptions",
    requiredFiles: ["Actuary Testing File", "CTC Report"],
    status: "pending",
  },
  {
    id: "accuracy_check",
    name: "Accuracy Check",
    description: "Cross-check accuracy between CTC and Actuary data",
    requiredFiles: ["Actuary Testing File", "CTC Report"],
    status: "pending",
  },
];

type SelectedFile = {
  documentId: string;
  document: PayrollDocument;
};

export default function PayrollModulePage() {
  const params = useParams({ strict: false });
  const moduleId = params.moduleId as string;
  const moduleDef = useMemo(() => MODULES.find((m) => m.id === moduleId), [moduleId]);

  const { documents } = usePayrollDocuments();

  const [selectedFiles, setSelectedFiles] = useState<Record<string, SelectedFile[]>>({});
  const [moduleAnswers, setModuleAnswers] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState<{
    runId?: string;
    progress: number;
    status: string;
    message?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    const off = window.payroll?.onProgress?.((p) => setProgress(p));
    return () => off?.();
  }, []);

  if (!moduleDef) {
    return (
      <div className="space-y-4">
        <Card className="border-white/10 bg-black/40">
          <CardHeader>
            <CardTitle className="text-white">Module not found</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-400">The requested module does not exist.</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleFileSelection = (fileType: string, document: PayrollDocument) => {
    setSelectedFiles((prev) => {
      const currentFiles = prev[fileType] || [];
      const isAlreadySelected = currentFiles.some((f) => f.documentId === document.id);
      if (isAlreadySelected) return prev;
      return { ...prev, [fileType]: [...currentFiles, { documentId: document.id, document }] };
    });
  };

  const handleFileRemoval = (fileType: string, documentId: string) => {
    setSelectedFiles((prev) => ({
      ...prev,
      [fileType]: (prev[fileType] || []).filter((f) => f.documentId !== documentId),
    }));
  };

  const getAvailableDocuments = (fileType: string) => {
    const selectedIds = new Set((selectedFiles[fileType] || []).map((f) => f.documentId));
    return documents.filter((doc) => !selectedIds.has(doc.id));
  };

  const canRunModule = (module: Module): boolean => {
    const hasRequiredFiles = module.requiredFiles.every(
      (fileType) => selectedFiles[fileType] && selectedFiles[fileType].length > 0,
    );
    const hasRequiredAnswers =
      !module.questions || module.questions.filter((q) => q.required).every((q) => moduleAnswers[q.id]);
    return hasRequiredFiles && hasRequiredAnswers;
  };

  const runModule = async (moduleId: string) => {
    const module = MODULES.find((m) => m.id === moduleId);
    if (!module || !canRunModule(module)) return;

    setProgress({ progress: 0, status: "running" });
    try {
      const inputFiles: string[] = [];
      for (const fileType of module.requiredFiles) {
        const files = selectedFiles[fileType] || [];
        inputFiles.push(...files.map((f) => f.document.filePath));
      }

      const options: Record<string, any> = {};
      if (module.questions) {
        for (const q of module.questions) {
          const value = moduleAnswers[q.id];
          if (value !== undefined) options[q.id] = value;
        }
      }

      const result = await window.payroll.run(moduleId, { inputFiles, options });
      if (!result.ok) {
        setProgress({ progress: 100, status: "error", error: result.error || "Failed to run module" });
      }
    } catch (error) {
      console.error("Failed to run module:", error);
      setProgress({ progress: 100, status: "error", error: "Failed to run module" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{moduleDef.name}</h2>
          <p className="text-gray-400">{moduleDef.description}</p>
        </div>
      </div>

      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="text-white">Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Required Files */}
          <div className="space-y-4">
            <h4 className="font-medium text-white">Required Files</h4>
            <div className="mb-3 text-xs text-gray-400">
              Select from documents uploaded in the main payroll section.
              <br />
              <span className="text-green-400">
                ℹ Column mapping is automatically handled - no need to upload column_map.json
              </span>
            </div>
            {moduleDef.requiredFiles.map((fileType) => (
              <div key={fileType} className="space-y-3">
                <Label className="text-white">{fileType}</Label>

                {/* Selected Files */}
                {selectedFiles[fileType] && selectedFiles[fileType].length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-400">Selected files:</div>
                    {selectedFiles[fileType].map((selectedFile) => (
                      <div
                        key={selectedFile.documentId}
                        className="flex items-center justify-between rounded border border-green-500/20 bg-green-500/10 p-2"
                      >
                        <div className="flex items-center gap-2">
                          <File className="h-4 w-4 text-green-400" />
                          <span className="text-sm text-white">{selectedFile.document.fileName}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleFileRemoval(fileType, selectedFile.documentId)}
                          className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Available Documents Selector */}
                {getAvailableDocuments(fileType).length > 0 ? (
                  <Select
                    onValueChange={(documentId) => {
                      const document = documents.find((d) => d.id === documentId);
                      if (document) handleFileSelection(fileType, document);
                    }}
                  >
                    <SelectTrigger className="border-white/10 bg-black/40 text-white">
                      <SelectValue placeholder={`Select ${fileType} file...`} />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-black/90 text-white">
                      {getAvailableDocuments(fileType).map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          <div className="flex items-center gap-2">
                            <File className="h-4 w-4" />
                            <span>{doc.fileName}</span>
                            <span className="text-xs text-gray-400">({doc.extension.replace(".", "").toUpperCase()})</span>
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

                {/* File Status */}
                <div className="text-xs">
                  {selectedFiles[fileType] && selectedFiles[fileType].length > 0 ? (
                    <span className="text-green-400">✓ {selectedFiles[fileType].length} file(s) selected</span>
                  ) : (
                    <span className="text-red-400">⚠ No files selected for {fileType}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Questions */}
          {moduleDef.questions && (
            <>
              <Separator className="bg-white/10" />
              <div className="space-y-4">
                <h4 className="font-medium text-white">Additional Configuration</h4>
                {moduleDef.questions.map((q) => (
                  <div key={q.id} className="space-y-2">
                    <Label className="text-white">
                      {q.question}
                      {q.required && <span className="text-red-400">*</span>}
                    </Label>
                    {q.type === "radio" && q.options ? (
                      <Select value={moduleAnswers[q.id] || ""} onValueChange={(value) => setModuleAnswers((prev) => ({ ...prev, [q.id]: value }))}>
                        <SelectTrigger className="border-white/10 bg-black/40 text-white">
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-black/90 text-white">
                          {q.options.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type="text"
                        value={moduleAnswers[q.id] || ""}
                        onChange={(e) => setModuleAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                        className="border-white/10 bg-black/40 text-white"
                        placeholder="Enter value..."
                      />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Run */}
          <div className="flex justify-end">
            <Button onClick={() => runModule(moduleDef.id)} className="bg-blue-600 hover:bg-blue-700">
              <Play className="mr-2 h-4 w-4" /> Start
            </Button>
          </div>

          {/* Progress */}
          {progress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white">Progress: {progress.progress}%</span>
                <span className="text-gray-400">({progress.status})</span>
              </div>
              <Progress value={progress.progress} className="bg-black/40" />
              {progress.message && <div className="text-xs text-gray-400">{progress.message}</div>}
              {progress.error && <div className="text-xs text-red-400">{progress.error}</div>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


