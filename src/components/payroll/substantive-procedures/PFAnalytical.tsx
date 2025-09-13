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
  Calculator,
  CheckCircle,
  AlertTriangle,
  Play,
  Download,
  FileText,
  Settings,
  DollarSign,
  Percent,
  BarChart3,
} from "lucide-react";

interface PFAnalyticalProps {
  onBack?: () => void;
}

interface LedgerAccount {
  id: string;
  name: string;
  amount: number;
  selected: boolean;
}

interface PFCalculation {
  recordedAmount: number;
  salaryAmount: number;
  percentage: number;
  expectedPF: number;
  difference: number;
  threshold: number;
  withinThreshold: boolean;
}

const SAMPLE_LEDGER_ACCOUNTS: LedgerAccount[] = [
  { id: "pf_001", name: "Provident Fund - Employee Contribution", amount: 450000, selected: false },
  { id: "pf_002", name: "Provident Fund - Employer Contribution", amount: 450000, selected: false },
  { id: "pf_003", name: "EPF Contribution", amount: 380000, selected: false },
  { id: "pf_004", name: "EPS Contribution", amount: 70000, selected: false },
  { id: "pf_005", name: "Basic Salary", amount: 2500000, selected: false },
  { id: "pf_006", name: "HRA", amount: 1200000, selected: false },
  { id: "pf_007", name: "DA", amount: 800000, selected: false },
  { id: "pf_008", name: "Allowances", amount: 600000, selected: false },
  { id: "pf_009", name: "Gross Salary", amount: 5100000, selected: false },
];

export default function PFAnalytical({ onBack }: PFAnalyticalProps) {
  const [ledgerAccounts, setLedgerAccounts] = useState<LedgerAccount[]>(SAMPLE_LEDGER_ACCOUNTS);
  const [pfAccounts, setPfAccounts] = useState<string[]>([]);
  const [salaryAccounts, setSalaryAccounts] = useState<string[]>([]);
  const [percentage, setPercentage] = useState<number>(12);
  const [pfCalculation, setPfCalculation] = useState<PFCalculation | null>(null);
  const [processingStatus, setProcessingStatus] = useState<"idle" | "running" | "completed" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [riskAssessment, setRiskAssessment] = useState<string>("Higher");
  const [controlReliance, setControlReliance] = useState<string>("Relying on controls");
  const [performanceMateriality, setPerformanceMateriality] = useState<number>(21600000);

  const handleLedgerToggle = (ledgerId: string, type: 'pf' | 'salary') => {
    if (type === 'pf') {
      setPfAccounts(prev =>
        prev.includes(ledgerId)
          ? prev.filter(id => id !== ledgerId)
          : [...prev, ledgerId]
      );
    } else {
      setSalaryAccounts(prev =>
        prev.includes(ledgerId)
          ? prev.filter(id => id !== ledgerId)
          : [...prev, ledgerId]
      );
    }
  };

  const getThreshold = () => {
    // Simplified threshold calculation based on risk assessment and control reliance
    let thresholdPercentage = 0;
    
    if (riskAssessment === "Lower" && controlReliance === "Not relying on controls") {
      thresholdPercentage = 65;
    } else if (riskAssessment === "Higher" && controlReliance === "Relying on controls") {
      thresholdPercentage = 45;
    } else if (riskAssessment === "Lower" && controlReliance === "Relying on controls") {
      thresholdPercentage = 95;
    } else if (riskAssessment === "Higher" && controlReliance === "Not relying on controls") {
      thresholdPercentage = 90;
    } else if (riskAssessment === "Significant" && controlReliance === "Relying on controls") {
      thresholdPercentage = 50;
    }
    
    return (thresholdPercentage / 100) * performanceMateriality;
  };

  const calculatePF = () => {
    const selectedPfAccounts = ledgerAccounts.filter(ledger => pfAccounts.includes(ledger.id));
    const selectedSalaryAccounts = ledgerAccounts.filter(ledger => salaryAccounts.includes(ledger.id));
    
    const recordedAmount = selectedPfAccounts.reduce((sum, ledger) => sum + ledger.amount, 0);
    const salaryAmount = selectedSalaryAccounts.reduce((sum, ledger) => sum + ledger.amount, 0);
    const expectedPF = (percentage / 100) * salaryAmount;
    const difference = Math.abs(expectedPF - recordedAmount);
    const threshold = getThreshold();
    const withinThreshold = difference <= threshold;
    
    setPfCalculation({
      recordedAmount,
      salaryAmount,
      percentage,
      expectedPF,
      difference,
      threshold,
      withinThreshold,
    });
  };

  const runPFAnalytical = async () => {
    setProcessingStatus("running");
    setProgress(0);

    try {
      // Simulate analysis process
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setProgress(i);
      }

      calculatePF();
      setProcessingStatus("completed");
    } catch (error) {
      setProcessingStatus("error");
    }
  };

  const canRunAnalysis = () => {
    return pfAccounts.length > 0 && 
           salaryAccounts.length > 0 && 
           percentage > 0 && 
           percentage <= 100;
  };

  const getStatusIcon = (withinThreshold: boolean) => {
    return withinThreshold ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusColor = (withinThreshold: boolean) => {
    return withinThreshold ? "text-green-400" : "text-red-400";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">PF Analytical</h2>
          <p className="text-gray-400">
            Provident Fund analytical procedures with automated calculations
          </p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
        )}
      </div>

      {/* Ledger Account Selection */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <DollarSign className="h-5 w-5" />
            Ledger Account Selection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* PF Accounts Selection */}
          <div className="space-y-4">
            <div className="rounded border border-blue-500/20 bg-blue-900/10 p-3 text-sm text-blue-200">
              <p className="font-medium">Select ledger accounts comprising of provident fund:</p>
              <p className="mt-1">Choose accounts that represent PF contributions for analytical procedures.</p>
            </div>

            <div className="space-y-3">
              <Label className="text-white">Provident Fund Accounts</Label>
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {ledgerAccounts.filter(ledger => 
                  ledger.name.toLowerCase().includes('provident') || 
                  ledger.name.toLowerCase().includes('pf') ||
                  ledger.name.toLowerCase().includes('epf') ||
                  ledger.name.toLowerCase().includes('eps')
                ).map((ledger) => (
                  <div key={ledger.id} className="flex items-center justify-between rounded border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`pf-${ledger.id}`}
                        checked={pfAccounts.includes(ledger.id)}
                        onCheckedChange={() => handleLedgerToggle(ledger.id, 'pf')}
                      />
                      <div>
                        <Label htmlFor={`pf-${ledger.id}`} className="text-white">
                          {ledger.name}
                        </Label>
                        <div className="text-sm text-gray-400">
                          Amount: ₹{ledger.amount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">
                        {pfAccounts.includes(ledger.id) ? "Selected" : "Not Selected"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Salary Accounts Selection */}
          <div className="space-y-4">
            <div className="rounded border border-green-500/20 bg-green-900/10 p-3 text-sm text-green-200">
              <p className="font-medium">Select ledger accounts comprising basic salary, etc.:</p>
              <p className="mt-1">Choose accounts that represent salary components for PF calculation base.</p>
            </div>

            <div className="space-y-3">
              <Label className="text-white">Salary Accounts</Label>
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {ledgerAccounts.filter(ledger => 
                  ledger.name.toLowerCase().includes('basic') || 
                  ledger.name.toLowerCase().includes('salary') ||
                  ledger.name.toLowerCase().includes('hra') ||
                  ledger.name.toLowerCase().includes('da') ||
                  ledger.name.toLowerCase().includes('allowances') ||
                  ledger.name.toLowerCase().includes('gross')
                ).map((ledger) => (
                  <div key={ledger.id} className="flex items-center justify-between rounded border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`salary-${ledger.id}`}
                        checked={salaryAccounts.includes(ledger.id)}
                        onCheckedChange={() => handleLedgerToggle(ledger.id, 'salary')}
                      />
                      <div>
                        <Label htmlFor={`salary-${ledger.id}`} className="text-white">
                          {ledger.name}
                        </Label>
                        <div className="text-sm text-gray-400">
                          Amount: ₹{ledger.amount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">
                        {salaryAccounts.includes(ledger.id) ? "Selected" : "Not Selected"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Section */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Settings className="h-5 w-5" />
            PF Calculation Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-white">PF Percentage</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={percentage}
                  onChange={(e) => setPercentage(Number(e.target.value))}
                  className="border-white/10 bg-black/40 text-white"
                  placeholder="Enter percentage..."
                />
                <span className="text-white">%</span>
              </div>
              <p className="text-xs text-gray-400">
                Standard PF rate is 12% (Employee + Employer)
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Risk Assessment</Label>
              <Select value={riskAssessment} onValueChange={setRiskAssessment}>
                <SelectTrigger className="border-white/10 bg-black/40 text-white">
                  <SelectValue placeholder="Select risk level" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-black/90 text-white">
                  <SelectItem value="Lower">Lower</SelectItem>
                  <SelectItem value="Higher">Higher</SelectItem>
                  <SelectItem value="Significant">Significant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Control Reliance</Label>
              <Select value={controlReliance} onValueChange={setControlReliance}>
                <SelectTrigger className="border-white/10 bg-black/40 text-white">
                  <SelectValue placeholder="Select control reliance" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-black/90 text-white">
                  <SelectItem value="Relying on controls">Relying on controls</SelectItem>
                  <SelectItem value="Not relying on controls">Not relying on controls</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Performance Materiality</Label>
            <Input
              type="number"
              value={performanceMateriality}
              onChange={(e) => setPerformanceMateriality(Number(e.target.value))}
              className="border-white/10 bg-black/40 text-white"
              placeholder="Enter amount..."
            />
          </div>
        </CardContent>
      </Card>

      {/* PF Calculation Results */}
      {pfCalculation && (
        <Card className="border-white/10 bg-black/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <Calculator className="h-5 w-5" />
              PF Analytical Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-white">Particulars</TableHead>
                      <TableHead className="text-white">Amount (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-white">Recorded Amount</TableCell>
                      <TableCell className="text-white">{pfCalculation.recordedAmount.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-white">Salary Amount</TableCell>
                      <TableCell className="text-white">{pfCalculation.salaryAmount.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-white">Percentage</TableCell>
                      <TableCell className="text-white">{pfCalculation.percentage}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-white">Expected PF</TableCell>
                      <TableCell className="text-white">{pfCalculation.expectedPF.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-white">Difference</TableCell>
                      <TableCell className="text-white">{pfCalculation.difference.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-white">Threshold</TableCell>
                      <TableCell className="text-white">{pfCalculation.threshold.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-white font-medium">Within Threshold?</TableCell>
                      <TableCell className="text-white">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(pfCalculation.withinThreshold)}
                          <span className={`font-medium ${getStatusColor(pfCalculation.withinThreshold)}`}>
                            {pfCalculation.withinThreshold ? "Yes" : "No"}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {!pfCalculation.withinThreshold && (
                <div className="rounded border border-red-500/20 bg-red-500/10 p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <h4 className="font-medium text-red-300">Threshold Exceeded</h4>
                  </div>
                  <p className="mt-2 text-sm text-red-200">
                    The difference between expected and recorded PF exceeds the calculated threshold. 
                    Additional procedures may be required to address this variance.
                  </p>
                </div>
              )}

              {pfCalculation.withinThreshold && (
                <div className="rounded border border-green-500/20 bg-green-500/10 p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <h4 className="font-medium text-green-300">Within Acceptable Threshold</h4>
                  </div>
                  <p className="mt-2 text-sm text-green-200">
                    The PF calculation is within the acceptable threshold. No additional procedures required.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Execution Section */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Play className="h-5 w-5" />
            Execute PF Analytical
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">
                Run PF analytical procedures with automated calculations
              </p>
              {!canRunAnalysis() && (
                <p className="mt-1 text-xs text-red-400">
                  Please select PF accounts, salary accounts, and enter percentage
                </p>
              )}
            </div>
            <Button
              onClick={runPFAnalytical}
              disabled={!canRunAnalysis() || processingStatus === "running"}
              className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
            >
              {processingStatus === "running" ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Calculating...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run PF Analytical
                </>
              )}
            </Button>
          </div>

          {/* Progress Indicator */}
          {processingStatus === "running" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-teal-300">Processing PF Analytical...</span>
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
                  <h4 className="font-medium text-green-300">PF Analytical Completed</h4>
                  <p className="text-sm text-green-200">
                    PF analytical procedures have been completed successfully
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
