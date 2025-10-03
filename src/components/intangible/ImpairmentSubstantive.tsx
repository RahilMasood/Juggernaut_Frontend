import React from "react";

interface ImpairmentSubstantiveProps {
  onBack?: () => void;
}

export default function ImpairmentSubstantive({ onBack }: ImpairmentSubstantiveProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Impairment Testing - Substantive Procedures</h2>
          <p className="text-gray-400">To be added.</p>
        </div>
      </div>
    </div>
  );
}


