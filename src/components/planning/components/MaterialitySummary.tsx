import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";

interface MaterialitySummaryProps {
  planningData: any;
  abcotdData: any;
  componentData: any;
}

/**
 * Summary component displaying key materiality metrics and additional materiality types.
 * Shows planning materiality, performance materiality, trivial threshold, and benchmarks used.
 */
export function MaterialitySummary({
  planningData,
  abcotdData,
  componentData,
}: MaterialitySummaryProps) {
  if (!planningData) return null;

  const performanceMateriality =
    planningData.calculatedPerformanceMateriality > 0
      ? planningData.calculatedPerformanceMateriality
      : (planningData.determinedMateriality *
          planningData.performancePercentage) /
        100;

  const trivialThreshold =
    planningData.trivialThreshold ||
    (planningData.determinedMateriality * planningData.trivialPercentage) / 100;

  const isCustomPerformanceMateriality =
    planningData.calculatedPerformanceMateriality > 0;

  const isCustomTrivialThreshold =
    planningData.trivialThreshold !==
    (planningData.determinedMateriality * planningData.trivialPercentage) / 100;

  const hasAdditionalMaterialityTypes =
    (abcotdData && abcotdData.abcotdRequired === "Yes") ||
    (componentData && componentData.componentMaterialityRequired);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Materiality Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm">
              Planning Materiality
            </p>
            <p className="text-2xl font-bold">
              {planningData.determinedMateriality.toLocaleString()}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm">
              Performance Materiality
            </p>
            <p className="text-2xl font-bold">
              {performanceMateriality.toLocaleString()}
            </p>
            <p className="text-muted-foreground text-xs">
              {isCustomPerformanceMateriality
                ? "Custom value"
                : `${planningData.performancePercentage}% of planning materiality`}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm">Trivial Threshold</p>
            <p className="text-2xl font-bold">
              {trivialThreshold.toLocaleString()}
            </p>
            <p className="text-muted-foreground text-xs">
              {isCustomTrivialThreshold
                ? "Custom value"
                : `${planningData.trivialPercentage}% of planning materiality`}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm">Benchmarks Used</p>
            <p className="text-2xl font-bold">
              {planningData.selectedBenchmarks?.length || 0}
            </p>
            <p className="text-muted-foreground text-xs">
              {planningData.selectedBenchmarks?.join(", ") || "None"}
            </p>
          </div>
        </div>

        {/* Additional Materiality Types */}
        {hasAdditionalMaterialityTypes && (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {abcotdData && abcotdData.abcotdRequired === "Yes" && (
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm">
                  ABCOTD Materiality
                </p>
                <p className="text-lg font-bold">
                  {(abcotdData.abcotdDetails || []).length} items
                </p>
                <p className="text-muted-foreground text-xs">
                  Account Balances, Classes, Disclosures
                </p>
              </div>
            )}

            {componentData && componentData.componentMaterialityRequired && (
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm">
                  Component Materiality
                </p>
                <p className="text-lg font-bold">
                  {(componentData.componentDetails || []).length} components
                </p>
                <p className="text-muted-foreground text-xs">
                  Group audit components
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
