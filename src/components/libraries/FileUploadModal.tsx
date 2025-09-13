"use client";

import React, { useState, useRef } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { 
  X, 
  Upload, 
  FileText, 
  BookOpen, 
  Shield, 
  AlertTriangle, 
  Users, 
  Monitor, 
  Workflow, 
  XCircle,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { logger } from "../../utils/logger";

interface LibraryOption {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const libraryOptions: LibraryOption[] = [
  {
    id: "information",
    title: "Information Library",
    description: "Access to information resources and documentation",
    icon: BookOpen,
  },
  {
    id: "internal-control",
    title: "Internal Control Library",
    description: "Internal control frameworks and procedures",
    icon: Shield,
  },
  {
    id: "romm",
    title: "ROMM Library",
    description: "Risk of Material Misstatement library",
    icon: AlertTriangle,
  },
  {
    id: "control-owner",
    title: "Control Owner Library",
    description: "Control ownership and responsibility matrix",
    icon: Users,
  },
  {
    id: "it-elements",
    title: "IT Elements Library",
    description: "IT controls and system documentation",
    icon: Monitor,
  },
  {
    id: "business-process",
    title: "Business Process Library",
    description: "Business process documentation and workflows",
    icon: Workflow,
  },
  {
    id: "document",
    title: "Document Library",
    description: "Upload and manage supporting documents",
    icon: FileText,
  },
  {
    id: "deficiency",
    title: "Deficiency Library",
    description: "Track and manage audit deficiencies",
    icon: XCircle,
  },
];

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUploaded?: (libraryId: string, fileName: string) => void;
}

export default function FileUploadModal({ 
  isOpen, 
  onClose, 
  onFileUploaded 
}: FileUploadModalProps) {
  const [selectedLibrary, setSelectedLibrary] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLibrarySelect = (libraryId: string) => {
    setSelectedLibrary(libraryId);
    setUploadStatus({ type: null, message: '' });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(files);
      setUploadStatus({ type: null, message: '' });
    }
  };

  const handleUpload = async () => {
    if (!selectedLibrary || !selectedFiles) {
      setUploadStatus({ 
        type: 'error', 
        message: 'Please select a library and files to upload' 
      });
      return;
    }

    setUploading(true);
    setUploadStatus({ type: null, message: '' });

    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add library information
      formData.append('library', selectedLibrary);
      
      // Add all selected files
      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('files', selectedFiles[i]);
      }

      // Simulate file upload to Cloud/Client folder
      // In a real implementation, this would be an API call
      await simulateFileUpload(formData);

      // Log the upload
      logger.dataAccess("File Upload", `Uploaded ${selectedFiles.length} file(s) to ${selectedLibrary} library`);

      setUploadStatus({ 
        type: 'success', 
        message: `Successfully uploaded ${selectedFiles.length} file(s) to ${libraryOptions.find(l => l.id === selectedLibrary)?.title}` 
      });

      // Notify parent component
      if (onFileUploaded) {
        for (let i = 0; i < selectedFiles.length; i++) {
          onFileUploaded(selectedLibrary, selectedFiles[i].name);
        }
      }

      // Reset form after successful upload
      setTimeout(() => {
        setSelectedLibrary(null);
        setSelectedFiles(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setUploadStatus({ type: null, message: '' });
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({ 
        type: 'error', 
        message: 'Failed to upload files. Please try again.' 
      });
    } finally {
      setUploading(false);
    }
  };

  const simulateFileUpload = async (formData: FormData): Promise<void> => {
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real implementation, this would:
    // 1. Send files to backend API
    // 2. Backend saves files to C:\Users\shez8\Desktop\Juggernaut Frontend\Cloud\Client
    // 3. Backend organizes files by library type
    // 4. Backend updates database with file metadata
    
    console.log('Files uploaded to Cloud/Client folder:', {
      library: formData.get('library'),
      fileCount: formData.getAll('files').length
    });
  };

  const handleClose = () => {
    setSelectedLibrary(null);
    setSelectedFiles(null);
    setUploadStatus({ type: null, message: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl border-white/10 bg-black/80 text-white shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Add Files to Library</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-white/60 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Step 1: Select Library */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-white">
              1. Select Library
            </h3>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {libraryOptions.map((library) => {
                const Icon = library.icon;
                const isSelected = selectedLibrary === library.id;
                
                return (
                  <button
                    key={library.id}
                    onClick={() => handleLibrarySelect(library.id)}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                      isSelected
                        ? "border-[#4da3ff]/50 bg-[#4da3ff]/10"
                        : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isSelected ? "text-[#4da3ff]" : "text-white/60"}`} />
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${isSelected ? "text-[#4da3ff]" : "text-white"}`}>
                        {library.title}
                      </div>
                      <div className="text-xs text-white/60">
                        {library.description}
                      </div>
                    </div>
                    {isSelected && <CheckCircle className="h-4 w-4 text-[#4da3ff]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Select Files */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-white">
              2. Select Files
            </h3>
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept="*/*"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose Files
              </Button>
              
              {selectedFiles && (
                <div className="space-y-2">
                  <p className="text-xs text-white/60">
                    Selected {selectedFiles.length} file(s):
                  </p>
                  <div className="max-h-32 space-y-1 overflow-y-auto">
                    {Array.from(selectedFiles).map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 rounded bg-white/5 p-2 text-xs"
                      >
                        <FileText className="h-3 w-3 text-white/60" />
                        <span className="text-white/80">{file.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {(file.size / 1024).toFixed(1)} KB
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Upload Status */}
          {uploadStatus.type && (
            <div className={`flex items-center gap-2 rounded-lg p-3 ${
              uploadStatus.type === 'success' 
                ? 'bg-green-500/10 border border-green-500/20' 
                : 'bg-red-500/10 border border-red-500/20'
            }`}>
              {uploadStatus.type === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-400" />
              )}
              <span className={`text-sm ${
                uploadStatus.type === 'success' ? 'text-green-400' : 'text-red-400'
              }`}>
                {uploadStatus.message}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="border-white/10 bg-transparent text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedLibrary || !selectedFiles || uploading}
              className="bg-[#4da3ff] text-white hover:bg-[#4da3ff]/80"
            >
              {uploading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Files
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
