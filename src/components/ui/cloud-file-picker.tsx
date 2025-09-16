import React, { useState, useEffect } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Upload, Link, FileText, Download, Trash2, RefreshCw, X } from 'lucide-react';
import { CloudFileEntry } from '../../helpers/ipc/cloud/cloud-context';
import { DuplicateFileDialog } from './duplicate-file-dialog';

interface CloudFilePickerProps {
  onFileSelected?: (file: CloudFileEntry) => void;
  onLocalFileSelected?: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
  className?: string;
  triggerText?: string;
}

export function CloudFilePicker({
  onFileSelected,
  onLocalFileSelected,
  multiple = false,
  accept = "*",
  className = "",
  triggerText = "Select File"
}: CloudFilePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'local' | 'cloud'>('local');
  const [cloudFiles, setCloudFiles] = useState<CloudFileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateFilename, setDuplicateFilename] = useState('');

  // Always use "client" container
  const selectedContainer = "client";

  // Load cloud files when container changes or dialog opens
  useEffect(() => {
    if (isOpen && mode === 'cloud') {
      loadCloudFiles();
    }
  }, [isOpen, mode, selectedContainer]);

  // Check if cloud API is available on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('Cloud API available:', !!window.cloud);
      if (window.cloud) {
        console.log('Cloud API methods:', Object.keys(window.cloud));
      }
    }
  }, []);

  const loadCloudFiles = async () => {
    if (!window.cloud) {
      console.error('Cloud API not available');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Loading cloud files from container:', selectedContainer);
      const result = await window.cloud.list({ container: selectedContainer });
      console.log('Cloud files result:', result);
      if (result.success && result.files) {
        setCloudFiles(result.files);
        console.log('Loaded cloud files:', result.files);
      } else {
        console.error('Failed to load cloud files:', result.error);
      }
    } catch (error) {
      console.error('Error loading cloud files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocalFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      if (onLocalFileSelected) {
        onLocalFileSelected(fileArray);
      }
      setIsOpen(false);
    }
  };

  const handleCloudFileSelect = (file: CloudFileEntry) => {
    console.log('Cloud file selected:', file);
    if (onFileSelected) {
      console.log('Calling onFileSelected callback');
      onFileSelected(file);
    } else {
      console.error('onFileSelected callback not provided');
    }
    setIsOpen(false);
  };

  const handleUploadToCloud = async (replaceExisting: boolean = false, newFilename?: string) => {
    if (!selectedFile || !window.cloud) return;

    try {
      const filename = newFilename || selectedFile.name;
      
      // Read file content as array buffer for proper binary handling
      const fileContent = await readFileAsArrayBuffer(selectedFile);
      
      // Convert to base64 string for transmission
      const base64Content = arrayBufferToBase64(fileContent);
      
      const result = await window.cloud.directUpload(
        base64Content,
        filename,
        selectedContainer,
        "", // No reference during upload
        replaceExisting
      );

      if (result.success) {
        setSelectedFile(null);
        setShowDuplicateDialog(false);
        setDuplicateFilename('');
        // Reload cloud files
        await loadCloudFiles();
        // Clear file input
        const fileInput = document.getElementById('local-file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        console.log(`✅ File uploaded to cloud: ${filename}`);
      } else if (result.error === 'FILE_EXISTS' && !replaceExisting) {
        // Show duplicate dialog
        setDuplicateFilename(filename);
        setShowDuplicateDialog(true);
      } else {
        console.error(`❌ Error uploading file to cloud:`, result.error);
      }
    } catch (error) {
      console.error('Error uploading file to cloud:', error);
    }
  };

  const handleDuplicateReplace = () => {
    handleUploadToCloud(true);
  };

  const handleDuplicateRename = (newName: string) => {
    handleUploadToCloud(false, newName);
  };

  const handleDuplicateCancel = () => {
    setShowDuplicateDialog(false);
    setDuplicateFilename('');
  };

  // Helper function to read file as array buffer
  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  // Helper function to convert array buffer to base64
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
    return btoa(binary);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFile(file || null);
  };

  return (
    <>
      <Button variant="outline" className={className} onClick={() => setIsOpen(true)}>
        <FileText className="mr-2 h-4 w-4" />
        {triggerText}
      </Button>
      
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-4xl border-white/10 bg-black/95 text-white shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Select File Source</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white/60 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">

        {/* Mode Selection */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={mode === 'local' ? 'default' : 'outline'}
            onClick={() => setMode('local')}
            className="flex-1"
          >
            <Upload className="mr-2 h-4 w-4" />
            Local Files
          </Button>
          <Button
            variant={mode === 'cloud' ? 'default' : 'outline'}
            onClick={() => setMode('cloud')}
            className="flex-1"
          >
            <Link className="mr-2 h-4 w-4" />
            Cloud Files
          </Button>
        </div>

        {/* Local File Mode */}
        {mode === 'local' && (
          <div className="space-y-4">
            <div>
              <Label className="text-white">Select Local File</Label>
              <Input
                id="local-file-upload"
                type="file"
                multiple={multiple}
                accept={accept}
                onChange={handleLocalFileSelect}
                className="bg-black/40 text-white border-white/10"
              />
            </div>

            {/* Upload to Cloud Section */}
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-sm text-white">Upload to Cloud</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Input
                    type="file"
                    onChange={handleFileInputChange}
                    className="bg-black/40 text-white border-white/10"
                  />
                </div>
                <Button 
                  onClick={handleUploadToCloud} 
                  disabled={!selectedFile}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload to Cloud
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Cloud File Mode */}
        {mode === 'cloud' && (
          <div className="space-y-4">
            <div className="flex gap-2 items-center justify-between">
              <Label className="text-white">Client Files</Label>
              <Button
                variant="outline"
                onClick={loadCloudFiles}
                disabled={loading}
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Cloud Files List */}
            <div className="max-h-80 overflow-y-auto space-y-2">
              {loading ? (
                <div className="text-center py-8 text-white/60">Loading files...</div>
              ) : cloudFiles.length === 0 ? (
                <div className="text-center py-8 text-white/60">No files found in client container</div>
              ) : (
                cloudFiles.map((file, index) => (
                  <div
                    key={index} 
                    className="border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors rounded-lg"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Card clicked for file:', file);
                      handleCloudFileSelect(file);
                    }}
                  >
                    <div className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-blue-400" />
                        <div>
                          <div className="text-white text-sm font-medium">{file.name}</div>
                          {file.reference && (
                            <div className="text-white/60 text-xs">{file.reference}</div>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Client
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Duplicate File Dialog */}
      <DuplicateFileDialog
        isOpen={showDuplicateDialog}
        filename={duplicateFilename}
        onReplace={handleDuplicateReplace}
        onRename={handleDuplicateRename}
        onCancel={handleDuplicateCancel}
      />
    </>
  );
}
