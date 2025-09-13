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
  Calculator,
  CheckCircle,
  AlertTriangle,
  Play,
  Download,
  FileText,
  Users,
  DollarSign,
  Building,
  Plus,
  Minus,
  Scale,
  Gavel,
} from "lucide-react";

interface ManagerialRemunerationProps {
  onBack?: () => void;
}

interface Director {
  id: string;
  name: string;
  position: string;
  remuneration: number;
}

interface ProfitCalculation {
  profitBeforeTax: number;
  bountiesSubsidies: number;
  items198_3: number;
  directorsRemuneration: number;
  sums198_5: number;
  profit198: number;
  maxLimit197: number;
}

interface EffectiveCapital {
  paidUpShareCapital: number;
  securitiesPremium: number;
  reservesSurplus: number;
  longTermLoans: number;
  investments: number;
  accumulatedLosses: number;
  preliminaryExpenses: number;
  effectiveCapital: number;
}

interface ComplianceResult {
  category: string;
  limit: number;
  totalActuals: number;
  compliance: string;
}

const POSITION_OPTIONS = [
  "Managing Director",
  "Whole-time Director", 
  "Manager",
  "Other Director"
];

const EFFECTIVE_CAPITAL_LIMITS = [
  { range: "<5cr", mdLimit: 6000000, otherLimit: 1200000 },
  { range: ">=5cr, <100cr", mdLimit: 8400000, otherLimit: 1700000 },
  { range: ">=100cr, <250cr", mdLimit: 12000000, otherLimit: 2400000 },
  { range: ">=250cr", mdLimit: 12000000, otherLimit: 2400000 },
];

export default function ManagerialRemuneration({ onBack }: ManagerialRemunerationProps) {
  const [hasAdequateProfits, setHasAdequateProfits] = useState<string>("");
  const [profitCalculation, setProfitCalculation] = useState<ProfitCalculation>({
    profitBeforeTax: 0,
    bountiesSubsidies: 0,
    items198_3: 0,
    directorsRemuneration: 0,
    sums198_5: 0,
    profit198: 0,
    maxLimit197: 0,
  });
  const [directors, setDirectors] = useState<Director[]>([]);
  const [effectiveCapital, setEffectiveCapital] = useState<EffectiveCapital>({
    paidUpShareCapital: 0,
    securitiesPremium: 0,
    reservesSurplus: 0,
    longTermLoans: 0,
    investments: 0,
    accumulatedLosses: 0,
    preliminaryExpenses: 0,
    effectiveCapital: 0,
  });
  const [complianceResults, setComplianceResults] = useState<ComplianceResult[]>([]);
  const [processingStatus, setProcessingStatus] = useState<"idle" | "running" | "completed" | "error">("idle");
  const [progress, setProgress] = useState(0);

  const addDirector = () => {
    const newDirector: Director = {
      id: `director_${Date.now()}`,
      name: "",
      position: "",
      remuneration: 0,
    };
    setDirectors(prev => [...prev, newDirector]);
  };

  const removeDirector = (id: string) => {
    setDirectors(prev => prev.filter(director => director.id !== id));
  };

  const updateDirector = (id: string, field: keyof Director, value: string | number) => {
    setDirectors(prev =>
      prev.map(director =>
        director.id === id ? { ...director, [field]: value } : director
      )
    );
  };

  const calculateProfit198 = () => {
    const profit198 = profitCalculation.profitBeforeTax + 
                     profitCalculation.bountiesSubsidies - 
                     profitCalculation.items198_3 + 
                     profitCalculation.directorsRemuneration + 
                     profitCalculation.sums198_5;
    
    const maxLimit197 = profit198 * 0.11; // 11% of profit u/s 198
    
    setProfitCalculation(prev => ({
      ...prev,
      profit198,
      maxLimit197,
    }));
  };

  const calculateEffectiveCapital = () => {
    const effectiveCapital = effectiveCapital.paidUpShareCapital +
                            effectiveCapital.securitiesPremium +
                            effectiveCapital.reservesSurplus +
                            effectiveCapital.longTermLoans -
                            effectiveCapital.investments -
                            effectiveCapital.accumulatedLosses -
                            effectiveCapital.preliminaryExpenses;
    
    setEffectiveCapital(prev => ({
      ...prev,
      effectiveCapital,
    }));
  };

  const calculateCompliance = () => {
    const mdDirectors = directors.filter(d => 
      ["Managing Director", "Whole-time Director", "Manager"].includes(d.position)
    );
    const otherDirectors = directors.filter(d => d.position === "Other Director");
    
    const mdTotal = mdDirectors.reduce((sum, d) => sum + d.remuneration, 0);
    const otherTotal = otherDirectors.reduce((sum, d) => sum + d.remuneration, 0);
    
    let mdLimit = 0;
    let otherLimit = 0;
    
    if (hasAdequateProfits === "Yes") {
      // Calculate limits based on Section 197
      const mdCount = mdDirectors.length;
      const otherCount = otherDirectors.length;
      
      if (mdCount > 1) {
        mdLimit = profitCalculation.profit198 * 0.10; // 10%
      } else if (mdCount === 1) {
        mdLimit = profitCalculation.profit198 * 0.05; // 5%
      }
      
      if (mdCount === 0) {
        otherLimit = profitCalculation.profit198 * 0.03; // 3%
      } else {
        otherLimit = profitCalculation.profit198 * 0.01; // 1%
      }
    } else {
      // Calculate limits based on Schedule V
      const capital = effectiveCapital.effectiveCapital;
      
      if (capital < 50000000) {
        mdLimit = 6000000;
        otherLimit = 1200000;
      } else if (capital < 1000000000) {
        mdLimit = 8400000;
        otherLimit = 1700000;
      } else if (capital < 2500000000) {
        mdLimit = 12000000;
        otherLimit = 2400000;
      } else {
        mdLimit = 12000000 + (capital - 2500000000) * 0.0001;
        otherLimit = 2400000 + (capital - 2500000000) * 0.0001;
      }
    }
    
    setComplianceResults([
      {
        category: "Managing director, whole-time director and manager",
        limit: mdLimit,
        totalActuals: mdTotal,
        compliance: mdTotal <= mdLimit ? "Within Limit" : "Exceeds Limit",
      },
      {
        category: "Other directors",
        limit: otherLimit,
        totalActuals: otherTotal,
        compliance: otherTotal <= otherLimit ? "Within Limit" : "Exceeds Limit",
      },
    ]);
  };

  useEffect(() => {
    calculateProfit198();
  }, [profitCalculation.profitBeforeTax, profitCalculation.bountiesSubsidies, 
      profitCalculation.items198_3, profitCalculation.directorsRemuneration, 
      profitCalculation.sums198_5]);

  useEffect(() => {
    calculateEffectiveCapital();
  }, [effectiveCapital.paidUpShareCapital, effectiveCapital.securitiesPremium, 
      effectiveCapital.reservesSurplus, effectiveCapital.longTermLoans, 
      effectiveCapital.investments, effectiveCapital.accumulatedLosses, 
      effectiveCapital.preliminaryExpenses]);

  useEffect(() => {
    calculateCompliance();
  }, [directors, hasAdequateProfits, profitCalculation.profit198, effectiveCapital.effectiveCapital]);

  const runManagerialRemuneration = async () => {
    setProcessingStatus("running");
    setProgress(0);

    try {
      // Simulate processing
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
    return hasAdequateProfits && directors.length > 0;
  };

  const getComplianceColor = (compliance: string) => {
    return compliance === "Within Limit" ? "text-green-400" : "text-red-400";
  };

  const getComplianceIcon = (compliance: string) => {
    return compliance === "Within Limit" ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Managerial Remuneration</h2>
          <p className="text-gray-400">
            Section 197/198 compliance and Schedule V calculations
          </p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
        )}
      </div>

      {/* Adequate Profits Question */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Gavel className="h-5 w-5" />
            Section 197 Compliance Check
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white">
              Does the company have adequate profits to comply with the provisions of Section 197 of the Companies Act, 2013?
            </Label>
            <Select value={hasAdequateProfits} onValueChange={setHasAdequateProfits}>
              <SelectTrigger className="border-white/10 bg-black/40 text-white">
                <SelectValue placeholder="Select Yes or No" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-black/90 text-white">
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Profit Calculation (Section 198) */}
      {hasAdequateProfits === "Yes" && (
        <Card className="border-white/10 bg-black/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <Calculator className="h-5 w-5" />
              Calculation of Net Profit u/s 198
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
                      <TableCell className="text-white">Profit Before Tax</TableCell>
                      <TableCell className="text-white">
                        <Input
                          type="number"
                          value={profitCalculation.profitBeforeTax}
                          onChange={(e) => setProfitCalculation(prev => ({ ...prev, profitBeforeTax: Number(e.target.value) }))}
                          className="border-white/10 bg-black/40 text-white"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-white">Add: Bounties or subsidies received from government</TableCell>
                      <TableCell className="text-white">
                        <Input
                          type="number"
                          value={profitCalculation.bountiesSubsidies}
                          onChange={(e) => setProfitCalculation(prev => ({ ...prev, bountiesSubsidies: Number(e.target.value) }))}
                          className="border-white/10 bg-black/40 text-white"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-white">Less: Items u/s 198(3)</TableCell>
                      <TableCell className="text-white">
                        <Input
                          type="number"
                          value={profitCalculation.items198_3}
                          onChange={(e) => setProfitCalculation(prev => ({ ...prev, items198_3: Number(e.target.value) }))}
                          className="border-white/10 bg-black/40 text-white"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-white">Add: Director's remuneration deducted from P&L</TableCell>
                      <TableCell className="text-white">
                        <Input
                          type="number"
                          value={profitCalculation.directorsRemuneration}
                          onChange={(e) => setProfitCalculation(prev => ({ ...prev, directorsRemuneration: Number(e.target.value) }))}
                          className="border-white/10 bg-black/40 text-white"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-white">Add: Sums that should not be deducted u/s 198(5)</TableCell>
                      <TableCell className="text-white">
                        <Input
                          type="number"
                          value={profitCalculation.sums198_5}
                          onChange={(e) => setProfitCalculation(prev => ({ ...prev, sums198_5: Number(e.target.value) }))}
                          className="border-white/10 bg-black/40 text-white"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-white font-medium">Profit u/s 198</TableCell>
                      <TableCell className="text-white font-medium">{profitCalculation.profit198.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-white font-medium">Maximum limit u/s 197 (11%)</TableCell>
                      <TableCell className="text-white font-medium">{profitCalculation.maxLimit197.toLocaleString()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Effective Capital Calculation (Schedule V) */}
      {hasAdequateProfits === "No" && (
        <Card className="border-white/10 bg-black/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <Building className="h-5 w-5" />
              Calculation of Effective Capital (Schedule V)
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
                      <TableCell className="text-white">Paid-up share capital [A]</TableCell>
                      <TableCell className="text-white">
                        <Input
                          type="number"
                          value={effectiveCapital.paidUpShareCapital}
                          onChange={(e) => setEffectiveCapital(prev => ({ ...prev, paidUpShareCapital: Number(e.target.value) }))}
                          className="border-white/10 bg-black/40 text-white"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-white">Securities Premium Account [B]</TableCell>
                      <TableCell className="text-white">
                        <Input
                          type="number"
                          value={effectiveCapital.securitiesPremium}
                          onChange={(e) => setEffectiveCapital(prev => ({ ...prev, securitiesPremium: Number(e.target.value) }))}
                          className="border-white/10 bg-black/40 text-white"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-white">Reserves and surplus [C]</TableCell>
                      <TableCell className="text-white">
                        <Input
                          type="number"
                          value={effectiveCapital.reservesSurplus}
                          onChange={(e) => setEffectiveCapital(prev => ({ ...prev, reservesSurplus: Number(e.target.value) }))}
                          className="border-white/10 bg-black/40 text-white"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-white">Long term loans and deposits [D]</TableCell>
                      <TableCell className="text-white">
                        <Input
                          type="number"
                          value={effectiveCapital.longTermLoans}
                          onChange={(e) => setEffectiveCapital(prev => ({ ...prev, longTermLoans: Number(e.target.value) }))}
                          className="border-white/10 bg-black/40 text-white"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-white">Less: Aggregate of investments [E]</TableCell>
                      <TableCell className="text-white">
                        <Input
                          type="number"
                          value={effectiveCapital.investments}
                          onChange={(e) => setEffectiveCapital(prev => ({ ...prev, investments: Number(e.target.value) }))}
                          className="border-white/10 bg-black/40 text-white"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-white">Less: Accumulated losses [F]</TableCell>
                      <TableCell className="text-white">
                        <Input
                          type="number"
                          value={effectiveCapital.accumulatedLosses}
                          onChange={(e) => setEffectiveCapital(prev => ({ ...prev, accumulatedLosses: Number(e.target.value) }))}
                          className="border-white/10 bg-black/40 text-white"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-white">Less: Preliminary expenses [G]</TableCell>
                      <TableCell className="text-white">
                        <Input
                          type="number"
                          value={effectiveCapital.preliminaryExpenses}
                          onChange={(e) => setEffectiveCapital(prev => ({ ...prev, preliminaryExpenses: Number(e.target.value) }))}
                          className="border-white/10 bg-black/40 text-white"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-white font-medium">Effective Capital (A+B+C+D-E-F-G)</TableCell>
                      <TableCell className="text-white font-medium">{effectiveCapital.effectiveCapital.toLocaleString()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Directors Management */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5" />
              Directors and Managers
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={addDirector}
              className="border-white/10"
            >
              <Plus className="mr-2 h-3 w-3" />
              Add Director
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded border border-blue-500/20 bg-blue-900/10 p-3 text-sm text-blue-200">
              <p className="font-medium">Note: 2(78) Remuneration means any money or its equivalent given or passed to any person for services rendered by him and includes perquisites as defined under the Income-tax Act, 1961 (43 of 1961)</p>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white">Name</TableHead>
                    <TableHead className="text-white">Position</TableHead>
                    <TableHead className="text-white">Remuneration u/s 2(78)</TableHead>
                    <TableHead className="text-white">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {directors.map((director) => (
                    <TableRow key={director.id}>
                      <TableCell className="text-white">
                        <Input
                          type="text"
                          value={director.name}
                          onChange={(e) => updateDirector(director.id, 'name', e.target.value)}
                          className="border-white/10 bg-black/40 text-white"
                          placeholder="Enter name..."
                        />
                      </TableCell>
                      <TableCell className="text-white">
                        <Select
                          value={director.position}
                          onValueChange={(value) => updateDirector(director.id, 'position', value)}
                        >
                          <SelectTrigger className="border-white/10 bg-black/40 text-white">
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                          <SelectContent className="border-white/10 bg-black/90 text-white">
                            {POSITION_OPTIONS.map((position) => (
                              <SelectItem key={position} value={position}>
                                {position}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-white">
                        <Input
                          type="number"
                          value={director.remuneration}
                          onChange={(e) => updateDirector(director.id, 'remuneration', Number(e.target.value))}
                          className="border-white/10 bg-black/40 text-white"
                          placeholder="Enter amount..."
                        />
                      </TableCell>
                      <TableCell className="text-white">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeDirector(director.id)}
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Results */}
      {complianceResults.length > 0 && (
        <Card className="border-white/10 bg-black/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <Scale className="h-5 w-5" />
              Compliance Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white">Category</TableHead>
                    <TableHead className="text-white">Limit u/s 197</TableHead>
                    <TableHead className="text-white">Total at Actuals</TableHead>
                    <TableHead className="text-white">Compliance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complianceResults.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-white">{result.category}</TableCell>
                      <TableCell className="text-white">{result.limit.toLocaleString()}</TableCell>
                      <TableCell className="text-white">{result.totalActuals.toLocaleString()}</TableCell>
                      <TableCell className="text-white">
                        <div className="flex items-center gap-2">
                          {getComplianceIcon(result.compliance)}
                          <span className={getComplianceColor(result.compliance)}>
                            {result.compliance}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {complianceResults.some(result => result.compliance === "Exceeds Limit") && (
              <div className="mt-4 rounded border border-red-500/20 bg-red-500/10 p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <h4 className="font-medium text-red-300">Compliance Issue</h4>
                </div>
                <p className="mt-2 text-sm text-red-200">
                  The remuneration paid is in excess of limits specified u/s 197 of the Companies Act, 2013. 
                  Document the details of the resolution taken at a general meeting for the same or our testing 
                  on the compliance with other provisions as per the respective Section.
                </p>
                <Textarea
                  className="mt-3 border-white/10 bg-black/40 text-white"
                  placeholder="Document resolution details or compliance testing..."
                  rows={3}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Execution Section */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Play className="h-5 w-5" />
            Execute Managerial Remuneration Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">
                Run comprehensive managerial remuneration compliance analysis
              </p>
              {!canRunAnalysis() && (
                <p className="mt-1 text-xs text-red-400">
                  Please answer the adequate profits question and add at least one director
                </p>
              )}
            </div>
            <Button
              onClick={runManagerialRemuneration}
              disabled={!canRunAnalysis() || processingStatus === "running"}
              className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50"
            >
              {processingStatus === "running" ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Analysis
                </>
              )}
            </Button>
          </div>

          {/* Progress Indicator */}
          {processingStatus === "running" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-violet-300">Processing Managerial Remuneration Analysis...</span>
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
                  <h4 className="font-medium text-green-300">Managerial Remuneration Analysis Completed</h4>
                  <p className="text-sm text-green-200">
                    All compliance calculations have been completed successfully
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
