"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Play,
  FileText,
  CheckCircle,
  AlertCircle,
  Settings,
  Calculator,
  Users,
  TrendingUp,
  DollarSign,
  Shield,
  Gavel,
} from "lucide-react";

// Import all substantive procedure components
import IPETesting from "./substantive-procedures/IPETesting";
import ExceptionTesting from "./substantive-procedures/ExceptionTesting";
import HeadcountReconciliation from "./substantive-procedures/HeadcountReconciliation";
import MoMAnalysis from "./substantive-procedures/MoMAnalysis";
import IncrementAnalysis from "./substantive-procedures/IncrementAnalysis";
import SalaryAnalytical from "./substantive-procedures/SalaryAnalytical";
import ActuaryTesting from "./substantive-procedures/ActuaryTesting";
import ManagerialRemuneration from "./substantive-procedures/ManagerialRemuneration";

interface SubstantiveProceduresProps {
  onBack?: () => void;
}

interface ProcedureModule {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  component: React.ComponentType<{ onBack?: () => void }>;
  status: "pending" | "running" | "completed" | "error";
  category: "testing" | "analysis" | "compliance";
}

const SUBSTANTIVE_PROCEDURES: ProcedureModule[] = [
  {
    id: "ipe_testing",
    name: "IPE Testing",
    description: "Integrity of Processing Environment Testing with file uploads",
    icon: <Settings className="h-5 w-5" />,
    component: IPETesting,
    status: "pending",
    category: "testing",
  },
  {
    id: "exception_testing",
    name: "Exception Testing",
    description: "Automated testing for payroll data integrity and compliance",
    icon: <AlertCircle className="h-5 w-5" />,
    component: ExceptionTesting,
    status: "pending",
    category: "testing",
  },
  {
    id: "headcount_reconciliation",
    name: "Headcount Reconciliation",
    description: "Monthly reconciliation and analytical procedures for headcount data",
    icon: <Users className="h-5 w-5" />,
    component: HeadcountReconciliation,
    status: "pending",
    category: "analysis",
  },
  {
    id: "mom_analysis",
    name: "MoM Analysis",
    description: "Month-on-month payroll changes and variance analysis",
    icon: <TrendingUp className="h-5 w-5" />,
    component: MoMAnalysis,
    status: "pending",
    category: "analysis",
  },
  {
    id: "increment_analysis",
    name: "Increment Analysis",
    description: "Salary increments year-over-year with trend visualization",
    icon: <Calculator className="h-5 w-5" />,
    component: IncrementAnalysis,
    status: "pending",
    category: "analysis",
  },
  {
    id: "salary_analytical",
    name: "Salary Analytical",
    description: "Develop expectations for current year salary based on previous year data",
    icon: <DollarSign className="h-5 w-5" />,
    component: SalaryAnalytical,
    status: "pending",
    category: "analysis",
  },
  {
    id: "actuary_testing",
    name: "Actuary Testing",
    description: "Test actuarial calculations and validate data sent to actuary",
    icon: <FileText className="h-5 w-5" />,
    component: ActuaryTesting,
    status: "pending",
    category: "testing",
  },
  {
    id: "managerial_remuneration",
    name: "Managerial Remuneration",
    description: "Section 197/198 compliance and Schedule V calculations",
    icon: <Gavel className="h-5 w-5" />,
    component: ManagerialRemuneration,
    status: "pending",
    category: "compliance",
  },
];

export default function SubstantiveProcedures({
  onBack,
}: SubstantiveProceduresProps) {
  const [procedures, setProcedures] = useState<ProcedureModule[]>(SUBSTANTIVE_PROCEDURES);
  const [selectedProcedure, setSelectedProcedure] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const getStatusIcon = (status: ProcedureModule["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "running":
        return (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        );
      default:
        return (
          <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
        );
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "testing":
        return "border-blue-500/20 bg-blue-500/10 text-blue-300";
      case "analysis":
        return "border-green-500/20 bg-green-500/10 text-green-300";
      case "compliance":
        return "border-purple-500/20 bg-purple-500/10 text-purple-300";
      default:
        return "border-gray-500/20 bg-gray-500/10 text-gray-300";
    }
  };

  const filteredProcedures = selectedCategory === "all" 
    ? procedures 
    : procedures.filter(p => p.category === selectedCategory);

  const selectedProcedureData = procedures.find(p => p.id === selectedProcedure);

  // If a specific procedure is selected, render that component
  if (selectedProcedure && selectedProcedureData) {
    const ProcedureComponent = selectedProcedureData.component;
    return (
      <ProcedureComponent 
        onBack={() => setSelectedProcedure(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Substantive Procedures
          </h2>
          <p className="text-gray-400">
            Comprehensive payroll analysis and testing procedures
          </p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400">Filter by category:</span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={selectedCategory === "all" ? "default" : "outline"}
            onClick={() => setSelectedCategory("all")}
            className={selectedCategory === "all" ? "bg-blue-600" : "border-white/10"}
          >
            All
          </Button>
          <Button
            size="sm"
            variant={selectedCategory === "testing" ? "default" : "outline"}
            onClick={() => setSelectedCategory("testing")}
            className={selectedCategory === "testing" ? "bg-blue-600" : "border-white/10"}
          >
            Testing
          </Button>
          <Button
            size="sm"
            variant={selectedCategory === "analysis" ? "default" : "outline"}
            onClick={() => setSelectedCategory("analysis")}
            className={selectedCategory === "analysis" ? "bg-green-600" : "border-white/10"}
          >
            Analysis
          </Button>
          <Button
            size="sm"
            variant={selectedCategory === "compliance" ? "default" : "outline"}
            onClick={() => setSelectedCategory("compliance")}
            className={selectedCategory === "compliance" ? "bg-purple-600" : "border-white/10"}
          >
            Compliance
          </Button>
        </div>
      </div>

      {/* Procedures Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProcedures.map((procedure) => (
          <Card
            key={procedure.id}
            className={`cursor-pointer border transition-all duration-200 hover:scale-105 ${
              getCategoryColor(procedure.category)
            }`}
            onClick={() => setSelectedProcedure(procedure.id)}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  {procedure.icon}
                  <span className="text-lg">{procedure.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(procedure.status)}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-300 mb-4">
                {procedure.description}
              </p>
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(procedure.category)}`}>
                  {procedure.category.charAt(0).toUpperCase() + procedure.category.slice(1)}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/10 text-white hover:bg-white/10"
                >
                  <Play className="mr-2 h-3 w-3" />
                  Open
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Statistics */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="text-white">Procedure Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {procedures.filter(p => p.category === "testing").length}
              </div>
              <div className="text-sm text-gray-400">Testing Procedures</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {procedures.filter(p => p.category === "analysis").length}
              </div>
              <div className="text-sm text-gray-400">Analysis Procedures</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {procedures.filter(p => p.category === "compliance").length}
              </div>
              <div className="text-sm text-gray-400">Compliance Procedures</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {procedures.length}
              </div>
              <div className="text-sm text-gray-400">Total Procedures</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
