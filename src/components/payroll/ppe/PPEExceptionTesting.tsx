"use client";

import React, { useEffect, useState } from "react";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Label } from "../../ui/label";
import { Progress } from "../../ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Checkbox } from "../../ui/checkbox";
import { Database, Play, Loader2, ArrowLeft, AlertTriangle } from "lucide-react";

interface PPEExceptionTestingProps {
  onBack?: () => void;
}

interface ClientFile {
  name: string;
  reference: string;
}

const EXCEPTIONS = [
  { id: 1, description: "Net book value should not be equal to original cost." },
  { id: 2, description: "Useful life cannot be zero or blank." },
  { id: 3, description: "Accumulated depreciation should not exceed original cost." },
  { id: 4, description: "Useful life should not be less than 1 year." },
  { id: 5, description: "Capitalization date mismatch with previous year" },
  { id: 6, description: "Capitalization date must lie within current FY" },
];

export default function PPEExceptionTesting({ onBack }: PPEExceptionTestingProps) {
  const [clientFiles, setClientFiles] = useState<ClientFile[]>([]);
  const [isLoadingClientFiles, setIsLoadingClientFiles] = useState(false);
  const [currentFarFile, setCurrentFarFile] = useState<string>("");
  const [previousFarFile, setPreviousFarFile] = useState<string>("");
  const [selectedExceptions, setSelectedExceptions] = useState<number[]>([]);
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

  const handleExceptionToggle = (exceptionId: number) => {
    setSelectedExceptions(prev => prev.includes(exceptionId) ? prev.filter(id => id !== exceptionId) : [...prev, exceptionId]);
  };

  const canRunExceptionTests = () => currentFarFile && previousFarFile && selectedExceptions.length > 0;

  const runExceptionTests = async () => {
    if (!canRunExceptionTests()) return;
    setProcessingStatus("running");
    setProgress(0);
    setFileUrl("");

    try {
      if (window.payroll?.run) {
        const result = await window.payroll.run("execute_ppe_exception_testing", {
          inputFiles: [],
          options: {
            current_far_file: currentFarFile,
            previous_far_file: previousFarFile,
            exception_numbers: selectedExceptions,
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
                    if (parsed.file_web_url) setFileUrl(parsed.file_web_url);
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
      console.error("Error running PPE Exception Testing:", error);
      setProcessingStatus("error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Exception Testing - Property, Plant & Equipment</h2>
          <p className="text-gray-400">Run exception tests on FAR files and generate exception reports</p>
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
            Step 1: Select FAR Files
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-white">Current FAR File</Label>
              <Select value={currentFarFile} onValueChange={setCurrentFarFile}>
                <SelectTrigger className="border-white/10 bg-black/40 text-white">
                  <SelectValue placeholder={isLoadingClientFiles ? "Loading..." : "Select current FAR file"} />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-black/90 text-white">
                  {clientFiles.map((f) => (
                    <SelectItem key={f.name} value={f.name}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white">Previous FAR File</Label>
              <Select value={previousFarFile} onValueChange={setPreviousFarFile}>
                <SelectTrigger className="border-white/10 bg-black/40 text-white">
                  <SelectValue placeholder={isLoadingClientFiles ? "Loading..." : "Select previous FAR file"} />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-black/90 text-white">
                  {clientFiles.map((f) => (
                    <SelectItem key={f.name} value={f.name}>{f.name}</SelectItem>
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
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Step 2: Select Exception Tests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {EXCEPTIONS.map((e) => (
              <div key={e.id} className="flex items-start space-x-3">
                <Checkbox id={`exception-${e.id}`} checked={selectedExceptions.includes(e.id)} onCheckedChange={() => handleExceptionToggle(e.id)} className="mt-1" />
                <div className="space-y-1">
                  <Label htmlFor={`exception-${e.id}`} className="text-white cursor-pointer">{e.id}. {e.description}</Label>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Play className="h-5 w-5 text-green-500" />
            Execute Exception Testing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Button onClick={runExceptionTests} disabled={!canRunExceptionTests() || processingStatus === "running"} className="bg-green-600 hover:bg-green-700 text-white">
              {processingStatus === "running" ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>) : ("Run Exception Tests")}
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
              <p className="text-green-400 text-sm">Exception testing completed! Results uploaded to SharePoint.</p>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline text-sm">View Results</a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
