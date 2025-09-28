import React, { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Card, CardContent } from "./card";
import { Badge } from "./badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Upload, X, CheckCircle2, AlertCircle, Loader2, Cloud, FolderOpen } from "lucide-react";
import { sharePointService } from "../../utils/sharepoint-service";

interface SharePointFileUploadProps {
  onFilesUploaded: (files: Array<{ name: string; path: string; cloudUrl?: string }>) => void;
  multiple?: boolean;
  accept?: string;
  className?: string;
  triggerText?: string;
  showReferenceInput?: boolean;
  referencePlaceholder?: string;
}

interface CloudFile {
  name: string;
  url: string;
  reference: string;
}

interface UploadStatus {
  fileName: string;
  status: 'uploading' | 'success' | 'error';
  progress?: number;
  error?: string;
  webUrl?: string;
}

export function SharePointFileUpload({
  onFilesUploaded,
  multiple = true,
  accept = "*",
  className = "",
  triggerText = "Upload Files to SharePoint",
  showReferenceInput = false,
  referencePlaceholder = "Enter reference name"
}: SharePointFileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [referenceName, setReferenceName] = useState<string>("");
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [cloudFiles, setCloudFiles] = useState<CloudFile[]>([]);
  const [selectedCloudFiles, setSelectedCloudFiles] = useState<CloudFile[]>([]);
  const [isLoadingCloudFiles, setIsLoadingCloudFiles] = useState(false);
  const [uploadMode, setUploadMode] = useState<'local' | 'cloud'>('local');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load cloud files when component mounts or when switching to cloud mode
  useEffect(() => {
    if (uploadMode === 'cloud' && cloudFiles.length === 0) {
      loadCloudFiles();
    }
  }, [uploadMode]);

  const loadCloudFiles = async () => {
    setIsLoadingCloudFiles(true);
    try {
      if (window.sharePointAPI?.loadCloudFiles) {
        const result = await window.sharePointAPI.loadCloudFiles();
        if (result.success && result.data?.files) {
          setCloudFiles(result.data.files);
          console.log('Loaded cloud files:', result.data.files);
        } else {
          console.error('Failed to load cloud files:', result.error);
        }
      } else {
        console.error('SharePoint API not available');
      }
    } catch (error) {
      console.error('Error loading cloud files:', error);
    } finally {
      setIsLoadingCloudFiles(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    
    // Initialize upload statuses
    const statuses: UploadStatus[] = files.map(file => ({
      fileName: file.name,
      status: 'uploading' as const
    }));
    setUploadStatuses(statuses);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setUploadStatuses(prev => prev.filter((_, i) => i !== index));
  };

  const handleCloudFileSelect = (cloudFile: CloudFile) => {
    if (selectedCloudFiles.find(f => f.name === cloudFile.name)) {
      // Remove if already selected
      setSelectedCloudFiles(prev => prev.filter(f => f.name !== cloudFile.name));
    } else {
      // Add if not selected
      if (multiple) {
        setSelectedCloudFiles(prev => [...prev, cloudFile]);
      } else {
        setSelectedCloudFiles([cloudFile]);
      }
    }
  };

  const removeCloudFile = (cloudFile: CloudFile) => {
    setSelectedCloudFiles(prev => prev.filter(f => f.name !== cloudFile.name));
  };

  const uploadFileToSharePoint = async (file: File): Promise<{ success: boolean; webUrl?: string; error?: string }> => {
    try {
      // Convert file to base64
      const base64Content = await fileToBase64(file);
      
      console.log(`Uploading file to SharePoint: ${file.name}`, {
        referenceName,
        folderName: "client",
        fyYear: "TestClient_FY25"
      });
      
      // Call SharePoint API to upload file
      if (window.sharePointAPI?.uploadFile) {
        const result = await window.sharePointAPI.uploadFile({
          fileContent: base64Content,
          fileName: file.name,
          referenceValue: referenceName,
          folderName: "client",
          fyYear: "TestClient_FY25"
        });

        console.log('SharePoint upload result:', result);

        if (result.success) {
          return {
            success: true,
            webUrl: result.data?.webUrl,
            error: undefined
          };
        } else {
          return {
            success: false,
            webUrl: undefined,
            error: result.error || 'Upload failed'
          };
        }
      } else {
        throw new Error('SharePoint API not available');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        webUrl: undefined,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get just the base64 content
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    if (uploadMode === 'local' && selectedFiles.length === 0) return;
    if (uploadMode === 'cloud' && selectedCloudFiles.length === 0) return;

    setIsUploading(true);
    
    try {
      if (uploadMode === 'local') {
        // Handle local file upload
        const uploadPromises = selectedFiles.map(async (file, index) => {
          // Update status to uploading
          setUploadStatuses(prev => prev.map((status, i) => 
            i === index ? { ...status, status: 'uploading' } : status
          ));

          const result = await uploadFileToSharePoint(file);
          
          // Update status based on result
          setUploadStatuses(prev => prev.map((status, i) => 
            i === index ? { 
              ...status, 
              status: result.success ? 'success' : 'error',
              webUrl: result.webUrl,
              error: result.error
            } : status
          ));

          return {
            name: file.name,
            path: file.name, // In a real implementation, this would be the actual file path
            cloudUrl: result.webUrl
          };
        });

        const results = await Promise.all(uploadPromises);
        const successfulUploads = results.filter(r => r.cloudUrl);
        
        if (successfulUploads.length > 0) {
          onFilesUploaded(successfulUploads);
          console.log(`✅ Uploaded ${successfulUploads.length} file(s) to SharePoint:`, successfulUploads);
        }

        // Clear files after successful upload
        setTimeout(() => {
          setSelectedFiles([]);
          setUploadStatuses([]);
          setReferenceName("");
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }, 2000);
      } else {
        // Handle cloud file association
        const cloudFileResults = selectedCloudFiles.map(cloudFile => ({
          name: cloudFile.name,
          path: cloudFile.name,
          cloudUrl: cloudFile.url
        }));

        onFilesUploaded(cloudFileResults);
        console.log(`✅ Associated ${cloudFileResults.length} cloud file(s):`, cloudFileResults);

        // Clear selected cloud files after association
        setTimeout(() => {
          setSelectedCloudFiles([]);
        }, 2000);
      }

    } catch (error) {
      console.error('Upload/Association failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusIcon = (status: UploadStatus['status']) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: UploadStatus['status']) => {
    switch (status) {
      case 'uploading':
        return "border-blue-500/20 bg-blue-500/10 text-blue-300";
      case 'success':
        return "border-green-500/20 bg-green-500/10 text-green-300";
      case 'error':
        return "border-red-500/20 bg-red-500/10 text-red-300";
      default:
        return "border-gray-500/20 bg-gray-500/10 text-gray-300";
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Mode Selection */}
      <div className="flex items-center gap-2">
        <Button
          variant={uploadMode === 'local' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUploadMode('local')}
          className="flex items-center gap-2"
        >
          <FolderOpen className="h-4 w-4" />
          Upload Local Files
        </Button>
        <Button
          variant={uploadMode === 'cloud' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUploadMode('cloud')}
          className="flex items-center gap-2"
        >
          <Cloud className="h-4 w-4" />
          Select from Cloud
        </Button>
      </div>

      {/* Local Upload Mode */}
      {uploadMode === 'local' && (
        <>
          {/* File Input */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple={multiple}
              accept={accept}
              onChange={handleFileSelect}
              className="hidden"
              id="sharepoint-file-upload"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {triggerText}
            </Button>
          </div>

          {/* Reference Input */}
          {showReferenceInput && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">
                Reference Name (Optional)
              </label>
              <Input
                type="text"
                placeholder={referencePlaceholder}
                value={referenceName}
                onChange={(e) => setReferenceName(e.target.value)}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
          )}

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-white">Selected Files</div>
                  {selectedFiles.map((file, index) => {
                    const status = uploadStatuses[index];
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(status?.status || 'uploading')}
                          <div className="flex-1">
                            <div className="text-sm text-white">{file.name}</div>
                            <div className="text-xs text-white/60">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                            {status?.error && (
                              <div className="text-xs text-red-400 mt-1">
                                {status.error}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {status && (
                            <Badge className={`text-xs ${getStatusColor(status.status)}`}>
                              {status.status}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="text-white/60 hover:text-white hover:bg-white/10"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Upload Button */}
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="bg-green-600 text-white hover:bg-green-700"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload to SharePoint
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Cloud Selection Mode */}
      {uploadMode === 'cloud' && (
        <>
          <div className="flex items-center gap-4">
            <Button
              onClick={loadCloudFiles}
              disabled={isLoadingCloudFiles}
              className="flex items-center gap-2"
            >
              {isLoadingCloudFiles ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Cloud className="h-4 w-4" />
              )}
              {isLoadingCloudFiles ? 'Loading...' : 'Load Cloud Files'}
            </Button>
          </div>

          {cloudFiles.length > 0 && (
            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-white">Available Cloud Files:</h4>
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                    {cloudFiles.map((cloudFile, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                          selectedCloudFiles.find(f => f.name === cloudFile.name)
                            ? 'bg-blue-100 border border-blue-300'
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                        onClick={() => handleCloudFileSelect(cloudFile)}
                      >
                        <div className="flex items-center gap-2">
                          <Cloud className="h-4 w-4 text-blue-500" />
                          <div>
                            <span className="text-sm font-medium text-white">{cloudFile.name}</span>
                            {cloudFile.reference && (
                              <span className="text-xs text-white/60 ml-2">({cloudFile.reference})</span>
                            )}
                          </div>
                        </div>
                        {selectedCloudFiles.find(f => f.name === cloudFile.name) && (
                          <CheckCircle2 className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedCloudFiles.length > 0 && (
            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-white">Selected Cloud Files:</h4>
                  {selectedCloudFiles.map((cloudFile, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                      <div className="flex items-center gap-2">
                        <Cloud className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-white">{cloudFile.name}</span>
                        {cloudFile.reference && (
                          <Badge variant="secondary" className="text-xs">
                            {cloudFile.reference}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCloudFile(cloudFile)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {selectedCloudFiles.length > 0 && (
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Associating Files...
                </>
              ) : (
                <>
                  <Cloud className="h-4 w-4 mr-2" />
                  Associate Cloud Files
                </>
              )}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
