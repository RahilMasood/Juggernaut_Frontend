"use client";

import React, { useState, useEffect } from "react";
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
import { Settings, Play, Database, FileText, Download } from "lucide-react";

interface IncrementAnalysisProps {
  onBack?: () => void;
}

export default function IncrementAnalysis({ onBack }: IncrementAnalysisProps) {
  const [clientFiles, setClientFiles] = useState<Array<{ name: string; reference: string }>>([]);
  const [isLoadingClientFiles, setIsLoadingClientFiles] = useState(false);

  const [ctcReport, setCtcReport] = useState<string>("");
  const [ctcPrevReport, setCtcPrevReport] = useState<string>("");

  const [ctcColumns, setCtcColumns] = useState<string[]>([]);
  const [isLoadingCtcColumns, setIsLoadingCtcColumns] = useState(false);

  const [incrementColumns, setIncrementColumns] = useState<string[]>([]); // expects 4
  const [columnsToSum, setColumnsToSum] = useState<string[]>([]);

  const [reconcileInput, setReconcileInput] = useState<string>("0");

  const [processingStatus, setProcessingStatus] = useState<"idle" | "running" | "completed" | "error">("idle");
  const [progress, setProgress] = useState(0);
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
            .map((f: any) => ({ name: String(f.name || "").trim(), reference: f.reference || "" }))
            .filter((f: any) => f.name && f.name.length > 0);
          setClientFiles(files);
        }
      }
    } finally {
      setIsLoadingClientFiles(false);
    }
  };

  const loadCtcReportColumns = async () => {
    if (!ctcReport) return;
    setIsLoadingCtcColumns(true);
    try {
      if (window.payroll?.loadExcelColumns) {
        const fileName = ctcReport.includes(' (') ? ctcReport.split(' (')[0] : ctcReport;
        const result = await window.payroll.loadExcelColumns(fileName);
        if (result.ok && result.columns) {
          setCtcColumns(result.columns);
          setIncrementColumns([]);
          setColumnsToSum([]);
        }
      }
    } finally {
      setIsLoadingCtcColumns(false);
    }
  };

  const toggleFrom = (setter: React.Dispatch<React.SetStateAction<string[]>>, list: string[], value: string) => {
    setter(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
  };

  const canRun = () => {
    const reconOk = /^-?\d+$/.test(reconcileInput.trim());
    return (
      ctcReport &&
      ctcPrevReport &&
      ctcColumns.length > 0 &&
      incrementColumns.length === 4 &&
      columnsToSum.length > 0 &&
      reconOk
    );
  };

  const runIncrementAnalysis = async () => {
    if (!canRun()) return;
    setProcessingStatus("running");
    setProgress(0);
    setFileUrl("");

    try {
      if (window.payroll?.run) {
        const result = await window.payroll.run("execute_increment_analysis_sharepoint", {
          inputFiles: [],
          options: {
            cy_file: ctcReport.includes(' (') ? ctcReport.split(' (')[0] : ctcReport,
            py_file: ctcPrevReport.includes(' (') ? ctcPrevReport.split(' (')[0] : ctcPrevReport,
            incr_columns: incrementColumns,
            cols_to_sum: columnsToSum,
            reconcile_input: parseInt(reconcileInput.trim(), 10) || 0,
          },
        });

        if (result.ok && result.runId) {
          const unsubscribe = window.payroll.onProgress((payload: any) => {
            if (payload.runId === result.runId) {
              if (payload.status === "running") {
                setProgress((prev) => Math.min(95, Math.max(5, prev + 5)));
              } else if (payload.status === "success") {
                try {
                  const lines = String(payload.stdout || '').split('\n');
                  const jsonLine = lines.find((l: string) => l.trim().startsWith('{') && l.trim().endsWith('}'));
                  if (jsonLine) {
                    const parsed = JSON.parse(jsonLine);
                    if (parsed.success) {
                      setProcessingStatus("completed");
                      setProgress(100);
                      if (parsed.excel_url) setFileUrl(parsed.excel_url);
                    } else {
                      setProcessingStatus("error");
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Increment Analysis</h2>
          <p className="text-gray-400">Compare current vs previous year CTC to compute increments</p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
        )}
      </div>

      {/* Step 1: Select CTC Files */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Database className="h-5 w-5" />
            Step 1: Select CTC Files
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Button onClick={loadClientFiles} disabled={isLoadingClientFiles} className="flex items-center gap-2">
              {isLoadingClientFiles ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              {isLoadingClientFiles ? 'Loading...' : 'Load Client Files'}
            </Button>
          </div>
          {clientFiles.length > 0 && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <Label className="text-white">CTC Report (Current Year)</Label>
                <Select value={ctcReport && clientFiles.some(f => f.name === ctcReport) ? ctcReport : ""} onValueChange={setCtcReport}>
                  <SelectTrigger className="border-white/10 bg-black/40 text-white"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent className="border-white/10 bg-black/90 text-white max-h-64">
                    {clientFiles
                      .filter((f) => f.name && f.name.trim().length > 0)
                      .map((f, i) => (<SelectItem key={i} value={f.name}>{f.name} {f.reference && `(${f.reference})`}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white">CTC Previous Year Report</Label>
                <Select value={ctcPrevReport && clientFiles.some(f => f.name === ctcPrevReport) ? ctcPrevReport : ""} onValueChange={setCtcPrevReport}>
                  <SelectTrigger className="border-white/10 bg-black/40 text-white"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent className="border-white/10 bg-black/90 text-white max-h-64">
                    {clientFiles
                      .filter((f) => f.name && f.name.trim().length > 0)
                      .map((f, i) => (<SelectItem key={i} value={f.name}>{f.name} {f.reference && `(${f.reference})`}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={loadCtcReportColumns} disabled={!ctcReport || isLoadingCtcColumns} className="ml-auto">
                  {isLoadingCtcColumns ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Settings className="h-4 w-4" />
                  )}
                  {isLoadingCtcColumns ? 'Loading Columns...' : 'Load Excel Columns'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Configure Columns */}
      {ctcColumns.length > 0 && (
        <Card className="border-white/10 bg-black/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <Settings className="h-5 w-5" />
              Step 2: Configure Columns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Increment Columns (choose exactly 4) */}
            <div className="space-y-4">
              <Label className="text-white">Increment columns (choose exactly 4: Emp No, Name, DOJ, Designation)</Label>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {ctcColumns.map((columnName) => (
                  <div key={columnName} className="flex items-center space-x-2">
                    <Checkbox
                      id={`incr-${columnName}`}
                      checked={incrementColumns.includes(columnName)}
                      onCheckedChange={() => toggleFrom(setIncrementColumns, incrementColumns, columnName)}
                    />
                    <Label htmlFor={`incr-${columnName}`} className="flex items-center gap-2 text-white">
                      {columnName}
                    </Label>
                  </div>
                ))}
              </div>
              {incrementColumns.length !== 4 && (
                <p className="text-xs text-yellow-400">Select exactly 4 columns for increment mapping.</p>
              )}
            </div>

            {/* Columns to Sum */}
            <div className="space-y-4">
              <Label className="text-white">Columns to Sum</Label>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {ctcColumns.map((columnName) => (
                  <div key={columnName} className="flex items-center space-x-2">
                    <Checkbox
                      id={`sum-${columnName}`}
                      checked={columnsToSum.includes(columnName)}
                      onCheckedChange={() => toggleFrom(setColumnsToSum, columnsToSum, columnName)}
                    />
                    <Label htmlFor={`sum-${columnName}`} className="flex items-center gap-2 text-white">
                      {columnName}
                    </Label>
                  </div>
                ))}
              </div>
              {columnsToSum.length === 0 && (
                <p className="text-xs text-yellow-400">Select at least one column to sum.</p>
              )}
            </div>

            {/* Reconcile Input */}
            <div className="space-y-2">
              <Label className="text-white">Reconcile Input</Label>
              <Input
                type="text"
                value={reconcileInput}
                onChange={(e) => setReconcileInput(e.target.value)}
                className="border-white/10 bg-black/40 text-white"
                placeholder="Enter a whole number (e.g., 0)"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Execute */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Play className="h-5 w-5" />
            Execute Increment Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Run increment analysis on selected CTC files</p>
              {!canRun() && (
                <p className="mt-1 text-xs text-red-400">Select both files, load columns, choose 4 increment columns and at least one sum column, and enter reconcile input.</p>
              )}
            </div>
            <Button
              onClick={runIncrementAnalysis}
              disabled={!canRun() || processingStatus === "running"}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {processingStatus === "running" ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Increment Analysis
                </>
              )}
            </Button>
          </div>

          {processingStatus === "running" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-indigo-300">Processing Increment Analysis...</span>
                <span className="text-gray-400">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {processingStatus === "completed" && (
            <div className="rounded border border-green-500/20 bg-green-500/10 p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-green-500" />
                <div>
                  <h4 className="font-medium text-green-300">Increment Analysis Completed</h4>
                  <p className="text-sm text-green-200">Updated Excel uploaded to SharePoint.</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" className="border-green-500/30 text-green-300" onClick={() => { if (fileUrl) window.open(fileUrl, "_blank"); }} disabled={!fileUrl}>
                  <Download className="mr-2 h-4 w-4" />
                  Open Excel
                </Button>
              </div>
            </div>
          )}

          {processingStatus === "error" && (
            <div className="rounded border border-red-500/20 bg-red-500/10 p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-red-500" />
                <div>
                  <h4 className="font-medium text-red-300">Increment Analysis Failed</h4>
                  <p className="text-sm text-red-200">Please check inputs and try again.</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
