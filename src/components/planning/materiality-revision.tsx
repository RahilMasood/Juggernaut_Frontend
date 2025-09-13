"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { AlertTriangle, Calculator, Save, ArrowLeft } from "lucide-react";

interface MaterialityRevisionProps {
  planningData: any;
  onRevisionComplete: () => void;
  crossSectionAnswers?: Record<string, string | number | boolean>;
}

export function MaterialityRevision({
  planningData,
  onRevisionComplete,
  crossSectionAnswers = {},
}: MaterialityRevisionProps) {
  const [step, setStep] = useState(1);
  const [changesObserved, setChangesObserved] = useState("");
  const [revisionNeeded, setRevisionNeeded] = useState("");
  const [revisionData, setRevisionData] = useState({
    benchmarkData: [] as Array<{
      benchmark: string;
      amount: number;
      adjustments: number;
      factor: number;
    }>,
    determinedMateriality: 0,
    justification: "",
    auditTrail: {
      userId: "Current User",
      timestamp: new Date().toISOString(),
      oldMateriality: 0,
      newMateriality: 0,
    },
  });

  if (!planningData) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
        <AlertTriangle className="h-4 w-4" />
        <span>
          Please complete the Planning Stage first before proceeding with
          revision.
        </span>
      </div>
    );
  }

  const handleStep1Response = (value: string) => {
    setChangesObserved(value);
    if (value === "No") {
      // Log and end process
      console.log("No revision required - no changes observed");
      return;
    }
    setStep(2);
  };

  const handleStep2Response = (value: string) => {
    setRevisionNeeded(value);
    if (value === "No") {
      // Log and end process
      console.log("Change observed but no revision required");
      return;
    }

    // Initialize revision data with planning benchmarks
    const initialRevisionData = planningData.benchmarkData.map((item: any) => ({
      ...item,
      amount: 0, // Clear amounts for re-entry
      adjustments: 0, // Clear adjustments for re-entry
    }));

    setRevisionData((prev) => ({
      ...prev,
      benchmarkData: initialRevisionData,
      auditTrail: {
        ...prev.auditTrail,
        oldMateriality: planningData.determinedMateriality,
      },
    }));

    setStep(3);
  };

  const updateRevisionBenchmarkData = (
    index: number,
    field: string,
    value: number,
  ) => {
    setRevisionData((prev) => {
      const newData = [...prev.benchmarkData];
      newData[index] = { ...newData[index], [field]: value };
      return { ...prev, benchmarkData: newData };
    });
  };

  const calculateRevisedMateriality = () => {
    const total = revisionData.benchmarkData.reduce((sum, item) => {
      const normalizedAmount = item.amount + item.adjustments;
      return sum + (normalizedAmount * item.factor) / 100;
    }, 0);

    setRevisionData((prev) => ({
      ...prev,
      determinedMateriality: total,
      auditTrail: {
        ...prev.auditTrail,
        newMateriality: total,
      },
    }));
  };

  const saveRevision = () => {
    // Save revision data and audit trail
    console.log("Revision saved:", revisionData);
    onRevisionComplete();
  };

  // Debug log for tracking cross-section answers (for future conditional logic)
  console.log("MaterialityRevision crossSectionAnswers:", crossSectionAnswers);

  if (step === 1 || step === 2) {
    return (
      <div className="space-y-6">
        {/* Multi-step flow header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Badge variant={step === 1 ? "default" : "secondary"}>Step 1</Badge>
            <div className="flex items-center space-x-2">
              <div
                className={`h-2 w-8 rounded ${step === 2 ? "bg-primary" : "bg-muted"}`}
              />
              <Badge variant={step === 2 ? "default" : "secondary"}>
                Step 2
              </Badge>
            </div>
          </div>
          {step === 2 && (
            <Button
              variant="ghost"
              onClick={() => setStep(1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
        </div>

        {/* Row-wise layout for questions */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Question 1 */}
          <Card
            className={`${step === 1 ? "ring-primary ring-2" : step === 2 && changesObserved ? "bg-muted/50" : ""}`}
          >
            <CardHeader>
              <CardTitle className="text-base">
                Step 1: Changes Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Have we come across any instances of changes in circumstances,
                new information, or changes in auditor's understanding of the
                entity and its operations as a result of performing further
                audit procedures?
              </p>

              <RadioGroup
                value={changesObserved}
                onValueChange={handleStep1Response}
                disabled={step !== 1 && changesObserved !== ""}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Yes" id="changes-yes" />
                  <Label htmlFor="changes-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="No" id="changes-no" />
                  <Label htmlFor="changes-no">No</Label>
                </div>
              </RadioGroup>

              {changesObserved === "No" && (
                <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-green-800">
                  <span className="text-sm">
                    No revision required. Process completed - no changes
                    observed during audit procedures.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Question 2 */}
          <Card
            className={`${step === 2 ? "ring-primary ring-2" : step === 1 || !changesObserved ? "opacity-50" : ""}`}
          >
            <CardHeader>
              <CardTitle className="text-base">
                Step 2: Revision Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Does the materiality determined at planning stage need revision?
              </p>

              <RadioGroup
                value={revisionNeeded}
                onValueChange={handleStep2Response}
                disabled={step !== 2 || changesObserved !== "Yes"}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="Yes"
                    id="revision-yes"
                    disabled={changesObserved !== "Yes"}
                  />
                  <Label htmlFor="revision-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="No"
                    id="revision-no"
                    disabled={changesObserved !== "Yes"}
                  />
                  <Label htmlFor="revision-no">No</Label>
                </div>
              </RadioGroup>

              {revisionNeeded === "No" && (
                <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-green-800">
                  <span className="text-sm">
                    Change observed but no revision required. Process completed.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 3) {
    // Use editable calculated fields from planning if available, otherwise calculate
    const performanceMateriality =
      planningData.calculatedPerformanceMateriality > 0
        ? (revisionData.determinedMateriality /
            planningData.determinedMateriality) *
          planningData.calculatedPerformanceMateriality
        : (revisionData.determinedMateriality *
            planningData.performancePercentage) /
          100;

    const trivialThreshold =
      planningData.trivialThreshold > 0
        ? (revisionData.determinedMateriality /
            planningData.determinedMateriality) *
          planningData.trivialThreshold
        : (revisionData.determinedMateriality *
            planningData.trivialPercentage) /
          100;

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep(2)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <Button
            onClick={calculateRevisedMateriality}
            className="flex items-center gap-2"
          >
            <Calculator className="h-4 w-4" />
            Calculate Revised Materiality
          </Button>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Materiality Revision Form</h3>

          {/* Benchmarks from Planning Stage (Read-only) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Benchmarks from Planning Stage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {planningData.selectedBenchmarks.map(
                  (benchmark: string, index: number) => {
                    const planningBenchmark = planningData.benchmarkData.find(
                      (b: any) => b.benchmark === benchmark,
                    );
                    return (
                      <div
                        key={benchmark}
                        className="bg-muted flex items-center justify-between rounded p-2"
                      >
                        <span className="font-medium">{benchmark}</span>
                        <Badge variant="outline">
                          {planningBenchmark?.factor}%
                        </Badge>
                      </div>
                    );
                  },
                )}
              </div>
            </CardContent>
          </Card>

          {/* Revision Data Entry */}
          <div className="space-y-4">
            <h4 className="font-medium">Updated Financial Data</h4>
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
                  {revisionData.benchmarkData.map((item, index) => {
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
                              updateRevisionBenchmarkData(
                                index,
                                "amount",
                                Number.parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-24"
                            placeholder="Enter new amount"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.adjustments || ""}
                            onChange={(e) =>
                              updateRevisionBenchmarkData(
                                index,
                                "adjustments",
                                Number.parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-24"
                            placeholder="Enter adjustments"
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {normalizedAmount.toLocaleString()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.factor}%</Badge>
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
          </div>

          {/* Calculated Values */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Revised Materiality</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className="px-4 py-2 text-lg">
                  {revisionData.determinedMateriality.toLocaleString()}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  Performance Materiality
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="px-4 py-2 text-lg">
                  {performanceMateriality.toLocaleString()}
                </Badge>
                <p className="text-muted-foreground mt-1 text-xs">
                  {planningData.performancePercentage}% of materiality
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  Clearly Trivial Threshold
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="px-4 py-2 text-lg">
                  {trivialThreshold.toLocaleString()}
                </Badge>
                <p className="text-muted-foreground mt-1 text-xs">
                  {planningData.trivialPercentage}% of materiality
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Comparison */}
          {revisionData.determinedMateriality > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Materiality Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm">
                      Planning Stage
                    </Label>
                    <div className="text-lg font-semibold">
                      {planningData.determinedMateriality.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">
                      Revised
                    </Label>
                    <div className="text-lg font-semibold">
                      {revisionData.determinedMateriality.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <Label className="text-muted-foreground text-sm">
                    Change
                  </Label>
                  <div
                    className={`text-lg font-semibold ${
                      revisionData.determinedMateriality >
                      planningData.determinedMateriality
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {revisionData.determinedMateriality >
                    planningData.determinedMateriality
                      ? "+"
                      : ""}
                    {(
                      revisionData.determinedMateriality -
                      planningData.determinedMateriality
                    ).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Justification */}
          <div className="space-y-2">
            <Label htmlFor="justification">Justification for Revision</Label>
            <Textarea
              id="justification"
              placeholder="Provide justification for the materiality revision..."
              value={revisionData.justification}
              onChange={(e) =>
                setRevisionData((prev) => ({
                  ...prev,
                  justification: e.target.value,
                }))
              }
              className="min-h-[100px]"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={saveRevision} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Revision
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
