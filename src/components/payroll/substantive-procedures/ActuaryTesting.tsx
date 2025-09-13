"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Label } from "../../ui/label";
import { Progress } from "../../ui/progress";
import { Textarea } from "../../ui/textarea";
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
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  Play,
  Download,
  Users,
  Calculator,
  Shield,
  FileCheck,
  UserCheck,
  ClipboardList,
} from "lucide-react";

interface ActuaryTestingProps {
  onBack?: () => void;
}

interface ActuaryData {
  employeeCount: number;
  ctcCount: number;
  difference: number;
  reconciliationRows: Array<{ id: string; description: string; amount: number }>;
  netDifference: number;
}

interface AccuracyCheck {
  uniqueValueCTC: string;
  uniqueValueActuary: string;
  columnsToTestCTC: string[];
  columnsToTestActuary: string[];
}

interface ExpertEvaluation {
  competence: string;
  capabilities: string;
  objectivity: string;
  workUnderstanding: string;
  appropriateness: string;
}

export default function ActuaryTesting({ onBack }: ActuaryTestingProps) {
  const [actuaryFileUploaded, setActuaryFileUploaded] = useState(false);
  const [actuaryData, setActuaryData] = useState<ActuaryData>({
    employeeCount: 0,
    ctcCount: 0,
    difference: 0,
    reconciliationRows: [],
    netDifference: 0,
  });
  const [accuracyCheck, setAccuracyCheck] = useState<AccuracyCheck>({
    uniqueValueCTC: "",
    uniqueValueActuary: "",
    columnsToTestCTC: [],
    columnsToTestActuary: [],
  });
  const [expertEvaluation, setExpertEvaluation] = useState<ExpertEvaluation>({
    competence: "",
    capabilities: "",
    objectivity: "",
    workUnderstanding: "",
    appropriateness: "",
  });
  const [processingStatus, setProcessingStatus] = useState<"idle" | "running" | "completed" | "error">("idle");
  const [progress, setProgress] = useState(0);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setActuaryFileUploaded(true);
    // Simulate data extraction
    setActuaryData(prev => ({
      ...prev,
      employeeCount: 1250, // Simulated count from uploaded file
    }));
  };

  const addReconciliationRow = () => {
    const newRow = {
      id: `recon_${Date.now()}`,
      description: "",
      amount: 0,
    };
    setActuaryData(prev => ({
      ...prev,
      reconciliationRows: [...prev.reconciliationRows, newRow],
    }));
  };

  const removeReconciliationRow = (id: string) => {
    setActuaryData(prev => ({
      ...prev,
      reconciliationRows: prev.reconciliationRows.filter(row => row.id !== id),
    }));
  };

  const updateReconciliationRow = (id: string, field: string, value: string | number) => {
    setActuaryData(prev => ({
      ...prev,
      reconciliationRows: prev.reconciliationRows.map(row =>
        row.id === id ? { ...row, [field]: value } : row
      ),
    }));
  };

  const calculateNetDifference = () => {
    const difference = actuaryData.employeeCount - actuaryData.ctcCount;
    const reconciliationTotal = actuaryData.reconciliationRows.reduce((sum, row) => sum + row.amount, 0);
    const netDifference = difference - reconciliationTotal;
    
    setActuaryData(prev => ({
      ...prev,
      difference,
      netDifference,
    }));
  };

  useEffect(() => {
    calculateNetDifference();
  }, [actuaryData.employeeCount, actuaryData.ctcCount, actuaryData.reconciliationRows]);

  const runActuaryTesting = async () => {
    setProcessingStatus("running");
    setProgress(0);

    try {
      // Simulate testing process
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setProgress(i);
      }

      setProcessingStatus("completed");
    } catch (error) {
      setProcessingStatus("error");
    }
  };

  const canRunTesting = () => {
    return actuaryFileUploaded && 
           actuaryData.ctcCount > 0 &&
           accuracyCheck.uniqueValueCTC && 
           accuracyCheck.uniqueValueActuary &&
           accuracyCheck.columnsToTestCTC.length > 0 &&
           accuracyCheck.columnsToTestActuary.length > 0;
  };

  const columnOptions = [
    "Employee Code", "Employee Name", "Date of Birth", "Date of Joining", 
    "Basic Pay", "HRA", "DA", "Allowances", "Gross Pay", "Designation", 
    "Department", "PAN", "PF", "ESI", "Total Deductions", "Net Pay"
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Actuary Testing</h2>
          <p className="text-gray-400">
            Test actuarial calculations and validate data sent to actuary
          </p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
        )}
      </div>

      {/* Data Upload Section */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Upload className="h-5 w-5" />
            Data Sent to Actuary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded border border-blue-500/20 bg-blue-900/10 p-3 text-sm text-blue-200">
            <p className="font-medium">Upload the data sent to actuary by the entity:</p>
            <p className="mt-1">This data will be compared with the CTC Report uploaded in IPE Testing.</p>
          </div>

          <div className="space-y-3">
            <Label className="text-white">Upload Actuary Data File</Label>
            <div className="flex items-center gap-3">
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="border-white/10 bg-black/40 text-white"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('actuary-file')?.click()}
                className="border-white/10"
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {actuaryFileUploaded && (
            <div className="rounded border border-green-500/20 bg-green-500/10 p-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-300">Actuary data uploaded successfully</span>
              </div>
              <div className="mt-1 text-sm text-green-200">
                Employee count extracted: {actuaryData.employeeCount}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completeness Check */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Users className="h-5 w-5" />
            Completeness Check
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-white">As per Data sent to Actuary (A)</Label>
              <Input
                type="number"
                value={actuaryData.employeeCount}
                onChange={(e) => setActuaryData(prev => ({ ...prev, employeeCount: Number(e.target.value) }))}
                className="border-white/10 bg-black/40 text-white"
                placeholder="Enter count..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">As per CTC Report (B)</Label>
              <Input
                type="number"
                value={actuaryData.ctcCount}
                onChange={(e) => setActuaryData(prev => ({ ...prev, ctcCount: Number(e.target.value) }))}
                className="border-white/10 bg-black/40 text-white"
                placeholder="Enter count..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Difference (C) = (A) - (B)</Label>
            <Input
              type="number"
              value={actuaryData.difference}
              readOnly
              className="border-white/10 bg-black/40 text-white"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-white">Reconciliation Adjustments</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={addReconciliationRow}
                className="border-white/10"
              >
                Add Row
              </Button>
            </div>
            
            {actuaryData.reconciliationRows.map((row) => (
              <div key={row.id} className="flex items-center gap-3">
                <Input
                  type="text"
                  value={row.description}
                  onChange={(e) => updateReconciliationRow(row.id, 'description', e.target.value)}
                  placeholder="Description"
                  className="flex-1 border-white/10 bg-black/40 text-white"
                />
                <Input
                  type="number"
                  value={row.amount}
                  onChange={(e) => updateReconciliationRow(row.id, 'amount', Number(e.target.value))}
                  placeholder="Amount"
                  className="w-24 border-white/10 bg-black/40 text-white"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeReconciliationRow(row.id)}
                  className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label className="text-white">Net Difference</Label>
            <Input
              type="number"
              value={actuaryData.netDifference}
              readOnly
              className="border-white/10 bg-black/40 text-white font-medium"
            />
          </div>
        </CardContent>
      </Card>

      {/* Accuracy Check */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <FileCheck className="h-5 w-5" />
            Accuracy Check
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded border border-yellow-500/20 bg-yellow-900/10 p-3 text-sm text-yellow-200">
            <p className="font-medium">Column Mapping for Accuracy Testing:</p>
            <p className="mt-1">Map columns between CTC Report and Actuary data for comparison.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-white">CTC Report - Unique Value for Testing</Label>
              <Select
                value={accuracyCheck.uniqueValueCTC}
                onValueChange={(value) => setAccuracyCheck(prev => ({ ...prev, uniqueValueCTC: value }))}
              >
                <SelectTrigger className="border-white/10 bg-black/40 text-white">
                  <SelectValue placeholder="Select column..." />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-black/90 text-white">
                  {columnOptions.map((column) => (
                    <SelectItem key={column} value={column}>
                      {column}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Data sent to Actuary - Unique Value for Testing</Label>
              <Select
                value={accuracyCheck.uniqueValueActuary}
                onValueChange={(value) => setAccuracyCheck(prev => ({ ...prev, uniqueValueActuary: value }))}
              >
                <SelectTrigger className="border-white/10 bg-black/40 text-white">
                  <SelectValue placeholder="Select column..." />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-black/90 text-white">
                  {columnOptions.map((column) => (
                    <SelectItem key={column} value={column}>
                      {column}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-white">CTC Report - Columns to be Tested</Label>
              <Select
                value=""
                onValueChange={(value) => {
                  if (value && !accuracyCheck.columnsToTestCTC.includes(value)) {
                    setAccuracyCheck(prev => ({
                      ...prev,
                      columnsToTestCTC: [...prev.columnsToTestCTC, value]
                    }));
                  }
                }}
              >
                <SelectTrigger className="border-white/10 bg-black/40 text-white">
                  <SelectValue placeholder="Select columns..." />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-black/90 text-white">
                  {columnOptions.map((column) => (
                    <SelectItem key={column} value={column}>
                      {column}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2">
                {accuracyCheck.columnsToTestCTC.map((column) => (
                  <span
                    key={column}
                    className="rounded bg-blue-500/20 px-2 py-1 text-xs text-blue-300"
                  >
                    {column}
                    <button
                      onClick={() => setAccuracyCheck(prev => ({
                        ...prev,
                        columnsToTestCTC: prev.columnsToTestCTC.filter(c => c !== column)
                      }))}
                      className="ml-1 text-blue-400 hover:text-blue-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Data sent to Actuary - Columns to be Tested</Label>
              <Select
                value=""
                onValueChange={(value) => {
                  if (value && !accuracyCheck.columnsToTestActuary.includes(value)) {
                    setAccuracyCheck(prev => ({
                      ...prev,
                      columnsToTestActuary: [...prev.columnsToTestActuary, value]
                    }));
                  }
                }}
              >
                <SelectTrigger className="border-white/10 bg-black/40 text-white">
                  <SelectValue placeholder="Select columns..." />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-black/90 text-white">
                  {columnOptions.map((column) => (
                    <SelectItem key={column} value={column}>
                      {column}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2">
                {accuracyCheck.columnsToTestActuary.map((column) => (
                  <span
                    key={column}
                    className="rounded bg-green-500/20 px-2 py-1 text-xs text-green-300"
                  >
                    {column}
                    <button
                      onClick={() => setAccuracyCheck(prev => ({
                        ...prev,
                        columnsToTestActuary: prev.columnsToTestActuary.filter(c => c !== column)
                      }))}
                      className="ml-1 text-green-400 hover:text-green-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expert Evaluation */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <UserCheck className="h-5 w-5" />
            Expert Evaluation Documentation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded border border-purple-500/20 bg-purple-900/10 p-3 text-sm text-purple-200">
            <p className="font-medium">Document conclusion on the performance of the following procedures:</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">a. Evaluate the competence, capabilities and objectivity of that expert</Label>
              <Textarea
                value={expertEvaluation.competence}
                onChange={(e) => setExpertEvaluation(prev => ({ ...prev, competence: e.target.value }))}
                className="border-white/10 bg-black/40 text-white"
                placeholder="Document evaluation of expert competence, capabilities and objectivity..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">b. Obtain an understanding of the work of that expert</Label>
              <Textarea
                value={expertEvaluation.workUnderstanding}
                onChange={(e) => setExpertEvaluation(prev => ({ ...prev, workUnderstanding: e.target.value }))}
                className="border-white/10 bg-black/40 text-white"
                placeholder="Document understanding of expert's work..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">c. Evaluate the appropriateness of that expert's work as audit evidence</Label>
              <Textarea
                value={expertEvaluation.appropriateness}
                onChange={(e) => setExpertEvaluation(prev => ({ ...prev, appropriateness: e.target.value }))}
                className="border-white/10 bg-black/40 text-white"
                placeholder="Document evaluation of appropriateness of expert's work..."
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actuary Reports Documentation */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <ClipboardList className="h-5 w-5" />
            Actuary Reports Documentation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded border border-indigo-500/20 bg-indigo-900/10 p-3 text-sm text-indigo-200">
            <p className="font-medium">Document the actuary reports received and testing performed:</p>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Actuary Reports and Testing Documentation</Label>
            <Textarea
              className="border-white/10 bg-black/40 text-white"
              placeholder="Document the actuary reports received for the current period and our testing on the same..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Execution Section */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Play className="h-5 w-5" />
            Execute Actuary Testing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">
                Run comprehensive actuary testing with completeness and accuracy checks
              </p>
              {!canRunTesting() && (
                <p className="mt-1 text-xs text-red-400">
                  Please upload actuary data, complete column mappings, and enter CTC count
                </p>
              )}
            </div>
            <Button
              onClick={runActuaryTesting}
              disabled={!canRunTesting() || processingStatus === "running"}
              className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50"
            >
              {processingStatus === "running" ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Testing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Actuary Testing
                </>
              )}
            </Button>
          </div>

          {/* Progress Indicator */}
          {processingStatus === "running" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-cyan-300">Processing Actuary Testing...</span>
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
                  <h4 className="font-medium text-green-300">Actuary Testing Completed</h4>
                  <p className="text-sm text-green-200">
                    All actuary testing procedures have been completed successfully
                  </p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" className="border-green-500/30 text-green-300">
                  <Download className="mr-2 h-4 w-4" />
                  Download Report
                </Button>
                <Button variant="outline" className="border-green-500/30 text-green-300">
                  <FileText className="mr-2 h-4 w-4" />
                  View Analysis
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
