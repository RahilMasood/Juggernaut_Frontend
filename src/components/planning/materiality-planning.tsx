"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import { Save, Calculator } from "lucide-react";

const BENCHMARK_OPTIONS = [
  "Cash Flow from Operations",
  "EBITDA",
  "Total Expenses",
  "Revenue from Operations",
  "Total Assets",
  "Total equity/net assets",
];

const PERFORMANCE_FACTORS = [
  {
    label: "Reliability on internal controls",
    options: ["Effective", "Not Effective"],
  },
  { label: "Engagement risk", options: ["Increased", "Not Increased"] },
  {
    label: "Forecasting changes",
    options: [
      "No changes",
      "Significant and could impact expected misstatements",
    ],
  },
  {
    label: "History of misstatements",
    options: ["Limited to no errors", "High value or amount"],
  },
  {
    label: "Management responsiveness",
    options: [
      "Investigates and corrects",
      "Does not investigate and/or correct",
    ],
  },
];

interface MaterialityPlanningProps {
  onDataChange: (data: any) => void;
  initialData: any;
  crossSectionAnswers?: Record<string, string | number | boolean>;
}

export function MaterialityPlanning({
  onDataChange,
  initialData,
  crossSectionAnswers = {},
}: MaterialityPlanningProps) {
  const [formData, setFormData] = useState({
    commonUsers: "",
    selectedBenchmarks: [] as string[],
    benchmarkData: [] as Array<{
      benchmark: string;
      amount: number;
      adjustments: number;
      factor: number;
    }>,
    determinedMateriality: 0,
    calculatedPerformanceMateriality: 0,
    benchmarkFactors: "",
    performancePercentage: 75,
    performanceFactors: {} as Record<string, string>,
    performanceDocumentation: "",
    trivialPercentage: 5,
    trivialThreshold: 0,
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    // Only auto-calculate if the fields are empty (0) - allows manual override
    const autoThreshold =
      (formData.determinedMateriality * formData.trivialPercentage) / 100;
    const autoPerformanceMateriality =
      (formData.determinedMateriality * formData.performancePercentage) / 100;

    setFormData((prev) => ({
      ...prev,
      // Only update if current value is 0 (not manually set)
      trivialThreshold:
        prev.trivialThreshold === 0 ? autoThreshold : prev.trivialThreshold,
      calculatedPerformanceMateriality:
        prev.calculatedPerformanceMateriality === 0
          ? autoPerformanceMateriality
          : prev.calculatedPerformanceMateriality,
    }));
  }, [
    formData.determinedMateriality,
    formData.trivialPercentage,
    formData.performancePercentage,
  ]);

  const handleBenchmarkSelection = (benchmark: string, checked: boolean) => {
    setFormData((prev) => {
      const newSelected = checked
        ? [...prev.selectedBenchmarks, benchmark]
        : prev.selectedBenchmarks.filter((b) => b !== benchmark);

      const newBenchmarkData = newSelected.map((b) => {
        const existing = prev.benchmarkData.find((bd) => bd.benchmark === b);
        return (
          existing || { benchmark: b, amount: 0, adjustments: 0, factor: 5 }
        );
      });

      return {
        ...prev,
        selectedBenchmarks: newSelected,
        benchmarkData: newBenchmarkData,
      };
    });
  };

  const updateBenchmarkData = (index: number, field: string, value: number) => {
    setFormData((prev) => {
      const newData = [...prev.benchmarkData];
      newData[index] = { ...newData[index], [field]: value };
      return { ...prev, benchmarkData: newData };
    });
  };

  const calculateMateriality = () => {
    const total = formData.benchmarkData.reduce((sum, item) => {
      const normalizedAmount = item.amount + item.adjustments;
      return sum + (normalizedAmount * item.factor) / 100;
    }, 0);

    setFormData((prev) => ({ ...prev, determinedMateriality: total }));
  };

  const handlePerformanceFactorChange = (factor: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      performanceFactors: { ...prev.performanceFactors, [factor]: value },
    }));
  };

  const handleSave = () => {
    onDataChange(formData);
  };

  // Debug log for tracking cross-section answers (for future conditional logic)
  console.log("MaterialityPlanning crossSectionAnswers:", crossSectionAnswers);

  return (
    <div className="space-y-8">
      {/* Common Users Documentation */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Common Users & Factors</h3>
        <div className="space-y-2">
          <Label htmlFor="commonUsers">
            Document the common users of the financial statements and other
            factors affecting materiality determination
          </Label>
          <Textarea
            id="commonUsers"
            placeholder="Describe common users, previous audit misstatements, changes in circumstances..."
            value={formData.commonUsers}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, commonUsers: e.target.value }))
            }
            className="min-h-[100px]"
          />
        </div>
      </div>

      <Separator />

      {/* Benchmark Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Benchmark Selection</h3>
        <div className="grid grid-cols-2 gap-4">
          {BENCHMARK_OPTIONS.map((benchmark) => (
            <div key={benchmark} className="flex items-center space-x-2">
              <Checkbox
                id={benchmark}
                checked={formData.selectedBenchmarks.includes(benchmark)}
                onCheckedChange={(checked) =>
                  handleBenchmarkSelection(benchmark, checked as boolean)
                }
              />
              <Label htmlFor={benchmark} className="text-sm">
                {benchmark}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Benchmark Data Table */}
      {formData.selectedBenchmarks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Benchmark Calculations</h3>
            <Button
              onClick={calculateMateriality}
              className="flex items-center gap-2"
            >
              <Calculator className="h-4 w-4" />
              Calculate Materiality
            </Button>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Benchmark</TableHead>
                  <TableHead>Amount (A)</TableHead>
                  <TableHead>Normalization Adjustments (B)</TableHead>
                  <TableHead>Normalized Amount (C=A+B)</TableHead>
                  <TableHead>Benchmark Factor (%)</TableHead>
                  <TableHead>Materiality (C×%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.benchmarkData.map((item, index) => {
                  const normalizedAmount = item.amount + item.adjustments;
                  const materiality = (normalizedAmount * item.factor) / 100;

                  return (
                    <TableRow key={item.benchmark}>
                      <TableCell className="font-medium">
                        {item.benchmark}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.amount || ""}
                          onChange={(e) =>
                            updateBenchmarkData(
                              index,
                              "amount",
                              Number.parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.adjustments || ""}
                          onChange={(e) =>
                            updateBenchmarkData(
                              index,
                              "adjustments",
                              Number.parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {normalizedAmount.toLocaleString()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.factor || ""}
                          onChange={(e) =>
                            updateBenchmarkData(
                              index,
                              "factor",
                              Number.parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-20"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {materiality.toLocaleString()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="bg-primary/5 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold">
                Total Determined Materiality:
              </span>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="px-4 py-2 text-lg">
                  Calculated:{" "}
                  {formData.benchmarkData
                    .reduce((sum, item) => {
                      const normalizedAmount = item.amount + item.adjustments;
                      return sum + (normalizedAmount * item.factor) / 100;
                    }, 0)
                    .toLocaleString()}
                </Badge>
                <div className="flex items-center gap-2">
                  <Label htmlFor="determinedMateriality" className="text-sm">
                    Final:
                  </Label>
                  <Input
                    id="determinedMateriality"
                    type="number"
                    value={formData.determinedMateriality || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        determinedMateriality:
                          Number.parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-32"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Separator />

      {/* Benchmark Factors Documentation */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Benchmark Factors Documentation
        </h3>
        <Textarea
          placeholder="Document factors used to consider benchmarks: ownership structure, financing, volatility, elements of financial statements, user focus areas, entity nature and lifecycle..."
          value={formData.benchmarkFactors}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              benchmarkFactors: e.target.value,
            }))
          }
          className="min-h-[120px]"
        />
      </div>

      <Separator />

      {/* Performance Materiality */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Performance Materiality</h3>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="performancePercentage">
              Performance Materiality Percentage
            </Label>
            <Input
              id="performancePercentage"
              type="number"
              value={formData.performancePercentage}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  performancePercentage: Number.parseFloat(e.target.value) || 0,
                }))
              }
              min="1"
              max="99"
              className="w-24"
            />
            <p className="text-muted-foreground text-sm">
              Must be less than 100%
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="calculatedPerformanceMateriality">
              Calculated Performance Materiality
            </Label>
            <div className="flex items-center gap-4">
              <div className="bg-secondary rounded-md p-3">
                <Badge variant="secondary" className="text-base">
                  Auto:{" "}
                  {(
                    (formData.determinedMateriality *
                      formData.performancePercentage) /
                    100
                  ).toLocaleString()}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="calculatedPerformanceMateriality"
                  className="text-sm"
                >
                  Override:
                </Label>
                <Input
                  id="calculatedPerformanceMateriality"
                  type="number"
                  value={formData.calculatedPerformanceMateriality || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      calculatedPerformanceMateriality:
                        Number.parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-32"
                  placeholder="Optional override"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Performance Materiality Factors</h4>
          <div className="space-y-4">
            {PERFORMANCE_FACTORS.map((factor) => (
              <div key={factor.label} className="space-y-2">
                <Label className="text-sm font-medium">{factor.label}</Label>
                <RadioGroup
                  value={formData.performanceFactors[factor.label] || ""}
                  onValueChange={(value) =>
                    handlePerformanceFactorChange(factor.label, value)
                  }
                  className="flex gap-6"
                >
                  {factor.options.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={option}
                        id={`${factor.label}-${option}`}
                      />
                      <Label
                        htmlFor={`${factor.label}-${option}`}
                        className="text-sm"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="performanceDocumentation">
            Additional Performance Materiality Documentation
          </Label>
          <Textarea
            id="performanceDocumentation"
            placeholder="Document additional factors considered for performance materiality..."
            value={formData.performanceDocumentation}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                performanceDocumentation: e.target.value,
              }))
            }
            className="min-h-[80px]"
          />
        </div>
      </div>

      <Separator />

      {/* Clearly Trivial Threshold */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Clearly Trivial Threshold</h3>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="trivialPercentage">
              Clearly Trivial Threshold Percentage
            </Label>
            <Input
              id="trivialPercentage"
              type="number"
              value={formData.trivialPercentage}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  trivialPercentage: Number.parseFloat(e.target.value) || 0,
                }))
              }
              min="1"
              max="10"
              step="0.1"
              className="w-24"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trivialThreshold">
              Computed Clearly Trivial Threshold
            </Label>
            <div className="flex items-center gap-4">
              <div className="bg-secondary rounded-md p-3">
                <Badge variant="secondary" className="text-base">
                  Auto:{" "}
                  {(
                    (formData.determinedMateriality *
                      formData.trivialPercentage) /
                    100
                  ).toLocaleString()}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="trivialThreshold" className="text-sm">
                  Override:
                </Label>
                <Input
                  id="trivialThreshold"
                  type="number"
                  value={formData.trivialThreshold || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      trivialThreshold: Number.parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-32"
                  placeholder="Optional override"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Planning Data
        </Button>
      </div>
    </div>
  );
}
