"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { 
  X, 
  CheckCircle,
  Shield,
  Search,
  Filter
} from "lucide-react";
import { Input } from "../ui/input";

interface InternalControl {
  control_id: string;
  control_name: string;
  control_type: string;
  control_attribute: string;
  control_description: string;
}

interface ControlSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onControlsSelected: (selectedControls: InternalControl[]) => void;
  existingControls?: InternalControl[];
}

export default function ControlSelectorModal({ 
  isOpen, 
  onClose, 
  onControlsSelected,
  existingControls = []
}: ControlSelectorModalProps) {
  const [controls, setControls] = useState<InternalControl[]>([]);
  const [selectedControls, setSelectedControls] = useState<InternalControl[]>(existingControls);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterAttribute, setFilterAttribute] = useState<string>("all");

  // Load controls from Internal Control Library
  useEffect(() => {
    if (isOpen) {
      loadControls();
    }
  }, [isOpen]);

  const loadControls = async () => {
    setLoading(true);
    try {
      let libraryControls: InternalControl[] = [];
      
      // Use the exact same logic as LibrariesPage
      if (window.cloud?.list) {
        try {
          console.log('=== USING SAME LOGIC AS LIBRARIES PAGE ===');
          const result = await window.cloud.list({ container: 'juggernaut' });
          console.log('Cloud list result:', result);
          console.log('Cloud list success:', result.success);
          console.log('Cloud list files:', result.files);
          
          if (result.success && result.files) {
            console.log('Total files in juggernaut container:', result.files.length);
            // Filter files that start with "Libraries_InternalControlResponses_"
            const controlFiles = result.files.filter((file: any) => 
              file.name.startsWith('Libraries_InternalControlResponses_') && 
              file.name.endsWith('.json')
            );
            
            console.log('Found internal control files:', controlFiles.length);
            console.log('Control files:', controlFiles.map(f => f.name));
            
            // Load each control file using the same logic as LibrariesPage
            for (const file of controlFiles) {
              try {
                const downloadResult = await window.cloud.download({
                  container: 'juggernaut',
                  filename: file.name,
                  downloadPath: `temp_${file.name}`
                });
                
                if (downloadResult.success) {
                  const tempFilePath = downloadResult.filePath!;
                  
                  // Read the downloaded file content using IPC
                  const readResult = await window.cloud.readTempFile(tempFilePath);
                  
                  if (readResult.success) {
                    const controlData = JSON.parse(readResult.content!);
                    
                    // Clean up temp file
                    await window.cloud.deleteTempFile(tempFilePath);
                    
                    // Extract controlId from the file name (this is the user-entered ControlID)
                    const controlId = file.name.replace('Libraries_InternalControlResponses_', '').replace('.json', '');
                    
                    // Extract other details from the JSON structure (same as LibrariesPage)
                    const controlName = controlData.InternalControls?.Control?.ControlSummary?.ControlDetails?.ControlName || 
                                      'Unknown Control';
                    
                    const typeOfControl = controlData.InternalControls?.Control?.ControlSummary?.ControlAttributes?.TypeOfControl || 
                                          'Unknown';
                    
                    const subtype = controlData.InternalControls?.Control?.ControlSummary?.ControlAttributes?.Nature || 
                                    'Unknown';
                    
                    const controlDescription = controlData.InternalControls?.Control?.ControlSummary?.ControlDetails?.ControlDescription || 
                                              `${controlName} - ${typeOfControl} control`;
                    
                    // Create control object in the same format as LibrariesPage
                    libraryControls.push({
                      control_id: controlId,
                      control_name: controlName,
                      control_type: subtype === 'Manual' ? 'Manual' : 'Automated',
                      control_attribute: typeOfControl,
                      control_description: controlDescription
                    });
                  } else {
                    console.error(`Error reading control file ${file.name}:`, readResult.error);
                  }
                }
              } catch (fileError) {
                console.error(`Error loading control file ${file.name}:`, fileError);
              }
            }
          }
        } catch (cloudError) {
          console.error('Error loading from cloud storage:', cloudError);
        }
      }
      
      // Fallback to localStorage if no controls found
      if (libraryControls.length === 0) {
        console.log('=== FALLBACK TO LOCALSTORAGE ===');
        const savedControls = localStorage.getItem('internalControls');
        if (savedControls) {
          const parsedControls = JSON.parse(savedControls);
          libraryControls = parsedControls.map((control: any) => ({
            control_id: control.controlMetadata?.controlId || control.id,
            control_name: control.controlMetadata?.controlName || 'Unknown Control',
            control_type: control.controlMetadata?.subtype === 'Manual' ? 'Manual' : 'Automated',
            control_attribute: control.controlMetadata?.typeOfControl || 'Unknown',
            control_description: control.control_summary?.control_description || `${control.controlMetadata?.controlName || 'Unknown'} - ${control.controlMetadata?.typeOfControl || 'Unknown'} control`
          }));
          console.log('Loaded from localStorage:', libraryControls.length, 'controls');
        }
      }
      
      console.log('=== CONTROL SELECTOR DEBUG ===');
      console.log('Final controls loaded for selector:', libraryControls);
      console.log('Number of controls loaded:', libraryControls.length);
      console.log('Controls details:', libraryControls.map(c => ({
        id: c.control_id,
        name: c.control_name,
        type: c.control_type,
        attribute: c.control_attribute
      })));
      setControls(libraryControls);
    } catch (error) {
      console.error("Error loading controls:", error);
      setControls([]);
    } finally {
      setLoading(false);
    }
  };

  const handleControlToggle = (control: InternalControl) => {
    setSelectedControls(prev => {
      const isSelected = prev.some(c => c.control_id === control.control_id);
      if (isSelected) {
        return prev.filter(c => c.control_id !== control.control_id);
      } else {
        return [...prev, control];
      }
    });
  };

  const handleConfirm = () => {
    onControlsSelected(selectedControls);
    onClose();
  };

  const handleClose = () => {
    setSelectedControls(existingControls);
    setSearchTerm("");
    setFilterType("all");
    setFilterAttribute("all");
    onClose();
  };

  // Filter controls based on search and filters
  const filteredControls = controls.filter(control => {
    const matchesSearch = control.control_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         control.control_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         control.control_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || control.control_type === filterType;
    const matchesAttribute = filterAttribute === "all" || control.control_attribute === filterAttribute;
    
    return matchesSearch && matchesType && matchesAttribute;
  });

  // Get unique filter options
  const controlTypes = [...new Set(controls.map(c => c.control_type))];
  const controlAttributes = [...new Set(controls.map(c => c.control_attribute))];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-4xl max-h-[80vh] border-white/10 bg-black/80 text-white shadow-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/10">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#4da3ff]" />
            Associate Controls
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-white/60 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6 overflow-hidden flex flex-col">
          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute top-2.5 left-3 h-4 w-4 text-white/40" />
              <Input
                placeholder="Search controls..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-white/10 bg-transparent pl-10 text-white placeholder:text-white/40 focus-visible:border-[#4da3ff]/60 focus-visible:ring-[#4da3ff]/40"
              />
            </div>
            
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-white/60" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
                >
                  <option value="all">All Types</option>
                  {controlTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <select
                  value={filterAttribute}
                  onChange={(e) => setFilterAttribute(e.target.value)}
                  className="rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
                >
                  <option value="all">All Attributes</option>
                  {controlAttributes.map(attr => (
                    <option key={attr} value={attr}>{attr}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Selected Controls Summary */}
          {selectedControls.length > 0 && (
            <div className="bg-[#4da3ff]/10 border border-[#4da3ff]/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-[#4da3ff]" />
                <span className="text-sm font-medium text-[#4da3ff]">
                  {selectedControls.length} control(s) selected
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedControls.map(control => (
                  <Badge key={control.control_id} variant="outline" className="text-xs">
                    {control.control_id}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Controls List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {loading ? (
              <div className="text-center text-white/60 py-8">
                Loading controls...
              </div>
            ) : filteredControls.length === 0 ? (
              <div className="text-center text-white/60 py-8">
                No controls found matching your criteria
              </div>
            ) : (
              filteredControls.map((control) => {
                const isSelected = selectedControls.some(c => c.control_id === control.control_id);
                
                return (
                  <Card
                    key={control.control_id}
                    className={`cursor-pointer border transition-all ${
                      isSelected
                        ? "border-[#4da3ff]/50 bg-[#4da3ff]/10"
                        : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                    }`}
                    onClick={() => handleControlToggle(control)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleControlToggle(control)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-sm font-medium text-white">
                              {control.control_name}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {control.control_id}
                            </Badge>
                          </div>
                          <p className="text-xs text-white/70 mb-2">
                            {control.control_description}
                          </p>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">
                              {control.control_type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {control.control_attribute}
                            </Badge>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle className="h-5 w-5 text-[#4da3ff] mt-1" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="border-white/10 bg-transparent text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="bg-[#4da3ff] text-white hover:bg-[#4da3ff]/80"
            >
              Associate {selectedControls.length} Control(s)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
