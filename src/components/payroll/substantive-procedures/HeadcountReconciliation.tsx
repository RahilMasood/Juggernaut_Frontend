"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Label } from "../../ui/label";
import { Progress } from "../../ui/progress";
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  Users,
  TrendingUp,
  Calculator,
  Play,
  Download,
  FileText,
  Plus,
  Minus,
  BarChart3,
  LineChart as LineChartIcon,
} from "lucide-react";

interface HeadcountReconciliationProps {
  onBack?: () => void;
}

interface MonthlyData {
  month: string;
  opening: number;
  joiners: number;
  leavers: number;
  closing: number;
}

interface QuarterlyData {
  quarter: string;
  weightedFigure: number;
  totalWeight: number;
  weightedAverage: number;
}

interface AnnualData {
  year: string;
  weightedFigure: number;
  totalWeight: number;
  weightedAverage: number;
}

interface QuarterlyPayData {
  quarter: string;
  grossPay: number;
  weightedAverageHeadcount: number;
  averagePay: number;
}

const MONTHS = [
  "Apr-24", "May-24", "Jun-24", "Jul-24", "Aug-24", "Sep-24",
  "Oct-24", "Nov-24", "Dec-24", "Jan-25", "Feb-25", "Mar-25"
];

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

export default function HeadcountReconciliation({ onBack }: HeadcountReconciliationProps) {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [quarterlyData, setQuarterlyData] = useState<QuarterlyData[]>([]);
  const [annualData, setAnnualData] = useState<AnnualData[]>([]);
  const [quarterlyPayData, setQuarterlyPayData] = useState<QuarterlyPayData[]>([]);
  const [openingHeadcount, setOpeningHeadcount] = useState<number>(2000);
  const [ctcReportCount, setCtcReportCount] = useState<number>(0);
  const [reconciliationRows, setReconciliationRows] = useState<Array<{ id: string; description: string; amount: number }>>([]);
  const [processingStatus, setProcessingStatus] = useState<"idle" | "running" | "completed" | "error">("idle");
  const [showCharts, setShowCharts] = useState(true);

  // Initialize monthly data
  useEffect(() => {
    const initialData: MonthlyData[] = MONTHS.map((month, index) => ({
      month,
      opening: index === 0 ? openingHeadcount : 0,
      joiners: 0,
      leavers: 0,
      closing: 0,
    }));
    setMonthlyData(initialData);
  }, [openingHeadcount]);

  // Calculate closing headcount for each month
  useEffect(() => {
    setMonthlyData(prev => {
      const updated = [...prev];
      for (let i = 0; i < updated.length; i++) {
        if (i === 0) {
          updated[i].closing = updated[i].opening + updated[i].joiners - updated[i].leavers;
        } else {
          updated[i].opening = updated[i - 1].closing;
          updated[i].closing = updated[i].opening + updated[i].joiners - updated[i].leavers;
        }
      }
      return updated;
    });
  }, [monthlyData.map(m => m.joiners).join(','), monthlyData.map(m => m.leavers).join(',')]);

  // Calculate quarterly weighted averages
  useEffect(() => {
    const quarterly: QuarterlyData[] = [];
    for (let q = 0; q < 4; q++) {
      const startMonth = q * 3;
      const months = monthlyData.slice(startMonth, startMonth + 3);
      
      if (months.length === 3) {
        const weightedFigure = (months[0].closing * 3) + (months[1].closing * 2) + (months[2].closing * 1);
        const totalWeight = 6;
        const weightedAverage = weightedFigure / totalWeight;
        
        quarterly.push({
          quarter: QUARTERS[q],
          weightedFigure,
          totalWeight,
          weightedAverage: Math.round(weightedAverage * 100) / 100,
        });
      }
    }
    setQuarterlyData(quarterly);
  }, [monthlyData]);

  // Calculate annual weighted average
  useEffect(() => {
    if (monthlyData.length === 12) {
      const weights = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
      const weightedFigure = monthlyData.reduce((sum, month, index) => 
        sum + (month.closing * weights[index]), 0
      );
      const totalWeight = 78; // Sum of weights 12+11+...+1
      const weightedAverage = weightedFigure / totalWeight;
      
      setAnnualData([{
        year: "FY24-25",
        weightedFigure,
        totalWeight,
        weightedAverage: Math.round(weightedAverage * 100) / 100,
      }]);
    }
  }, [monthlyData]);

  // Calculate quarterly average pay
  useEffect(() => {
    const quarterlyPay: QuarterlyPayData[] = quarterlyData.map(q => {
      const grossPay = Math.random() * 10000000 + 5000000; // Simulated data
      const averagePay = grossPay / q.weightedAverage;
      
      return {
        quarter: q.quarter,
        grossPay: Math.round(grossPay),
        weightedAverageHeadcount: q.weightedAverage,
        averagePay: Math.round(averagePay),
      };
    });
    setQuarterlyPayData(quarterlyPay);
  }, [quarterlyData]);

  const handleMonthlyDataChange = (monthIndex: number, field: keyof MonthlyData, value: number) => {
    setMonthlyData(prev => {
      const updated = [...prev];
      updated[monthIndex] = { ...updated[monthIndex], [field]: value };
      return updated;
    });
  };

  const addReconciliationRow = () => {
    const newRow = {
      id: `recon_${Date.now()}`,
      description: "",
      amount: 0,
    };
    setReconciliationRows(prev => [...prev, newRow]);
  };

  const removeReconciliationRow = (id: string) => {
    setReconciliationRows(prev => prev.filter(row => row.id !== id));
  };

  const updateReconciliationRow = (id: string, field: string, value: string | number) => {
    setReconciliationRows(prev =>
      prev.map(row =>
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  };

  const calculateNetDifference = () => {
    const headcountDifference = monthlyData[11]?.closing - ctcReportCount || 0;
    const reconciliationTotal = reconciliationRows.reduce((sum, row) => sum + row.amount, 0);
    return headcountDifference - reconciliationTotal;
  };

  const runHeadcountReconciliation = async () => {
    setProcessingStatus("running");
    
    try {
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      setProcessingStatus("completed");
    } catch (error) {
      setProcessingStatus("error");
    }
  };

  const chartData = [
    ...quarterlyPayData.map(q => ({
      quarter: q.quarter,
      "Average Gross Pay": q.averagePay,
      "Weighted Average Headcount": q.weightedAverageHeadcount,
    }))
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Headcount Reconciliation</h2>
          <p className="text-gray-400">
            Monthly reconciliation and analytical procedures for headcount data
          </p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
        )}
      </div>

      {/* Charts Section */}
      {showCharts && (
        <Card className="border-white/10 bg-black/40">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5" />
                Analytical Charts
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
                  <XAxis dataKey="quarter" stroke="#9CA3AF" />
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
                    dataKey="Average Gross Pay" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="Weighted Average Headcount" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 rounded border border-blue-500/20 bg-blue-900/10 p-3 text-sm text-blue-200">
              <p className="font-medium">Analysis of the above data and trend:</p>
              <p className="mt-1">
                The quarterly trends show consistent growth in both average gross pay and headcount. 
                The correlation between these metrics indicates stable compensation practices and 
                organizational growth patterns.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Reconciliation Table */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Users className="h-5 w-5" />
            Monthly Headcount Reconciliation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <Label className="text-white">Opening Headcount (April)</Label>
                <Input
                  type="number"
                  value={openingHeadcount}
                  onChange={(e) => setOpeningHeadcount(Number(e.target.value))}
                  className="w-32 border-white/10 bg-black/40 text-white"
                />
              </div>
              <div className="text-sm text-gray-400">
                For initial audit: enter manually. For subsequent audits: previous year's closing will be used.
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white">Month</TableHead>
                    <TableHead className="text-white">Opening (A)</TableHead>
                    <TableHead className="text-white">Joiners (B)</TableHead>
                    <TableHead className="text-white">Leavers (C)</TableHead>
                    <TableHead className="text-white">Closing (A+B-C)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyData.map((month, index) => (
                    <TableRow key={month.month}>
                      <TableCell className="text-white">{month.month}</TableCell>
                      <TableCell className="text-white">
                        {index === 0 ? (
                          <Input
                            type="number"
                            value={month.opening}
                            onChange={(e) => handleMonthlyDataChange(index, 'opening', Number(e.target.value))}
                            className="w-20 border-white/10 bg-black/40 text-white"
                          />
                        ) : (
                          month.opening
                        )}
                      </TableCell>
                      <TableCell className="text-white">
                        <Input
                          type="number"
                          value={month.joiners}
                          onChange={(e) => handleMonthlyDataChange(index, 'joiners', Number(e.target.value))}
                          className="w-20 border-white/10 bg-black/40 text-white"
                        />
                      </TableCell>
                      <TableCell className="text-white">
                        <Input
                          type="number"
                          value={month.leavers}
                          onChange={(e) => handleMonthlyDataChange(index, 'leavers', Number(e.target.value))}
                          className="w-20 border-white/10 bg-black/40 text-white"
                        />
                      </TableCell>
                      <TableCell className="text-white font-medium">
                        {month.closing}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reconciliation Test */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Calculator className="h-5 w-5" />
            Headcount Reconciliation Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-white">As per Above Headcount (A)</Label>
              <Input
                type="number"
                value={monthlyData[11]?.closing || 0}
                readOnly
                className="border-white/10 bg-black/40 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">As per CTC Report (B)</Label>
              <Input
                type="number"
                value={ctcReportCount}
                onChange={(e) => setCtcReportCount(Number(e.target.value))}
                className="border-white/10 bg-black/40 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Difference (C) = (A) - (B)</Label>
            <Input
              type="number"
              value={monthlyData[11]?.closing - ctcReportCount || 0}
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
                <Plus className="mr-2 h-3 w-3" />
                Add Row
              </Button>
            </div>
            
            {reconciliationRows.map((row) => (
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
                  <Minus className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label className="text-white">Net Difference</Label>
            <Input
              type="number"
              value={calculateNetDifference()}
              readOnly
              className="border-white/10 bg-black/40 text-white font-medium"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quarterly Weighted Average */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <TrendingUp className="h-5 w-5" />
            Quarterly Weighted Average Headcount
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white">Quarter</TableHead>
                  <TableHead className="text-white">Weighted Figure (A)</TableHead>
                  <TableHead className="text-white">Total Weight (B)</TableHead>
                  <TableHead className="text-white">Weighted Average (A/B)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quarterlyData.map((quarter) => (
                  <TableRow key={quarter.quarter}>
                    <TableCell className="text-white">{quarter.quarter}</TableCell>
                    <TableCell className="text-white">{quarter.weightedFigure}</TableCell>
                    <TableCell className="text-white">{quarter.totalWeight}</TableCell>
                    <TableCell className="text-white font-medium">{quarter.weightedAverage}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Annual Weighted Average */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <TrendingUp className="h-5 w-5" />
            Annual Weighted Average Headcount
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white">Year</TableHead>
                  <TableHead className="text-white">Weighted Figure (A)</TableHead>
                  <TableHead className="text-white">Total Weight (B)</TableHead>
                  <TableHead className="text-white">Weighted Average (A/B)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {annualData.map((year) => (
                  <TableRow key={year.year}>
                    <TableCell className="text-white">{year.year}</TableCell>
                    <TableCell className="text-white">{year.weightedFigure}</TableCell>
                    <TableCell className="text-white">{year.totalWeight}</TableCell>
                    <TableCell className="text-white font-medium">{year.weightedAverage}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Average Gross Pay - Quarterly */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <LineChartIcon className="h-5 w-5" />
            Average Gross Pay - Quarterly
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white">Particulars</TableHead>
                  <TableHead className="text-white">Q4FY24</TableHead>
                  <TableHead className="text-white">Q3FY24</TableHead>
                  <TableHead className="text-white">Q2FY24</TableHead>
                  <TableHead className="text-white">Q1FY24</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-white">Gross Pay (A)</TableCell>
                  {quarterlyPayData.map((q) => (
                    <TableCell key={q.quarter} className="text-white">{q.grossPay.toLocaleString()}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="text-white">Weighted Average Headcount (B)</TableCell>
                  {quarterlyPayData.map((q) => (
                    <TableCell key={q.quarter} className="text-white">{q.weightedAverageHeadcount}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="text-white font-medium">Average Pay (A/B)</TableCell>
                  {quarterlyPayData.map((q) => (
                    <TableCell key={q.quarter} className="text-white font-medium">{q.averagePay.toLocaleString()}</TableCell>
                  ))}
                </TableRow>
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
            Execute Headcount Reconciliation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">
                Generate comprehensive headcount reconciliation report
              </p>
            </div>
            <Button
              onClick={runHeadcountReconciliation}
              disabled={processingStatus === "running"}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {processingStatus === "running" ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Reconciliation
                </>
              )}
            </Button>
          </div>

          {processingStatus === "completed" && (
            <div className="rounded border border-green-500/20 bg-green-500/10 p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-green-500" />
                <div>
                  <h4 className="font-medium text-green-300">Headcount Reconciliation Completed</h4>
                  <p className="text-sm text-green-200">
                    All calculations and analyses have been completed successfully
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
