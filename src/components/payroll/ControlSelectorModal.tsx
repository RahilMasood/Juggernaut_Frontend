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
      // In a real implementation, this would load from the JSON file
      // For now, we'll use mock data
      const mockControls: InternalControl[] = [
        {
          control_id: "IC001",
          control_name: "Payroll Authorization Controls",
          control_type: "Preventive",
          control_attribute: "Authorization",
          control_description: "Controls to ensure payroll transactions are properly authorized before processing"
        },
        {
          control_id: "IC002",
          control_name: "Employee Data Validation",
          control_type: "Detective",
          control_attribute: "Validation",
          control_description: "Automated validation of employee data against HR records before payroll processing"
        },
        {
          control_id: "IC003",
          control_name: "Payroll Calculation Review",
          control_type: "Preventive",
          control_attribute: "Calculation",
          control_description: "Manual review and approval of payroll calculations by authorized personnel"
        },
        {
          control_id: "IC004",
          control_name: "Bank Reconciliation Controls",
          control_type: "Detective",
          control_attribute: "Reconciliation",
          control_description: "Monthly reconciliation of payroll bank accounts with supporting documentation"
        },
        {
          control_id: "IC005",
          control_name: "Access Controls - Payroll System",
          control_type: "Preventive",
          control_attribute: "Access",
          control_description: "Role-based access controls for payroll system with regular access reviews"
        },
        {
          control_id: "IC006",
          control_name: "Segregation of Duties - Payroll",
          control_type: "Preventive",
          control_attribute: "Segregation",
          control_description: "Separation of payroll preparation, review, and approval functions"
        },
        {
          control_id: "IC007",
          control_name: "Payroll Exception Monitoring",
          control_type: "Detective",
          control_attribute: "Monitoring",
          control_description: "Automated monitoring and reporting of payroll exceptions and anomalies"
        },
        {
          control_id: "IC008",
          control_name: "Employee Termination Controls",
          control_type: "Preventive",
          control_attribute: "Termination",
          control_description: "Controls to ensure timely removal of terminated employees from payroll"
        }
      ];
      
      setControls(mockControls);
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
