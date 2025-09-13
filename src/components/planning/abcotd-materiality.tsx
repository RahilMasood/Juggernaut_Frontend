"use client";
import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

import { Save, Plus, Trash2 } from "lucide-react";
import { getStructuredBalanceSheetData } from "@/lib/textron-data-processor";

interface AbcotdMaterialityData {
  abcotdRequired: string;
  abcotdDetails: Array<{
    fsSubLine: string;
    abcotdBalance: number;
    percentageApplied: number;
    abcotdMaterialityBasedOnPercent: number;
    determinedMateriality: number;
    determinedPM: number;
  }>;
}

interface AbcotdMaterialityProps {
  onDataChange: (data: AbcotdMaterialityData) => void;
  initialData: AbcotdMaterialityData | null;
  crossSectionAnswers?: Record<string, string | number | boolean>;
}

export function AbcotdMateriality({
  onDataChange,
  initialData,
  crossSectionAnswers = {},
}: AbcotdMaterialityProps) {
  const [formData, setFormData] = useState({
    abcotdRequired: "",
    abcotdDetails: [] as Array<{
      fsSubLine: string;
      abcotdBalance: number;
      percentageApplied: number;
      abcotdMaterialityBasedOnPercent: number;
      determinedMateriality: number;
      determinedPM: number;
    }>,
  });

  // Get unique FS SubLines for dropdown
  const [fsSubLines, setFsSubLines] = useState<string[]>([]);

  useEffect(() => {
    const structuredData = getStructuredBalanceSheetData();
    const uniqueSubLines = new Set<string>();

    Object.values(structuredData).forEach((typeData) => {
      Object.keys(typeData).forEach((subLine) => {
        if (subLine !== "Other") {
          uniqueSubLines.add(subLine);
        }
      });
    });

    setFsSubLines(Array.from(uniqueSubLines).sort());
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        abcotdRequired: initialData.abcotdRequired || "",
        abcotdDetails: (initialData.abcotdDetails || []).map((detail) => ({
          fsSubLine: detail.fsSubLine || "",
          abcotdBalance: detail.abcotdBalance || 0,
          percentageApplied: detail.percentageApplied || 0,
          abcotdMaterialityBasedOnPercent:
            detail.abcotdMaterialityBasedOnPercent || 0,
          determinedMateriality: detail.determinedMateriality || 0,
          determinedPM: detail.determinedPM || 0,
        })),
      });
    }
  }, [initialData]);

  // Function to get balance for a specific FS SubLine
  const getFsSubLineBalance = (fsSubLine: string): number => {
    if (!fsSubLine) return 0;

    try {
      const structuredData = getStructuredBalanceSheetData();
      let balance = 0;

      Object.values(structuredData).forEach((typeData) => {
        if (typeData && typeData[fsSubLine]) {
          balance += typeData[fsSubLine].reduce(
            (sum, item) => sum + Math.abs(item.amount || 0),
            0,
          );
        }
      });

      return balance;
    } catch (error) {
      console.error("Error calculating FS SubLine balance:", error);
      return 0;
    }
  };

  const addAbcotdDetail = () => {
    setFormData((prev) => ({
      ...prev,
      abcotdDetails: [
        ...prev.abcotdDetails,
        {
          fsSubLine: "",
          abcotdBalance: 0,
          percentageApplied: 0,
          abcotdMaterialityBasedOnPercent: 0,
          determinedMateriality: 0,
          determinedPM: 0,
        },
      ],
    }));
  };

  const updateAbcotdDetail = (
    index: number,
    field: string,
    value: string | number,
  ) => {
    setFormData((prev) => {
      const newDetails = [...prev.abcotdDetails];
      newDetails[index] = { ...newDetails[index], [field]: value };

      // Auto-calculate fields based on changes
      if (field === "fsSubLine") {
        // Update ABCOTD Balance when FS SubLine changes
        newDetails[index].abcotdBalance =
          getFsSubLineBalance(value as string) || 0;
        // Recalculate materiality based on percentage
        const balance = newDetails[index].abcotdBalance || 0;
        const percentage = newDetails[index].percentageApplied || 0;
        if (percentage > 0) {
          newDetails[index].abcotdMaterialityBasedOnPercent =
            (balance * percentage) / 100;
        }
      } else if (field === "percentageApplied") {
        // Recalculate materiality when percentage changes
        const balance = newDetails[index].abcotdBalance || 0;
        const percentage = Number(value) || 0;
        if (balance > 0) {
          newDetails[index].abcotdMaterialityBasedOnPercent =
            (balance * percentage) / 100;
        }
      }

      return { ...prev, abcotdDetails: newDetails };
    });
  };

  const removeAbcotdDetail = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      abcotdDetails: prev.abcotdDetails.filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    onDataChange(formData);
  };

  // Debug log for tracking cross-section answers (for future conditional logic)
  console.log("AbcotdMateriality crossSectionAnswers:", crossSectionAnswers);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="abcotdRequired">
            Do we need to determine materiality for particular classes of
            transactions, account balances or disclosures?
          </Label>
          <RadioGroup
            value={formData.abcotdRequired}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, abcotdRequired: value }))
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Yes" id="abcotd-yes" />
              <Label htmlFor="abcotd-yes">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="No" id="abcotd-no" />
              <Label htmlFor="abcotd-no">No</Label>
            </div>
          </RadioGroup>
        </div>

        {formData.abcotdRequired === "Yes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">ABCOTD Details</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAbcotdDetail}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add ABCOTD Entry
              </Button>
            </div>

            {/* ABCOTD Table */}
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="border-r p-3 text-left text-sm font-medium">
                      Field
                    </th>
                    {(formData.abcotdDetails || []).map((_, index) => (
                      <th
                        key={index}
                        className="border-r p-3 text-center text-sm font-medium"
                      >
                        ABCOTD {index + 1}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAbcotdDetail(index)}
                          className="ml-2 h-6 w-6 p-0 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* ABCOTD Row */}
                  <tr className="border-b">
                    <td className="border-r p-3 text-sm font-medium">ABCOTD</td>
                    {(formData.abcotdDetails || []).map((detail, index) => (
                      <td key={index} className="border-r p-3">
                        <select
                          value={detail.fsSubLine}
                          onChange={(e) =>
                            updateAbcotdDetail(
                              index,
                              "fsSubLine",
                              e.target.value,
                            )
                          }
                          className="w-full rounded border border-gray-300 p-2 text-sm"
                        >
                          <option value="">Select FS SubLine</option>
                          {fsSubLines.map((subLine) => (
                            <option key={subLine} value={subLine}>
                              {subLine}
                            </option>
                          ))}
                        </select>
                      </td>
                    ))}
                  </tr>

                  {/* ABCOTD Balance Row */}
                  <tr className="border-b">
                    <td className="border-r p-3 text-sm font-medium">
                      ABCOTD Balance
                    </td>
                    {(formData.abcotdDetails || []).map((detail, index) => (
                      <td key={index} className="border-r p-3">
                        <div className="rounded p-2 text-center text-sm">
                          {(detail.abcotdBalance || 0).toLocaleString()}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          (Auto-computed from FS SubLine)
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* % Applied Row */}
                  <tr className="border-b">
                    <td className="border-r p-3 text-sm font-medium">
                      % Applied
                    </td>
                    {(formData.abcotdDetails || []).map((detail, index) => (
                      <td key={index} className="border-r p-3">
                        <Input
                          type="number"
                          value={detail.percentageApplied || ""}
                          onChange={(e) =>
                            updateAbcotdDetail(
                              index,
                              "percentageApplied",
                              Number.parseFloat(e.target.value) || 0,
                            )
                          }
                          placeholder="0"
                          min="0"
                          max="100"
                          step="0.1"
                          className="text-center"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* ABCOTD Materiality based on % Row */}
                  <tr className="border-b">
                    <td className="border-r p-3 text-sm font-medium">
                      ABCOTD Materiality based on %
                    </td>
                    {(formData.abcotdDetails || []).map((detail, index) => (
                      <td key={index} className="border-r p-3">
                        <div className="rounded p-2 text-center text-sm font-medium">
                          {(
                            detail.abcotdMaterialityBasedOnPercent || 0
                          ).toLocaleString()}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          (Auto-computed)
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Determined Materiality Row */}
                  <tr className="border-b">
                    <td className="border-r p-3 text-sm font-medium">
                      Determined Materiality
                    </td>
                    {(formData.abcotdDetails || []).map((detail, index) => (
                      <td key={index} className="border-r p-3">
                        <Input
                          type="number"
                          value={detail.determinedMateriality || ""}
                          onChange={(e) =>
                            updateAbcotdDetail(
                              index,
                              "determinedMateriality",
                              Number.parseFloat(e.target.value) || 0,
                            )
                          }
                          placeholder="0"
                          className="text-center"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Determined PM Row */}
                  <tr>
                    <td className="border-r p-3 text-sm font-medium">
                      Determined PM
                    </td>
                    {(formData.abcotdDetails || []).map((detail, index) => (
                      <td key={index} className="border-r p-3">
                        <Input
                          type="number"
                          value={detail.determinedPM || ""}
                          onChange={(e) =>
                            updateAbcotdDetail(
                              index,
                              "determinedPM",
                              Number.parseFloat(e.target.value) || 0,
                            )
                          }
                          placeholder="0"
                          className="text-center"
                        />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-6">
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save ABCOTD Data
        </Button>
      </div>
    </div>
  );
}
