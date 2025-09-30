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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Play,
  Download,
  FileText,
  Settings,
  Calculator,
  BarChart3,
  Users,
  Calendar,
} from "lucide-react";

interface MoMAnalysisProps {
  onBack?: () => void;
}

interface EmployeeMoMData {
  employeeCode: string;
  employeeName: string;
  doj: string;
  dol: string;
  aprSepTotal: number;
  octMarTotal: number;
  variance: number;
  variancePercentage: number;
  remarks: string;
  isNewHire: boolean;
  isResigned: boolean;
}

interface ColumnSelection {
  displayColumns: string[];
  calculationColumns: string[];
}

const AVAILABLE_COLUMNS = [
  { value: "employee_code", label: "Employee Code", icon: <Users className="h-4 w-4" /> },
  { value: "employee_name", label: "Employee Name", icon: <Users className="h-4 w-4" /> },
  { value: "doj", label: "Date of Joining", icon: <Calendar className="h-4 w-4" /> },
  { value: "dol", label: "Date of Leaving", icon: <Calendar className="h-4 w-4" /> },
  { value: "basic", label: "Basic Salary", icon: <Calculator className="h-4 w-4" /> },
  { value: "hra", label: "HRA", icon: <Calculator className="h-4 w-4" /> },
  { value: "da", label: "DA", icon: <Calculator className="h-4 w-4" /> },
  { value: "allowances", label: "Allowances", icon: <Calculator className="h-4 w-4" /> },
  { value: "gross", label: "Gross Pay", icon: <Calculator className="h-4 w-4" /> },
  { value: "pf", label: "Provident Fund", icon: <Calculator className="h-4 w-4" /> },
  { value: "esi", label: "ESI", icon: <Calculator className="h-4 w-4" /> },
  { value: "deductions", label: "Total Deductions", icon: <Calculator className="h-4 w-4" /> },
  { value: "net_pay", label: "Net Pay", icon: <Calculator className="h-4 w-4" /> },
];

const MONTH_OPTIONS = [
  "Apr-25", "May-25", "Jun-25",
  "Jul-25", "Aug-25", "Sep-25", "Oct-25", "Nov-25", "Dec-25",
  "Jan-26", "Feb-26", "Mar-26"
];

export default function MoMAnalysis({ onBack }: MoMAnalysisProps) {
  const [columnSelection, setColumnSelection] = useState<ColumnSelection>({
    displayColumns: [],
    calculationColumns: [],
  });
  const [incrementMonth, setIncrementMonth] = useState<string>("Oct-24");
  const [momData, setMomData] = useState<EmployeeMoMData[]>([]);
  const [processingStatus, setProcessingStatus] = useState<"idle" | "running" | "completed" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [showSelectedColumns, setShowSelectedColumns] = useState(false);
  const [payRegistrar, setPayRegistrar] = useState<string>("");
  const [payRegistrarColumns, setPayRegistrarColumns] = useState<string[]>([]);
  const [clientFiles, setClientFiles] = useState<Array<{ name: string; reference?: string }>>([]);
  const [isLoadingClientFiles, setIsLoadingClientFiles] = useState(false);
  const [showDisplayDropdown, setShowDisplayDropdown] = useState(false);
  const [showCalcDropdown, setShowCalcDropdown] = useState(false);

  // Load client files similar to IPE Testing step
  const loadClientFiles = async () => {
    setIsLoadingClientFiles(true);
    try {
      if (window.sharePointAPI?.loadCloudFiles) {
        const result = await window.sharePointAPI.loadCloudFiles();
        if (result.success && result.data?.files) {
          const files = result.data.files
            .map((f: any) => ({ name: String(f.name || "").trim(), reference: f.reference }))
            .filter((f: any) => f.name && f.name.length > 0);
          setClientFiles(files);
        }
      }
    } finally {
      setIsLoadingClientFiles(false);
    }
  };

  const loadPayRegistrarColumns = async () => {
    try {
      if (window.payroll?.loadExcelColumns && payRegistrar) {
        const fileName = payRegistrar.includes(' (') ? payRegistrar.split(' (')[0] : payRegistrar;
        const res = await window.payroll.loadExcelColumns(fileName);
        if (res.ok && Array.isArray(res.columns)) setPayRegistrarColumns(res.columns);
      }
    } catch {}
  };

  const handleColumnToggle = (columnType: keyof ColumnSelection, columnValue: string) => {
    setColumnSelection(prev => ({
      ...prev,
      [columnType]: prev[columnType].includes(columnValue)
        ? prev[columnType].filter(col => col !== columnValue)
        : [...prev[columnType], columnValue]
    }));
  };

  const getColumnLabel = (value: string) => {
    return AVAILABLE_COLUMNS.find(col => col.value === value)?.label || value;
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (variance < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return "text-green-400";
    if (variance < 0) return "text-red-400";
    return "text-gray-400";
  };

  const runMoMAnalysis = async () => {
    setProcessingStatus("running");
    setProgress(0);
    try {
      if (window.payroll?.run) {
        const res = await window.payroll.run("execute_mom_increment_sharepoint", {
          inputFiles: [],
          options: {
            pay_registrar: payRegistrar,
            display_cols: columnSelection.displayColumns,
            calc_cols: columnSelection.calculationColumns,
            increment_month: incrementMonth,
          },
        });
        if (res.ok && res.runId) {
          const off = window.payroll.onProgress((payload: any) => {
            if (payload.runId === res.runId) {
              if (payload.status === 'running') return;
              if (payload.status === 'success') {
                setProcessingStatus('completed');
                setProgress(100);
                off();
              } else if (payload.status === 'error') {
                setProcessingStatus('error');
                off();
              }
            }
          });
        } else {
          setProcessingStatus('error');
        }
      } else {
        setProcessingStatus('error');
      }
    } catch {
      setProcessingStatus('error');
    }
  };

  const updateRemarks = (employeeCode: string, remarks: string) => {
    setMomData(prev =>
      prev.map(emp =>
        emp.employeeCode === employeeCode ? { ...emp, remarks } : emp
      )
    );
  };

  const canRunAnalysis = () => {
    return !!(payRegistrar && columnSelection.displayColumns.length > 0 && columnSelection.calculationColumns.length > 0 && incrementMonth);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Month-on-Month Analysis</h2>
          <p className="text-gray-400">
            Analyze month-over-month payroll changes and variance trends
          </p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
        )}
      </div>

      {/* Select Pay Registrar (ask user which file is Pay Registrar) */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Users className="h-5 w-5" />
            Step 1: Select Pay Registrar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Button onClick={loadClientFiles} disabled={isLoadingClientFiles} className="flex items-center gap-2">
              {isLoadingClientFiles ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              {isLoadingClientFiles ? 'Loading...' : 'Load Client Files'}
            </Button>
          </div>
          {clientFiles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-white">Pay Registrar</Label>
                <Select value={payRegistrar && clientFiles.some(f => f.name === payRegistrar) ? payRegistrar : ""} onValueChange={setPayRegistrar}>
                  <SelectTrigger className="border-white/10 bg-black/40 text-white"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent className="border-white/10 bg-black/90 text-white max-h-64">
                    {clientFiles
                      .filter((f) => f.name && f.name.trim().length > 0)
                      .map((f, i) => (
                        <SelectItem key={i} value={f.name}>{f.name} {f.reference && `(${f.reference})`}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={loadPayRegistrarColumns} disabled={!payRegistrar} className="ml-auto">
                  Load Excel Columns
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Select Columns (Display & Calculation) */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Settings className="h-5 w-5" />
            Step 2: Select Columns
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Display Columns Dropdown */}
            <div className="space-y-2">
              <Label className="text-white">Display Columns</Label>
              <div className="relative">
                <Button variant="outline" className="w-full justify-between border-white/10" onClick={() => setShowDisplayDropdown(!showDisplayDropdown)}>
                  {columnSelection.displayColumns.length > 0 ? `${columnSelection.displayColumns.length} selected` : 'Select display columns'}
                </Button>
                {showDisplayDropdown && (
                  <div className="absolute z-10 mt-2 w-full rounded-md border border-white/10 bg-black/90 p-2 max-h-64 overflow-auto">
                    {(payRegistrarColumns.length > 0 ? payRegistrarColumns : [])
                      .map((c: any) => (
                        <div key={String(c)} className="flex items-center gap-2 px-2 py-1 hover:bg-white/5 rounded">
                          <Checkbox id={`disp-${String(c)}`} checked={columnSelection.displayColumns.includes(String(c))} onCheckedChange={() => handleColumnToggle('displayColumns', String(c))} />
                          <Label htmlFor={`disp-${String(c)}`} className="text-white text-sm">{String(c)}</Label>
                        </div>
                      ))}
                  </div>
                )}
              </div>
              {columnSelection.displayColumns.length > 0 && (
                <div className="text-xs text-blue-300">{columnSelection.displayColumns.join(', ')}</div>
              )}
            </div>

            {/* Calculation Columns Dropdown */}
            <div className="space-y-2">
              <Label className="text-white">Calculation Columns</Label>
              <div className="relative">
                <Button variant="outline" className="w-full justify-between border-white/10" onClick={() => setShowCalcDropdown(!showCalcDropdown)}>
                  {columnSelection.calculationColumns.length > 0 ? `${columnSelection.calculationColumns.length} selected` : 'Select calculation columns'}
                </Button>
                {showCalcDropdown && (
                  <div className="absolute z-10 mt-2 w-full rounded-md border border-white/10 bg-black/90 p-2 max-h-64 overflow-auto">
                    {(payRegistrarColumns.length > 0 ? payRegistrarColumns : [])
                      .map((c: any) => (
                        <div key={String(c)} className="flex items-center gap-2 px-2 py-1 hover:bg-white/5 rounded">
                          <Checkbox id={`calc-${String(c)}`} checked={columnSelection.calculationColumns.includes(String(c))} onCheckedChange={() => handleColumnToggle('calculationColumns', String(c))} />
                          <Label htmlFor={`calc-${String(c)}`} className="text-white text-sm">{String(c)}</Label>
                        </div>
                      ))}
                  </div>
                )}
              </div>
              {columnSelection.calculationColumns.length > 0 && (
                <div className="text-xs text-green-300">{columnSelection.calculationColumns.join(', ')}</div>
              )}
            </div>
          </div>

          {/* Increment Month Selection (unchanged) */}
          <div className="space-y-2">
            <Label className="text-white">Month of Increment</Label>
            <Select value={incrementMonth} onValueChange={setIncrementMonth}>
              <SelectTrigger className="border-white/10 bg-black/40 text-white">
                <SelectValue placeholder="Select increment month" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-black/90 text-white">
                {MONTH_OPTIONS.map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* MoM Analysis Results removed as requested */}

      {/* Execution Section */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Play className="h-5 w-5" />
            Execute MoM Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">
                Run month-on-month analysis on the consolidated payroll register
              </p>
              {!canRunAnalysis() && (
                <p className="mt-1 text-xs text-red-400">
                  Please select display columns, calculation columns, and increment month
                </p>
              )}
            </div>
            <Button
              onClick={runMoMAnalysis}
              disabled={!canRunAnalysis() || processingStatus === "running"}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
            >
              {processingStatus === "running" ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run MoM Analysis
                </>
              )}
            </Button>
          </div>

          {/* Progress Indicator */}
          {processingStatus === "running" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-purple-300">Processing MoM Analysis...</span>
                <span className="text-gray-400">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Results */}
          {processingStatus === "completed" && (
            <div className="rounded border border-green-500/20 bg-green-500/10 p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-green-500" />
                <div>
                  <h4 className="font-medium text-green-300">MoM Analysis Completed</h4>
                  <p className="text-sm text-green-200">
                    Month-on-month analysis has been completed successfully
                  </p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" className="border-green-500/30 text-green-300">
                  <Download className="mr-2 h-4 w-4" />
                  Download Excel Report
                </Button>
                <Button variant="outline" className="border-green-500/30 text-green-300">
                  <FileText className="mr-2 h-4 w-4" />
                  View Detailed Analysis
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
