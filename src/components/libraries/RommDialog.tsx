"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { X, AlertTriangle } from "lucide-react";
import RommForm from "./RommForm";

interface RommDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    "romm-id": string;
    workspace: string;
    description: string;
    assertion: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

export default function RommDialog({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading = false 
}: RommDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border-white/10 bg-black/95 text-white shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-white">Add New ROMM Entry</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white/60 hover:text-white"
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-6">
          <RommForm 
            onSubmit={onSubmit} 
            isLoading={isLoading}
          />
          
          {/* Close button at the bottom */}
          <div className="flex justify-end pt-4 mt-6 border-t border-white/10">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
