import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Separator } from "../ui/separator";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import combinedData from "../../data/Combined.json";

interface RommItem {
  id: string;
  risk: string;
  assertion: string;
  options: string[];
  selectedOption?: string;
}

interface PayrollRommsProps {
  onBack: () => void;
  onComplete: (data: Record<string, string>) => void;
}

export default function PayrollRomms({
  onBack,
  onComplete,
}: PayrollRommsProps) {
  const [romms, setRomms] = useState<RommItem[]>([]);
  const [selectedRommId, setSelectedRommId] = useState<string | null>(null);
  const [rommSelections, setRommSelections] = useState<Record<string, string>>({});
  const [ebeNoteLines, setEbeNoteLines] = useState<string[]>([]);
  const [isLoadingEbe, setIsLoadingEbe] = useState(true);
  const [ebeError, setEbeError] = useState<string | null>(null);
  const [employeeBenefitsNoteLines, setEmployeeBenefitsNoteLines] = useState<string[]>([]);

  // Load ROMMS data from Instructions.json
  useEffect(() => {
    const loadRommsData = async () => {
      try {
        // Load the Instructions.json file from the payroll directory
        const response = await fetch("/payroll/Instructions.json");
        if (!response.ok) {
          throw new Error("Failed to load Instructions.json");
        }
        const instructionsData = await response.json();

        // Extract ROMMS data from the instructions
        const rommsData: RommItem[] = instructionsData.romms || [];

        // If romms array is missing or empty, use sensible defaults
        const effectiveRomms: RommItem[] =
          rommsData.length > 0
            ? rommsData
            : [
                {
                  id: "romm-1",
                  risk: "Payroll expenses is recorded that did not occur",
                  assertion: "Occurrence",
                  options: ["Lower", "Higher", "Significant", "NRPMM"],
                },
                {
                  id: "romm-2",
                  risk: "Payroll expenses is incomplete",
                  assertion: "C",
                  options: ["Lower", "Higher", "Significant", "NRPMM"],
                },
                {
                  id: "romm-3",
                  risk: "Payroll expenses is recorded in incorrect period",
                  assertion: "Cu",
                  options: ["Lower", "Higher", "Significant", "NRPMM"],
                },
                {
                  id: "romm-4",
                  risk: "Payroll expenses is not recorded at proper amount",
                  assertion: "A",
                  options: ["Lower", "Higher", "Significant", "NRPMM"],
                },
                {
                  id: "romm-5",
                  risk: "Payroll expenses is not recorded in proper account",
                  assertion: "Cl",
                  options: ["Lower", "Higher", "Significant", "NRPMM"],
                },
              ];

        setRomms(effectiveRomms);
        if (effectiveRomms.length > 0) {
          setSelectedRommId(effectiveRomms[0].id);
        }
      } catch (error) {
        console.error("Error loading ROMMS data:", error);
        // Fallback to hardcoded data if file loading fails
        const fallbackData: RommItem[] = [
          {
            id: "romm-1",
            risk: "Payroll expenses is recorded that did not occur",
            assertion: "Occurrence",
            options: ["Lower", "Higher", "Significant", "NRPMM"],
          },
          {
            id: "romm-2",
            risk: "Payroll expenses is incomplete",
            assertion: "C",
            options: ["Lower", "Higher", "Significant", "NRPMM"],
          },
          {
            id: "romm-3",
            risk: "Payroll expenses is recorded in incorrect period",
            assertion: "Cu",
            options: ["Lower", "Higher", "Significant", "NRPMM"],
          },
          {
            id: "romm-4",
            risk: "Payroll expenses is not recorded at proper amount",
            assertion: "A",
            options: ["Lower", "Higher", "Significant", "NRPMM"],
          },
          {
            id: "romm-5",
            risk: "Payroll expenses is not recorded in proper account",
            assertion: "Cl",
            options: ["Lower", "Higher", "Significant", "NRPMM"],
          },
        ];
        setRomms(fallbackData);
        if (fallbackData.length > 0) {
          setSelectedRommId(fallbackData[0].id);
        }
      }
    };

    loadRommsData();
  }, []);

  const selectedRomm = romms.find((r) => r.id === selectedRommId);

  // Load Combined.json and extract note lines for Employee Benefits Expense
  useEffect(() => {
    let isMounted = true;
    const loadEbeNotes = async () => {
      try {
        setIsLoadingEbe(true);
        setEbeError(null);
        const combined = (await window.planning.readCombinedData()) as {
          data?: Array<{ par?: string; note_line?: string }>;
        };
        const raw = combined?.data ?? [];
        const filtered = raw.filter(
          (item) => (item?.par || "").trim() === "Employee Benefits Expense",
        );
        const notes = new Set<string>();
        for (const entry of filtered) {
          const note = entry?.note_line;
          if (note && typeof note === "string") notes.add(note);
        }
        if (isMounted) setEbeNoteLines(Array.from(notes));
      } catch {
        if (isMounted) setEbeError("Failed to load financial data");
      } finally {
        if (isMounted) setIsLoadingEbe(false);
      }
    };
    loadEbeNotes();
    return () => {
      isMounted = false;
    };
  }, []);

  // Extract Employee Benefits Expense note lines from Combined.json
  useEffect(() => {
    try {
      const employeeBenefitsEntries = combinedData.data.filter(
        (entry: any) => entry.par === "Employee Benefits Expense"
      );
      
      const uniqueNoteLines = [...new Set(
        employeeBenefitsEntries.map((entry: any) => entry.note_line)
      )].filter(Boolean);
      
      setEmployeeBenefitsNoteLines(uniqueNoteLines as string[]);
    } catch (error) {
      console.error('Error extracting Employee Benefits note lines:', error);
    }
  }, []);

  const handleRommSelection = (rommId: string, option: string) => {
    setRommSelections((prev) => ({
      ...prev,
      [rommId]: option,
    }));
  };

  const isRommComplete = (rommId: string) => {
    return rommSelections[rommId] !== undefined;
  };

  const allRommsComplete = romms.every((r) => isRommComplete(r.id));

  const getRiskLevelColor = (option: string) => {
    switch (option) {
      case "Lower":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Higher":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "Significant":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "NRPMM":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getOptionDescription = (option: string) => {
    switch (option) {
      case "Lower":
        return "Lower risk of material misstatement";
      case "Higher":
        return "Higher risk of material misstatement";
      case "Significant":
        return "Significant risk requiring special audit consideration";
      case "NRPMM":
        return "Not a Risk of Material Misstatement";
      default:
        return "";
    }
  };

  const handleComplete = () => {
    onComplete(rommSelections);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            Risk of Material Misstatement (RoMMs)
          </h2>
          <p className="text-sm text-white/60">
            Assess the risk level for each payroll-related assertion
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-white/10 text-white/80">
            {Object.keys(rommSelections).length} / {romms.length} Complete
          </Badge>
          <Button variant="outline" onClick={onBack}>
            Back to Landing
          </Button>
        </div>
      </div>

      {/* Two Column Layout - 30% Left, 70% Right */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left Panel - ROMMS List */}
        <Card className="border-white/10 bg-white/5 text-white lg:w-[30%] lg:flex-shrink-0">
          <CardHeader>
            <CardTitle className="text-lg">Payroll Risks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {romms.map((romm) => (
              <div
                key={romm.id}
                className={`cursor-pointer rounded-lg border p-3 transition-all ${
                  selectedRommId === romm.id
                    ? "border-blue-500/50 bg-blue-500/10"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                }`}
                onClick={() => setSelectedRommId(romm.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {romm.assertion}
                      </Badge>
                      {isRommComplete(romm.id) ? (
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-400" />
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-white/80">
                      {romm.risk}
                    </p>
                    {rommSelections[romm.id] && (
                      <div className="mt-2">
                        <Badge
                          className={`text-xs ${getRiskLevelColor(rommSelections[romm.id])}`}
                        >
                          {rommSelections[romm.id]}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Right Panel - Four Column Layout */}
        <Card className="border-white/10 bg-white/5 text-white lg:w-[70%] lg:flex-shrink-0">
          <CardHeader>
            <CardTitle className="text-lg">
              PRCOR007 - COT-Payroll expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Table Header */}
            <div className="mb-4 hidden rounded-lg border border-white/20 bg-white/10 p-3 md:grid md:grid-cols-4 md:gap-4">
              <div className="text-sm font-semibold text-white">Description</div>
              <div className="text-sm font-semibold text-white">Accounts/Areas</div>
              <div className="text-sm font-semibold text-white">Assertions/Type</div>
              <div className="text-sm font-semibold text-white">Assessment</div>
            </div>

            {/* Table Rows */}
            <div className="space-y-4">
              {romms.map((romm) => (
                <div
                  key={romm.id}
                  className="rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10 md:grid md:grid-cols-4 md:gap-4 md:p-3"
                >
                  {/* Description Column */}
                  <div className="mb-4 md:mb-0">
                    <div className="mb-2 block text-xs font-semibold text-white/60 md:hidden">Description</div>
                    <div className="text-sm text-white/80">
                      {romm.risk}
                    </div>
                  </div>

                  {/* Accounts/Areas Column */}
                  <div className="mb-4 md:mb-0">
                    <div className="mb-2 block text-xs font-semibold text-white/60 md:hidden">Accounts/Areas</div>
                    <div className="space-y-1">
                      {employeeBenefitsNoteLines.length > 0 ? (
                        employeeBenefitsNoteLines.map((noteLine, index) => (
                          <div key={index} className="flex items-center gap-1 text-xs text-orange-400">
                            <span className="h-2 w-2 rounded-full bg-orange-400"></span>
                            {noteLine}
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-white/60">Loading accounts/areas...</div>
                      )}
                    </div>
                  </div>

                  {/* Assertions/Type Column */}
                  <div className="mb-4 md:mb-0">
                    <div className="mb-2 block text-xs font-semibold text-white/60 md:hidden">Assertions/Type</div>
                    <div className="flex items-center group relative">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white cursor-pointer" title={romm.assertion}>
                        {romm.assertion === 'Completeness' ? 'C' : 
                         romm.assertion === 'Classification' ? 'Cl' : 
                         romm.assertion === 'Cutoff' ? 'Cu' : 
                         romm.assertion === 'Accuracy' ? 'A' : 
                         romm.assertion === 'Occurrence' ? 'O' : romm.assertion}
                      </div>
                      <span className="ml-2 text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">{romm.assertion}</span>
                    </div>
                  </div>

                  {/* Assessment Column */}
                  <div>
                    <div className="mb-2 block text-xs font-semibold text-white/60 md:hidden">Assessment</div>
                    <div className="flex items-center gap-2">
                      {/* Triangle indicator on the left */}
                      <div className="flex-shrink-0">
                        {rommSelections[romm.id] === 'lower' && <span style={{color: "#FFFF00"}}>▼</span>}
                        {rommSelections[romm.id] === 'higher' && <span style={{color: "#FFA500"}}>▲</span>}
                        {rommSelections[romm.id] === 'significant' && <span style={{color: "#FFA500"}}>▲</span>}
                        {rommSelections[romm.id] === 'nrpmm' && <span style={{color: "#008000"}}>●</span>}
                      </div>
                      <Select
                        value={rommSelections[romm.id] || ""}
                        onValueChange={(value) => handleRommSelection(romm.id, value)}
                      >
                        <SelectTrigger className="w-full">
                           <SelectValue placeholder="Select assessment">
                             {rommSelections[romm.id] && (
                               <div className="flex items-center gap-2">
                                 {rommSelections[romm.id] === 'lower' && <span style={{color: "#FFFF00"}}>▼</span>}
                                  {rommSelections[romm.id] === 'higher' && <span style={{color: "#FFA500"}}>▲</span>}
                                  {rommSelections[romm.id] === 'significant' && <span style={{color: "#FFA500"}}>▲</span>}
                                  {rommSelections[romm.id] === 'nrpmm' && <span style={{color: "#008000"}}>●</span>}
                                 <Badge className={`text-xs ${getRiskLevelColor(rommSelections[romm.id])}`}>
                                   {rommSelections[romm.id]}
                                 </Badge>
                               </div>
                             )}
                           </SelectValue>
                         </SelectTrigger>
                        <SelectContent>
                           {romm.options.map((option) => (
                             <SelectItem key={option} value={option}>
                               <div className="flex items-center gap-2">
                                 {option === 'lower' && <span style={{color: "#FFFF00"}}>▼</span>}
                                 {option === 'higher' && <span style={{color: "#FFA500"}}>▲</span>}
                                 {option === 'significant' && <span style={{color: "#FFA500"}}>▲</span>}
                                 {option === 'nrpmm' && <span style={{color: "#008000"}}>●</span>}
                                 <Badge className={`text-xs ${getRiskLevelColor(option)}`}>
                                   {option}
                                 </Badge>
                               </div>
                             </SelectItem>
                           ))}
                         </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Employee Benefits Expense Note Lines */}
            <Separator className="my-6 bg-white/10" />
            <div className="space-y-3">
              <h4 className="text-md font-medium text-white">
                Employee Benefits Expense Note Lines
              </h4>
              {isLoadingEbe ? (
                <p className="text-sm text-white/60">Loading...</p>
              ) : ebeError ? (
                <p className="text-sm text-red-400">{ebeError}</p>
              ) : ebeNoteLines.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {ebeNoteLines.map((note) => (
                    <Badge key={note} variant="outline" className="text-xs">
                      {note}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/60">No note lines found.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-white/60">
          Complete all risk assessments to proceed to the next step
        </div>
        <Button
          onClick={handleComplete}
          disabled={!allRommsComplete}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          Complete Risk Assessment
        </Button>
      </div>
    </div>
  );
}
