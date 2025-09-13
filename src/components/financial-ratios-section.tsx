"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  CheckCircle,
  Calculator,
  TrendingUp,
  TrendingDown,
  Info,
} from "lucide-react";
import {
  getFinancialRatiosYoY,
  getMultiYearData,
  calculateFinancialRatios,
  formatRatioValue,
  formatCurrency,
  type FinancialRatio,
  type YearlyFinancialData,
} from "../lib/textron-data-processor";
import React from "react";

interface RatioCardProps {
  ratio: FinancialRatio;
  yoyData: { year: string; value: number | null }[];
  onLoad: () => void;
}

function RatioCard({ ratio, yoyData, onLoad }: RatioCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate loading time for each chart
    const timer = setTimeout(
      () => {
        setIsLoaded(true);
        onLoad();
      },
      Math.random() * 1000 + 500,
    ); // Random delay between 500-1500ms

    return () => clearTimeout(timer);
  }, [onLoad]);

  const chartData = yoyData.map((data) => ({
    year: data.year,
    value: data.value || 0,
    displayValue: data.value,
  }));

  const latestValue = yoyData[yoyData.length - 1]?.value;
  const previousValue = yoyData[yoyData.length - 2]?.value;
  const trend =
    latestValue && previousValue
      ? latestValue > previousValue
        ? "up"
        : "down"
      : null;

  const formatTooltipValue = (value: number | null) => {
    if (value === null) return "N/A";

    if (ratio.isPercentage) {
      return `${value.toFixed(2)}%`;
    } else if (ratio.isDays) {
      return `${Math.round(value)} days`;
    } else {
      return value.toFixed(2);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="rounded-lg border border-white/10 bg-black/70 p-4 text-white shadow-lg backdrop-blur-md">
          <p className="font-semibold">{`${ratio.name} - ${label}`}</p>
          <p className="mb-2 text-sm text-white/60">{ratio.formula}</p>
          <p className="text-lg font-bold text-[#4da3ff]">
            {formatTooltipValue(data.payload.displayValue)}
          </p>
          {ratio.underlying && (
            <div className="mt-2 text-xs text-white/60">
              <p>Numerator: {formatCurrency(ratio.underlying.numerator)}</p>
              <p>Denominator: {formatCurrency(ratio.underlying.denominator)}</p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{ratio.name}</CardTitle>
          {trend && (
            <Badge
              variant={trend === "up" ? "default" : "destructive"}
              className="border-white/10 text-xs"
            >
              {trend === "up" ? (
                <TrendingUp className="mr-1 h-3 w-3" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3" />
              )}
              {trend === "up" ? "Up" : "Down"}
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">
          {ratio.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">
              {formatRatioValue(ratio)}
            </span>
            <div className="flex items-center text-xs text-white/60">
              <Info className="mr-1 h-3 w-3" />
              {ratio.formula}
            </div>
          </div>

          <div className="h-48">
            {isLoaded ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis
                    dataKey="year"
                    fontSize={10}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    fontSize={10}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) =>
                      ratio.isPercentage
                        ? `${value}%`
                        : ratio.isDays
                          ? `${value}d`
                          : value.toFixed(1)
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#4da3ff" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[#4da3ff]"></div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FinancialRatiosSection() {
  const [loadedRatios, setLoadedRatios] = useState(0);
  const [allRatios, setAllRatios] = useState<FinancialRatio[]>([]);
  const [yoyData, setYoyData] = useState<{
    [key: string]: { year: string; value: number | null }[];
  }>({});

  useEffect(() => {
    // Get the latest year data and calculate ratios
    const multiYearData = getMultiYearData();
    const latestYearData = multiYearData[multiYearData.length - 1];
    const ratios = calculateFinancialRatios(latestYearData);

    // Get YoY data for all ratios
    const ratiosYoY = getFinancialRatiosYoY();

    setAllRatios(ratios);
    setYoyData(ratiosYoY);
  }, []);

  const handleRatioLoad = () => {
    setLoadedRatios((prev) => prev + 1);
  };

  const totalRatios = allRatios.length;
  const isAllLoaded = loadedRatios === totalRatios;

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">
              Financial Overview
            </h2>
            {isAllLoaded && (
              <CheckCircle className="h-6 w-6 text-emerald-400" />
            )}
          </div>
          <p className="text-white/60">
            Key financial ratios with year-over-year comparison
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-white/10 text-xs text-white/80"
          >
            {loadedRatios}/{totalRatios} Loaded
          </Badge>
          <Calculator className="h-5 w-5 text-white/60" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Ratios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRatios}</div>
            <p className="text-xs text-white/60">
              Financial performance indicators
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Years Compared
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-white/60">Years of historical data</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Liquidity Focus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-white/60">
              Current, Inventory, Debtor ratios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Efficiency Focus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-white/60">Turnover and cycle ratios</p>
          </CardContent>
        </Card>
      </div>

      {/* Ratios Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {allRatios.map((ratio, index) => (
          <RatioCard
            key={ratio.name}
            ratio={ratio}
            yoyData={yoyData[ratio.name] || []}
            onLoad={handleRatioLoad}
          />
        ))}
      </div>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ratio Interpretation Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-semibold">Liquidity Ratios</h4>
              <ul className="space-y-1 text-sm text-white/60">
                <li>
                  • <strong>Current Ratio:</strong> Should be above 1.0 for good
                  liquidity
                </li>
                <li>
                  • <strong>Inventory Days:</strong> Lower is better for
                  efficiency
                </li>
                <li>
                  • <strong>Debtor Days:</strong> Shorter collection period is
                  preferred
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Efficiency Ratios</h4>
              <ul className="space-y-1 text-sm text-white/60">
                <li>
                  • <strong>Turnover Ratios:</strong> Higher values indicate
                  better efficiency
                </li>
                <li>
                  • <strong>Operating Cycle:</strong> Shorter cycle means faster
                  cash conversion
                </li>
                <li>
                  • <strong>Net Profit Ratio:</strong> Higher percentage shows
                  better profitability
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
