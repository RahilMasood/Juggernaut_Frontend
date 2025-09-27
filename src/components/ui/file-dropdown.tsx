import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { CloudFileEntry } from '../../helpers/ipc/cloud/cloud-context';
import { RefreshCw } from 'lucide-react';
import { Button } from './button';

interface FileDropdownProps {
  fileType: string;
  onFileSelected: (fileType: string, file: CloudFileEntry) => void;
  disabled?: boolean;
}

export function FileDropdown({ fileType, onFileSelected, disabled }: FileDropdownProps) {
  const [cloudFiles, setCloudFiles] = useState<CloudFileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string>('');

  // Load cloud files on mount
  useEffect(() => {
    loadCloudFiles();
  }, []);

  const loadCloudFiles = async () => {
    if (!window.cloud) {
      console.error('Cloud API not available');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Loading cloud files from client container');
      const result = await window.cloud.list({ container: "client" });
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

  const handleFileSelect = (filename: string) => {
    const file = cloudFiles.find(f => f.name === filename);
    if (file) {
      setSelectedFile(filename);
      onFileSelected(fileType, file);
      console.log(`Selected file: ${filename} for ${fileType}`);
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <Select 
        value={selectedFile} 
        onValueChange={handleFileSelect}
        disabled={disabled || loading}
      >
        <SelectTrigger className="bg-black/40 text-white border-white/10">
          <SelectValue placeholder={loading ? "Loading files..." : "Select a file from client container"} />
        </SelectTrigger>
        <SelectContent className="bg-black/90 text-white border-white/10">
          {cloudFiles.length === 0 ? (
            <SelectItem value="no-files" disabled>
              No files found in client container
            </SelectItem>
          ) : (
            cloudFiles.map((file, index) => (
              <SelectItem key={index} value={file.name}>
                <div className="flex flex-col">
                  <span>{file.name}</span>
                  {file.reference && (
                    <span className="text-xs text-white/60">{file.reference}</span>
                  )}
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      
      <Button
        variant="outline"
        size="sm"
        onClick={loadCloudFiles}
        disabled={loading}
        className="border-white/10"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
}


