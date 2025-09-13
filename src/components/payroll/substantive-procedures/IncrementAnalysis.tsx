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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Play,
  Download,
  FileText,
  Settings,
  Calculator,
  BarChart3,
  LineChart as LineChartIcon,
  Upload,
  Users,
  DollarSign,
} from "lucide-react";

interface IncrementAnalysisProps {
  onBack?: () => void;
}

interface IncrementData {
  employeeCode: string;
  employeeName: string;
  doj: string;
  department: string;
  previousYearTotal: number;
  currentYearTotal: number;
  increment: number;
  incrementPercentage: number;
}

interface ColumnSelection {
  displayColumns: string[];
  calculationColumns: string[];
}

const AVAILABLE_COLUMNS = [
  { value: "employee_code", label: "Employee Code", icon: <Users className="h-4 w-4" /> },
  { value: "employee_name", label: "Employee Name", icon: <Users className="h-4 w-4" /> },
  { value: "doj", label: "Date of Joining", icon: <Users className="h-4 w-4" /> },
  { value: "department", label: "Department", icon: <Users className="h-4 w-4" /> },
  { value: "designation", label: "Designation", icon: <Users className="h-4 w-4" /> },
  { value: "basic", label: "Basic Salary", icon: <DollarSign className="h-4 w-4" /> },
  { value: "hra", label: "HRA", icon: <DollarSign className="h-4 w-4" /> },
  { value: "da", label: "DA", icon: <DollarSign className="h-4 w-4" /> },
  { value: "allowances", label: "Allowances", icon: <DollarSign className="h-4 w-4" /> },
  { value: "monthly_ctc", label: "Monthly CTC", icon: <DollarSign className="h-4 w-4" /> },
  { value: "annual_ctc", label: "Annual CTC", icon: <DollarSign className="h-4 w-4" /> },
];

export default function IncrementAnalysis({ onBack }: IncrementAnalysisProps) {
  const [columnSelection, setColumnSelection] = useState<ColumnSelection>({
    displayColumns: ["employee_code", "employee_name", "doj", "department"],
    calculationColumns: ["monthly_ctc"],
  });
  const [incrementData, setIncrementData] = useState<IncrementData[]>([]);
  const [processingStatus, setProcessingStatus] = useState<"idle" | "running" | "completed" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [showSelectedColumns, setShowSelectedColumns] = useState(false);
  const [ctcFileUploaded, setCtcFileUploaded] = useState(false);
  const [reconciliationInput, setReconciliationInput] = useState(0);
  const [averageIncrement, setAverageIncrement] = useState(0);
  const [showCharts, setShowCharts] = useState(true);

  // Generate sample data for demonstration
  useEffect(() => {
    const sampleData: IncrementData[] = [
      {
        employeeCode: "EMP001",
        employeeName: "John Doe",
        doj: "2023-01-15",
        department: "Engineering",
        previousYearTotal: 600000,
        currentYearTotal: 660000,
        increment: 60000,
        incrementPercentage: 10.0,
      },
      {
        employeeCode: "EMP002",
        employeeName: "Jane Smith",
        doj: "2023-06-01",
        department: "Marketing",
        previousYearTotal: 480000,
        currentYearTotal: 528000,
        increment: 48000,
        incrementPercentage: 10.0,
      },
      {
        employeeCode: "EMP003",
        employeeName: "Mike Johnson",
        doj: "2022-03-10",
        department: "Sales",
        previousYearTotal: 720000,
        currentYearTotal: 792000,
        increment: 72000,
        incrementPercentage: 10.0,
      },
      {
        employeeCode: "EMP004",
        employeeName: "Sarah Wilson",
        doj: "2023-08-20",
        department: "HR",
        previousYearTotal: 540000,
        currentYearTotal: 594000,
        increment: 54000,
        incrementPercentage: 10.0,
      },
    ];
    setIncrementData(sampleData);
    
    // Calculate average increment
    const avgIncrement = sampleData.reduce((sum, emp) => sum + emp.incrementPercentage, 0) / sampleData.length;
    setAverageIncrement(avgIncrement);
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

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Simulate file upload
    setCtcFileUploaded(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const runIncrementAnalysis = async () => {
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

  const canRunAnalysis = () => {
    return ctcFileUploaded && 
           columnSelection.displayColumns.length > 0 && 
           columnSelection.calculationColumns.length > 0;
  };

  // Prepare chart data
  const chartData = [
    { year: "2023", increment: 8.5, headcount: 1200 },
    { year: "2024", increment: averageIncrement, headcount: 1350 },
    { year: "2025", increment: 11.2, headcount: 1500 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Increment Analysis</h2>
          <p className="text-gray-400">
            Analyze salary increments year-over-year with trend visualization
          </p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
        )}
      </div>

      {/* File Upload Section */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Upload className="h-5 w-5" />
            CTC Register Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded border border-blue-500/20 bg-blue-900/10 p-3 text-sm text-blue-200">
            <p className="font-medium">Upload CTC register for the month before increment:</p>
            <p className="mt-1">This will be compared with the CTC report uploaded in IPE Testing to calculate increments.</p>
          </div>

          <div className="space-y-3">
            <Label className="text-white">Upload CTC Register File</Label>
            <div className="flex items-center gap-3">
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="border-white/10 bg-black/40 text-white"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('ctc-file')?.click()}
                className="border-white/10"
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {ctcFileUploaded && (
            <div className="rounded border border-green-500/20 bg-green-500/10 p-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-300">CTC Register uploaded successfully</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
            <Label className="text-white">Calculation Columns (for increment analysis)</Label>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {AVAILABLE_COLUMNS.filter(col => 
                ['basic', 'hra', 'da', 'allowances', 'monthly_ctc', 'annual_ctc'].includes(col.value)
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

          {/* Reconciliation Input */}
          <div className="space-y-2">
            <Label className="text-white">Reconciliation Input Value</Label>
            <Input
              type="number"
              value={reconciliationInput}
              onChange={(e) => setReconciliationInput(Number(e.target.value))}
              className="border-white/10 bg-black/40 text-white"
              placeholder="Enter reconciliation value..."
            />
            <p className="text-xs text-gray-400">
              Additional adjustment value for reconciliation purposes
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      {showCharts && (
        <Card className="border-white/10 bg-black/40">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5" />
                Increment Trend Analysis
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCharts(!showCharts)}
                className="border-white/10"
              >
                {showCharts ? "Hide Charts" : "Show Charts"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="year" stroke="#9CA3AF" />
                  <YAxis yAxisId="left" stroke="#9CA3AF" />
                  <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '6px',
                      color: '#F9FAFB'
                    }} 
                  />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="increment" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    name="Average Increment %"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="headcount" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    name="Weighted Average Headcount"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 rounded border border-blue-500/20 bg-blue-900/10 p-3 text-sm text-blue-200">
              <p className="font-medium">Conclusion on the trend displayed above:</p>
              <p className="mt-1">
                The increment trend shows consistent growth patterns aligned with organizational performance. 
                The correlation between increment percentages and headcount growth indicates sustainable 
                compensation practices and positive employee retention.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <Calculator className="h-5 w-5" />
              Increment Analysis Results
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-blue-500/20 px-2 py-1 text-xs text-blue-300">
                {incrementData.length} employees
              </span>
              <span className="rounded bg-green-500/20 px-2 py-1 text-xs text-green-300">
                Avg: {averageIncrement.toFixed(1)}%
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Summary Statistics */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="rounded border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-400">Average Increment</span>
                </div>
                <p className="text-2xl font-bold text-green-400">
                  {averageIncrement.toFixed(1)}%
                </p>
              </div>
              <div className="rounded border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-400">Total Increment</span>
                </div>
                <p className="text-2xl font-bold text-blue-400">
                  {incrementData.reduce((sum, emp) => sum + emp.increment, 0).toLocaleString()}
                </p>
              </div>
              <div className="rounded border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-gray-400">Employees Analyzed</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">
                  {incrementData.length}
                </p>
              </div>
              <div className="rounded border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-gray-400">Max Increment</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">
                  {Math.max(...incrementData.map(emp => emp.incrementPercentage)).toFixed(1)}%
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
                    <TableHead className="text-white">Department</TableHead>
                    <TableHead className="text-white">Previous Year Total</TableHead>
                    <TableHead className="text-white">Current Year Total</TableHead>
                    <TableHead className="text-white">Increment</TableHead>
                    <TableHead className="text-white">Increment %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incrementData.map((employee) => (
                    <TableRow key={employee.employeeCode}>
                      <TableCell className="text-white">{employee.employeeCode}</TableCell>
                      <TableCell className="text-white">{employee.employeeName}</TableCell>
                      <TableCell className="text-white">{employee.doj}</TableCell>
                      <TableCell className="text-white">{employee.department}</TableCell>
                      <TableCell className="text-white">{employee.previousYearTotal.toLocaleString()}</TableCell>
                      <TableCell className="text-white">{employee.currentYearTotal.toLocaleString()}</TableCell>
                      <TableCell className="text-white">
                        <span className="text-green-400">
                          +{employee.increment.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-white">
                        <span className="text-green-400">
                          +{employee.incrementPercentage.toFixed(1)}%
                        </span>
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
                <li>• Increment calculations are based on the sum of selected calculation columns</li>
                <li>• Comparison is made between CTC report (IPE Testing) and uploaded CTC register</li>
                <li>• Percentage calculations show year-over-year growth in compensation</li>
                <li>• Trend analysis helps identify compensation strategy effectiveness</li>
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
            Execute Increment Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">
                Run comprehensive increment analysis with trend visualization
              </p>
              {!canRunAnalysis() && (
                <p className="mt-1 text-xs text-red-400">
                  Please upload CTC register file and select required columns
                </p>
              )}
            </div>
            <Button
              onClick={runIncrementAnalysis}
              disabled={!canRunAnalysis() || processingStatus === "running"}
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

          {/* Progress Indicator */}
          {processingStatus === "running" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-indigo-300">Processing Increment Analysis...</span>
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
                  <h4 className="font-medium text-green-300">Increment Analysis Completed</h4>
                  <p className="text-sm text-green-200">
                    Comprehensive increment analysis has been completed successfully
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
                  View Trend Analysis
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
