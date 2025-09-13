"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Save, Plus, Trash2, Users } from "lucide-react";

interface ComponentDetail {
  componentName: string;
  performanceMateriality: {
    percentage: number;
    balanceOfChosenBenchmark: number;
    determinedAmount: number;
  };
  clearlyTrivialThreshold: {
    percentage: number;
    balanceOfChosenBenchmark: number;
    determinedAmount: number;
  };
}

interface ComponentMaterialityData {
  componentMaterialityRequired: boolean;
  componentDetails: ComponentDetail[];
}

interface ComponentMaterialityProps {
  onDataChange: (data: ComponentMaterialityData) => void;
  initialData: ComponentMaterialityData | null;
  crossSectionAnswers?: Record<string, string | number | boolean>;
}

export function ComponentMateriality({
  onDataChange,
  initialData,
  crossSectionAnswers = {},
}: ComponentMaterialityProps) {
  const [formData, setFormData] = useState({
    componentMaterialityRequired: false,
    componentDetails: [] as Array<{
      componentName: string;
      performanceMateriality: {
        percentage: number;
        balanceOfChosenBenchmark: number;
        determinedAmount: number;
      };
      clearlyTrivialThreshold: {
        percentage: number;
        balanceOfChosenBenchmark: number;
        determinedAmount: number;
      };
    }>,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        componentMaterialityRequired:
          initialData.componentMaterialityRequired || false,
        componentDetails: (initialData.componentDetails || []).map(
          (detail: ComponentDetail) => ({
            componentName: detail.componentName || "",
            performanceMateriality: {
              percentage: detail.performanceMateriality?.percentage || 0,
              balanceOfChosenBenchmark:
                detail.performanceMateriality?.balanceOfChosenBenchmark || 0,
              determinedAmount:
                detail.performanceMateriality?.determinedAmount || 0,
            },
            clearlyTrivialThreshold: {
              percentage: detail.clearlyTrivialThreshold?.percentage || 0,
              balanceOfChosenBenchmark:
                detail.clearlyTrivialThreshold?.balanceOfChosenBenchmark || 0,
              determinedAmount:
                detail.clearlyTrivialThreshold?.determinedAmount || 0,
            },
          }),
        ),
      });
    }
  }, [initialData]);

  const addComponentDetail = () => {
    setFormData((prev) => ({
      ...prev,
      componentDetails: [
        ...prev.componentDetails,
        {
          componentName: "",
          performanceMateriality: {
            percentage: 0,
            balanceOfChosenBenchmark: 0,
            determinedAmount: 0,
          },
          clearlyTrivialThreshold: {
            percentage: 0,
            balanceOfChosenBenchmark: 0,
            determinedAmount: 0,
          },
        },
      ],
    }));
  };

  const updateComponentDetail = (
    index: number,
    section: "performanceMateriality" | "clearlyTrivialThreshold",
    field: string,
    value: string | number,
  ) => {
    setFormData((prev) => {
      const newDetails = [...prev.componentDetails];
      newDetails[index] = {
        ...newDetails[index],
        [section]: {
          ...newDetails[index][section],
          [field]: value,
        },
      };

      // Auto-calculate determinedAmount when percentage or balance changes
      if (field === "percentage" || field === "balanceOfChosenBenchmark") {
        const percentage =
          field === "percentage"
            ? Number(value)
            : newDetails[index][section].percentage;
        const balance =
          field === "balanceOfChosenBenchmark"
            ? Number(value)
            : newDetails[index][section].balanceOfChosenBenchmark;
        newDetails[index][section].determinedAmount =
          (percentage * balance) / 100;
      }

      return { ...prev, componentDetails: newDetails };
    });
  };

  const updateComponentName = (index: number, value: string) => {
    setFormData((prev) => {
      const newDetails = [...prev.componentDetails];
      newDetails[index] = { ...newDetails[index], componentName: value };
      return { ...prev, componentDetails: newDetails };
    });
  };

  const removeComponentDetail = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      componentDetails: prev.componentDetails.filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    onDataChange(formData);
  };

  const hasValidationError =
    formData.componentMaterialityRequired &&
    formData.componentDetails.length < 2;

  // Check conditional rendering based on EP-1 (Is this an audit of group financial statements?)
  const shouldShowComponent = crossSectionAnswers["EP-1"] === "Yes";

  // Debug log for tracking condition evaluation
  console.log("ComponentMateriality condition check:", {
    "EP-1": crossSectionAnswers["EP-1"],
    shouldShowComponent,
    crossSectionAnswers,
  });

  // If condition is not met, show informational message
  if (!shouldShowComponent) {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-blue-100 p-2">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-blue-900">
              Component Materiality Not Required
            </h3>
            <p className="text-sm text-blue-700">
              Component materiality is only required for group audits. To enable
              this section, please ensure that the engagement is marked as an
              audit of group financial statements in the Engagement Acceptance
              section.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="componentMaterialityRequired"
            checked={formData.componentMaterialityRequired}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({
                ...prev,
                componentMaterialityRequired: checked as boolean,
              }))
            }
          />
          <Label htmlFor="componentMaterialityRequired">
            Component materiality required (for group audits)
          </Label>
        </div>

        {formData.componentMaterialityRequired && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Component Details</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addComponentDetail}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Component
              </Button>
            </div>

            {/* Validation Error Message */}
            {hasValidationError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-600">
                  <span className="font-medium">Error:</span> A minimum of two
                  components have to be documented to comprise a group.
                </p>
              </div>
            )}

            {/* Component Cards */}
            {formData.componentDetails.map((component, index) => (
              <div key={index} className="borderp-6 rounded-lg shadow-sm">
                <div className="space-y-4">
                  {/* Component Header */}
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="space-y-2">
                      <Label
                        htmlFor={`component-name-${index}`}
                        className="text-lg font-medium"
                      >
                        Component {index + 1}
                      </Label>
                      <Input
                        id={`component-name-${index}`}
                        value={component.componentName}
                        onChange={(e) =>
                          updateComponentName(index, e.target.value)
                        }
                        placeholder="Enter component name"
                        className="max-w-md"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeComponentDetail(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Component Table */}
                  <div className="overflow-hidden rounded-lg border">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="border-r p-3 text-left text-sm font-medium">
                            Particulars
                          </th>
                          <th className="border-r p-3 text-center text-sm font-medium">
                            Percentage (A)
                          </th>
                          <th className="border-r p-3 text-center text-sm font-medium">
                            Balance of Chosen Benchmark (B)
                          </th>
                          <th className="p-3 text-center text-sm font-medium">
                            Determined Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Performance Materiality Row */}
                        <tr className="border-b">
                          <td className="border-r p-3 text-sm font-medium">
                            Performance Materiality
                          </td>
                          <td className="border-r p-3">
                            <Input
                              type="number"
                              value={
                                component.performanceMateriality.percentage ||
                                ""
                              }
                              onChange={(e) =>
                                updateComponentDetail(
                                  index,
                                  "performanceMateriality",
                                  "percentage",
                                  Number.parseFloat(e.target.value) || 0,
                                )
                              }
                              placeholder="Enter Percentage"
                              className="text-center"
                              step="0.1"
                            />
                          </td>
                          <td className="border-r p-3">
                            <Input
                              type="number"
                              value={
                                component.performanceMateriality
                                  .balanceOfChosenBenchmark || ""
                              }
                              onChange={(e) =>
                                updateComponentDetail(
                                  index,
                                  "performanceMateriality",
                                  "balanceOfChosenBenchmark",
                                  Number.parseFloat(e.target.value) || 0,
                                )
                              }
                              placeholder="Enter Amount"
                              className="text-center"
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              value={
                                component.performanceMateriality
                                  .determinedAmount || ""
                              }
                              onChange={(e) =>
                                updateComponentDetail(
                                  index,
                                  "performanceMateriality",
                                  "determinedAmount",
                                  Number.parseFloat(e.target.value) || 0,
                                )
                              }
                              placeholder="Product"
                              className="text-center"
                            />
                          </td>
                        </tr>

                        {/* Clearly Trivial Threshold Row */}
                        <tr>
                          <td className="border-r p-3 text-sm font-medium">
                            Clearly Trivial Threshold
                          </td>
                          <td className="border-r p-3">
                            <Input
                              type="number"
                              value={
                                component.clearlyTrivialThreshold.percentage ||
                                ""
                              }
                              onChange={(e) =>
                                updateComponentDetail(
                                  index,
                                  "clearlyTrivialThreshold",
                                  "percentage",
                                  Number.parseFloat(e.target.value) || 0,
                                )
                              }
                              placeholder="Enter Percentage"
                              className="text-center"
                              step="0.1"
                            />
                          </td>
                          <td className="border-r p-3">
                            <Input
                              type="number"
                              value={
                                component.clearlyTrivialThreshold
                                  .balanceOfChosenBenchmark || ""
                              }
                              onChange={(e) =>
                                updateComponentDetail(
                                  index,
                                  "clearlyTrivialThreshold",
                                  "balanceOfChosenBenchmark",
                                  Number.parseFloat(e.target.value) || 0,
                                )
                              }
                              placeholder="Enter Amount"
                              className="text-center"
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              value={
                                component.clearlyTrivialThreshold
                                  .determinedAmount || ""
                              }
                              onChange={(e) =>
                                updateComponentDetail(
                                  index,
                                  "clearlyTrivialThreshold",
                                  "determinedAmount",
                                  Number.parseFloat(e.target.value) || 0,
                                )
                              }
                              placeholder="Product"
                              className="text-center"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-6">
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Component Data
        </Button>
      </div>
    </div>
  );
}
