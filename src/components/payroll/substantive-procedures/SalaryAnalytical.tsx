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
  Play,
  Download,
  FileText,
  Calculator,
  BarChart3,
  Users,
  Settings,
  Loader2,
} from "lucide-react";

interface SalaryAnalyticalProps {
  onBack?: () => void;
}

interface LedgerItem {
  ledger_name: string;
  fs_sub_line_id?: number;
  note_line_id?: number;
}

const RISK_ASSESSMENT_OPTIONS = [
  { value: "Lower", label: "Lower" },
  { value: "Higher", label: "Higher" },
  { value: "Significant", label: "Significant" },
];

const CONTROL_RELIANCE_OPTIONS = [
  { value: "Relying on controls", label: "Relying on controls" },
  { value: "Not relying on controls", label: "Not relying on controls" },
];

export default function SalaryAnalytical({ onBack }: SalaryAnalyticalProps) {
  // Salary Calculations state
  const [riskAssessment, setRiskAssessment] = useState<string>("");
  const [controlReliance, setControlReliance] = useState<string>("");
  const [performanceMatrix, setPerformanceMatrix] = useState<string>("");
  const [weightedAvgHeadcountPY, setWeightedAvgHeadcountPY] = useState<string>("");

  // PF Analytics state
  const [pfLedgerOptions, setPfLedgerOptions] = useState<LedgerItem[]>([]);
  const [salaryLedgerOptions, setSalaryLedgerOptions] = useState<LedgerItem[]>([]);
  const [selectedPfLedgers, setSelectedPfLedgers] = useState<string[]>([]);
  const [selectedSalaryLedgers, setSelectedSalaryLedgers] = useState<string[]>([]);
  const [selectedExcludeLedgers, setSelectedExcludeLedgers] = useState<string[]>([]);
  const [percentage, setPercentage] = useState<string>("");

  // UI state
  const [showPfDropdown, setShowPfDropdown] = useState(false);
  const [showSalaryDropdown, setShowSalaryDropdown] = useState(false);
  const [showExcludeDropdown, setShowExcludeDropdown] = useState(false);
  const [isLoadingPfLedgers, setIsLoadingPfLedgers] = useState(false);
  const [isLoadingSalaryLedgers, setIsLoadingSalaryLedgers] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<"idle" | "running" | "completed" | "error">("idle");
  const [progress, setProgress] = useState(0);

  // Load PF Ledger Options (fs_sub_line_id = 20031)
  const loadPfLedgerOptions = async () => {
    setIsLoadingPfLedgers(true);
    try {
      if (window.sharePointAPI?.loadLedgerData) {
        const result = await window.sharePointAPI.loadLedgerData({
          fs_sub_line_id: 20031
        });
        if (result.success && result.data) {
          setPfLedgerOptions(result.data);
        }
      }
    } catch (error) {
      console.error("Error loading PF ledger options:", error);
    } finally {
      setIsLoadingPfLedgers(false);
    }
  };

  // Load Salary Ledger Options (note_line_id = 30152)
  const loadSalaryLedgerOptions = async () => {
    setIsLoadingSalaryLedgers(true);
    try {
      if (window.sharePointAPI?.loadLedgerData) {
        const result = await window.sharePointAPI.loadLedgerData({
          note_line_id: 30152
        });
        if (result.success && result.data) {
          setSalaryLedgerOptions(result.data);
        }
      }
    } catch (error) {
      console.error("Error loading salary ledger options:", error);
    } finally {
      setIsLoadingSalaryLedgers(false);
    }
  };

  const handleLedgerToggle = (ledgerType: 'pf' | 'salary' | 'exclude', ledgerName: string) => {
    const setterMap = {
      pf: setSelectedPfLedgers,
      salary: setSelectedSalaryLedgers,
      exclude: setSelectedExcludeLedgers
    };
    
    const currentMap = {
      pf: selectedPfLedgers,
      salary: selectedSalaryLedgers,
      exclude: selectedExcludeLedgers
    };

    const setter = setterMap[ledgerType];
    const current = currentMap[ledgerType];

    setter(prev => 
      prev.includes(ledgerName) 
        ? prev.filter(name => name !== ledgerName)
        : [...prev, ledgerName]
    );
  };

  const runAnalytics = async () => {
    setProcessingStatus("running");
    setProgress(0);

    try {
      if (window.payroll?.run) {
        // Prepare inputs for the Python script
        const inputs = {
          risk_assessment: riskAssessment,
          control_reliance: controlReliance,
          per_mat: parseFloat(performanceMatrix) || 0,
          weighted_avg_headcount_py: parseFloat(weightedAvgHeadcountPY) || 0,
          percentage: parseFloat(percentage) || 0,
          i_input: selectedPfLedgers.map((name, index) => index + 1), // Convert to indices
          ii_input: selectedSalaryLedgers.map((name, index) => index + 1), // Convert to indices
          exclude_input: selectedExcludeLedgers
        };

        const res = await window.payroll.run("execute_salary_analytical", {
          inputFiles: [],
          options: inputs,
        });

        if (res.ok && res.runId) {
          const off = window.payroll.onProgress((payload: any) => {
            if (payload.runId === res.runId) {
              if (payload.status === 'running') {
                setProgress(payload.progress || 50);
                return;
              }
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
    } catch (error) {
      console.error("Error running analytics:", error);
      setProcessingStatus('error');
    }
  };

  const canRunAnalytics = () => {
    return !!(
      riskAssessment && 
           controlReliance && 
      performanceMatrix && 
      weightedAvgHeadcountPY &&
      selectedPfLedgers.length > 0 &&
      selectedSalaryLedgers.length > 0 &&
      percentage
    );
  };

  // Update control reliance options based on risk assessment
  const getControlRelianceOptions = () => {
    if (riskAssessment === "Significant") {
      return CONTROL_RELIANCE_OPTIONS.filter(option => option.value === "Relying on controls");
    }
    return CONTROL_RELIANCE_OPTIONS;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Salary Analytical</h2>
          <p className="text-gray-400">
            Perform substantive analytical procedures on salary and provident fund expenses
          </p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
        )}
      </div>

      {/* Salary Calculations Section */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Calculator className="h-5 w-5" />
            Salary Calculations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Assessment of risk</Label>
              <Select value={riskAssessment} onValueChange={setRiskAssessment}>
                <SelectTrigger className="border-white/10 bg-black/40 text-white">
                  <SelectValue placeholder="Select risk assessment" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-black/90 text-white">
                  {RISK_ASSESSMENT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Control reliance approach</Label>
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
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Performance Matrix</Label>
              <Input
                type="number"
                placeholder="Enter performance matrix value"
                value={performanceMatrix}
                onChange={(e) => setPerformanceMatrix(e.target.value)}
                className="border-white/10 bg-black/40 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Weighted Avg Headcount Previous Year</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Enter weighted average headcount"
                value={weightedAvgHeadcountPY}
                onChange={(e) => setWeightedAvgHeadcountPY(e.target.value)}
                className="border-white/10 bg-black/40 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PF Analytics Section */}
        <Card className="border-white/10 bg-black/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
            <BarChart3 className="h-5 w-5" />
            PF Analytics
            </CardTitle>
          </CardHeader>
        <CardContent className="space-y-6">
          {/* Provident Fund Ledger Selection */}
            <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Button 
                onClick={loadPfLedgerOptions} 
                disabled={isLoadingPfLedgers}
                className="flex items-center gap-2"
              >
                {isLoadingPfLedgers ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Settings className="h-4 w-4" />
                )}
                {isLoadingPfLedgers ? 'Loading...' : 'Load Columns'}
              </Button>
              <Label className="text-white">
                Select the ledger accounts comprising of provident fund for substantive analytical procedures on provident fund.
              </Label>
                </div>

            {pfLedgerOptions.length > 0 && (
              <div className="relative">
                <Button 
                  variant="outline" 
                  className="w-full justify-between border-white/10" 
                  onClick={() => setShowPfDropdown(!showPfDropdown)}
                >
                  {selectedPfLedgers.length > 0 ? `${selectedPfLedgers.length} selected` : 'Select PF ledgers'}
                </Button>
                {showPfDropdown && (
                  <div className="absolute z-10 mt-2 w-full rounded-md border border-white/10 bg-black/90 p-2 max-h-64 overflow-auto">
                    {pfLedgerOptions.map((ledger, index) => (
                      <div key={index} className="flex items-center gap-2 px-2 py-1 hover:bg-white/5 rounded">
                        <Checkbox 
                          id={`pf-${index}`} 
                          checked={selectedPfLedgers.includes(ledger.ledger_name)} 
                          onCheckedChange={() => handleLedgerToggle('pf', ledger.ledger_name)} 
                        />
                        <Label htmlFor={`pf-${index}`} className="text-white text-sm">
                          {ledger.ledger_name}
                        </Label>
                  </div>
                    ))}
                  </div>
                )}
                {selectedPfLedgers.length > 0 && (
                  <div className="text-xs text-blue-300 mt-1">
                    {selectedPfLedgers.join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Basic Salary Ledger Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Button 
                onClick={loadSalaryLedgerOptions} 
                disabled={isLoadingSalaryLedgers}
                className="flex items-center gap-2"
              >
                {isLoadingSalaryLedgers ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Settings className="h-4 w-4" />
                )}
                {isLoadingSalaryLedgers ? 'Loading...' : 'Load Columns'}
              </Button>
              <Label className="text-white">
                Select the ledger accounts comprising balances such as basic salary, etc. on which the substantive analytical procedures are to be performed.
              </Label>
              </div>

            {salaryLedgerOptions.length > 0 && (
              <div className="relative">
                <Button 
                  variant="outline" 
                  className="w-full justify-between border-white/10" 
                  onClick={() => setShowSalaryDropdown(!showSalaryDropdown)}
                >
                  {selectedSalaryLedgers.length > 0 ? `${selectedSalaryLedgers.length} selected` : 'Select salary ledgers'}
                </Button>
                {showSalaryDropdown && (
                  <div className="absolute z-10 mt-2 w-full rounded-md border border-white/10 bg-black/90 p-2 max-h-64 overflow-auto">
                    {salaryLedgerOptions.map((ledger, index) => (
                      <div key={index} className="flex items-center gap-2 px-2 py-1 hover:bg-white/5 rounded">
                        <Checkbox 
                          id={`salary-${index}`} 
                          checked={selectedSalaryLedgers.includes(ledger.ledger_name)} 
                          onCheckedChange={() => handleLedgerToggle('salary', ledger.ledger_name)} 
                        />
                        <Label htmlFor={`salary-${index}`} className="text-white text-sm">
                          {ledger.ledger_name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
                {selectedSalaryLedgers.length > 0 && (
                  <div className="text-xs text-green-300 mt-1">
                    {selectedSalaryLedgers.join(', ')}
                  </div>
                )}
              </div>
            )}
              </div>

          {/* Exclude Ledgers Selection */}
          <div className="space-y-4">
            <Label className="text-white">
              Select ledgers to exclude from analysis (optional)
            </Label>
            {salaryLedgerOptions.length > 0 && (
              <div className="relative">
                <Button 
                  variant="outline" 
                  className="w-full justify-between border-white/10" 
                  onClick={() => setShowExcludeDropdown(!showExcludeDropdown)}
                >
                  {selectedExcludeLedgers.length > 0 ? `${selectedExcludeLedgers.length} selected` : 'Select exclude ledgers'}
                </Button>
                {showExcludeDropdown && (
                  <div className="absolute z-10 mt-2 w-full rounded-md border border-white/10 bg-black/90 p-2 max-h-64 overflow-auto">
                    {salaryLedgerOptions.map((ledger, index) => (
                      <div key={index} className="flex items-center gap-2 px-2 py-1 hover:bg-white/5 rounded">
                        <Checkbox 
                          id={`exclude-${index}`} 
                          checked={selectedExcludeLedgers.includes(ledger.ledger_name)} 
                          onCheckedChange={() => handleLedgerToggle('exclude', ledger.ledger_name)} 
                        />
                        <Label htmlFor={`exclude-${index}`} className="text-white text-sm">
                          {ledger.ledger_name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
                {selectedExcludeLedgers.length > 0 && (
                  <div className="text-xs text-red-300 mt-1">
                    {selectedExcludeLedgers.join(', ')}
                </div>
              )}
              </div>
            )}
          </div>

          {/* Percentage Input */}
          <div className="space-y-2">
            <Label className="text-white">Mention the percentage to be used for the analytical procedure</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="Enter percentage"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              className="border-white/10 bg-black/40 text-white"
            />
            </div>
          </CardContent>
        </Card>

      {/* Run Analytics Section */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Play className="h-5 w-5" />
            Run Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">
                Execute salary analytical procedures with the configured parameters
              </p>
              {!canRunAnalytics() && (
                <p className="mt-1 text-xs text-red-400">
                  Please fill in all required fields and select ledgers
                </p>
              )}
            </div>
            <Button
              onClick={runAnalytics}
              disabled={!canRunAnalytics() || processingStatus === "running"}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
            >
              {processingStatus === "running" ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Running Analytics...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Analytics
                </>
              )}
            </Button>
          </div>

          {/* Progress Indicator */}
          {processingStatus === "running" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-purple-300">Processing Salary Analytics...</span>
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
                  <h4 className="font-medium text-green-300">Analytics Completed</h4>
                  <p className="text-sm text-green-200">
                    Salary analytical procedures have been completed successfully
                  </p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" className="border-green-500/30 text-green-300">
                  <Download className="mr-2 h-4 w-4" />
                  Download Results
                </Button>
                <Button variant="outline" className="border-green-500/30 text-green-300">
                  <FileText className="mr-2 h-4 w-4" />
                  View Analysis
                </Button>
              </div>
            </div>
          )}

          {processingStatus === "error" && (
            <div className="rounded border border-red-500/20 bg-red-500/10 p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-red-500" />
                <div>
                  <h4 className="font-medium text-red-300">Error</h4>
                  <p className="text-sm text-red-200">
                    An error occurred while running the analytics. Please try again.
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