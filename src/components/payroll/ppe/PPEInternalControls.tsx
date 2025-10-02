"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { ArrowLeft, Lock } from "lucide-react";

interface PPEInternalControlsProps {
  onBack?: () => void;
}

export default function PPEInternalControls({ onBack }: PPEInternalControlsProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">PPE Internal Controls</h2>
          <p className="text-gray-400">Evaluate design and implementation of key PPE-related controls</p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
      </div>

      {/* Empty State */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Lock className="h-5 w-5 text-blue-500" />
            Internal Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Lock className="h-16 w-16 mx-auto mb-4 text-white/40" />
          <h3 className="text-lg font-semibold text-white mb-2">No Controls Configured</h3>
          <p className="text-white/60">
            Internal controls for Property, Plant & Equipment are not yet configured.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
