"use client";

import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Progress } from "../ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Database, Play, Loader2, ArrowLeft } from "lucide-react";

interface IAAdditionsDeletionsProps {
  onBack?: () => void;
}

interface ClientFile {
  name: string;
  reference: string;
}

interface ExcelColumn {
  name: string;
  value: string;
}

export default function IAAdditionsDeletions({ onBack }: IAAdditionsDeletionsProps) {
  const [clientFiles, setClientFiles] = useState<ClientFile[]>([]);
  const [isLoadingClientFiles, setIsLoadingClientFiles] = useState(false);

  const [additionsFile, setAdditionsFile] = useState<string>("");
  const [deletionsFile, setDeletionsFile] = useState<string>("");

  const [isLoadingAddCols, setIsLoadingAddCols] = useState(false);
  const [isLoadingDelCols, setIsLoadingDelCols] = useState(false);
  const [additionColumns, setAdditionColumns] = useState<ExcelColumn[]>([]);
  const [deletionColumns, setDeletionColumns] = useState<ExcelColumn[]>([]);

  const [additionsDateCol, setAdditionsDateCol] = useState<string>("");
  const [additionsAmountCol, setAdditionsAmountCol] = useState<string>("");
  const [deletionsDateCol, setDeletionsDateCol] = useState<string>("");
  const [deletionsAmountCol, setDeletionsAmountCol] = useState<string>("");

  const [processingStatus, setProcessingStatus] = useState<"idle" | "running" | "completed" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [fileUrl, setFileUrl] = useState<string>("");

  useEffect(() => {
    loadClientFiles();
  }, []);

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

  const loadAdditionColumns = async () => {
    if (!additionsFile) return;
    setIsLoadingAddCols(true);
    try {
      if (window.sharePointAPI?.readExcelColumnsFromCloud) {
        const result = await window.sharePointAPI.readExcelColumnsFromCloud(additionsFile);
        if (result.success && Array.isArray(result.data)) {
          setAdditionColumns(result.data.map((c: any) => ({ name: c, value: c })));
        }
      }
    } finally {
      setIsLoadingAddCols(false);
    }
  };

  const loadDeletionColumns = async () => {
    if (!deletionsFile) return;
    setIsLoadingDelCols(true);
    try {
      if (window.sharePointAPI?.readExcelColumnsFromCloud) {
        const result = await window.sharePointAPI.readExcelColumnsFromCloud(deletionsFile);
        if (result.success && Array.isArray(result.data)) {
          setDeletionColumns(result.data.map((c: any) => ({ name: c, value: c })));
        }
      }
    } finally {
      setIsLoadingDelCols(false);
    }
  };

  const canRun = () =>
    additionsFile && deletionsFile && additionsDateCol && additionsAmountCol && deletionsDateCol && deletionsAmountCol;

  const runADL = async () => {
    if (!canRun()) return;
    setProcessingStatus("running");
    setProgress(0);
    setFileUrl("");

    try {
      if (window.payroll?.run) {
        const result = await window.payroll.run("execute_ia_adl", {
          inputFiles: [],
          options: {
            file_additions: additionsFile,
            file_deletions: deletionsFile,
            col_add: [additionsDateCol, additionsAmountCol],
            col_del: [deletionsDateCol, deletionsAmountCol],
          },
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
                    if (parsed.json_url) setFileUrl(parsed.json_url);
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
          setTimeout(() => {
            if (!isCompleted) {
              setProcessingStatus("completed");
              setProgress(100);
              isCompleted = true;
              unsubscribe();
            }
          }, 60000);
        } else {
          setProcessingStatus("error");
        }
      } else {
        setProcessingStatus("error");
      }
    } catch (error) {
      setProcessingStatus("error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Additions & Deletions Listing - Intangible Assets</h2>
          <p className="text-gray-400">Select listings, map columns, and run analysis</p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
      </div>

      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Database className="h-5 w-5 text-blue-500" />
            Step 1: Select Listing Files
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-white">Additions Listing (from Cloud)</Label>
              <Select value={additionsFile} onValueChange={setAdditionsFile}>
                <SelectTrigger className="border-white/10 bg-black/40 text-white">
                  <SelectValue placeholder={isLoadingClientFiles ? "Loading..." : "Select Additions file"} />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-black/90 text-white">
                  {clientFiles.map((f) => (
                    <SelectItem key={f.name} value={f.name}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white">Deletions Listing (from Cloud)</Label>
              <Select value={deletionsFile} onValueChange={setDeletionsFile}>
                <SelectTrigger className="border-white/10 bg-black/40 text-white">
                  <SelectValue placeholder={isLoadingClientFiles ? "Loading..." : "Select Deletions file"} />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-black/90 text-white">
                  {clientFiles.map((f) => (
                    <SelectItem key={f.name} value={f.name}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={loadAdditionColumns} disabled={!additionsFile || isLoadingAddCols} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isLoadingAddCols ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading Additions Columns...</>) : ("Load Additions Columns")}
            </Button>
            <Button onClick={loadDeletionColumns} disabled={!deletionsFile || isLoadingDelCols} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isLoadingDelCols ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading Deletions Columns...</>) : ("Load Deletions Columns")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="text-white">Step 2: Map Columns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Additions Date</Label>
              <Select value={additionsDateCol} onValueChange={setAdditionsDateCol} disabled={additionColumns.length === 0}>
                <SelectTrigger className="border-white/10 bg-black/40 text-white">
                  <SelectValue placeholder={additionColumns.length === 0 ? "Load columns first" : "Select column"} />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-black/90 text-white">
                  {additionColumns.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white">Additions Amount</Label>
              <Select value={additionsAmountCol} onValueChange={setAdditionsAmountCol} disabled={additionColumns.length === 0}>
                <SelectTrigger className="border-white/10 bg-black/40 text-white">
                  <SelectValue placeholder={additionColumns.length === 0 ? "Load columns first" : "Select column"} />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-black/90 text-white">
                  {additionColumns.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white">Deletions Date</Label>
              <Select value={deletionsDateCol} onValueChange={setDeletionsDateCol} disabled={deletionColumns.length === 0}>
                <SelectTrigger className="border-white/10 bg-black/40 text-white">
                  <SelectValue placeholder={deletionColumns.length === 0 ? "Load columns first" : "Select column"} />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-black/90 text-white">
                  {deletionColumns.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white">Deletions Amount</Label>
              <Select value={deletionsAmountCol} onValueChange={setDeletionsAmountCol} disabled={deletionColumns.length === 0}>
                <SelectTrigger className="border-white/10 bg-black/40 text-white">
                  <SelectValue placeholder={deletionColumns.length === 0 ? "Load columns first" : "Select column"} />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-black/90 text-white">
                  {deletionColumns.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Play className="h-5 w-5 text-green-500" />
            Execute ADL
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Button onClick={runADL} disabled={!canRun() || processingStatus === "running"} className="bg-green-600 hover:bg-green-700 text-white">
              {processingStatus === "running" ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>) : ("Run ADL")}
            </Button>
            {processingStatus === "completed" && (<span className="text-green-400">Successful</span>)}
            {processingStatus === "error" && (<span className="text-red-400">Failed</span>)}
          </div>
          <div className="space-y-2">
            <Label className="text-white">Progress</Label>
            <Progress value={progress} />
          </div>
          {fileUrl && (
            <div className="mt-4 p-3 bg-green-900/20 border border-green-500/20 rounded-lg">
              <p className="text-green-400 text-sm">ADL completed! Results uploaded to SharePoint.</p>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline text-sm">View Results</a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



