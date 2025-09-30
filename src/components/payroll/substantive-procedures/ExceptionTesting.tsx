"use client";

import React, { useEffect, useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import {
  AlertTriangle,
  CheckCircle,
  Play,
  Download,
  FileText,
  Settings,
  Users,
  Calendar,
  CreditCard,
  User,
  Building,
} from "lucide-react";

interface ExceptionTestingProps {
  onBack?: () => void;
}

interface Exception {
  id: number;
  description: string;
  selected: boolean;
  result?: string;
}

interface ClientFile { name: string; reference: string }

const EXCEPTIONS: Exception[] = [
  {
    id: 1,
    description: "One employee code does not have more than one employee name",
    selected: false,
  },
  {
    id: 2,
    description: "One employee code does not have two lines with the same month of pay",
    selected: false,
  },
  {
    id: 3,
    description: "One employee code does not have more than 2 designations",
    selected: false,
  },
  {
    id: 4,
    description: "One employee code is not paid for months subsequent to month of resignation",
    selected: false,
  },
  {
    id: 5,
    description: "One employee code is not paid for months before joining date",
    selected: false,
  },
  {
    id: 6,
    description: "Two different employees do not have the same PAN",
    selected: false,
  },
  {
    id: 7,
    description: "Employees having blank designation",
    selected: false,
  },
  {
    id: 8,
    description: "Gross pay is lesser than net pay",
    selected: false,
  },
  {
    id: 9,
    description: "Employees having no employee code",
    selected: false,
  },
  {
    id: 10,
    description: "Instances where gross pay less total deductions is not equal to net pay",
    selected: false,
  },
  {
    id: 11,
    description: "Employee IDs where net pay is negative",
    selected: false,
  },
  {
    id: 12,
    description: "Employee IDs where PF was not there in one month but there in other months",
    selected: false,
  },
  {
    id: 13,
    description: "Employee IDs where ESI is not there in one month but there in previous months",
    selected: false,
  },
  {
    id: 14,
    description: "Employee IDs with different dates of joining",
    selected: false,
  },
  {
    id: 15,
    description: "Employee IDs with different dates of leaving",
    selected: false,
  },
];

// Column mapping removed per requirements

export default function ExceptionTesting({ onBack }: ExceptionTestingProps) {
  const [exceptions, setExceptions] = useState<Exception[]>(EXCEPTIONS);
  const [clientFiles, setClientFiles] = useState<ClientFile[]>([]);
  const [isLoadingClientFiles, setIsLoadingClientFiles] = useState(false);
  const [selectedPayrollFile, setSelectedPayrollFile] = useState<string>("");
  const [processingStatus, setProcessingStatus] = useState<"idle" | "running" | "completed" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Record<number, string>>({});
  const [fileUrl, setFileUrl] = useState<string>("");

  useEffect(() => {
    loadClientFiles();
  }, []);

  const loadClientFiles = async () => {
    setIsLoadingClientFiles(true);
    try {
      if (window.sharePointAPI?.loadCloudFiles) {
        const result = await window.sharePointAPI.loadCloudFiles();
        if (result.success && result.data?.files) {
          const files = result.data.files
            .map((file: any) => ({ 
              name: String(file.name || "").trim(), 
              reference: file.reference || "" 
            }))
            .filter((file: any) => file.name && file.name.length > 0);
          setClientFiles(files);
        }
      }
    } catch (e) {
      // ignore
    } finally {
      setIsLoadingClientFiles(false);
    }
  };

  const handleExceptionToggle = (exceptionId: number) => {
    setExceptions(prev =>
      prev.map(exp =>
        exp.id === exceptionId ? { ...exp, selected: !exp.selected } : exp
      )
    );
  };

  const handleSelectAllExceptions = () => {
    const allSelected = exceptions.every(exp => exp.selected);
    setExceptions(prev =>
      prev.map(exp => ({ ...exp, selected: !allSelected }))
    );
  };

  const canRunTests = () => {
    const hasSelectedExceptions = exceptions.some(exp => exp.selected);
    const hasPayroll = !!selectedPayrollFile;
    return hasSelectedExceptions && hasPayroll;
  };

  const runExceptionTests = async () => {
    if (!canRunTests()) return;

    setProcessingStatus("running");
    setProgress(0);

    try {
      const selectedExceptions = exceptions.filter(exp => exp.selected).map(e => e.id);
      // If user selected all, maintain requested list order
      const expn_no = selectedExceptions.length === EXCEPTIONS.length ? [1,2,3,4,5,7,8,9,10,11,12,13] : selectedExceptions;

      // Send to backend to run Python SharePoint exception testing
      if (window.payroll?.run) {
        const result = await window.payroll.run("execute_exception_sharepoint", {
          inputFiles: [],
          options: {
            pay_registrar: selectedPayrollFile,
            expn_no,
          },
        });

        if (result.ok && result.runId) {
          const unsubscribe = window.payroll.onProgress((payload: any) => {
            if (payload.runId === result.runId) {
              if (payload.status === "running") {
                setProgress((prev) => Math.min(95, Math.max(5, prev + 5)));
                // Fallback: if JSON appears early in stdout, finalize
                try {
                  if (payload.stdout) {
                    const lines = String(payload.stdout).split("\n");
                    const jsonLine = lines.find((l: string) => l.trim().startsWith("{") && l.trim().endsWith("}"));
                    if (jsonLine) {
                      const parsed = JSON.parse(jsonLine);
                      if (parsed.success) {
                        setProcessingStatus("completed");
                        setProgress(100);
                        if (parsed.file_web_url) setFileUrl(parsed.file_web_url);
                        unsubscribe();
                        return;
                      }
                    }
                  }
                } catch {}
              } else if (payload.status === "success") {
                try {
                  if (payload.stdout) {
                    const lines = String(payload.stdout).split("\n");
                    const jsonLine = lines.find((l: string) => l.trim().startsWith("{") && l.trim().endsWith("}"));
                    if (jsonLine) {
                      const parsed = JSON.parse(jsonLine);
                      if (parsed.success) {
                        setProcessingStatus("completed");
                        setProgress(100);
                        if (parsed.file_web_url) setFileUrl(parsed.file_web_url);
                      } else {
                        setProcessingStatus("error");
                      }
                    } else {
                      setProcessingStatus("completed");
                      setProgress(100);
                    }
                  } else {
                    setProcessingStatus("completed");
                    setProgress(100);
                  }
                } catch {
                  setProcessingStatus("completed");
                  setProgress(100);
                }
                unsubscribe();
              } else if (payload.status === "error") {
                setProcessingStatus("error");
                unsubscribe();
              }
            }
          });
        } else {
          setProcessingStatus("error");
        }
      } else {
        setProcessingStatus("error");
      }
    } catch (error) {
      setProcessingStatus("error");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "running":
        return <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getResultColor = (result?: string) => {
    if (!result) return "text-gray-400";
    if (result.includes("exceptions found")) return "text-red-400";
    if (result === "No exception found") return "text-green-400";
    return "text-gray-400";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Exception Testing</h2>
          <p className="text-gray-400">
            Automated testing for payroll data integrity and compliance
          </p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
        )}
      </div>

      {/* Step 1: Select Payroll File */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Settings className="h-5 w-5" />
            Step 1: Select Payroll File
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Button onClick={loadClientFiles} disabled={isLoadingClientFiles} className="flex items-center gap-2">
              {isLoadingClientFiles ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Settings className="h-4 w-4" />
              )}
              {isLoadingClientFiles ? "Loading..." : "Load Client Files"}
            </Button>
          </div>
          {clientFiles.length > 0 && (
            <Select value={selectedPayrollFile && clientFiles.some(f => f.name === selectedPayrollFile) ? selectedPayrollFile : ""} onValueChange={setSelectedPayrollFile}>
              <SelectTrigger className="border-white/10 bg-black/40 text-white">
                <SelectValue placeholder="Select payroll file..." />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-black/90 text-white max-h-64">
                {clientFiles
                  .filter((f) => f.name && f.name.trim().length > 0)
                  .map((file, index) => (
                    <SelectItem key={index} value={file.name}>
                      {file.name} {file.reference && `(${file.reference})`}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Exception Selection Section */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5" />
              Exception Tests
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSelectAllExceptions}
                className="border-white/10"
              >
                {exceptions.every(exp => exp.selected) ? "Deselect All" : "Select All"}
              </Button>
              <span className="rounded bg-blue-500/20 px-2 py-1 text-xs text-blue-300">
                {exceptions.filter(exp => exp.selected).length} selected
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded border border-white/10 bg-white/5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20 text-white">Sl. No.</TableHead>
                  <TableHead className="text-white">Exception</TableHead>
                  <TableHead className="w-40 text-white">Selection</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exceptions.map((exception) => (
                  <TableRow key={exception.id}>
                    <TableCell className="text-white">{exception.id}</TableCell>
                    <TableCell className="text-white">{exception.description}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`exception-${exception.id}`}
                          checked={exception.selected}
                          onCheckedChange={() => handleExceptionToggle(exception.id)}
                        />
                        <Label htmlFor={`exception-${exception.id}`} className="text-white">
                          {exception.selected ? "Selected" : "Select"}
                        </Label>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Execution Section */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Play className="h-5 w-5" />
            Execute Exception Tests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">
                Run selected exception tests on the consolidated payroll register
              </p>
              {!canRunTests() && (
                <p className="mt-1 text-xs text-red-400">
                  Please select at least one exception test and choose the payroll file
                </p>
              )}
            </div>
            <Button
              onClick={runExceptionTests}
              disabled={!canRunTests() || processingStatus === "running"}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {processingStatus === "running" ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Exception Tests
                </>
              )}
            </Button>
          </div>

          {/* Progress Indicator */}
          {processingStatus === "running" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-red-300">Processing Exception Tests...</span>
                <span className="text-gray-400">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Results Summary */}
          {processingStatus === "completed" && (
            <div className="space-y-4">
              <div className="rounded border border-green-500/20 bg-green-500/10 p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <h4 className="font-medium text-green-300">Exception Testing Completed</h4>
                    <p className="text-sm text-green-200">
                      All selected tests have been executed successfully
                    </p>
                  </div>
                </div>
              </div>

              {/* Results Table */}
              <div className="rounded border border-white/10 bg-white/5">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-white">Exception No.</TableHead>
                      <TableHead className="text-white">Exception</TableHead>
                      <TableHead className="text-white">Selected</TableHead>
                      <TableHead className="text-white">Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exceptions.map((exception) => (
                      <TableRow key={exception.id}>
                        <TableCell className="text-white">{exception.id}</TableCell>
                        <TableCell className="text-white">{exception.description}</TableCell>
                        <TableCell className="text-white">
                          {exception.selected ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                          )}
                        </TableCell>
                        <TableCell className={getResultColor(exception.result)}>
                          {exception.result || "Not applicable"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="border-green-500/30 text-green-300">
                  <Download className="mr-2 h-4 w-4" />
                  Download Excel Report
                </Button>
                <Button
                  variant="outline"
                  className="border-green-500/30 text-green-300"
                  onClick={() => {
                    if (fileUrl) window.open(fileUrl, "_blank");
                  }}
                  disabled={!fileUrl}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Open Exception Testing
                </Button>
              </div>
            </div>
          )}

          {/* Error State */}
          {processingStatus === "error" && (
            <div className="rounded border border-red-500/20 bg-red-500/10 p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <h4 className="font-medium text-red-300">Exception Testing Failed</h4>
                  <p className="text-sm text-red-200">
                    An error occurred while running the exception tests. Please check your data and try again.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
