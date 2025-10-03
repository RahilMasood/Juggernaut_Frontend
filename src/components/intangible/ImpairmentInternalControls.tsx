import React from "react";

interface ImpairmentInternalControlsProps {
  onBack?: () => void;
}

export default function ImpairmentInternalControls({ onBack }: ImpairmentInternalControlsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Impairment Testing - Internal Controls</h2>
          <p className="text-gray-400">To be added.</p>
        </div>
      </div>
    </div>
  );
}


