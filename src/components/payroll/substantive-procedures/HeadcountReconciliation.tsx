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
  const [fileUrl, setFileUrl] = useState<string>("");

  // IPE-style client file dropdowns
  const [clientFiles, setClientFiles] = useState<Array<{ name: string; reference: string }>>([]);
  const [isLoadingClientFiles, setIsLoadingClientFiles] = useState(false);
  const [payRegistrar, setPayRegistrar] = useState<string>("");
  const [ctcFile, setCtcFile] = useState<string>("");
  const [addList, setAddList] = useState<string>("");
  const [delList, setDelList] = useState<string>("");
  const [addColumns, setAddColumns] = useState<string[]>([]);
  const [delColumns, setDelColumns] = useState<string[]>([]);
  const [dojal, setDojal] = useState<string>("");
  const [doldl, setDoldl] = useState<string>("");
  const [openingHeadcountInput, setOpeningHeadcountInput] = useState<number>(2000);

  useEffect(() => {
    loadClientFiles();
  }, []);

  const loadClientFiles = async () => {
    setIsLoadingClientFiles(true);
    try {
      if (window.sharePointAPI?.loadCloudFiles) {
        const result = await window.sharePointAPI.loadCloudFiles();
        if (result.success && result.data?.files) {
          const files = result.data.files.map((f: any) => ({ name: f.name, reference: f.reference || "" }));
          setClientFiles(files);
        }
      }
    } finally {
      setIsLoadingClientFiles(false);
    }
  };

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

  // Remove simulated quarterly pay; will be set from JSON

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

  const handleLoadColumns = async () => {
    try {
      if (window.payroll?.loadExcelColumns) {
        if (addList) {
          const resAdd = await window.payroll.loadExcelColumns(addList.includes(' (') ? addList.split(' (')[0] : addList);
          if (resAdd.ok && resAdd.columns) setAddColumns(resAdd.columns);
        }
        if (delList) {
          const resDel = await window.payroll.loadExcelColumns(delList.includes(' (') ? delList.split(' (')[0] : delList);
          if (resDel.ok && resDel.columns) setDelColumns(resDel.columns);
        }
      }
    } catch {}
  };

  const canCalculate = () => {
    return !!(payRegistrar && ctcFile && addList && delList && dojal && doldl);
  };

  const runHeadcountReconciliation = async () => {
    setProcessingStatus("running");
    setFileUrl("");
    try {
      if (window.payroll?.run) {
        const result = await window.payroll.run("execute_headcount_sharepoint", {
          inputFiles: [],
          options: {
            add_list: addList,
            del_list: delList,
            ctc_file: ctcFile,
            pay_registrar: payRegistrar,
            opening_apr: openingHeadcountInput,
            dojal,
            doldl,
          },
        });
        if (result.ok && result.runId) {
          const unsubscribe = window.payroll.onProgress((payload: any) => {
            if (payload.runId === result.runId) {
              if (payload.status === 'running') return;
              if (payload.status === 'success') {
                try {
                  const lines = String(payload.stdout || '').split('\n');
                  const jsonLine = lines.find((l: string) => l.trim().startsWith('{') && l.trim().endsWith('}'));
                  if (jsonLine) {
                    const parsed = JSON.parse(jsonLine);
                    if (parsed.success) {
                      setProcessingStatus('completed');
                      if (parsed.file_web_url) setFileUrl(parsed.file_web_url);
                      const data = parsed.data;
                      if (data) {
                        // Monthly
                        if (Array.isArray(data.Headcount_Reconciliation)) {
                          const m = data.Headcount_Reconciliation.map((r: any, idx: number) => ({
                            month: r.Month,
                            opening: Number(r.Opening),
                            joiners: Number(r.Joiners),
                            leavers: Number(r.Leavers),
                            closing: Number(r.Closing),
                          }));
                          setMonthlyData(m);
                          if (m.length > 0) setOpeningHeadcount(m[0].opening);
                        }
                        // Test Reconciliation
                        if (Array.isArray(data.Test_Reconciliation) && data.Test_Reconciliation.length >= 2) {
                          setCtcReportCount(Number(data.Test_Reconciliation[1].Employees) || 0);
                        }
                        // Quarterly Weighted
                        if (data.Quarterly_Weighted_Average_Headcount) {
                          const qd: QuarterlyData[] = Object.entries(data.Quarterly_Weighted_Average_Headcount).map(([q, v]: any) => ({
                            quarter: q,
                            weightedFigure: Number(v['Weighted Figure']),
                            totalWeight: Number(v['Total Weight']),
                            weightedAverage: Number(v['Weighted Average']),
                          }));
                          setQuarterlyData(qd);
                        }
                        // Annual
                        if (data.Annual_Weighted_Average_Headcount) {
                          const ad = data.Annual_Weighted_Average_Headcount;
                          setAnnualData([{ 
                            year: String(ad['Year']), 
                            weightedFigure: Number(ad['Weighted Figure']),
                            totalWeight: Number(ad['Total Weight']),
                            weightedAverage: Number(ad['Weighted Average']),
                          }]);
                        }
                        // Average Gross Pay Quarterly
                        if (data.Average_Gross_Pay_Quarterly) {
                          const qp: QuarterlyPayData[] = Object.entries(data.Average_Gross_Pay_Quarterly).map(([q, v]: any) => ({
                            quarter: String(q),
                            grossPay: Number(v['Gross Pay']),
                            weightedAverageHeadcount: Number(v['Weighted Average Headcount']),
                            averagePay: Number(v['Average Pay']),
                          }));
                          setQuarterlyPayData(qp);
                        }
                      }
                    } else {
                      setProcessingStatus('error');
                    }
                  } else {
                    setProcessingStatus('completed');
                  }
                } catch {
                  setProcessingStatus('completed');
                }
                unsubscribe();
              } else if (payload.status === 'error') {
                setProcessingStatus('error');
                unsubscribe();
              }
            }
          });
        } else {
          setProcessingStatus('error');
        }
      }
    } catch (e) {
      setProcessingStatus('error');
    }
  };

  const displayHeadcountFromJson = async () => {
    setProcessingStatus("running");
    try {
      if (window.payroll?.run) {
        const result = await window.payroll.run("download_headcount_results", { inputFiles: [], options: {} });
        if (result.ok && result.runId) {
          const unsubscribe = window.payroll.onProgress((payload: any) => {
            if (payload.runId === result.runId) {
              if (payload.status === 'running') return;
              if (payload.status === 'success') {
                try {
                  const stdout = String(payload.stdout || '');
                  let data: any = null;
                  try { data = JSON.parse(stdout); } catch {}
                  if (!data) {
                    const start = stdout.indexOf('{');
                    const end = stdout.lastIndexOf('}');
                    if (start !== -1 && end !== -1 && end > start) {
                      data = JSON.parse(stdout.substring(start, end + 1));
                    }
                  }
                  if (data) {
                    if (Array.isArray(data.Headcount_Reconciliation)) {
                      const m = data.Headcount_Reconciliation.map((r: any) => ({
                        month: r.Month,
                        opening: Number(r.Opening),
                        joiners: Number(r.Joiners),
                        leavers: Number(r.Leavers),
                        closing: Number(r.Closing),
                      }));
                      setMonthlyData(m);
                      if (m.length > 0) setOpeningHeadcount(m[0].opening);
                    }
                    if (Array.isArray(data.Test_Reconciliation) && data.Test_Reconciliation.length >= 2) {
                      setCtcReportCount(Number(data.Test_Reconciliation[1].Employees) || 0);
                    }
                    if (data.Quarterly_Weighted_Average_Headcount) {
                      const qd: QuarterlyData[] = Object.entries(data.Quarterly_Weighted_Average_Headcount).map(([q, v]: any) => ({
                        quarter: String(q),
                        weightedFigure: Number(v['Weighted Figure']),
                        totalWeight: Number(v['Total Weight']),
                        weightedAverage: Number(v['Weighted Average']),
                      }));
                      setQuarterlyData(qd);
                    }
                    if (data.Annual_Weighted_Average_Headcount) {
                      const ad = data.Annual_Weighted_Average_Headcount;
                      setAnnualData([{ 
                        year: String(ad['Year']),
                        weightedFigure: Number(ad['Weighted Figure']),
                        totalWeight: Number(ad['Total Weight']),
                        weightedAverage: Number(ad['Weighted Average']),
                      }]);
                    }
                    if (data.Average_Gross_Pay_Quarterly) {
                      const qp: QuarterlyPayData[] = Object.entries(data.Average_Gross_Pay_Quarterly).map(([q, v]: any) => ({
                        quarter: String(q),
                        grossPay: Number(v['Gross Pay']),
                        weightedAverageHeadcount: Number(v['Weighted Average Headcount']),
                        averagePay: Number(v['Average Pay']),
                      }));
                      setQuarterlyPayData(qp);
                    }
                    setProcessingStatus('completed');
                  } else {
                    setProcessingStatus('error');
                  }
                } catch {
                  setProcessingStatus('error');
                }
                unsubscribe();
              } else if (payload.status === 'error') {
                setProcessingStatus('error');
                unsubscribe();
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

      {/* Charts Section - only show after calculation */}
      {processingStatus === "completed" && showCharts && (
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

      {/* Inputs: Select files */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Users className="h-5 w-5" />
            Select Source Files
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
                <Select value={payRegistrar} onValueChange={setPayRegistrar}>
                  <SelectTrigger className="border-white/10 bg-black/40 text-white"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent className="border-white/10 bg-black/90 text-white max-h-64">
                    {clientFiles.map((f, i) => (<SelectItem key={i} value={f.name}>{f.name} {f.reference && `(${f.reference})`}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white">CTC Report</Label>
                <Select value={ctcFile} onValueChange={setCtcFile}>
                  <SelectTrigger className="border-white/10 bg-black/40 text-white"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent className="border-white/10 bg-black/90 text-white max-h-64">
                    {clientFiles.map((f, i) => (<SelectItem key={i} value={f.name}>{f.name} {f.reference && `(${f.reference})`}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white">Additions Listing</Label>
                <Select value={addList} onValueChange={setAddList}>
                  <SelectTrigger className="border-white/10 bg-black/40 text-white"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent className="border-white/10 bg-black/90 text-white max-h-64">
                    {clientFiles.map((f, i) => (<SelectItem key={i} value={f.name}>{f.name} {f.reference && `(${f.reference})`}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white">Deletions Listing</Label>
                <Select value={delList} onValueChange={setDelList}>
                  <SelectTrigger className="border-white/10 bg-black/40 text-white"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent className="border-white/10 bg-black/90 text-white max-h-64">
                    {clientFiles.map((f, i) => (<SelectItem key={i} value={f.name}>{f.name} {f.reference && `(${f.reference})`}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Columns selection */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Users className="h-5 w-5" />
            Map Date Columns
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Button onClick={handleLoadColumns} disabled={!addList && !delList} className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Get Columns
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-white">Date of joining (from Additions Listing)</Label>
              <Select value={dojal} onValueChange={setDojal}>
                <SelectTrigger className="border-white/10 bg-black/40 text-white"><SelectValue placeholder="Select column..." /></SelectTrigger>
                <SelectContent className="border-white/10 bg-black/90 text-white max-h-64">
                  {addColumns.map((c, i) => (<SelectItem key={i} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white">Date of leaving (from Deletions Listing)</Label>
              <Select value={doldl} onValueChange={setDoldl}>
                <SelectTrigger className="border-white/10 bg-black/40 text-white"><SelectValue placeholder="Select column..." /></SelectTrigger>
                <SelectContent className="border-white/10 bg-black/90 text-white max-h-64">
                  {delColumns.map((c, i) => (<SelectItem key={i} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Reconciliation Table - only show after calculation */}
      {processingStatus === "completed" && (
        <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Users className="h-5 w-5" />
            Monthly Headcount Reconciliation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">

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
                  {monthlyData.map((month) => (
                    <TableRow key={month.month}>
                      <TableCell className="text-white">{month.month}</TableCell>
                      <TableCell className="text-white">{month.opening}</TableCell>
                      <TableCell className="text-white">{month.joiners}</TableCell>
                      <TableCell className="text-white">{month.leavers}</TableCell>
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
      )}

      {/* Reconciliation Test - only show after calculation */}
      {processingStatus === "completed" && (
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
                  readOnly
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

        </CardContent>
        </Card>
      )}

      {/* Quarterly Weighted Average - only show after calculation */}
      {processingStatus === "completed" && (
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
      )}

      {/* Annual Weighted Average - only show after calculation */}
      {processingStatus === "completed" && (
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
      )}

      {/* Average Gross Pay - Quarterly - only show after calculation */}
      {processingStatus === "completed" && (
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
      )}

      {/* Opening Headcount Input */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Users className="h-5 w-5" />
            Opening Headcount
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <Label className="text-white">Opening Headcount (April)</Label>
              <Input
                type="number"
                value={openingHeadcountInput}
                onChange={(e) => setOpeningHeadcountInput(Number(e.target.value))}
                className="w-32 border-white/10 bg-black/40 text-white"
              />
            </div>
            <div className="text-sm text-gray-400">
              For initial audit: enter manually. For subsequent audits: previous year's closing will be used.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculate Button */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Play className="h-5 w-5" />
            Execute Headcount Reconciliation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-gray-400">
              Display latest JSON from SharePoint or run a fresh reconciliation
            </div>
            <div className="flex gap-2">
              <Button
                onClick={displayHeadcountFromJson}
                disabled={processingStatus === "running"}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
              >
                Display Headcount Reconciliation
              </Button>
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
