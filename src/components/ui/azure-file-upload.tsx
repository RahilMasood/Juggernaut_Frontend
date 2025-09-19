import React, { useRef, useState } from 'react';
import { Button } from './button';
import { Upload, Cloud, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Progress } from './progress';

interface AzureFileUploadProps {
  onFilesUploaded?: (files: Array<{ name: string; path: string; cloudUrl?: string }>) => void;
  multiple?: boolean;
  accept?: string;
  className?: string;
  triggerText?: string;
  containerName?: string;
  showReferenceInput?: boolean;
  referencePlaceholder?: string;
}

interface UploadStatus {
  fileName: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  cloudUrl?: string;
}

export function AzureFileUpload({
  onFilesUploaded,
  multiple = true,
  accept = "*",
  className = "",
  triggerText = "Upload Files to Cloud",
  containerName = "client",
  showReferenceInput = false,
  referencePlaceholder = "Enter reference name"
}: AzureFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [referenceName, setReferenceName] = useState<string>("");

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    setUploadStatuses([]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setUploadStatuses(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFileToAzure = async (file: File): Promise<{ success: boolean; cloudUrl?: string; error?: string }> => {
    try {
      // Convert file to base64 for upload using FileReader (handles large files better)
      const base64Content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove the data URL prefix to get just the base64 content
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
      
      // Call the main process to upload to Azure with reference name
      const result = await window.electronAPI.uploadFileToAzure({
        containerName,
        fileName: file.name,
        fileContent: base64Content,
        contentType: file.type || 'application/octet-stream',
        reference: referenceName || ""
      });

      return {
        success: result.success,
        cloudUrl: result.cloudUrl,
        error: result.error
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    const newStatuses: UploadStatus[] = selectedFiles.map(file => ({
      fileName: file.name,
      status: 'uploading',
      progress: 0
    }));
    setUploadStatuses(newStatuses);

    const uploadedFiles: Array<{ name: string; path: string; cloudUrl?: string }> = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      // Update progress
      setUploadStatuses(prev => prev.map((status, index) => 
        index === i ? { ...status, progress: 50 } : status
      ));

      const result = await uploadFileToAzure(file);
      
      // Update status
      setUploadStatuses(prev => prev.map((status, index) => 
        index === i ? {
          ...status,
          status: result.success ? 'success' : 'error',
          progress: 100,
          error: result.error,
          cloudUrl: result.cloudUrl
        } : status
      ));

      if (result.success) {
        uploadedFiles.push({
          name: file.name,
          path: file.name, // For cloud files, we use the name as path
          cloudUrl: result.cloudUrl
        });
      }
    }

    setIsUploading(false);
    
    if (uploadedFiles.length > 0 && onFilesUploaded) {
      onFilesUploaded(uploadedFiles);
    }

    // Clear files after successful upload
    if (uploadedFiles.length === selectedFiles.length) {
      setSelectedFiles([]);
      setUploadStatuses([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getStatusIcon = (status: UploadStatus['status']) => {
    switch (status) {
      case 'uploading':
        return <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: UploadStatus['status']) => {
    switch (status) {
      case 'uploading':
        return 'text-blue-500';
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
    }
  };

  return (
    <div className="space-y-4">
      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Button */}
      <Button
        onClick={() => fileInputRef.current?.click()}
        className={`${className} border-white/10 bg-white/5 text-white hover:bg-white/10`}
        disabled={isUploading}
      >
        <Upload className="mr-2 h-4 w-4" />
        {triggerText}
      </Button>

      {/* Selected Files Display */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-white">Selected Files:</div>
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/10">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <Cloud className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span className="text-sm text-white truncate">{file.name}</span>
                <span className="text-xs text-white/60">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
                disabled={isUploading}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}

          {/* Reference Name Input */}
          {showReferenceInput && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Reference Name:</label>
              <input
                type="text"
                value={referenceName}
                onChange={(e) => setReferenceName(e.target.value)}
                placeholder={referencePlaceholder}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isUploading}
              />
            </div>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={isUploading || (showReferenceInput && !referenceName.trim())}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} file(s) to Azure`}
          </Button>
        </div>
      )}

      {/* Upload Status */}
      {uploadStatuses.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-white">Upload Status:</div>
          {uploadStatuses.map((status, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(status.status)}
                  <span className={`text-sm ${getStatusColor(status.status)}`}>
                    {status.fileName}
                  </span>
                </div>
                <span className="text-xs text-white/60">{status.progress}%</span>
              </div>
              <Progress value={status.progress} className="h-1" />
              {status.error && (
                <div className="text-xs text-red-500">{status.error}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
