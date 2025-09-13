"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { PlanningDashboard } from "./planning-dashboard";
import { PlanningSection } from "./planning-section";

type SectionKey =
  | "engagement-acceptance"
  | "fraud-risk"
  | "it-risk"
  | "materiality"
  | "preliminary-analytical"
  | "understanding-entity";
import { MaterialitySection } from "./materiality-section";
import { PreliminaryAnalyticsSection } from "./preliminary-analytics-section";
import {
  Calculator,
  Building,
  Shield,
  FileCheck,
  BarChart3,
  Home,
  ArrowLeft,
} from "lucide-react";
import { Button } from "../ui/button";

interface WorkflowTab {
  id: string;
  title: string;
  icon: React.ComponentType<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  sectionKey: SectionKey;
  sectionTitle: string;
}

const workflowTabs: WorkflowTab[] = [
  {
    id: "materiality",
    title: "Materiality",
    icon: Calculator,
    sectionKey: "materiality",
    sectionTitle: "Materiality",
  },
  {
    id: "understanding-entity",
    title: "Entity",
    icon: Building,
    sectionKey: "understanding-entity",
    sectionTitle: "Understanding the Entity and its Environment",
  },
  {
    id: "engagement-acceptance",
    title: "Engagement",
    icon: FileCheck,
    sectionKey: "engagement-acceptance",
    sectionTitle: "Engagement Acceptance & Continuance",
  },
  {
    id: "fraud-risk",
    title: "Fraud Risk",
    icon: Shield,
    sectionKey: "fraud-risk",
    sectionTitle: "Fraud Risk Assessment & Response",
  },
  {
    id: "it-risk",
    title: "IT Risk",
    icon: Shield,
    sectionKey: "it-risk",
    sectionTitle: "IT Risk Assessment",
  },
  {
    id: "preliminary-analytical",
    title: "Analytics",
    icon: BarChart3,
    sectionKey: "preliminary-analytical",
    sectionTitle: "Preliminary Analytical Procedures",
  },
];

interface PlanningWorkflowProps {
  initialTab?: string;
}

export function PlanningWorkflow({ initialTab }: PlanningWorkflowProps) {
  // Determine initial tab based on URL or passed prop
  const getInitialTab = () => {
    if (initialTab && workflowTabs.find((tab) => tab.id === initialTab)) {
      return initialTab;
    }
    // Check if we're coming from a specific planning section via URL or state
    const currentSection =
      window.location.hash.replace("#", "") ||
      (typeof window !== "undefined" && (window as any).currentPlanningSection); // eslint-disable-line @typescript-eslint/no-explicit-any

    if (
      currentSection &&
      workflowTabs.find((tab) => tab.id === currentSection)
    ) {
      return currentSection;
    }

    return "dashboard";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  const handleNavigateToWorkflow = (workflowId: string) => {
    setActiveTab(workflowId);
  };

  const handleBackToDashboard = () => {
    setActiveTab("dashboard");
  };

  return (
    <div className="bg-background min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            {workflowTabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2"
                >
                  <IconComponent className="h-4 w-4" />
                  {tab.title}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <PlanningDashboard
              onNavigateToWorkflow={handleNavigateToWorkflow}
            />
          </TabsContent>

          {workflowTabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <TabsContent key={tab.id} value={tab.id} className="mt-6">
                <div className="space-y-4">
                  {/* Back to Dashboard */}
                  <Button
                    variant="outline"
                    onClick={handleBackToDashboard}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                  </Button>

                  {/* Section Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconComponent className="h-5 w-5" />
                        {tab.sectionTitle}
                      </CardTitle>
                      <CardDescription>
                        Complete the {tab.title.toLowerCase()} assessment as
                        part of the audit planning process
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {tab.id === "materiality" ? (
                        <MaterialitySection />
                      ) : tab.id === "preliminary-analytical" ? (
                        <PreliminaryAnalyticsSection />
                      ) : (
                        <PlanningSection
                          sectionKey={tab.sectionKey}
                          title={tab.sectionTitle}
                        />
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}
