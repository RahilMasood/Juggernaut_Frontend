import React from "react";

interface DepreciationInternalControlsProps {
  onBack?: () => void;
}

export default function DepreciationInternalControls({ onBack }: DepreciationInternalControlsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Depreciation - Internal Controls</h2>
          <p className="text-gray-400">To be added.</p>
        </div>
      </div>
    </div>
  );
}


