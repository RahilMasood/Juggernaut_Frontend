"use client";

import React from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { ArrowLeft, FileCheck2, Shield, TrendingUp } from "lucide-react";

interface IASubstantiveProceduresProps {
  onBack?: () => void;
  setActiveSection?: (section: string) => void;
}

type ProcedureModule = {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "testing" | "analysis" | "compliance";
};

const IA_SUBSTANTIVE_PROCEDURES: ProcedureModule[] = [
  {
    id: "ia-ipe-testing",
    name: "IPE Testing",
    description: "Integrity of Processing Environment Testing for Intangibles",
    icon: FileCheck2,
    category: "testing",
  },
  {
    id: "ia-exception-testing",
    name: "Exception Testing",
    description: "Exception testing for Intangible assets",
    icon: Shield,
    category: "testing",
  },
  {
    id: "ia-additions-deletions",
    name: "Additions & Deletions Listing",
    description: "Analyze additions and deletions to Intangible Assets",
    icon: TrendingUp,
    category: "analysis",
  },
];

export default function IASubstantiveProcedures({ onBack, setActiveSection }: IASubstantiveProceduresProps) {
  const handleProcedureSelect = (id: string) => {
    if (setActiveSection) setActiveSection(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Intangible Assets - Substantive Procedures</h2>
          <p className="text-gray-400">Perform detailed procedures over Intangible Assets</p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {IA_SUBSTANTIVE_PROCEDURES.map((procedure) => {
          const Icon = procedure.icon;
          return (
            <Card
              key={procedure.id}
              className="group cursor-pointer border-white/10 bg-white/5 text-white backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/10"
              onClick={() => handleProcedureSelect(procedure.id)}
            >
              <CardContent className="p-4">
                <div className="mb-4 inline-flex rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 p-2">
                  <Icon className="h-5 w-5 text-white/80" />
                </div>
                <div className="mb-1 text-sm font-semibold">{procedure.name}</div>
                <div className="mb-4 text-xs text-white/60">{procedure.description}</div>
                <Button size="sm" variant="outline" className="border-white/10 text-xs text-white/80 group-hover:bg-white/10 group-hover:text-white">Open</Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}



