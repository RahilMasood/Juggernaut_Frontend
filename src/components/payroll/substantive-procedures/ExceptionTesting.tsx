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

interface ColumnMapping {
  employeeCode: string;
  month: string;
  designation: string;
  dateOfLeaving: string;
  dateOfJoining: string;
  pan: string;
  grossPay: string;
  netPay: string;
  employeeName: string;
  providentFund: string;
  esi: string;
  totalDeductions: string;
}

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

const COLUMN_OPTIONS = [
  { value: "employee_code", label: "Employee Code/ID", icon: <User className="h-4 w-4" /> },
  { value: "month", label: "Month", icon: <Calendar className="h-4 w-4" /> },
  { value: "designation", label: "Designation", icon: <Building className="h-4 w-4" /> },
  { value: "date_of_leaving", label: "Date of Leaving", icon: <Calendar className="h-4 w-4" /> },
  { value: "date_of_joining", label: "Date of Joining", icon: <Calendar className="h-4 w-4" /> },
  { value: "pan", label: "PAN", icon: <CreditCard className="h-4 w-4" /> },
  { value: "gross_pay", label: "Gross Pay", icon: <CreditCard className="h-4 w-4" /> },
  { value: "net_pay", label: "Net Pay", icon: <CreditCard className="h-4 w-4" /> },
  { value: "employee_name", label: "Employee Name", icon: <User className="h-4 w-4" /> },
  { value: "provident_fund", label: "Provident Fund", icon: <CreditCard className="h-4 w-4" /> },
  { value: "esi", label: "ESI", icon: <CreditCard className="h-4 w-4" /> },
  { value: "total_deductions", label: "Total Deductions", icon: <CreditCard className="h-4 w-4" /> },
];

export default function ExceptionTesting({ onBack }: ExceptionTestingProps) {
  const [exceptions, setExceptions] = useState<Exception[]>(EXCEPTIONS);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    employeeCode: "",
    month: "",
    designation: "",
    dateOfLeaving: "",
    dateOfJoining: "",
    pan: "",
    grossPay: "",
    netPay: "",
    employeeName: "",
    providentFund: "",
    esi: "",
    totalDeductions: "",
  });
  const [processingStatus, setProcessingStatus] = useState<"idle" | "running" | "completed" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Record<number, string>>({});

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

  const handleColumnMappingChange = (field: keyof ColumnMapping, value: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const canRunTests = () => {
    const hasSelectedExceptions = exceptions.some(exp => exp.selected);
    const hasRequiredMappings = columnMapping.employeeCode && columnMapping.month && columnMapping.grossPay && columnMapping.netPay;
    return hasSelectedExceptions && hasRequiredMappings;
  };

  const runExceptionTests = async () => {
    if (!canRunTests()) return;

    setProcessingStatus("running");
    setProgress(0);

    try {
      // Simulate test execution with progress updates
      const selectedExceptions = exceptions.filter(exp => exp.selected);
      
      for (let i = 0; i < selectedExceptions.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProgress(((i + 1) / selectedExceptions.length) * 100);

        // Simulate test results
        const exception = selectedExceptions[i];
        const hasExceptions = Math.random() > 0.7; // 30% chance of finding exceptions
        const exceptionCount = hasExceptions ? Math.floor(Math.random() * 50) + 1 : 0;
        
        const result = hasExceptions 
          ? `${exceptionCount} exceptions found`
          : "No exception found";
        
        setResults(prev => ({
          ...prev,
          [exception.id]: result,
        }));

        setExceptions(prev =>
          prev.map(exp =>
            exp.id === exception.id ? { ...exp, result } : exp
          )
        );
      }

      setProcessingStatus("completed");
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

      {/* Column Mapping Section */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Settings className="h-5 w-5" />
            Column Mapping
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded border border-blue-500/20 bg-blue-900/10 p-3 text-sm text-blue-200">
            <p className="font-medium">Map your payroll register columns to the required fields:</p>
            <p className="mt-1">Select the appropriate column names from your consolidated payroll register.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {COLUMN_OPTIONS.map((column) => (
              <div key={column.value} className="space-y-2">
                <Label className="flex items-center gap-2 text-white">
                  {column.icon}
                  {column.label}
                </Label>
                <Select
                  value={columnMapping[column.value as keyof ColumnMapping] || ""}
                  onValueChange={(value) => handleColumnMappingChange(column.value as keyof ColumnMapping, value)}
                >
                  <SelectTrigger className="border-white/10 bg-black/40 text-white">
                    <SelectValue placeholder="Select column..." />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-black/90 text-white">
                    <SelectItem value="pernr">Pernr</SelectItem>
                    <SelectItem value="employee_id">Employee ID</SelectItem>
                    <SelectItem value="emp_code">Emp Code</SelectItem>
                    <SelectItem value="month_year">Month Year</SelectItem>
                    <SelectItem value="pay_month">Pay Month</SelectItem>
                    <SelectItem value="design_code">Design Code</SelectItem>
                    <SelectItem value="designation">Designation</SelectItem>
                    <SelectItem value="doj">DOJ</SelectItem>
                    <SelectItem value="dol">DOL</SelectItem>
                    <SelectItem value="date_of_joining">Date of Joining</SelectItem>
                    <SelectItem value="date_of_leaving">Date of Leaving</SelectItem>
                    <SelectItem value="pan_number">PAN Number</SelectItem>
                    <SelectItem value="pan">PAN</SelectItem>
                    <SelectItem value="gross">Gross</SelectItem>
                    <SelectItem value="gross_pay">Gross Pay</SelectItem>
                    <SelectItem value="net_pay">Net Pay</SelectItem>
                    <SelectItem value="employee_name">Employee Name</SelectItem>
                    <SelectItem value="emp_name">Emp Name</SelectItem>
                    <SelectItem value="prov_fund">Prov. Fund</SelectItem>
                    <SelectItem value="pf">PF</SelectItem>
                    <SelectItem value="esi">E.S.I</SelectItem>
                    <SelectItem value="ded_tot">Ded Tot</SelectItem>
                    <SelectItem value="total_deductions">Total Deductions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-gray-400">
              Required fields: Employee Code, Month, Gross Pay, Net Pay
            </div>
            <div className="flex items-center gap-2">
              {columnMapping.employeeCode && columnMapping.month && columnMapping.grossPay && columnMapping.netPay ? (
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <CheckCircle className="h-3 w-3" />
                  Required mappings complete
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-red-400">
                  <AlertTriangle className="h-3 w-3" />
                  Missing required mappings
                </span>
              )}
            </div>
          </div>
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
                  Please select at least one exception test and complete required column mappings
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
                <Button variant="outline" className="border-green-500/30 text-green-300">
                  <FileText className="mr-2 h-4 w-4" />
                  View Detailed Results
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
