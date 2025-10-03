"use client";

import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Progress } from "../ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Database, Play, Loader2, ArrowLeft } from "lucide-react";

interface IAIPETestingProps {
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

const FIELD_KEYS: Array<{ key: string; label: string }> = [
  { key: "asset_code", label: "Asset Code" },
  { key: "asset_category", label: "Asset Category" },
  { key: "asset_description", label: "Asset Description" },
  { key: "useful_life", label: "Useful Life" },
  { key: "original_cost", label: "Original Cost" },
  { key: "accumulated_depreciation", label: "Accumulated Depreciation" },
  { key: "net_book_value", label: "Net Book Value" },
  { key: "capitalization_date", label: "Capitalization Date" },
  { key: "scrap_value", label: "Scrap Value" },
  { key: "additions", label: "Additions" },
  { key: "deletions", label: "Deletions" },
  { key: "month_year", label: "Month/Year" },
];

export default function IAIPETesting({ onBack }: IAIPETestingProps) {
  const [clientFiles, setClientFiles] = useState<ClientFile[]>([]);
  const [excelColumns, setExcelColumns] = useState<ExcelColumn[]>([]);
  const [isLoadingClientFiles, setIsLoadingClientFiles] = useState(false);
  const [isLoadingExcelColumns, setIsLoadingExcelColumns] = useState(false);
  const [farFile, setFarFile] = useState<string>("");
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [processingStatus, setProcessingStatus] = useState<"idle" | "running" | "completed" | "error">("idle");
  const [progress, setProgress] = useState(0);

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

  const loadExcelColumns = async () => {
    if (!farFile) return;
    setIsLoadingExcelColumns(true);
    try {
      if (window.sharePointAPI?.readExcelColumnsFromCloud) {
        const result = await window.sharePointAPI.readExcelColumnsFromCloud(farFile);
        if (result.success && Array.isArray(result.data)) {
          setExcelColumns(result.data.map((c: any) => ({ name: c, value: c })));
        }
      }
    } finally {
      setIsLoadingExcelColumns(false);
    }
  };

  const handleMappingChange = (fieldKey: string, columnName: string) => {
    setColumnMappings(prev => ({ ...prev, [fieldKey]: columnName }));
  };

  const allFieldsMapped = FIELD_KEYS.every(f => columnMappings[f.key] && columnMappings[f.key].length > 0);

  const executeIPE = async () => {
    if (!farFile || !allFieldsMapped) return;
    setProcessingStatus("running");
    setProgress(0);

    try {
      const customKeys = FIELD_KEYS.map(f => columnMappings[f.key] || "");
      const result = await window.payroll.run("execute_ia_ipe_testing", {
        inputFiles: [],
        options: {
          ipe_custom_keys: customKeys,
          reference_value: farFile || ""
        }
      });

      if (result.ok && result.runId) {
        const unsubscribe = window.payroll.onProgress((payload: any) => {
          if (payload.runId !== result.runId) return;

          if (payload.status === "running") {
            setProgress(prev => {
              const newProgress = Math.min(95, Math.max(5, prev + 5));
              if (newProgress >= 30) {
                setProcessingStatus("completed");
                setProgress(100);
                unsubscribe();
                return 100;
              }
              return newProgress;
            });
          } else if (payload.status === "success") {
            setProcessingStatus("completed");
            setProgress(100);
            unsubscribe();
          } else if (payload.status === "error") {
            setProcessingStatus("error");
            unsubscribe();
          }
        });

        setTimeout(() => {
          if (processingStatus === "running") {
            setProcessingStatus("completed");
            setProgress(100);
            unsubscribe();
          }
        }, 30000);
      } else {
        setProcessingStatus("error");
      }
    } catch (e) {
      setProcessingStatus("error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">IPE Testing - Intangible Assets</h2>
          <p className="text-gray-400">Map FAR columns and update SharePoint column map</p>
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
            Step 1: Select FAR File
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-white">Select from Cloud</Label>
              <Select value={farFile} onValueChange={setFarFile}>
                <SelectTrigger className="border-white/10 bg-black/40 text-white">
                  <SelectValue placeholder={isLoadingClientFiles ? "Loading..." : "Select FAR file"} />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-black/90 text-white">
                  {clientFiles.map((f) => (
                    <SelectItem key={f.name} value={f.name}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={loadExcelColumns} disabled={!farFile || isLoadingExcelColumns} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isLoadingExcelColumns ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading Columns...</>
              ) : (
                "Load Excel Columns"
              )}
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
            {FIELD_KEYS.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label className="text-white">{field.label}</Label>
                <Select
                  value={columnMappings[field.key] || ""}
                  onValueChange={(v) => handleMappingChange(field.key, v)}
                  disabled={excelColumns.length === 0}
                >
                  <SelectTrigger className="border-white/10 bg-black/40 text-white">
                    <SelectValue placeholder={excelColumns.length === 0 ? "Load columns first" : "Select column"} />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-black/90 text-white">
                    {excelColumns.map((col) => (
                      <SelectItem key={col.value} value={col.value}>{col.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Play className="h-5 w-5 text-green-500" />
            Execute IPE Mapping
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Button onClick={executeIPE} disabled={!farFile || !allFieldsMapped || processingStatus === "running"} className="bg-green-600 hover:bg-green-700 text-white">
              {processingStatus === "running" ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                "Run IPE Testing"
              )}
            </Button>
            {processingStatus === "completed" && (
              <span className="text-green-400">Successful</span>
            )}
            {processingStatus === "error" && (
              <span className="text-red-400">Failed</span>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-white">Progress</Label>
            <Progress value={progress} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



