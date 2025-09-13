"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { 
  X, 
  CheckCircle,
  Play,
  Search,
  Filter,
  FileText
} from "lucide-react";
import { Input } from "../ui/input";

interface SubstantiveProcedure {
  id: string;
  name: string;
  description: string;
  requiredFiles: string[];
  optionalFiles?: string[];
  questions?: QuestionConfig[];
}

interface QuestionConfig {
  id: string;
  question: string;
  type: string;
  required: boolean;
  options?: string[];
}

interface ProcedureSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceduresSelected: (selectedProcedures: SubstantiveProcedure[]) => void;
  existingProcedures?: SubstantiveProcedure[];
}

export default function ProcedureSelectorModal({ 
  isOpen, 
  onClose, 
  onProceduresSelected,
  existingProcedures = []
}: ProcedureSelectorModalProps) {
  const [procedures, setProcedures] = useState<SubstantiveProcedure[]>([]);
  const [selectedProcedures, setSelectedProcedures] = useState<SubstantiveProcedure[]>(existingProcedures);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterFiles, setFilterFiles] = useState<string>("all");

  // Load procedures from Substantive Procedures
  useEffect(() => {
    if (isOpen) {
      loadProcedures();
    }
  }, [isOpen]);

  const loadProcedures = async () => {
    setLoading(true);
    try {
      // Mock data based on the SubstantiveProcedures component
      const mockProcedures: SubstantiveProcedure[] = [
        {
          id: "ipe_testing",
          name: "IPE Testing",
          description: "Integrity of Processing Environment Testing",
          requiredFiles: ["Pay Registrar", "CTC Report"],
          questions: [
            {
              id: "pay_registrar_sheet",
              question: "Pay Registrar Sheet Name",
              type: "text",
              required: true,
            },
            {
              id: "ctc_sheet",
              question: "CTC Report Sheet Name",
              type: "text",
              required: true,
            },
          ],
        },
        {
          id: "exception_testing",
          name: "Exception Testing",
          description: "Identify and analyze payroll exceptions",
          requiredFiles: ["Pay Registrar", "CTC Report"],
          questions: [
            {
              id: "pay_registrar_sheet",
              question: "Pay Registrar Sheet Name",
              type: "text",
              required: true,
            },
            {
              id: "ctc_sheet",
              question: "CTC Report Sheet Name",
              type: "text",
              required: true,
            },
          ],
        },
        {
          id: "headcount_reconciliation",
          name: "Headcount Reconciliation",
          description: "Reconcile headcount between periods",
          requiredFiles: ["Pay Registrar", "Additions List", "Deletions List", "CTC Report"],
          questions: [
            {
              id: "pay_registrar_sheet",
              question: "Pay Registrar Sheet Name",
              type: "text",
              required: true,
            },
            {
              id: "ctc_sheet",
              question: "CTC Report Sheet Name",
              type: "text",
              required: true,
            },
            {
              id: "opening_headcount",
              question: "Opening Headcount (April)",
              type: "text",
              required: true,
            },
          ],
        },
        {
          id: "mom_analysis",
          name: "Month-on-Month Analysis",
          description: "Analyze month-over-month payroll changes",
          requiredFiles: ["Pay Registrar", "CTC Report"],
          questions: [
            {
              id: "pay_registrar_sheet",
              question: "Pay Registrar Sheet Name",
              type: "text",
              required: true,
            },
            {
              id: "ctc_sheet",
              question: "CTC Report Sheet Name",
              type: "text",
              required: true,
            },
            {
              id: "mom_increment_month",
              question: "Month for Increment Analysis (e.g., Nov-24)",
              type: "text",
              required: true,
            },
          ],
        },
        {
          id: "increment_analysis",
          name: "Increment Analysis",
          description: "Analyze salary increments year-over-year",
          requiredFiles: ["CTC Report", "CTC Report Previous Year"],
          questions: [
            {
              id: "ctc_sheet",
              question: "CTC Report Sheet Name",
              type: "text",
              required: true,
            },
            {
              id: "ctc_py_sheet",
              question: "CTC Previous Year Sheet Name",
              type: "text",
              required: true,
            },
          ],
        },
        {
          id: "pf_sal_analytics",
          name: "PF & Salary Analytics",
          description: "Provident Fund and Salary analytical procedures",
          requiredFiles: ["Combined JSON"],
          questions: [
            {
              id: "risk_assessment",
              question: "Assessment of risk",
              type: "radio",
              options: ["Lower", "Higher", "Significant"],
              required: true,
            },
            {
              id: "control_reliance",
              question: "Control reliance approach",
              type: "radio",
              options: ["Relying on controls", "Not relying on controls"],
              required: true,
            },
            {
              id: "percentage",
              question: "Percentage for analytical procedure",
              type: "text",
              required: true,
            },
          ],
        },
        {
          id: "actuary_testing",
          name: "Actuary Testing",
          description: "Test actuarial calculations and assumptions",
          requiredFiles: ["Actuary Testing File", "CTC Report"],
          questions: [
            {
              id: "actuary_sheet",
              question: "Actuary Testing Sheet Name",
              type: "text",
              required: true,
            },
            {
              id: "ctc_sheet",
              question: "CTC Report Sheet Name",
              type: "text",
              required: true,
            },
          ],
        },
        {
          id: "accuracy_check",
          name: "Accuracy Check",
          description: "Verify accuracy of payroll calculations",
          requiredFiles: ["Pay Registrar", "CTC Report"],
          questions: [
            {
              id: "pay_registrar_sheet",
              question: "Pay Registrar Sheet Name",
              type: "text",
              required: true,
            },
            {
              id: "ctc_sheet",
              question: "CTC Report Sheet Name",
              type: "text",
              required: true,
            },
          ],
        }
      ];
      
      setProcedures(mockProcedures);
    } catch (error) {
      console.error("Error loading procedures:", error);
      setProcedures([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProcedureToggle = (procedure: SubstantiveProcedure) => {
    setSelectedProcedures(prev => {
      const isSelected = prev.some(p => p.id === procedure.id);
      if (isSelected) {
        return prev.filter(p => p.id !== procedure.id);
      } else {
        return [...prev, procedure];
      }
    });
  };

  const handleConfirm = () => {
    onProceduresSelected(selectedProcedures);
    onClose();
  };

  const handleClose = () => {
    setSelectedProcedures(existingProcedures);
    setSearchTerm("");
    setFilterFiles("all");
    onClose();
  };

  // Filter procedures based on search and filters
  const filteredProcedures = procedures.filter(procedure => {
    const matchesSearch = procedure.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         procedure.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         procedure.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFiles = filterFiles === "all" || 
                        procedure.requiredFiles.some(file => 
                          file.toLowerCase().includes(filterFiles.toLowerCase())
                        );
    
    return matchesSearch && matchesFiles;
  });

  // Get unique file types for filter
  const allFiles = procedures.flatMap(p => p.requiredFiles);
  const uniqueFiles = [...new Set(allFiles)];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-4xl max-h-[80vh] border-white/10 bg-black/80 text-white shadow-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/10">
          <CardTitle className="text-lg flex items-center gap-2">
            <Play className="h-5 w-5 text-[#4da3ff]" />
            Associate Substantive Procedures
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
                placeholder="Search procedures..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-white/10 bg-transparent pl-10 text-white placeholder:text-white/40 focus-visible:border-[#4da3ff]/60 focus-visible:ring-[#4da3ff]/40"
              />
            </div>
            
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-white/60" />
                <select
                  value={filterFiles}
                  onChange={(e) => setFilterFiles(e.target.value)}
                  className="rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
                >
                  <option value="all">All Files</option>
                  {uniqueFiles.map(file => (
                    <option key={file} value={file}>{file}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Selected Procedures Summary */}
          {selectedProcedures.length > 0 && (
            <div className="bg-[#4da3ff]/10 border border-[#4da3ff]/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-[#4da3ff]" />
                <span className="text-sm font-medium text-[#4da3ff]">
                  {selectedProcedures.length} procedure(s) selected
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedProcedures.map(procedure => (
                  <Badge key={procedure.id} variant="outline" className="text-xs">
                    {procedure.id}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Procedures List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {loading ? (
              <div className="text-center text-white/60 py-8">
                Loading procedures...
              </div>
            ) : filteredProcedures.length === 0 ? (
              <div className="text-center text-white/60 py-8">
                No procedures found matching your criteria
              </div>
            ) : (
              filteredProcedures.map((procedure) => {
                const isSelected = selectedProcedures.some(p => p.id === procedure.id);
                
                return (
                  <Card
                    key={procedure.id}
                    className={`cursor-pointer border transition-all ${
                      isSelected
                        ? "border-[#4da3ff]/50 bg-[#4da3ff]/10"
                        : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                    }`}
                    onClick={() => handleProcedureToggle(procedure)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleProcedureToggle(procedure)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-sm font-medium text-white">
                              {procedure.name}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {procedure.id}
                            </Badge>
                          </div>
                          <p className="text-xs text-white/70 mb-3">
                            {procedure.description}
                          </p>
                          
                          {/* Required Files */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <FileText className="h-3 w-3 text-white/60" />
                              <span className="text-xs text-white/60">Required Files:</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {procedure.requiredFiles.map((file, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {file}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Questions Count */}
                          {procedure.questions && procedure.questions.length > 0 && (
                            <div className="mt-2">
                              <Badge variant="outline" className="text-xs">
                                {procedure.questions.length} question(s)
                              </Badge>
                            </div>
                          )}
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
              Associate {selectedProcedures.length} Procedure(s)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
