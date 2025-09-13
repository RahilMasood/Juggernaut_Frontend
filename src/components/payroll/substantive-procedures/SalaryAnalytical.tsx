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
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Play,
  Download,
  FileText,
  Settings,
  DollarSign,
  Users,
  BarChart3,
} from "lucide-react";

interface SalaryAnalyticalProps {
  onBack?: () => void;
}

interface LedgerAccount {
  id: string;
  name: string;
  amount: number;
  selected: boolean;
}

interface ThresholdGuide {
  riskLevel: string;
  controlReliance: string;
  populationPercentage: number;
  materialityPercentage: number;
}

interface SalaryExpectation {
  previousYearAmount: number;
  currentYearAmount: number;
  expectedAmount: number;
  difference: number;
  threshold: number;
  withinThreshold: boolean;
}

const THRESHOLD_GUIDE: ThresholdGuide[] = [
  { riskLevel: "Lower", controlReliance: "Not relying on controls", populationPercentage: 22, materialityPercentage: 65 },
  { riskLevel: "Higher", controlReliance: "Relying on controls", populationPercentage: 15, materialityPercentage: 45 },
  { riskLevel: "Lower", controlReliance: "Relying on controls", populationPercentage: 35, materialityPercentage: 95 },
  { riskLevel: "Higher", controlReliance: "Not relying on controls", populationPercentage: 25, materialityPercentage: 90 },
  { riskLevel: "Significant", controlReliance: "Relying on controls", populationPercentage: 20, materialityPercentage: 50 },
];

const SAMPLE_LEDGER_ACCOUNTS: LedgerAccount[] = [
  { id: "ledger_001", name: "Salaries and Wages - Engineering", amount: 2500000, selected: false },
  { id: "ledger_002", name: "Salaries and Wages - Marketing", amount: 1800000, selected: false },
  { id: "ledger_003", name: "Salaries and Wages - Sales", amount: 2200000, selected: false },
  { id: "ledger_004", name: "Salaries and Wages - HR", amount: 800000, selected: false },
  { id: "ledger_005", name: "Salaries and Wages - Finance", amount: 1200000, selected: false },
  { id: "ledger_006", name: "Salaries and Wages - Operations", amount: 1500000, selected: false },
  { id: "ledger_007", name: "Salaries and Wages - Admin", amount: 600000, selected: false },
  { id: "ledger_008", name: "Salaries and Wages - IT", amount: 900000, selected: false },
];

export default function SalaryAnalytical({ onBack }: SalaryAnalyticalProps) {
  const [ledgerAccounts, setLedgerAccounts] = useState<LedgerAccount[]>(SAMPLE_LEDGER_ACCOUNTS);
  const [excludedAccounts, setExcludedAccounts] = useState<string[]>([]);
  const [riskAssessment, setRiskAssessment] = useState<string>("");
  const [controlReliance, setControlReliance] = useState<string>("");
  const [performanceMateriality, setPerformanceMateriality] = useState<number>(21600000);
  const [weightedAvgHeadcountPY, setWeightedAvgHeadcountPY] = useState<number>(1601.06);
  const [salaryExpectation, setSalaryExpectation] = useState<SalaryExpectation | null>(null);
  const [processingStatus, setProcessingStatus] = useState<"idle" | "running" | "completed" | "error">("idle");
  const [progress, setProgress] = useState(0);

  const handleLedgerToggle = (ledgerId: string) => {
    setLedgerAccounts(prev =>
      prev.map(ledger =>
        ledger.id === ledgerId ? { ...ledger, selected: !ledger.selected } : ledger
      )
    );
  };

  const handleExcludedToggle = (ledgerId: string) => {
    setExcludedAccounts(prev =>
      prev.includes(ledgerId)
        ? prev.filter(id => id !== ledgerId)
        : [...prev, ledgerId]
    );
  };

  const getThreshold = () => {
    const guide = THRESHOLD_GUIDE.find(g => 
      g.riskLevel === riskAssessment && g.controlReliance === controlReliance
    );
    
    if (!guide) return 0;
    
    const populationThreshold = (guide.populationPercentage / 100) * performanceMateriality;
    const materialityThreshold = (guide.materialityPercentage / 100) * performanceMateriality;
    
    return Math.min(populationThreshold, materialityThreshold);
  };

  const calculateSalaryExpectation = () => {
    const selectedLedgers = ledgerAccounts.filter(ledger => 
      ledger.selected && !excludedAccounts.includes(ledger.id)
    );
    
    const totalCurrentYear = selectedLedgers.reduce((sum, ledger) => sum + ledger.amount, 0);
    const totalPreviousYear = totalCurrentYear * 0.9; // Simulate 10% growth assumption
    
    const expectedAmount = totalPreviousYear * (weightedAvgHeadcountPY / 1500); // Adjust for headcount
    const difference = Math.abs(totalCurrentYear - expectedAmount);
    const threshold = getThreshold();
    const withinThreshold = difference <= threshold;
    
    setSalaryExpectation({
      previousYearAmount: totalPreviousYear,
      currentYearAmount: totalCurrentYear,
      expectedAmount,
      difference,
      threshold,
      withinThreshold,
    });
  };

  const runSalaryAnalytical = async () => {
    setProcessingStatus("running");
    setProgress(0);

    try {
      // Simulate analysis process
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setProgress(i);
      }

      calculateSalaryExpectation();
      setProcessingStatus("completed");
    } catch (error) {
      setProcessingStatus("error");
    }
  };

  const canRunAnalysis = () => {
    return riskAssessment && 
           controlReliance && 
           performanceMateriality > 0 && 
           weightedAvgHeadcountPY > 0 &&
           ledgerAccounts.some(ledger => ledger.selected);
  };

  const getControlRelianceOptions = () => {
    if (riskAssessment === "Significant") {
      return ["Relying on controls"];
    }
    return ["Relying on controls", "Not relying on controls"];
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
          <h2 className="text-2xl font-bold text-white">Salary Analytical</h2>
          <p className="text-gray-400">
            Develop expectations for current year salary based on previous year data
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
        <CardContent className="space-y-4">
          <div className="rounded border border-blue-500/20 bg-blue-900/10 p-3 text-sm text-blue-200">
            <p className="font-medium">Select ledger accounts marked as 'Salaries and Wages' in TB Mapping:</p>
            <p className="mt-1">Choose which accounts to include in the analytical procedure.</p>
          </div>

          <div className="space-y-3">
            <Label className="text-white">Available Ledger Accounts</Label>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {ledgerAccounts.map((ledger) => (
                <div key={ledger.id} className="flex items-center justify-between rounded border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={`ledger-${ledger.id}`}
                      checked={ledger.selected}
                      onCheckedChange={() => handleLedgerToggle(ledger.id)}
                    />
                    <div>
                      <Label htmlFor={`ledger-${ledger.id}`} className="text-white">
                        {ledger.name}
                      </Label>
                      <div className="text-sm text-gray-400">
                        Amount: ₹{ledger.amount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">
                      {ledger.selected ? "Included" : "Excluded"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-white">Excluded Accounts (Optional)</Label>
            <div className="max-h-32 space-y-2 overflow-y-auto">
              {ledgerAccounts.filter(ledger => ledger.selected).map((ledger) => (
                <div key={ledger.id} className="flex items-center gap-3">
                  <Checkbox
                    id={`exclude-${ledger.id}`}
                    checked={excludedAccounts.includes(ledger.id)}
                    onCheckedChange={() => handleExcludedToggle(ledger.id)}
                  />
                  <Label htmlFor={`exclude-${ledger.id}`} className="text-white">
                    {ledger.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment and Control Reliance */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Settings className="h-5 w-5" />
            Risk Assessment & Control Reliance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-white">Assessment of Risk</Label>
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
              <Label className="text-white">Control Reliance Approach</Label>
              <Select 
                value={controlReliance} 
                onValueChange={setControlReliance}
                disabled={!riskAssessment}
              >
                <SelectTrigger className="border-white/10 bg-black/40 text-white">
                  <SelectValue placeholder="Select control reliance" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-black/90 text-white">
                  {getControlRelianceOptions().map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {riskAssessment === "Significant" && (
                <p className="text-xs text-yellow-400">
                  Significant risk requires control reliance
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

            <div className="space-y-2">
              <Label className="text-white">Weighted Average Headcount (Previous Year)</Label>
              <Input
                type="number"
                step="0.01"
                value={weightedAvgHeadcountPY}
                onChange={(e) => setWeightedAvgHeadcountPY(Number(e.target.value))}
                className="border-white/10 bg-black/40 text-white"
                placeholder="Enter headcount..."
              />
            </div>
          </div>

          {/* Threshold Guide */}
          <div className="rounded border border-yellow-500/20 bg-yellow-900/10 p-4">
            <h4 className="font-medium text-yellow-300">Threshold Calculation Guide</h4>
            <div className="mt-3 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white">Risk Level</TableHead>
                    <TableHead className="text-white">Control Reliance</TableHead>
                    <TableHead className="text-white">Population %</TableHead>
                    <TableHead className="text-white">Materiality %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {THRESHOLD_GUIDE.map((guide, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-white">{guide.riskLevel}</TableCell>
                      <TableCell className="text-white">{guide.controlReliance}</TableCell>
                      <TableCell className="text-white">{guide.populationPercentage}%</TableCell>
                      <TableCell className="text-white">{guide.materialityPercentage}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {salaryExpectation && (
        <Card className="border-white/10 bg-black/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <Calculator className="h-5 w-5" />
              Salary Expectation Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-gray-400">Previous Year Amount</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-400">
                    ₹{salaryExpectation.previousYearAmount.toLocaleString()}
                  </p>
                </div>

                <div className="rounded border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-400">Current Year Amount</span>
                  </div>
                  <p className="text-2xl font-bold text-green-400">
                    ₹{salaryExpectation.currentYearAmount.toLocaleString()}
                  </p>
                </div>

                <div className="rounded border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    <span className="text-sm text-gray-400">Expected Amount</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-400">
                    ₹{salaryExpectation.expectedAmount.toLocaleString()}
                  </p>
                </div>

                <div className="rounded border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-gray-400">Difference</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-400">
                    ₹{salaryExpectation.difference.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="rounded border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">Threshold Analysis</h4>
                    <p className="text-sm text-gray-400">
                      Threshold: ₹{salaryExpectation.threshold.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(salaryExpectation.withinThreshold)}
                    <span className={`font-medium ${getStatusColor(salaryExpectation.withinThreshold)}`}>
                      {salaryExpectation.withinThreshold ? "Within Threshold" : "Exceeds Threshold"}
                    </span>
                  </div>
                </div>
              </div>

              {!salaryExpectation.withinThreshold && (
                <div className="rounded border border-red-500/20 bg-red-500/10 p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <h4 className="font-medium text-red-300">Threshold Exceeded</h4>
                  </div>
                  <p className="mt-2 text-sm text-red-200">
                    The difference between expected and actual salary exceeds the calculated threshold. 
                    Additional procedures may be required to address this variance.
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
            Execute Salary Analytical
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">
                Run salary expectation analysis with threshold calculations
              </p>
              {!canRunAnalysis() && (
                <p className="mt-1 text-xs text-red-400">
                  Please complete risk assessment, control reliance, and select ledger accounts
                </p>
              )}
            </div>
            <Button
              onClick={runSalaryAnalytical}
              disabled={!canRunAnalysis() || processingStatus === "running"}
              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
            >
              {processingStatus === "running" ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Salary Analytical
                </>
              )}
            </Button>
          </div>

          {/* Progress Indicator */}
          {processingStatus === "running" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-orange-300">Processing Salary Analytical...</span>
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
                  <h4 className="font-medium text-green-300">Salary Analytical Completed</h4>
                  <p className="text-sm text-green-200">
                    Salary expectation analysis has been completed successfully
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
