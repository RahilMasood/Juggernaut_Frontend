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
  "Apr-24", "May-24", "Jun-24", "Jul-24", "Aug-24", "Sep-24",
  "Oct-24", "Nov-24", "Dec-24", "Jan-25", "Feb-25", "Mar-25"
];

export default function MoMAnalysis({ onBack }: MoMAnalysisProps) {
  const [columnSelection, setColumnSelection] = useState<ColumnSelection>({
    displayColumns: ["employee_code", "employee_name", "doj", "dol"],
    calculationColumns: ["basic", "hra"],
  });
  const [incrementMonth, setIncrementMonth] = useState<string>("Oct-24");
  const [momData, setMomData] = useState<EmployeeMoMData[]>([]);
  const [processingStatus, setProcessingStatus] = useState<"idle" | "running" | "completed" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [showSelectedColumns, setShowSelectedColumns] = useState(false);

  // Generate sample data for demonstration
  useEffect(() => {
    const sampleData: EmployeeMoMData[] = [
      {
        employeeCode: "EMP001",
        employeeName: "John Doe",
        doj: "2023-01-15",
        dol: "",
        aprSepTotal: 450000,
        octMarTotal: 495000,
        variance: 45000,
        variancePercentage: 10.0,
        remarks: "",
        isNewHire: false,
        isResigned: false,
      },
      {
        employeeCode: "EMP002",
        employeeName: "Jane Smith",
        doj: "2024-06-01",
        dol: "",
        aprSepTotal: 180000,
        octMarTotal: 270000,
        variance: 90000,
        variancePercentage: 50.0,
        remarks: "The variance is due to fresh hiring of the employee in the current year",
        isNewHire: true,
        isResigned: false,
      },
      {
        employeeCode: "EMP003",
        employeeName: "Mike Johnson",
        doj: "2022-03-10",
        dol: "2024-11-30",
        aprSepTotal: 360000,
        octMarTotal: 120000,
        variance: -240000,
        variancePercentage: -66.7,
        remarks: "The variance is due to resignation of the employee in the current year",
        isNewHire: false,
        isResigned: true,
      },
      {
        employeeCode: "EMP004",
        employeeName: "Sarah Wilson",
        doj: "2023-08-20",
        dol: "",
        aprSepTotal: 320000,
        octMarTotal: 352000,
        variance: 32000,
        variancePercentage: 10.0,
        remarks: "",
        isNewHire: false,
        isResigned: false,
      },
    ];
    setMomData(sampleData);
  }, []);

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
      // Simulate analysis process
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setProgress(i);
      }

      setProcessingStatus("completed");
    } catch (error) {
      setProcessingStatus("error");
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
    return columnSelection.displayColumns.length > 0 && 
           columnSelection.calculationColumns.length > 0 && 
           incrementMonth;
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

      {/* Configuration Section */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Settings className="h-5 w-5" />
            Analysis Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Column Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-white">Display Columns</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSelectedColumns(!showSelectedColumns)}
                className="border-white/10"
              >
                {showSelectedColumns ? "Hide Selected" : "Show Selected"}
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {AVAILABLE_COLUMNS.map((column) => (
                <div key={column.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`display-${column.value}`}
                    checked={columnSelection.displayColumns.includes(column.value)}
                    onCheckedChange={() => handleColumnToggle('displayColumns', column.value)}
                  />
                  <Label htmlFor={`display-${column.value}`} className="flex items-center gap-2 text-white">
                    {column.icon}
                    {column.label}
                  </Label>
                </div>
              ))}
            </div>

            {showSelectedColumns && (
              <div className="rounded border border-blue-500/20 bg-blue-900/10 p-3">
                <p className="text-sm font-medium text-blue-300">Selected Display Columns:</p>
                <p className="text-sm text-blue-200">
                  {columnSelection.displayColumns.map(getColumnLabel).join(", ")}
                </p>
              </div>
            )}
          </div>

          {/* Calculation Columns */}
          <div className="space-y-4">
            <Label className="text-white">Calculation Columns (for MoM analysis)</Label>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {AVAILABLE_COLUMNS.filter(col => 
                ['basic', 'hra', 'da', 'allowances', 'gross', 'pf', 'esi', 'deductions', 'net_pay'].includes(col.value)
              ).map((column) => (
                <div key={column.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`calc-${column.value}`}
                    checked={columnSelection.calculationColumns.includes(column.value)}
                    onCheckedChange={() => handleColumnToggle('calculationColumns', column.value)}
                  />
                  <Label htmlFor={`calc-${column.value}`} className="flex items-center gap-2 text-white">
                    {column.icon}
                    {column.label}
                  </Label>
                </div>
              ))}
            </div>

            <div className="rounded border border-green-500/20 bg-green-900/10 p-3">
              <p className="text-sm font-medium text-green-300">Selected Calculation Columns:</p>
              <p className="text-sm text-green-200">
                {columnSelection.calculationColumns.map(getColumnLabel).join(", ")}
              </p>
            </div>
          </div>

          {/* Increment Month Selection */}
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
            <p className="text-xs text-gray-400">
              Analysis will be split: Apr-Sep (pre-increment) and {incrementMonth}-Mar (post-increment)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5" />
              MoM Analysis Results
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-blue-500/20 px-2 py-1 text-xs text-blue-300">
                {momData.length} employees
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Summary Statistics */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-400">Positive Variance</span>
                </div>
                <p className="text-2xl font-bold text-green-400">
                  {momData.filter(emp => emp.variance > 0).length}
                </p>
              </div>
              <div className="rounded border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-gray-400">Negative Variance</span>
                </div>
                <p className="text-2xl font-bold text-red-400">
                  {momData.filter(emp => emp.variance < 0).length}
                </p>
              </div>
              <div className="rounded border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2">
                  <Minus className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-400">No Variance</span>
                </div>
                <p className="text-2xl font-bold text-gray-400">
                  {momData.filter(emp => emp.variance === 0).length}
                </p>
              </div>
            </div>

            {/* Detailed Results Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white">Employee Code</TableHead>
                    <TableHead className="text-white">Employee Name</TableHead>
                    <TableHead className="text-white">DOJ</TableHead>
                    <TableHead className="text-white">DOL</TableHead>
                    <TableHead className="text-white">Apr-Sep Total</TableHead>
                    <TableHead className="text-white">{incrementMonth}-Mar Total</TableHead>
                    <TableHead className="text-white">Variance</TableHead>
                    <TableHead className="text-white">Variance %</TableHead>
                    <TableHead className="text-white">Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {momData.map((employee) => (
                    <TableRow key={employee.employeeCode}>
                      <TableCell className="text-white">{employee.employeeCode}</TableCell>
                      <TableCell className="text-white">{employee.employeeName}</TableCell>
                      <TableCell className="text-white">{employee.doj}</TableCell>
                      <TableCell className="text-white">{employee.dol || "-"}</TableCell>
                      <TableCell className="text-white">{employee.aprSepTotal.toLocaleString()}</TableCell>
                      <TableCell className="text-white">{employee.octMarTotal.toLocaleString()}</TableCell>
                      <TableCell className="text-white">
                        <div className="flex items-center gap-2">
                          {getVarianceIcon(employee.variance)}
                          <span className={getVarianceColor(employee.variance)}>
                            {employee.variance.toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-white">
                        <span className={getVarianceColor(employee.variance)}>
                          {employee.variancePercentage.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-white">
                        <Input
                          type="text"
                          value={employee.remarks}
                          onChange={(e) => updateRemarks(employee.employeeCode, e.target.value)}
                          placeholder="Enter remarks..."
                          className="w-64 border-white/10 bg-black/40 text-white"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Analysis Notes */}
            <div className="rounded border border-yellow-500/20 bg-yellow-900/10 p-4">
              <h4 className="font-medium text-yellow-300">Analysis Notes</h4>
              <ul className="mt-2 space-y-1 text-sm text-yellow-200">
                <li>• New hires and resignations are automatically flagged with standard remarks</li>
                <li>• Variance calculations are based on the sum of selected calculation columns</li>
                <li>• Analysis period is split at the selected increment month</li>
                <li>• Manual remarks can be added for other variance explanations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

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
