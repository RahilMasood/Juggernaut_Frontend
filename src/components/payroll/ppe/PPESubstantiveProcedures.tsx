"use client";

import React from "react";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { ArrowLeft, FileCheck2, Play, Calculator, TrendingUp, DollarSign, Shield, Gavel, Building } from "lucide-react";

interface PPESubstantiveProceduresProps {
  onBack?: () => void;
  setActiveSection?: (section: string) => void;
}

interface ProcedureModule {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "testing" | "analysis" | "compliance";
}

const PPE_SUBSTANTIVE_PROCEDURES: ProcedureModule[] = [
  {
    id: "ppe-ipe-testing",
    name: "IPE Testing",
    description: "Integrity of Processing Environment Testing for PPE",
    icon: FileCheck2,
    category: "testing"
  },
  {
    id: "ppe-exception-testing", 
    name: "Exception Testing",
    description: "Exception testing for PPE transactions",
    icon: Shield,
    category: "testing"
  },
  {
    id: "ppe-additions-deletions",
    name: "Additions & Deletions Analysis",
    description: "Analyze additions and deletions to PPE",
    icon: TrendingUp,
    category: "analysis"
  },
  {
    id: "ppe-useful-life",
    name: "Useful Life & Composition",
    description: "Analyze useful life and composition of PPE",
    icon: Calculator,
    category: "analysis"
  },
  {
    id: "ppe-revaluation",
    name: "Revaluation Testing",
    description: "Test revaluation of PPE assets",
    icon: DollarSign,
    category: "testing"
  },
  {
    id: "ppe-cwip-analysis",
    name: "CWIP Analysis",
    description: "Capital Work in Progress analysis",
    icon: Building,
    category: "analysis"
  },
  {
    id: "ppe-impairment",
    name: "Impairment Testing",
    description: "Test for impairment of PPE assets",
    icon: Gavel,
    category: "testing"
  }
];

export default function PPESubstantiveProcedures({ onBack, setActiveSection }: PPESubstantiveProceduresProps) {
  const handleProcedureSelect = (procedureId: string) => {
    if (setActiveSection) {
      setActiveSection(procedureId);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "testing":
        return "from-red-500/20 to-pink-500/20";
      case "analysis":
        return "from-blue-500/20 to-cyan-500/20";
      case "compliance":
        return "from-green-500/20 to-emerald-500/20";
      default:
        return "from-gray-500/20 to-slate-500/20";
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case "testing":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "analysis":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "compliance":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">PPE Substantive Procedures</h2>
          <p className="text-gray-400">Perform detailed procedures over PPE balances and transactions</p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
      </div>

      {/* Procedures Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PPE_SUBSTANTIVE_PROCEDURES.map((procedure) => {
          const Icon = procedure.icon;
          return (
            <Card
              key={procedure.id}
              className="group cursor-pointer border-white/10 bg-white/5 text-white backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/10"
              onClick={() => handleProcedureSelect(procedure.id)}
            >
              <CardContent className="p-4">
                <div
                  className={`mb-4 inline-flex rounded-lg bg-gradient-to-br ${getCategoryColor(procedure.category)} p-2`}
                >
                  <Icon className="h-5 w-5 text-white/80" />
                </div>
                <div className="mb-1 text-sm font-semibold">{procedure.name}</div>
                <div className="mb-4 text-xs text-white/60">
                  {procedure.description}
                </div>
                <div className="flex items-center justify-between">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/10 text-xs text-white/80 group-hover:bg-white/10 group-hover:text-white"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Execute
                  </Button>
                  <div className={`px-2 py-1 rounded text-xs ${getCategoryBadgeColor(procedure.category)}`}>
                    {procedure.category}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

    </div>
  );
}
