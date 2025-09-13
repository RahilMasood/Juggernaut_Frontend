"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
  Calculator,
  Building,
  Shield,
  FileCheck,
  BarChart3,
  FileText,
} from "lucide-react";
import { getCompanyName } from "@/lib/textron-data-processor";

interface WorkflowStatus {
  id: string;
  title: string;
  description: string;
  progress: number;
  status: "not-started" | "in-progress" | "completed";
  questionsAnswered: number;
  totalQuestions: number;
  icon: React.ComponentType<any>;
}

interface PlanningDashboardProps {
  onNavigateToWorkflow: (workflowId: string) => void;
}

export function PlanningDashboard({
  onNavigateToWorkflow,
}: PlanningDashboardProps) {
  const companyName = getCompanyName();
  const [workflowData, setWorkflowData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // Load all planning data
  useEffect(() => {
    const loadPlanningData = async () => {
      try {
        setLoading(true);
        const sections = [
          "materiality",
          "understanding-entity",
          "engagement-acceptance",
          "fraud-risk",
          "it-risk",
          "preliminary-analytical",
        ];

        const data: Record<string, any> = {};
        for (const section of sections) {
          try {
            const sectionData = await (window as any).planning.readSection(
              companyName,
              section,
            );
            data[section] = sectionData;
          } catch (error) {
            console.warn(`Failed to load ${section}:`, error);
            data[section] = null;
          }
        }
        setWorkflowData(data);
      } finally {
        setLoading(false);
      }
    };

    loadPlanningData();
  }, [companyName]);

  // Calculate progress for each workflow
  const calculateProgress = useCallback(
    (data: any, estimatedQuestions: number) => {
      if (!data) return { progress: 0, answered: 0 };

      const flattenQuestions = (obj: any): any[] => {
        const questions: any[] = [];

        const traverse = (item: any) => {
          if (Array.isArray(item)) {
            item.forEach(traverse);
          } else if (item && typeof item === "object") {
            if (item.id && item.question !== undefined) {
              questions.push(item);
            }
            if (item.questions) {
              traverse(item.questions);
            }
            Object.values(item).forEach((value) => {
              if (Array.isArray(value)) {
                traverse(value);
              }
            });
          }
        };

        traverse(data);
        return questions;
      };

      const questions = flattenQuestions(data);
      const answered = questions.filter(
        (q) =>
          q.answer !== null &&
          q.answer !== undefined &&
          q.answer !== "" &&
          !(Array.isArray(q.answer) && q.answer.length === 0),
      ).length;

      const total = Math.max(questions.length, estimatedQuestions);

      return {
        progress: total > 0 ? (answered / total) * 100 : 0,
        answered,
      };
    },
    [],
  );

  const workflows: WorkflowStatus[] = useMemo(
    () => [
      {
        id: "materiality",
        title: "Materiality Planning",
        description: "Initial materiality benchmarks and calculations",
        icon: Calculator,
        ...(() => {
          const calc = calculateProgress(workflowData.materiality, 8);
          return {
            progress: calc.progress,
            questionsAnswered: calc.answered,
            totalQuestions: 8,
            status:
              calc.progress === 0
                ? "not-started"
                : calc.progress === 100
                  ? "completed"
                  : "in-progress",
          };
        })(),
      },
      {
        id: "understanding-entity",
        title: "Understanding Entity",
        description: "Entity environment and internal controls assessment",
        icon: Building,
        ...(() => {
          const calc = calculateProgress(
            workflowData["understanding-entity"],
            42,
          );
          return {
            progress: calc.progress,
            questionsAnswered: calc.answered,
            totalQuestions: 42,
            status:
              calc.progress === 0
                ? "not-started"
                : calc.progress === 100
                  ? "completed"
                  : "in-progress",
          };
        })(),
      },
      {
        id: "engagement-acceptance",
        title: "Engagement Acceptance",
        description: "Engagement profiling and acceptance procedures",
        icon: FileCheck,
        ...(() => {
          const calc = calculateProgress(
            workflowData["engagement-acceptance"],
            17,
          );
          return {
            progress: calc.progress,
            questionsAnswered: calc.answered,
            totalQuestions: 17,
            status:
              calc.progress === 0
                ? "not-started"
                : calc.progress === 100
                  ? "completed"
                  : "in-progress",
          };
        })(),
      },
      {
        id: "fraud-risk",
        title: "Fraud Risk Assessment",
        description: "Fraud risk identification and response procedures",
        icon: Shield,
        ...(() => {
          const calc = calculateProgress(workflowData["fraud-risk"], 15);
          return {
            progress: calc.progress,
            questionsAnswered: calc.answered,
            totalQuestions: 15,
            status:
              calc.progress === 0
                ? "not-started"
                : calc.progress === 100
                  ? "completed"
                  : "in-progress",
          };
        })(),
      },
      {
        id: "it-risk",
        title: "IT Risk Assessment",
        description: "Information technology risk evaluation",
        icon: Shield,
        ...(() => {
          const calc = calculateProgress(workflowData["it-risk"], 2);
          return {
            progress: calc.progress,
            questionsAnswered: calc.answered,
            totalQuestions: 2,
            status:
              calc.progress === 0
                ? "not-started"
                : calc.progress === 100
                  ? "completed"
                  : "in-progress",
          };
        })(),
      },
      {
        id: "preliminary-analytical",
        title: "Preliminary Analytics",
        description: "Analytical procedures and variance analysis",
        icon: BarChart3,
        ...(() => {
          const calc = calculateProgress(
            workflowData["preliminary-analytical"],
            1,
          );
          return {
            progress: calc.progress,
            questionsAnswered: calc.answered,
            totalQuestions: 1,
            status:
              calc.progress === 0
                ? "not-started"
                : calc.progress === 100
                  ? "completed"
                  : "in-progress",
          };
        })(),
      },
    ],
    [workflowData, calculateProgress],
  );

  const overallProgress =
    workflows.reduce((sum, workflow) => sum + workflow.progress, 0) /
    workflows.length;
  const completedWorkflows = workflows.filter(
    (w) => w.status === "completed",
  ).length;
  const inProgressWorkflows = workflows.filter(
    (w) => w.status === "in-progress",
  ).length;

  const getStatusIcon = (status: WorkflowStatus["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "in-progress":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: WorkflowStatus["status"]) => {
    switch (status) {
      case "completed":
        return (
          <Badge
            variant="default"
            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
          >
            Completed
          </Badge>
        );
      case "in-progress":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
          >
            In Progress
          </Badge>
        );
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
          <p className="text-muted-foreground">Loading planning workflows...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Audit Planning Dashboard</h1>
        <p className="text-muted-foreground">
          Complete audit workflow management from planning through execution for{" "}
          {companyName}
        </p>
      </div>

      {/* Overall Progress Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={overallProgress} className="w-full" />
              <p className="text-muted-foreground text-sm">
                {Math.round(overallProgress)}% Complete
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Workflow Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">{completedWorkflows} Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">
                  {inProgressWorkflows} In Progress
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Circle className="h-4 w-4 text-gray-400" />
                <span className="text-sm">
                  {workflows.length - completedWorkflows - inProgressWorkflows}{" "}
                  Not Started
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {inProgressWorkflows > 0 ? (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">
                    Continue in-progress workflows
                  </span>
                </div>
              ) : completedWorkflows === workflows.length ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">All workflows completed!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Circle className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    Start with Materiality Planning
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Individual Workflow Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {workflows.map((workflow) => {
          const IconComponent = workflow.icon;
          return (
            <Card
              key={workflow.id}
              className="transition-shadow hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(workflow.status)}
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-base">
                      {workflow.title}
                    </CardTitle>
                  </div>
                  {getStatusBadge(workflow.status)}
                </div>
                <CardDescription className="text-sm">
                  {workflow.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>
                      {workflow.questionsAnswered}/{workflow.totalQuestions}
                    </span>
                  </div>
                  <Progress value={workflow.progress} className="w-full" />
                  <p className="text-muted-foreground text-xs">
                    {Math.round(workflow.progress)}% complete
                  </p>
                </div>
                <Button
                  onClick={() => onNavigateToWorkflow(workflow.id)}
                  variant={
                    workflow.status === "not-started" ? "default" : "outline"
                  }
                  size="sm"
                  className="w-full"
                >
                  {workflow.status === "not-started"
                    ? "Start"
                    : workflow.status === "completed"
                      ? "Review"
                      : "Continue"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Common planning tasks and utilities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Button
              variant="outline"
              className="h-auto justify-start p-4"
              onClick={() => onNavigateToWorkflow("materiality")}
            >
              <div className="text-left">
                <div className="font-medium">Start with Materiality</div>
                <div className="text-muted-foreground text-sm">
                  Begin the planning process
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto justify-start p-4"
              onClick={() => onNavigateToWorkflow("documents")}
            >
              <div className="text-left">
                <div className="font-medium">View All Documents</div>
                <div className="text-muted-foreground text-sm">
                  Access uploaded files
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
