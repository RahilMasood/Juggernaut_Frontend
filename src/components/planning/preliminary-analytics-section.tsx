"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { PreliminaryAnalyticalTable } from "./preliminary-analytical-table";
import { PreliminaryAnalyticalSummary } from "./preliminary-analytical-summary";
import { FilteredAnalyticalTable } from "./filtered-analytical-table";
import {
  BarChart3,
  RefreshCw,
  FileText,
  TrendingUp,
  Calculator,
  AlertTriangle,
  Building2,
  DollarSign,
} from "lucide-react";
import { getCompanyName } from "@/lib/textron-data-processor";

interface PARData {
  par: string;
  closing_balance: number;
  opening_balance: number;
  variance: number;
  variance_percentage: number;
  exceeds_materiality: boolean;
  considered_significant: "Significant" | "Not Significant" | "";
  note_line?: string;
  type?: string;
}

interface MaterialityThresholds {
  group_materiality?: number;
  performance_materiality?: number;
  clearly_trivial_threshold?: number;
}

export function PreliminaryAnalyticsSection() {
  const companyName = getCompanyName();
  const [analyticalData, setAnalyticalData] = useState<PARData[]>([]);
  const [materiality, setMateriality] = useState<MaterialityThresholds>({});
  const [activeTab, setActiveTab] = useState("procedures");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  // Load existing analytical data
  useEffect(() => {
    const loadAnalyticalData = async () => {
      try {
        const data = await window.planning.readSection(
          companyName,
          "preliminary-analytical",
        );
        if (data && data.analyticalData) {
          setAnalyticalData(data.analyticalData);
        }
      } catch (error) {
        console.warn("Failed to load preliminary analytical data:", error);
      }
    };

    loadAnalyticalData();
  }, [companyName]);

  // Load materiality data
  useEffect(() => {
    const loadMaterialityData = async () => {
      try {
        const materialityData = await window.planning.readSection(
          companyName,
          "materiality",
        );

        const groupMateriality = materialityData?.[
          "Group materiality at planning stage"
        ]?.find((item: any) => item.id === "M-3")?.answer;

        const performanceMaterialityPercent = materialityData?.[
          "Group materiality at planning stage"
        ]?.find((item: any) => item.id === "M-5")?.answer;

        const clearlyTrivialPercent = materialityData?.[
          "Group materiality at planning stage"
        ]?.find((item: any) => item.id === "M-7")?.answer;

        const performanceMateriality =
          groupMateriality && performanceMaterialityPercent
            ? (parseFloat(groupMateriality) *
                parseFloat(performanceMaterialityPercent)) /
              100
            : undefined;

        const clearlyTrivialThreshold =
          groupMateriality && clearlyTrivialPercent
            ? (parseFloat(groupMateriality) *
                parseFloat(clearlyTrivialPercent)) /
              100
            : undefined;

        setMateriality({
          group_materiality: groupMateriality
            ? parseFloat(groupMateriality)
            : undefined,
          performance_materiality: performanceMateriality,
          clearly_trivial_threshold: clearlyTrivialThreshold,
        });
      } catch (error) {
        console.warn("Failed to load materiality data:", error);
      }
    };

    loadMaterialityData();
  }, [companyName]);

  // Save analytical data
  const saveAnalyticalData = async (data: PARData[]) => {
    try {
      await window.planning.saveSection(companyName, "preliminary-analytical", {
        analyticalData: data,
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error("Failed to save preliminary analytical data:", error);
    }
  };

  const handleAnalyticalDataChange = (data: PARData[]) => {
    setAnalyticalData(data);
    saveAnalyticalData(data);
  };

  const calculateStats = () => {
    const totalItems = analyticalData.length;
    const significantItems = analyticalData.filter(
      (item) => item.considered_significant === "Significant",
    ).length;
    const materialItems = analyticalData.filter(
      (item) => item.exceeds_materiality,
    ).length;
    const totalVariance = analyticalData.reduce(
      (sum, item) => sum + Math.abs(item.variance),
      0,
    );

    // Balance Sheet stats
    const balanceSheetItems = analyticalData.filter((item) =>
      ["Asset", "Liability"].includes(item.type || ""),
    );
    const bsSignificantItems = balanceSheetItems.filter(
      (item) => item.considered_significant === "Significant",
    ).length;

    // P&L stats
    const profitLossItems = analyticalData.filter((item) =>
      ["Income", "Expense"].includes(item.type || ""),
    );
    const plSignificantItems = profitLossItems.filter(
      (item) => item.considered_significant === "Significant",
    ).length;

    return {
      totalItems,
      significantItems,
      materialItems,
      totalVariance,
      balanceSheetItems: balanceSheetItems.length,
      bsSignificantItems,
      profitLossItems: profitLossItems.length,
      plSignificantItems,
    };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Preliminary Analytical Procedures
          </h2>
          <p className="text-white/70">
            Analytical procedures and variance analysis for {companyName}
          </p>
        </div>
        {lastSaved && (
          <Badge className="bg-emerald-500/15 text-emerald-300">
            Saved {lastSaved.toLocaleTimeString()}
          </Badge>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
        <Card className="border-white/10 bg-black/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-white/80">
              <BarChart3 className="h-4 w-4" />
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.totalItems}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-black/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-white/80">
              <AlertTriangle className="h-4 w-4" />
              Significant Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-300">
              {stats.significantItems}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-black/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-white/80">
              <Calculator className="h-4 w-4" />
              Material Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-300">
              {stats.materialItems}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-black/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-white/80">
              <Building2 className="h-4 w-4" />
              Balance Sheet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-blue-300">
              {stats.balanceSheetItems}
            </div>
            <div className="text-xs text-white/60">
              {stats.bsSignificantItems} significant
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-black/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-white/80">
              <DollarSign className="h-4 w-4" />
              Profit & Loss
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-300">
              {stats.profitLossItems}
            </div>
            <div className="text-xs text-white/60">
              {stats.plSignificantItems} significant
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-black/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-white/80">
              <TrendingUp className="h-4 w-4" />
              Total Variance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-purple-300">
              {new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                notation: "compact",
              }).format(stats.totalVariance)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Card className="border-white/10 bg-black/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="h-5 w-5" />
            Preliminary Analytical Procedures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="procedures">
                <BarChart3 className="mr-2 h-4 w-4" />
                Procedures
              </TabsTrigger>
              <TabsTrigger value="summary">
                <FileText className="mr-2 h-4 w-4" />
                Summary
              </TabsTrigger>
              <TabsTrigger value="documentation">
                <FileText className="mr-2 h-4 w-4" />
                Documentation
              </TabsTrigger>
            </TabsList>

            <TabsContent value="procedures" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">
                    Analytical Procedures Table
                  </h3>
                  <Button
                    onClick={() => {
                      // This will trigger the refresh in the table component
                      setLoading(true);
                      setTimeout(() => setLoading(false), 1000);
                    }}
                    disabled={loading}
                    size="sm"
                    variant="outline"
                    className="border-white/10 text-white/80 hover:bg-white/10"
                  >
                    <RefreshCw
                      className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    />
                    {loading ? "Loading..." : "Refresh All Data"}
                  </Button>
                </div>

                <PreliminaryAnalyticalTable
                  value={analyticalData}
                  onChange={handleAnalyticalDataChange}
                  readonly={false}
                />

                {/* Balance Sheet Table */}
                <div className="mt-8">
                  <FilteredAnalyticalTable
                    title="Balance Sheet Items"
                    data={analyticalData}
                    materiality={materiality}
                    onChange={handleAnalyticalDataChange}
                    readonly={false}
                    filterTypes={["Asset", "Liability"]}
                    icon={<Building2 className="h-5 w-5" />}
                  />
                </div>

                {/* Profit & Loss Table */}
                <div className="mt-8">
                  <FilteredAnalyticalTable
                    title="Profit & Loss Items"
                    data={analyticalData}
                    materiality={materiality}
                    onChange={handleAnalyticalDataChange}
                    readonly={false}
                    filterTypes={["Income", "Expense"]}
                    icon={<DollarSign className="h-5 w-5" />}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="summary" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">
                  Analytical Procedures Summary
                </h3>
                <PreliminaryAnalyticalSummary
                  data={analyticalData}
                  materiality={materiality}
                />
              </div>
            </TabsContent>

            <TabsContent value="documentation" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">
                  Documentation & Findings
                </h3>
                <div className="rounded-lg border border-white/10 bg-black/10 p-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="mb-2 font-medium text-white">
                        Key Findings
                      </h4>
                      <textarea
                        className="min-h-32 w-full rounded-md border border-white/10 bg-black/40 p-3 text-white placeholder-white/50"
                        placeholder="Document key findings from preliminary analytical procedures..."
                      />
                    </div>
                    <div>
                      <h4 className="mb-2 font-medium text-white">
                        Areas Requiring Further Investigation
                      </h4>
                      <textarea
                        className="min-h-32 w-full rounded-md border border-white/10 bg-black/40 p-3 text-white placeholder-white/50"
                        placeholder="Identify areas that require additional audit procedures..."
                      />
                    </div>
                    <div>
                      <h4 className="mb-2 font-medium text-white">
                        Management Explanations
                      </h4>
                      <textarea
                        className="min-h-32 w-full rounded-md border border-white/10 bg-black/40 p-3 text-white placeholder-white/50"
                        placeholder="Document management explanations for significant variances..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
