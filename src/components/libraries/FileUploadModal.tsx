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
  AlertCircle,
  Link
} from "lucide-react";
import { logger } from "../../utils/logger";
import { CloudFilePicker } from "../ui/cloud-file-picker";
import { CloudFileEntry } from "../../helpers/ipc/cloud/cloud-context";
import InternalControlMetadataModal from "./InternalControlMetadataModal";
import InternalControlForm from "./InternalControlForm";

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
  const [selectedCloudFile, setSelectedCloudFile] = useState<CloudFileEntry | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  
  // Internal Control specific states
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [showControlForm, setShowControlForm] = useState(false);
  const [controlMetadata, setControlMetadata] = useState<any>(null);
  const [controlTemplate, setControlTemplate] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLibrarySelect = (libraryId: string) => {
    setSelectedLibrary(libraryId);
    setUploadStatus({ type: null, message: '' });
    
    // If Internal Control Library is selected, show metadata modal
    if (libraryId === 'internal-control') {
      setShowMetadataModal(true);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(files);
      setSelectedCloudFile(null); // Clear cloud file selection
      setUploadStatus({ type: null, message: '' });
    }
  };

  const handleCloudFileSelect = (file: CloudFileEntry) => {
    setSelectedCloudFile(file);
    setSelectedFiles(null); // Clear local file selection
    setUploadStatus({ type: null, message: '' });
  };

  const handleLocalFilesFromPicker = (files: File[]) => {
    // Convert File[] to FileList-like object
    const dt = new DataTransfer();
    files.forEach(file => dt.items.add(file));
    setSelectedFiles(dt.files);
    setSelectedCloudFile(null); // Clear cloud file selection
    setUploadStatus({ type: null, message: '' });
  };

  const handleUpload = async () => {
    if (!selectedLibrary || (!selectedFiles && !selectedCloudFile)) {
      setUploadStatus({ 
        type: 'error', 
        message: 'Please select a library and files to upload' 
      });
      return;
    }

    setUploading(true);
    setUploadStatus({ type: null, message: '' });

    try {
      if (selectedCloudFile) {
        // Handle cloud file linking
        logger.dataAccess("Cloud File Link", `Linked cloud file ${selectedCloudFile.name} to ${selectedLibrary} library`);

        setUploadStatus({ 
          type: 'success', 
          message: `Successfully linked cloud file "${selectedCloudFile.name}" to ${libraryOptions.find(l => l.id === selectedLibrary)?.title}` 
        });

        // Notify parent component
        if (onFileUploaded) {
          onFileUploaded(selectedLibrary, selectedCloudFile.name);
        }
      } else if (selectedFiles) {
        // Handle local file upload
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
      }

      // Reset form after successful upload
      setTimeout(() => {
        setSelectedLibrary(null);
        setSelectedFiles(null);
        setSelectedCloudFile(null);
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

  // Load internal control template data
  const loadInternalControlTemplate = async () => {
    try {
      console.log('Loading internal control template...');
      console.log('window.internalControls:', window.internalControls);
      
      // Check if we're in Electron mode
      if (window.internalControls?.readTemplate) {
        // Use IPC to read the Internal Controls configuration file
        const templateData = await window.internalControls.readTemplate();
        console.log('Loaded template data via IPC:', templateData);
        return templateData;
      } else {
        console.log('Not in Electron mode, trying to load from public folder...');
        // Fallback: try to load from public folder (for web mode)
        try {
          const response = await fetch('/Internal%20Controls%20Updated.json');
          if (response.ok) {
            const templateData = await response.json();
            console.log('Loaded template data from public folder:', templateData);
            return templateData;
          } else {
            console.error('Failed to fetch from public folder, status:', response.status);
          }
        } catch (fetchError) {
          console.error('Failed to load from public folder:', fetchError);
        }
        
        console.error('Internal Controls IPC not available and public folder fallback failed');
        throw new Error('Internal Controls template not available');
      }
    } catch (error) {
      console.error('Failed to load internal control template:', error);
      // Return a more complete fallback structure
      return {
        templates: {
          manual: { 
            sections: [
              {
                id: "control_summary",
                label: "Control Summary",
                fields: [
                  { id: "control_id", type: "text", label: "Control ID" },
                  { id: "control_name", type: "text", label: "Control Name" }
                ]
              }
            ]
          },
          automated: { 
            sections: [
              {
                id: "control_summary",
                label: "Control Summary",
                fields: [
                  { id: "control_id", type: "text", label: "Control ID" },
                  { id: "control_name", type: "text", label: "Control Name" }
                ]
              }
            ]
          }
        }
      };
    }
  };

  const handleMetadataSubmitted = async (metadata: any) => {
    console.log('Metadata submitted:', metadata);
    setControlMetadata(metadata);
    setShowMetadataModal(false);
    
    // Load the appropriate template
    const templateData = await loadInternalControlTemplate();
    console.log('Template data loaded:', templateData);
    
    console.log('Metadata subtype:', metadata.subtype);
    console.log('Available templates:', Object.keys(templateData.templates || {}));
    
    const template = metadata.subtype === 'Manual' 
      ? templateData.templates?.manual 
      : templateData.templates?.automated;
    
    console.log('Selected template:', template);
    console.log('Template sections:', template?.sections?.length);
    
    setControlTemplate(template);
    setShowControlForm(true);
  };

  const handleControlSaved = async (controlData: any) => {
    setShowControlForm(false);
    
    // Save to Internal Control Library using localStorage for persistence
    try {
      const existingControls = JSON.parse(localStorage.getItem('internalControls') || '[]');
      const newControl = {
        id: `ic-${Date.now()}`,
        ...controlData
      };
      existingControls.push(newControl);
      localStorage.setItem('internalControls', JSON.stringify(existingControls));
      
      logger.dataSave("Internal Control", controlData);
      
      setUploadStatus({ 
        type: 'success', 
        message: `Internal control "${controlData.controlMetadata.controlName}" created successfully!` 
      });

      // Notify parent component
      if (onFileUploaded) {
        onFileUploaded('internal-control', controlData.controlMetadata.controlName);
      }

      // Reset after successful creation
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Error saving control:', error);
      setUploadStatus({ 
        type: 'error', 
        message: 'Failed to save internal control. Please try again.' 
      });
    }
  };

  const handleClose = () => {
    setSelectedLibrary(null);
    setSelectedFiles(null);
    setSelectedCloudFile(null);
    setUploadStatus({ type: null, message: '' });
    setShowMetadataModal(false);
    setShowControlForm(false);
    setControlMetadata(null);
    setControlTemplate(null);
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
              
              {/* File Selection Options */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose Local Files
                </Button>
                
                <CloudFilePicker
                  onFileSelected={handleCloudFileSelect}
                  onLocalFileSelected={handleLocalFilesFromPicker}
                  multiple={true}
                  triggerText="Link Cloud File"
                  className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                />
              </div>
              
              {/* Selected Files Display */}
              {selectedFiles && (
                <div className="space-y-2">
                  <p className="text-xs text-white/60">
                    Selected {selectedFiles.length} local file(s):
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

              {/* Selected Cloud File Display */}
              {selectedCloudFile && (
                <div className="space-y-2">
                  <p className="text-xs text-white/60">
                    Selected cloud file:
                  </p>
                  <div className="flex items-center gap-2 rounded bg-blue-500/10 p-2 text-xs border border-blue-500/20">
                    <Link className="h-3 w-3 text-blue-400" />
                    <span className="text-white/80">{selectedCloudFile.name}</span>
                    <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-200">
                      Cloud
                    </Badge>
                    {selectedCloudFile.reference && (
                      <span className="text-white/60 text-xs">({selectedCloudFile.reference})</span>
                    )}
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
              disabled={!selectedLibrary || (!selectedFiles && !selectedCloudFile) || uploading}
              className="bg-[#4da3ff] text-white hover:bg-[#4da3ff]/80"
            >
              {uploading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  Processing...
                </>
              ) : selectedCloudFile ? (
                <>
                  <Link className="mr-2 h-4 w-4" />
                  Link Cloud File
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
      
      {/* Internal Control Metadata Modal */}
      <InternalControlMetadataModal
        isOpen={showMetadataModal}
        onClose={() => setShowMetadataModal(false)}
        onMetadataSubmitted={handleMetadataSubmitted}
      />
      
      {/* Internal Control Form Modal */}
      {controlMetadata && controlTemplate && (
        <InternalControlForm
          isOpen={showControlForm}
          onClose={() => setShowControlForm(false)}
          onSave={handleControlSaved}
          metadata={controlMetadata}
          template={controlTemplate}
        />
      )}
    </div>
  );
}
