import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import {
  ArrowDown,
  ArrowUp,
  Building2,
  DollarSign,
  Package,
  TrendingUp,
} from "lucide-react";
import {
  processTextronData,
  getTopLedgersByType,
  formatCurrency,
  getFinancialSummary,
  getCompanyName,
  calculateDebitCreditMetrics,
} from "../lib/textron-data-processor";
import React from "react";

export function OverviewSection() {
  // Get processed data from Textron mapping
  const companyName = getCompanyName();
  const metrics = processTextronData();
  const debitCreditMetrics = calculateDebitCreditMetrics();
  const topAssets = getTopLedgersByType("Asset", 5);
  const topLiabilities = getTopLedgersByType("Liability", 5);
  const topRevenue = getTopLedgersByType("Income", 5);
  const financialSummary = getFinancialSummary();

  const overviewMetrics = [
    {
      title: "Total Debits",
      value: formatCurrency(debitCreditMetrics.totalDebits),
      change: "+2.5%",
      trend: "up",
      icon: Building2,
      description: "All debit entries combined",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(metrics.totalRevenue),
      change: "+15.8%",
      trend: "up",
      icon: TrendingUp,
      description: "Revenue generated",
    },
    {
      title: "Net Position",
      value: formatCurrency(debitCreditMetrics.netPosition),
      change: debitCreditMetrics.netPosition >= 0 ? "+12.3%" : "-8.7%",
      trend: debitCreditMetrics.netPosition >= 0 ? "up" : "down",
      icon: DollarSign,
      description: "Debits minus Credits",
    },
    {
      title: "Working Capital",
      value: formatCurrency(metrics.workingCapital),
      change: metrics.workingCapital >= 0 ? "+5.2%" : "-3.1%",
      trend: metrics.workingCapital >= 0 ? "up" : "down",
      icon: Package,
      description: "Liquidity position",
    },
  ];

  // Calculate financial health indicators
  const currentRatio =
    metrics.currentLiabilities > 0
      ? metrics.currentAssets / metrics.currentLiabilities
      : 0;
  const debtToAssetRatio =
    metrics.totalAssets > 0
      ? metrics.totalLiabilities / metrics.totalAssets
      : 0;
  const profitMarginStatus =
    metrics.profitMargin > 15
      ? "Good"
      : metrics.profitMargin > 5
        ? "Moderate"
        : "Poor";

  return (
    <div className="space-y-6 text-white">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Financial Overview
        </h2>
        <p className="text-white/60">
          Key financial metrics and performance indicators for {companyName}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {overviewMetrics.map((metric, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-white/50" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center space-x-2 text-xs text-white/60">
                <Badge
                  variant={metric.trend === "up" ? "default" : "destructive"}
                  className="flex items-center gap-1 border-white/10"
                >
                  {metric.trend === "up" ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  {metric.change}
                </Badge>
                <span>{metric.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Financial Health Score</CardTitle>
            <CardDescription>
              Overall assessment based on key ratios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Ratio</span>
                <Badge
                  variant={
                    currentRatio >= 2
                      ? "default"
                      : currentRatio >= 1
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {currentRatio >= 2
                    ? "Good"
                    : currentRatio >= 1
                      ? "Fair"
                      : "Poor"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Debt-to-Asset Ratio</span>
                <Badge
                  variant={
                    debtToAssetRatio <= 0.5
                      ? "default"
                      : debtToAssetRatio <= 0.8
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {debtToAssetRatio <= 0.5
                    ? "Good"
                    : debtToAssetRatio <= 0.8
                      ? "Moderate"
                      : "High"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Profit Margin</span>
                <Badge
                  variant={
                    profitMarginStatus === "Good"
                      ? "default"
                      : profitMarginStatus === "Moderate"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {profitMarginStatus}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Financial Highlights</CardTitle>
            <CardDescription>
              Important financial metrics from Textron data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Total Credits</span>
                <span className="font-medium">
                  {formatCurrency(debitCreditMetrics.totalCredits)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Credit Entries</span>
                <span className="font-medium">
                  {debitCreditMetrics.totalCreditEntries.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Debit Entries</span>
                <span className="font-medium">
                  {debitCreditMetrics.totalDebitEntries.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Net Position</span>
                <span
                  className={`font-medium ${debitCreditMetrics.netPosition >= 0 ? "text-emerald-400" : "text-red-400"}`}
                >
                  {formatCurrency(debitCreditMetrics.netPosition)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Assets</CardTitle>
            <CardDescription>Largest asset accounts by value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topAssets.slice(0, 5).map((asset, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {asset["Ledger Name"]}
                    </p>
                    <p className="text-xs text-white/60">
                      {asset["FS Sub Line"]}
                    </p>
                  </div>
                  <span className="ml-2 text-sm font-semibold">
                    {formatCurrency(asset["Closing Balance"])}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Revenue Sources</CardTitle>
            <CardDescription>Largest income accounts by value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topRevenue.slice(0, 5).map((revenue, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {revenue["Ledger Name"]}
                    </p>
                    <p className="text-xs text-white/60">
                      {revenue["FS Sub Line"]}
                    </p>
                  </div>
                  <span className="ml-2 text-sm font-semibold text-emerald-400">
                    {formatCurrency(revenue["Closing Balance"])}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
