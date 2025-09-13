"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { CheckCircle, AlertTriangle, Info } from "lucide-react";

interface PARData {
  par: string;
  closing_balance: number;
  opening_balance: number;
  variance: number;
  variance_percentage: number;
  exceeds_materiality: boolean;
  considered_significant: "Significant" | "Not Significant" | "";
}

interface PreliminaryAnalyticalSummaryProps {
  data: PARData[];
  materiality?: {
    group_materiality?: number;
    performance_materiality?: number;
    clearly_trivial_threshold?: number;
  };
}

export function PreliminaryAnalyticalSummary({
  data = [],
  materiality = {},
}: PreliminaryAnalyticalSummaryProps) {
  const stats = {
    totalItems: data.length,
    exceedingMateriality: data.filter((item) => item.exceeds_materiality)
      .length,
    markedSignificant: data.filter(
      (item) => item.considered_significant === "Significant",
    ).length,
    requiresInvestigation: data.filter(
      (item) =>
        item.exceeds_materiality ||
        Math.abs(item.variance_percentage) > 25 ||
        item.considered_significant === "Significant",
    ).length,
    highVariance: data.filter((item) => Math.abs(item.variance_percentage) > 50)
      .length,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCompletionStatus = () => {
    const completedItems = data.filter(
      (item) => item.considered_significant !== "",
    ).length;
    const completionRate =
      data.length > 0 ? (completedItems / data.length) * 100 : 0;

    if (completionRate === 100) {
      return { status: "Complete", color: "text-green-400", icon: CheckCircle };
    } else if (completionRate > 0) {
      return {
        status: "In Progress",
        color: "text-yellow-400",
        icon: AlertTriangle,
      };
    } else {
      return { status: "Not Started", color: "text-red-400", icon: Info };
    }
  };

  const completion = getCompletionStatus();
  const StatusIcon = completion.icon;

  return (
    <div className="space-y-4">
      {/* Header Summary */}
      <Card className="border-white/10 bg-black/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">
              Preliminary Analytical Procedures Summary
            </CardTitle>
            <div className="flex items-center gap-2">
              <StatusIcon className={`h-5 w-5 ${completion.color}`} />
              <span className={`text-sm font-medium ${completion.color}`}>
                {completion.status}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="mb-1 text-white/70">Total Items</div>
              <div className="text-lg font-semibold text-white">
                {stats.totalItems}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="mb-1 text-white/70">Exceeding Materiality</div>
              <div className="text-lg font-semibold text-red-300">
                {stats.exceedingMateriality}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="mb-1 text-white/70">Marked Significant</div>
              <div className="text-lg font-semibold text-yellow-300">
                {stats.markedSignificant}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="mb-1 text-white/70">Require Investigation</div>
              <div className="text-lg font-semibold text-orange-300">
                {stats.requiresInvestigation}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Materiality Thresholds */}
      {(materiality.group_materiality ||
        materiality.performance_materiality) && (
        <Card className="border-white/10 bg-black/20">
          <CardHeader>
            <CardTitle className="text-lg text-white">
              Materiality Thresholds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
              {materiality.group_materiality && (
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="mb-1 text-white/70">Group Materiality</div>
                  <div className="font-semibold text-blue-300">
                    {formatCurrency(materiality.group_materiality)}
                  </div>
                </div>
              )}
              {materiality.performance_materiality && (
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="mb-1 text-white/70">
                    Performance Materiality
                  </div>
                  <div className="font-semibold text-green-300">
                    {formatCurrency(materiality.performance_materiality)}
                  </div>
                </div>
              )}
              {materiality.clearly_trivial_threshold && (
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="mb-1 text-white/70">Clearly Trivial</div>
                  <div className="font-semibold text-gray-300">
                    {formatCurrency(materiality.clearly_trivial_threshold)}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items Requiring Attention */}
      {stats.requiresInvestigation > 0 && (
        <Card className="border-white/10 bg-black/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              Items Requiring Attention ({stats.requiresInvestigation})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data
                .filter(
                  (item) =>
                    item.exceeds_materiality ||
                    Math.abs(item.variance_percentage) > 25 ||
                    item.considered_significant === "Significant",
                )
                .slice(0, 10) // Show top 10
                .map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-3"
                  >
                    <div>
                      <div className="font-medium text-white">{item.par}</div>
                      <div className="text-sm text-white/60">
                        Variance: {formatCurrency(item.variance)} (
                        {item.variance_percentage.toFixed(2)}%)
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {item.exceeds_materiality && (
                        <Badge
                          variant="destructive"
                          className="border-red-500/30 bg-red-500/20 text-red-300"
                        >
                          Exceeds Materiality
                        </Badge>
                      )}
                      {Math.abs(item.variance_percentage) > 50 && (
                        <Badge
                          variant="secondary"
                          className="border-yellow-500/30 bg-yellow-500/20 text-yellow-300"
                        >
                          High Variance
                        </Badge>
                      )}
                      {item.considered_significant === "Significant" && (
                        <Badge
                          variant="outline"
                          className="border-orange-500/30 bg-orange-500/20 text-orange-300"
                        >
                          Significant
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion Progress */}
      <Card className="border-white/10 bg-black/20">
        <CardHeader>
          <CardTitle className="text-lg text-white">
            Analysis Completion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-white/70">
                Significance Assessment Complete
              </span>
              <span className="text-white">
                {
                  data.filter((item) => item.considered_significant !== "")
                    .length
                }{" "}
                / {data.length}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                style={{
                  width: `${data.length > 0 ? (data.filter((item) => item.considered_significant !== "").length / data.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
