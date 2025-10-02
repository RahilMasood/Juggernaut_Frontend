"use client";

import React, { useEffect, useState } from "react";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Label } from "../../ui/label";
import { Progress } from "../../ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Input } from "../../ui/input";
import { Database, Play, Loader2, ArrowLeft, Calendar } from "lucide-react";

interface PPECwipAnalysisProps { onBack?: () => void; }
interface ClientFile { name: string; reference: string; }
interface ExcelColumn { name: string; value: string; }

export default function PPECwipAnalysis({ onBack }: PPECwipAnalysisProps) {
  const [clientFiles, setClientFiles] = useState<ClientFile[]>([]);
  const [isLoadingClientFiles, setIsLoadingClientFiles] = useState(false);
  const [cwipFile, setCwipFile] = useState<string>("");
  const [cutoffDate, setCutoffDate] = useState<string>("");
  const [excelColumns, setExcelColumns] = useState<ExcelColumn[]>([]);
  const [isLoadingExcelColumns, setIsLoadingExcelColumns] = useState(false);
  const [amountColumn, setAmountColumn] = useState<string>("");
  const [dateColumn, setDateColumn] = useState<string>("");
  const [processingStatus, setProcessingStatus] = useState<"idle" | "running" | "completed" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [fileUrl, setFileUrl] = useState<string>("");

  useEffect(() => { loadClientFiles(); }, []);

  const loadClientFiles = async () => {
    setIsLoadingClientFiles(true);
    try {
      if (window.sharePointAPI?.loadCloudFiles) {
        const result = await window.sharePointAPI.loadCloudFiles();
        if (result.success && result.data?.files) {
          const files: ClientFile[] = result.data.files
            .map((f: any) => ({ name: String(f.name || "").trim(), reference: f.reference || "" }))
            .filter((f: any) => f.name && f.name.length > 0);
          setClientFiles(files);
        }
      }
    } finally {
      setIsLoadingClientFiles(false);
    }
  };

  const loadExcelColumns = async () => {
    if (!cwipFile) return;
    setIsLoadingExcelColumns(true);
    try {
      if (window.payroll?.loadExcelColumns) {
        const result = await window.payroll.loadExcelColumns(cwipFile);
        if (result.ok && result.columns) {
          setExcelColumns(result.columns.map((c: string) => ({ name: c, value: c })));
        } else {
          console.error("Failed to load Excel columns:", result.error);
        }
      }
    } catch (e) {
      console.error("Error loading Excel columns:", e);
    } finally {
      setIsLoadingExcelColumns(false);
    }
  };

  const canRun = () => !!(cwipFile && cutoffDate && amountColumn && dateColumn);

  const runCwip = async () => {
    if (!canRun()) return;
    setProcessingStatus("running");
    setProgress(0);
    setFileUrl("");

    try {
      if (window.payroll?.run) {
        const result = await window.payroll.run("execute_ppe_cwip_analysis", {
          inputFiles: [],
          options: { excel_file: cwipFile, cutoff_date: cutoffDate, columns: [amountColumn, dateColumn] },
        });
        if (result.ok && result.runId) {
          let isCompleted = false;
          const unsubscribe = window.payroll.onProgress((payload: any) => {
            if (payload.runId !== result.runId || isCompleted) return;
            if (payload.status === "running") {
              setProgress(payload.progress || 50);
            } else if (payload.status === "success") {
              setProcessingStatus("completed");
              setProgress(100);
              isCompleted = true;
              try {
                if (payload.stdout) {
                  const lines = String(payload.stdout).split("\n");
                  const jsonLine = lines.find((l: string) => l.trim().startsWith("{") && l.trim().endsWith("}"));
                  if (jsonLine) {
                    const parsed = JSON.parse(jsonLine);
                    if (parsed.excel_url) setFileUrl(parsed.excel_url);
                  }
                }
              } catch {}
              unsubscribe();
            } else if (payload.status === "error") {
              setProcessingStatus("error");
              isCompleted = true;
              unsubscribe();
            }
          });
          setTimeout(() => { if (!isCompleted) { setProcessingStatus("completed"); setProgress(100); isCompleted = true; unsubscribe(); } }, 60000);
        } else {
          setProcessingStatus("error");
        }
      } else {
        setProcessingStatus("error");
      }
    } catch (e) {
      console.error("Error running CWIP Analysis:", e);
      setProcessingStatus("error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify_between">
        <div>
          <h2 className="text-2xl font-bold text_white">CWIP Analysis - Property, Plant & Equipment</h2>
          <p className="text-gray-400">Upload CWIP listing, set cutoff, map columns, and run analysis</p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
        )}
      </div>

      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white"><Database className="h-5 w-5 text-blue-500" />Step 1: Select CWIP Listing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-white">Select from Cloud</Label>
              <Select value={cwipFile} onValueChange={setCwipFile}>
                <SelectTrigger className="border-white/10 bg-black/40 text-white"><SelectValue placeholder={isLoadingClientFiles ? "Loading..." : "Select CWIP file"} /></SelectTrigger>
                <SelectContent className="border-white/10 bg-black/90 text-white">
                  {clientFiles.map((f) => (<SelectItem key={f.name} value={f.name}>{f.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white">Cutoff date (mm/dd/yyyy)</Label>
              <div className="relative">
                <Input placeholder="mm/dd/yyyy" value={cutoffDate} onChange={(e) => setCutoffDate(e.target.value)} className="pr-9 border-white/10 bg-black/40 text-white placeholder:text-white/40" />
                <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              </div>
            </div>
          </div>
          <div className="flex items_center gap-3">
            <Button onClick={loadExcelColumns} disabled={!cwipFile || isLoadingExcelColumns} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isLoadingExcelColumns ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading Columns...</>) : ("Load Excel Columns")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-black/40">
        <CardHeader><CardTitle className="text-white">Step 2: Map Columns</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Amount</Label>
              <Select value={amountColumn} onValueChange={setAmountColumn} disabled={excelColumns.length === 0}>
                <SelectTrigger className="border-white/10 bg-black/40 text-white"><SelectValue placeholder={excelColumns.length === 0 ? "Load columns first" : "Select column"} /></SelectTrigger>
                <SelectContent className="border-white/10 bg-black/90 text-white">
                  {excelColumns.map((col) => (<SelectItem key={col.value} value={col.value}>{col.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white">GRN Date</Label>
              <Select value={dateColumn} onValueChange={setDateColumn} disabled={excelColumns.length === 0}>
                <SelectTrigger className="border-white/10 bg-black/40 text_white"><SelectValue placeholder={excelColumns.length === 0 ? "Load columns first" : "Select column"} /></SelectTrigger>
                <SelectContent className="border-white/10 bg-black/90 text-white">
                  {excelColumns.map((col) => (<SelectItem key={col.value} value={col.value}>{col.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-black/40">
        <CardHeader><CardTitle className="flex items-center gap-3 text-white"><Play className="h-5 w-5 text-green-500" />Execute CWIP Analysis</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Button onClick={runCwip} disabled={!canRun() || processingStatus === "running"} className="bg-green-600 hover:bg-green-700 text-white">
              {processingStatus === "running" ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>) : ("Run CWIP Analysis")}
            </Button>
            {processingStatus === "completed" && (<span className="text-green-400">Successful</span>)}
            {processingStatus === "error" && (<span className="text-red-400">Failed</span>)}
          </div>
          <div className="space-y-2"><Label className="text-white">Progress</Label><Progress value={progress} /></div>
          {fileUrl && (
            <div className="mt-4 p-3 bg-green-900/20 border border-green-500/20 rounded-lg">
              <p className="text-green-400 text-sm">CWIP analysis completed! Results uploaded to SharePoint.</p>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline text-sm">View Results</a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
