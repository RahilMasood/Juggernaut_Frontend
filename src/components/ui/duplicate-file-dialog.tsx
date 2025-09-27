import React, { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { AlertTriangle, Copy, RefreshCw, X } from 'lucide-react';

interface DuplicateFileDialogProps {
  isOpen: boolean;
  filename: string;
  onReplace: () => void;
  onRename: (newName: string) => void;
  onCancel: () => void;
}

export function DuplicateFileDialog({
  isOpen,
  filename,
  onReplace,
  onRename,
  onCancel
}: DuplicateFileDialogProps) {
  const [newFilename, setNewFilename] = useState(() => {
    // Generate a default new name
    const parts = filename.split('.');
    if (parts.length > 1) {
      const ext = parts.pop();
      const baseName = parts.join('.');
      return `${baseName}_copy.${ext}`;
    }
    return `${filename}_copy`;
  });

  const handleRename = () => {
    if (newFilename.trim() && newFilename !== filename) {
      onRename(newFilename.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md border-white/10 bg-black/95 text-white shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-white">File Already Exists</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-white/60 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-sm text-white/80">
            A file named <span className="font-semibold text-white">"{filename}"</span> already exists in the cloud. 
            What would you like to do?
          </div>

          <div className="space-y-3">
            {/* Replace Option */}
            <Button
              onClick={onReplace}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Replace Existing File
            </Button>

            {/* Rename Option */}
            <div className="space-y-2">
              <Label className="text-white">Or rename the new file:</Label>
              <div className="flex gap-2">
                <Input
                  value={newFilename}
                  onChange={(e) => setNewFilename(e.target.value)}
                  className="bg-black/40 text-white border-white/10"
                  placeholder="Enter new filename"
                />
                <Button
                  onClick={handleRename}
                  disabled={!newFilename.trim() || newFilename === filename}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Cancel Option */}
            <Button
              onClick={onCancel}
              variant="outline"
              className="w-full border-white/10 text-white hover:bg-white/10"
            >
              Cancel Upload
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


