"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../../ui/button";
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
import { CheckCircle, AlertCircle, X, Download, Play, File, Cloud, Loader2 } from "lucide-react";

interface IPETestingProps {
  onBack?: () => void;
}

interface CloudFile {
  name: string;
  reference: string;
}

interface ProcessingStatus {
  listingFiles: boolean;
  downloading: boolean;
  processing: boolean;
  completed: boolean;
  error: string | null;
}

export default function IPETesting({ onBack }: IPETestingProps) {
  // State management
  const [clientFiles, setClientFiles] = useState<CloudFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    listingFiles: false,
    downloading: false,
    processing: false,
    completed: false,
    error: null,
  });

  // Load files from client container on component mount
  useEffect(() => {
    loadClientFiles();
  }, []);

  // Load files from Azure client container
  const loadClientFiles = async () => {
    try {
      setProcessingStatus(prev => ({ ...prev, listingFiles: true, error: null }));
      
      // Use the cloud storage utility to list files directly from Azure client container
      const result = await (window as any).cloud.listFilesFromAzure({ container: "client" });
      if (result.success) {
        setClientFiles(result.files);
      } else {
        throw new Error(result.error || "Failed to list files");
      }
      
      setProcessingStatus(prev => ({ ...prev, listingFiles: false }));
    } catch (error) {
      console.error("Failed to load client files:", error);
      setProcessingStatus(prev => ({ 
        ...prev, 
        listingFiles: false, 
        error: `Failed to load files from client container: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }));
    }
  };

  // Download and process selected file
  const handleFileProcess = async () => {
    if (!selectedFile) return;

    try {
      setProcessingStatus(prev => ({ 
        ...prev, 
        downloading: true, 
        processing: true, 
        error: null 
      }));

      // Step 1: Download file from client container
      const downloadResult = await downloadFileFromClient(selectedFile);
      if (!downloadResult.success) {
        throw new Error(downloadResult.error || "Download failed");
      }

      // Step 2: Process the file and create column map
      await processPayRegistrarFile(selectedFile, downloadResult.filePath!);

      setProcessingStatus(prev => ({ 
        ...prev, 
        downloading: false, 
        processing: false, 
        completed: true 
      }));

    } catch (error) {
      console.error("File processing failed:", error);
      setProcessingStatus(prev => ({ 
        ...prev, 
        downloading: false, 
        processing: false, 
        error: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }));
    }
  };

  // Download file from Azure client container
  const downloadFileFromClient = async (fileName: string): Promise<{ success: boolean; filePath?: string; error?: string }> => {
    try {
      // Use the cloud storage utility to download file
      const result = await (window as any).cloud.downloadFile("client", fileName);
      
      if (result.success && result.filePath) {
        return { success: true, filePath: result.filePath };
      } else {
        return { success: false, error: result.error || "Download failed" };
      }
    } catch (error) {
      return { 
        success: false, 
        error: `Download error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  };

  // Process Pay Registrar file and create column map
  const processPayRegistrarFile = async (fileName: string, filePath: string) => {
    try {
      // Run the Python script to process the file
      const result = await (window as any).payroll.run("pay_registrar_processor", {
        inputFiles: [filePath],
        options: {
          blob_name: fileName,
        },
      });

      if (!result.success) {
        throw new Error(result.error || "Processing failed");
      }

      console.log("Pay Registrar file processed successfully");
    } catch (error) {
      console.error("Pay Registrar processing failed:", error);
      throw error;
    }
  };

  const isProcessing = processingStatus.downloading || processingStatus.processing;
  const canProcess = selectedFile && !isProcessing && !processingStatus.completed;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">IPE Testing</h2>
          <p className="text-gray-400">Select and process Pay Registrar files from client container</p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
        )}
      </div>

      {/* Error Display */}
      {processingStatus.error && (
        <Card className="border-red-500/20 bg-red-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <h4 className="font-medium text-red-300">Error</h4>
                <p className="text-sm text-red-200">{processingStatus.error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pay Registrar Card */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <File className="h-5 w-5" />
            Pay Registrar
            <span className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-300">Required</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Selection */}
          <div className="space-y-3">
            <Label className="text-white">Select File from Client Container</Label>
            <div className="flex items-center gap-3">
              <Select
                value={selectedFile}
                onValueChange={setSelectedFile}
                disabled={processingStatus.listingFiles || isProcessing}
              >
                <SelectTrigger className="flex-1 border-white/10 bg-black/40 text-white">
                  <SelectValue 
                    placeholder={
                      processingStatus.listingFiles 
                        ? "Loading files..." 
                        : clientFiles.length === 0 
                          ? "No files found" 
                          : "Select a file..."
                    } 
                  />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-black/90 text-white max-h-64">
                  {clientFiles.map((file) => (
                    <SelectItem key={file.name} value={file.name}>
                      <div className="flex items-center gap-2">
                        <Cloud className="h-4 w-4" />
                        {file.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                onClick={loadClientFiles}
                disabled={processingStatus.listingFiles}
                variant="outline"
                size="sm"
              >
                {processingStatus.listingFiles ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Refresh"
                )}
              </Button>
            </div>
          </div>

          {/* Selected File Display */}
          {selectedFile && (
            <div className="space-y-2">
              <Label className="text-white">Selected File</Label>
              <div className="flex items-center justify-between rounded border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <Cloud className="h-4 w-4 text-blue-400" />
                  <div>
                    <div className="text-sm font-medium text-white">{selectedFile}</div>
                    <div className="text-xs text-gray-400">Client Container</div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedFile("")}
                  disabled={isProcessing}
                  className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Process Button */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">
                Download and process the selected file to create Execution_Payroll_PRColumnMap.json
              </p>
              {!canProcess && selectedFile && (
                <p className="mt-1 text-xs text-red-400">
                  {isProcessing ? "Processing..." : "Ready to process"}
                </p>
              )}
            </div>
            <Button
              onClick={handleFileProcess}
              disabled={!canProcess}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {processingStatus.downloading ? "Downloading..." : "Processing..."}
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Process File
                </>
              )}
            </Button>
          </div>

          {/* Processing Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-blue-300">
                  {processingStatus.downloading ? "Downloading file..." : "Processing file..."}
                </span>
                <span className="text-gray-400">Please wait</span>
              </div>
              <Progress value={processingStatus.downloading ? 50 : 75} className="h-2" />
            </div>
          )}

          {/* Success Message */}
          {processingStatus.completed && (
            <div className="rounded border border-green-500/20 bg-green-500/10 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <h4 className="font-medium text-green-300">Processing Completed</h4>
                  <p className="text-sm text-green-200">
                    Execution_Payroll_PRColumnMap.json has been created and uploaded to juggernaut container
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Future Cards Placeholder */}
      <div className="text-center py-8">
        <div className="text-gray-500 text-sm">
          Additional IPE Testing cards will be added here in future updates
        </div>
      </div>
    </div>
  );
}