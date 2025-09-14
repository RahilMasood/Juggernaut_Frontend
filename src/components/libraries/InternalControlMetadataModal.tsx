"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { 
  X, 
  Shield,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface ControlMetadata {
  typeOfControl: "Direct" | "Indirect" | "GITC";
  subtype: "Manual" | "Automated";
  controlId: string;
  controlName: string;
  workspace: string;
}

interface InternalControlMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMetadataSubmitted: (metadata: ControlMetadata) => void;
}

export default function InternalControlMetadataModal({ 
  isOpen, 
  onClose, 
  onMetadataSubmitted 
}: InternalControlMetadataModalProps) {
  const [metadata, setMetadata] = useState<ControlMetadata>({
    typeOfControl: "Direct",
    subtype: "Manual",
    controlId: "",
    controlName: "",
    workspace: ""
  });
  
  const [errors, setErrors] = useState<Partial<ControlMetadata>>({});
  const [submitting, setSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Partial<ControlMetadata> = {};
    
    if (!metadata.controlId.trim()) {
      newErrors.controlId = "Control ID is required";
    }
    
    if (!metadata.controlName.trim()) {
      newErrors.controlName = "Control Name is required";
    }
    
    if (!metadata.workspace.trim()) {
      newErrors.workspace = "Workspace is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 500));
      onMetadataSubmitted(metadata);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setMetadata({
      typeOfControl: "Direct",
      subtype: "Manual",
      controlId: "",
      controlName: "",
      workspace: ""
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-lg border-white/10 bg-black/80 text-white shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-[#4da3ff]" />
            <CardTitle className="text-lg">Internal Control Metadata</CardTitle>
          </div>
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
          <p className="text-sm text-white/70">
            Please provide the control metadata to create the appropriate template.
          </p>

          {/* Type of Control Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-white">
              Type of Control
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {(["Direct", "Indirect", "GITC"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setMetadata(prev => ({ ...prev, typeOfControl: type }))}
                  className={`rounded-lg border p-3 text-center text-sm transition-all ${
                    metadata.typeOfControl === type
                      ? "border-[#4da3ff]/50 bg-[#4da3ff]/10 text-[#4da3ff]"
                      : "border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  {type}
                  {metadata.typeOfControl === type && (
                    <CheckCircle className="mx-auto mt-1 h-3 w-3" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Subtype Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-white">
              Control Nature
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {(["Manual", "Automated"] as const).map((subtype) => (
                <button
                  key={subtype}
                  onClick={() => setMetadata(prev => ({ ...prev, subtype }))}
                  className={`rounded-lg border p-3 text-center text-sm transition-all ${
                    metadata.subtype === subtype
                      ? "border-[#4da3ff]/50 bg-[#4da3ff]/10 text-[#4da3ff]"
                      : "border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  {subtype}
                  {metadata.subtype === subtype && (
                    <CheckCircle className="mx-auto mt-1 h-3 w-3" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-white/60">
              This will determine which template is used for the control.
            </p>
          </div>

          {/* Control Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="controlId" className="text-sm font-medium text-white">
                Control ID
              </Label>
              <Input
                id="controlId"
                value={metadata.controlId}
                onChange={(e) => setMetadata(prev => ({ ...prev, controlId: e.target.value }))}
                placeholder="e.g., IC001"
                className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 ${
                  errors.controlId ? 'border-red-500/50' : 'focus-visible:border-[#4da3ff]/60'
                }`}
              />
              {errors.controlId && (
                <div className="flex items-center gap-1 text-xs text-red-400">
                  <AlertCircle className="h-3 w-3" />
                  {errors.controlId}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="controlName" className="text-sm font-medium text-white">
                Control Name
              </Label>
              <Input
                id="controlName"
                value={metadata.controlName}
                onChange={(e) => setMetadata(prev => ({ ...prev, controlName: e.target.value }))}
                placeholder="e.g., Payroll Authorization Controls"
                className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 ${
                  errors.controlName ? 'border-red-500/50' : 'focus-visible:border-[#4da3ff]/60'
                }`}
              />
              {errors.controlName && (
                <div className="flex items-center gap-1 text-xs text-red-400">
                  <AlertCircle className="h-3 w-3" />
                  {errors.controlName}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="workspace" className="text-sm font-medium text-white">
                Workspace
              </Label>
              <Input
                id="workspace"
                value={metadata.workspace}
                onChange={(e) => setMetadata(prev => ({ ...prev, workspace: e.target.value }))}
                placeholder="e.g., Payroll, Financial Reporting"
                className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 ${
                  errors.workspace ? 'border-red-500/50' : 'focus-visible:border-[#4da3ff]/60'
                }`}
              />
              {errors.workspace && (
                <div className="flex items-center gap-1 text-xs text-red-400">
                  <AlertCircle className="h-3 w-3" />
                  {errors.workspace}
                </div>
              )}
            </div>
          </div>

          {/* Template Preview */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium text-white">Template Preview</span>
            </div>
            <div className="text-xs text-white/60">
              <Badge variant="outline" className="mr-2 text-xs">
                {metadata.typeOfControl}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {metadata.subtype}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-white/60">
              A {metadata.subtype.toLowerCase()} control template will be created for {metadata.typeOfControl.toLowerCase()} controls.
            </p>
          </div>

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
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-[#4da3ff] text-white hover:bg-[#4da3ff]/80"
            >
              {submitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  Creating...
                </>
              ) : (
                <>
                  Create Control
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
