"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { MaterialityPlanning } from "./materiality-planning";
import { MaterialityRevision } from "./materiality-revision";
import { AbcotdMateriality } from "./abcotd-materiality";
import { ComponentMateriality } from "./component-materiality";
import { DocumentationMateriality } from "./documentation-materiality";
import { Calculator } from "lucide-react";
import { getCompanyName } from "@/lib/textron-data-processor";
import { useMaterialityData } from "./hooks/useMaterialityData";
import { MaterialitySummary } from "./components/MaterialitySummary";
import { MaterialityTabNavigation } from "./components/MaterialityTabNavigation";

/**
 * Main MaterialitySection component that manages the materiality assessment workflow.
 * This component handles the overall state and coordination between different materiality tabs.
 */
export function MaterialitySection() {
  const companyName = getCompanyName();
  const {
    planningData,
    abcotdData,
    componentData,
    documentationData,
    activeTab,
    lastSaved,
    crossSectionAnswers,
    handlePlanningDataChange,
    handleRevisionComplete,
    handleAbcotdDataChange,
    handleComponentDataChange,
    handleDocumentationDataChange,
    setActiveTab,
    isPlanningComplete,
  } = useMaterialityData(companyName);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Calculator className="h-6 w-6" />
            Materiality Assessment
          </h2>
          <p className="text-muted-foreground">
            Determine and manage materiality thresholds for audit planning and
            execution
          </p>
        </div>
        {lastSaved && (
          <Badge variant="outline" className="border-green-600 text-green-600">
            Last saved: {lastSaved.toLocaleTimeString()}
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Materiality Workflow</span>
            <div className="flex items-center gap-2">
              {isPlanningComplete && (
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800"
                >
                  Planning Complete
                </Badge>
              )}
              <Badge variant="secondary">
                {activeTab === "planning" ? "Planning Stage" : "Revision Stage"}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <MaterialityTabNavigation isPlanningComplete={isPlanningComplete} />

            <TabsContent value="planning" className="mt-6">
              <MaterialityPlanning
                onDataChange={handlePlanningDataChange}
                initialData={planningData}
                crossSectionAnswers={crossSectionAnswers}
              />
            </TabsContent>

            <TabsContent value="abcotd" className="mt-6">
              <AbcotdMateriality
                onDataChange={handleAbcotdDataChange}
                initialData={abcotdData}
                crossSectionAnswers={crossSectionAnswers}
              />
            </TabsContent>

            <TabsContent value="component" className="mt-6">
              <ComponentMateriality
                onDataChange={handleComponentDataChange}
                initialData={componentData}
                crossSectionAnswers={crossSectionAnswers}
              />
            </TabsContent>

            <TabsContent value="documentation" className="mt-6">
              <DocumentationMateriality
                onDataChange={handleDocumentationDataChange}
                initialData={documentationData}
                crossSectionAnswers={crossSectionAnswers}
              />
            </TabsContent>

            <TabsContent value="revision" className="mt-6">
              <MaterialityRevision
                planningData={planningData}
                onRevisionComplete={handleRevisionComplete}
                crossSectionAnswers={crossSectionAnswers}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Summary Card */}
      {isPlanningComplete && (
        <MaterialitySummary
          planningData={planningData}
          abcotdData={abcotdData}
          componentData={componentData}
        />
      )}
    </div>
  );
}
