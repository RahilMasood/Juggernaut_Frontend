import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { CloudUpload, CloudDownload, Trash2, FileText, RefreshCw } from 'lucide-react';
import { CloudFileEntry, CloudProgressPayload } from '../../helpers/ipc/cloud/cloud-context';

interface CloudStorageManagerProps {
  className?: string;
}

const CONTAINERS = ['juggernaut', 'client', 'tools', 'rbin'];

export function CloudStorageManager({ className }: CloudStorageManagerProps) {
  const [selectedContainer, setSelectedContainer] = useState<string>('client');
  const [files, setFiles] = useState<CloudFileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadStatus, setUploadStatus] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reference, setReference] = useState('');

  // Load files when container changes
  useEffect(() => {
    loadFiles();
  }, [selectedContainer]);

  // Listen for cloud progress updates
  useEffect(() => {
    if (window.cloud?.onProgress) {
      const unsubscribe = window.cloud.onProgress((payload: CloudProgressPayload) => {
        if (payload.container === selectedContainer) {
          setUploadProgress(prev => ({
            ...prev,
            [payload.filename]: payload.progress
          }));
          setUploadStatus(prev => ({
            ...prev,
            [payload.filename]: payload.status
          }));

          if (payload.status === 'success' || payload.status === 'error') {
            // Refresh files list after successful operation
            setTimeout(() => {
              loadFiles();
            }, 1000);
          }
        }
      });

      return unsubscribe;
    }
  }, [selectedContainer]);

  const loadFiles = async () => {
    if (!window.cloud) return;
    
    setLoading(true);
    try {
      const result = await window.cloud.list({ container: selectedContainer });
      if (result.success && result.files) {
        setFiles(result.files);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFile(file || null);
  };

  const handleUpload = async () => {
    if (!selectedFile || !window.cloud) return;

    try {
      // Create a temporary file path (in a real app, you'd handle this differently)
      const tempPath = `temp_${Date.now()}_${selectedFile.name}`;
      
      const result = await window.cloud.upload({
        container: selectedContainer,
        filePath: tempPath,
        reference: reference
      });

      if (result.success) {
        setSelectedFile(null);
        setReference('');
        // Clear file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleDownload = async (filename: string) => {
    if (!window.cloud) return;

    try {
      // In a real app, you'd show a save dialog
      const downloadPath = `downloads/${filename}`;
      
      const result = await window.cloud.download({
        container: selectedContainer,
        filename,
        downloadPath
      });

      if (result.success) {
        console.log('File downloaded to:', result.filePath);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!window.cloud) return;

    try {
      const result = await window.cloud.delete({
        container: selectedContainer,
        filename
      });

      if (result.success) {
        loadFiles();
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'xls':
      case 'xlsx': return '📊';
      case 'ppt':
      case 'pptx': return '📋';
      case 'jpg':
      case 'jpeg':
      case 'png': return '🖼️';
      default: return '📄';
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudUpload className="h-5 w-5" />
            Cloud Storage Manager
          </CardTitle>
          <CardDescription>
            Manage files in Azure Blob Storage containers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Container Selection */}
          <div className="space-y-2">
            <Label htmlFor="container">Container</Label>
            <Select value={selectedContainer} onValueChange={setSelectedContainer}>
              <SelectTrigger>
                <SelectValue placeholder="Select container" />
              </SelectTrigger>
              <SelectContent>
                {CONTAINERS.map((container) => (
                  <SelectItem key={container} value={container}>
                    {container.charAt(0).toUpperCase() + container.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Upload Section */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <h3 className="text-lg font-semibold">Upload File</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="file-upload">Select File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  onChange={handleFileSelect}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="reference">Reference (Optional)</Label>
                <Input
                  id="reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Enter reference or description"
                  className="mt-1"
                />
              </div>
              <Button 
                onClick={handleUpload} 
                disabled={!selectedFile}
                className="w-full"
              >
                <CloudUpload className="h-4 w-4 mr-2" />
                Upload to {selectedContainer}
              </Button>
            </div>
          </div>

          {/* Files List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Files in {selectedContainer}</h3>
              <Button variant="outline" size="sm" onClick={loadFiles} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p>Loading files...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No files found in this container</p>
              </div>
            ) : (
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getFileIcon(file.name)}</span>
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {file.reference && file.reference}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(file.name)}
                      >
                        <CloudDownload className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(file.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


