"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Textarea } from "../../ui/textarea";
import { AlertCircle, CheckCircle2, Shield, ArrowLeft } from "lucide-react";

interface PPERommsProps {
  onBack?: () => void;
}

interface RommItem {
  id: string;
  risk: string;
  assertion: string;
  options: string[];
}

const PPE_ROMMS: RommItem[] = [
  {
    id: "PPE-1",
    risk: "Property, plant & equipment is recorded that did not occur",
    assertion: "Occurrence",
    options: ["Lower", "Higher", "Significant", "NRPMM"]
  },
  {
    id: "PPE-2", 
    risk: "Property, plant & equipment is incomplete",
    assertion: "Completeness",
    options: ["Lower", "Higher", "Significant", "NRPMM"]
  },
  {
    id: "PPE-3",
    risk: "Property, plant & equipment is recorded in incorrect period",
    assertion: "Cutoff",
    options: ["Lower", "Higher", "Significant", "NRPMM"]
  },
  {
    id: "PPE-4",
    risk: "Property, plant & equipment is not recorded at proper amount",
    assertion: "Accuracy",
    options: ["Lower", "Higher", "Significant", "NRPMM"]
  },
  {
    id: "PPE-5",
    risk: "Property, plant & equipment is not recorded in proper account",
    assertion: "Classification",
    options: ["Lower", "Higher", "Significant", "NRPMM"]
  }
];

export default function PPERomms({ onBack }: PPERommsProps) {
  const [romms, setRomms] = useState<RommItem[]>(PPE_ROMMS);
  const [selectedRommId, setSelectedRommId] = useState<string | null>(null);
  const [rommSelections, setRommSelections] = useState<Record<string, string>>({});
  const [rommDocumentation, setRommDocumentation] = useState<Record<string, string>>({});

  const selectedRomm = romms.find((r) => r.id === selectedRommId);

  useEffect(() => {
    if (romms.length > 0) {
      setSelectedRommId(romms[0].id);
    }
  }, [romms]);

  const handleRommSelection = (rommId: string, option: string) => {
    setRommSelections((prev) => ({
      ...prev,
      [rommId]: option,
    }));
  };

  const handleDocumentationChange = (rommId: string, documentation: string) => {
    setRommDocumentation((prev) => ({
      ...prev,
      [rommId]: documentation,
    }));
  };

  const isRommComplete = (rommId: string) => {
    return rommSelections[rommId] !== undefined;
  };

  const allRommsComplete = romms.every((r) => isRommComplete(r.id));

  const getRiskLevelColor = (option: string) => {
    switch (option) {
      case "Lower":
        return "bg-yellow-300/20 text-yellow-300 border-yellow-300/30";
      case "Higher":
        return "bg-yellow-700/30 text-yellow-400 border-yellow-700/30";
      case "Significant":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "NRPMM":
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
          <h2 className="text-2xl font-bold text-white">PPE RoMMs</h2>
          <p className="text-gray-400">Identify and assess risks of material misstatement relevant to property, plant & equipment</p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
      </div>

      {/* Two Column Layout - 30% Left, 70% Right */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left Panel - ROMMS List */}
        <Card className="border-white/10 bg-black/40 lg:w-[30%] lg:flex-shrink-0">
          <CardHeader>
            <CardTitle className="text-lg text-white">PPE Risks</CardTitle>
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
                        {romm.id}
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
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Right Panel - ROMM Details */}
        <Card className="border-white/10 bg-black/40 lg:w-[70%] lg:flex-shrink-0">
          <CardHeader>
            <CardTitle className="text-lg text-white">
              {selectedRomm?.id || "Select a ROMM"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedRomm && (
              <div className="space-y-6">
                {/* Risk Description */}
                <div>
                  <h4 className="text-md font-medium text-white mb-2">Risk Description</h4>
                  <p className="text-sm text-white/80">{selectedRomm.risk}</p>
                </div>

                {/* Assertion */}
                <div>
                  <h4 className="text-md font-medium text-white mb-2">Assertion</h4>
                  <Badge variant="outline" className="text-xs">
                    {selectedRomm.assertion}
                  </Badge>
                </div>

                {/* Assessment */}
                <div>
                  <h4 className="text-md font-medium text-white mb-2">Assessment</h4>
                  <Select
                    value={rommSelections[selectedRomm.id] || ""}
                    onValueChange={(value) => handleRommSelection(selectedRomm.id, value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select assessment" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedRomm.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs ${getRiskLevelColor(option)}`}>
                              {option}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Documentation */}
                <div>
                  <h4 className="text-md font-medium text-white mb-2">Documentation</h4>
                  <Textarea
                    placeholder="Enter your risk assessment documentation here..."
                    value={rommDocumentation[selectedRomm.id] || ""}
                    onChange={(e) => handleDocumentationChange(selectedRomm.id, e.target.value)}
                    className="min-h-[120px] bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-blue-500/50 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-white/60">
          Complete all risk assessments to proceed to the next step
        </div>
        <Button
          disabled={!allRommsComplete}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          Complete Risk Assessment
        </Button>
      </div>
    </div>
  );
}
