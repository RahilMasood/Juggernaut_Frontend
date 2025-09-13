"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCompanyName } from "@/lib/textron-data-processor";
import { PreliminaryAnalyticalSummary } from "./preliminary-analytical-summary";
import { Search, Download, RefreshCw } from "lucide-react";

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

interface MaterialityDataItem {
  id: string;
  answer: string;
}

// The global PlanningContext interface is already declared in types.d.ts

interface PreliminaryAnalyticalTableProps {
  value?: PARData[];
  onChange?: (data: PARData[]) => void;
  readonly?: boolean;
}

export function PreliminaryAnalyticalTable({
  value = [],
  onChange,
  readonly = false,
}: PreliminaryAnalyticalTableProps) {
  const companyName = getCompanyName();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState<PARData[]>([]);
  const [materiality, setMateriality] = useState<MaterialityThresholds>({});
  const [loading, setLoading] = useState(false);

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
        ]?.find((item: MaterialityDataItem) => item.id === "M-3")?.answer;

        const performanceMaterialityPercent = materialityData?.[
          "Group materiality at planning stage"
        ]?.find((item: MaterialityDataItem) => item.id === "M-5")?.answer;

        const clearlyTrivialPercent = materialityData?.[
          "Group materiality at planning stage"
        ]?.find((item: MaterialityDataItem) => item.id === "M-7")?.answer;

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

  // Load and process data from Combined.json
  const loadFinancialData = useCallback(async () => {
    setLoading(true);
    try {
      // Load the Combined.json data from the main process since it's in src/data
      const combinedData = await window.planning.readCombinedData();

      if (combinedData?.data) {
        // Group by PAR and aggregate balances
        const parGroups = combinedData.data.reduce(
          (acc: Record<string, PARData>, item: any) => {
            // eslint-disable-line @typescript-eslint/no-explicit-any
            const parKey = item.par || "Unclassified";

            if (!acc[parKey]) {
              acc[parKey] = {
                par: parKey,
                closing_balance: 0,
                opening_balance: 0,
                note_line: item.note_line,
                type: item.type,
                variance: 0,
                variance_percentage: 0,
                exceeds_materiality: false,
                considered_significant: "" as const,
              };
            }

            acc[parKey].closing_balance += item.closing_balance || 0;
            acc[parKey].opening_balance += item.opening_balance || 0;

            return acc;
          },
          {},
        );

        // Calculate variances and materiality checks
        const processedData: PARData[] = (
          Object.values(parGroups) as PARData[]
        ).map((item: PARData) => {
          const variance = item.closing_balance - item.opening_balance;
          const variance_percentage =
            item.opening_balance !== 0
              ? (variance / Math.abs(item.opening_balance)) * 100
              : 0;

          const exceeds_materiality = materiality.group_materiality
            ? Math.abs(item.closing_balance) > materiality.group_materiality
            : false;

          return {
            ...item,
            variance,
            variance_percentage,
            exceeds_materiality,
            considered_significant: exceeds_materiality
              ? "Significant"
              : "Not Significant",
          };
        });

        // Merge with existing data to preserve user inputs
        const mergedData = processedData.map((newItem) => {
          const existingItem = value.find((v) => v.par === newItem.par);
          return existingItem
            ? {
                ...newItem,
                considered_significant:
                  existingItem.considered_significant ||
                  newItem.considered_significant,
              }
            : newItem;
        });

        onChange?.(mergedData);
      }
    } catch (error) {
      console.error("Failed to load financial data:", error);
    } finally {
      setLoading(false);
    }
  }, [value, onChange, materiality.group_materiality]);

  // Filter data based on search term
  useEffect(() => {
    const filtered = value.filter(
      (item) =>
        item.par.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.note_line &&
          item.note_line.toLowerCase().includes(searchTerm.toLowerCase())),
    );
    setFilteredData(filtered);
  }, [value, searchTerm]);

  const handleSignificanceChange = (
    index: number,
    newValue: "Significant" | "Not Significant",
  ) => {
    if (readonly) return;

    const updatedData = [...value];
    updatedData[index] = {
      ...updatedData[index],
      considered_significant: newValue,
    };
    onChange?.(updatedData);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(2)}%`;
  };

  const exportToCSV = () => {
    const headers = [
      "PAR",
      "Closing Balance",
      "Opening Balance",
      "Variance",
      "Variance (%)",
      "Exceeds Materiality?",
      "Considered Significant?",
    ];

    const csvContent = [
      headers.join(","),
      ...filteredData.map((row) =>
        [
          `"${row.par}"`,
          row.closing_balance,
          row.opening_balance,
          row.variance,
          row.variance_percentage.toFixed(2),
          row.exceeds_materiality ? "Yes" : "No",
          `"${row.considered_significant}"`,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `preliminary_analytical_procedures_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PreliminaryAnalyticalSummary
        data={filteredData}
        materiality={materiality}
      />

      <Card className="border-white/10 bg-black/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">
              Preliminary Analytical Procedures
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={loadFinancialData}
                disabled={loading || readonly}
                size="sm"
                variant="outline"
                className="border-white/10 text-white/80 hover:bg-white/10"
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                {loading ? "Loading..." : "Refresh Data"}
              </Button>
              <Button
                onClick={exportToCSV}
                size="sm"
                variant="outline"
                className="border-white/10 text-white/80 hover:bg-white/10"
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          {materiality.group_materiality && (
            <div className="flex flex-wrap gap-4 text-sm text-white/70">
              <span>
                Group Materiality:{" "}
                {formatCurrency(materiality.group_materiality)}
              </span>
              {materiality.performance_materiality && (
                <span>
                  Performance Materiality:{" "}
                  {formatCurrency(materiality.performance_materiality)}
                </span>
              )}
              {materiality.clearly_trivial_threshold && (
                <span>
                  Clearly Trivial:{" "}
                  {formatCurrency(materiality.clearly_trivial_threshold)}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/50" />
              <Input
                placeholder="Search PAR items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-white/10 pl-10 text-white"
              />
            </div>
            <Badge variant="outline" className="border-white/10 text-white/70">
              {filteredData.length} items
            </Badge>
          </div>
        </CardHeader>

        {/* <CardContent>
          <div className="rounded-md border border-white/10">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="text-white/80">PAR</TableHead>
                  <TableHead className="text-right text-white/80">
                    Closing Balance
                  </TableHead>
                  <TableHead className="text-right text-white/80">
                    Opening Balance
                  </TableHead>
                  <TableHead className="text-right text-white/80">
                    Variance
                  </TableHead>
                  <TableHead className="text-right text-white/80">
                    Variance (%)
                  </TableHead>
                  <TableHead className="text-center text-white/80">
                    Exceeds Materiality?
                  </TableHead>
                  <TableHead className="text-center text-white/80">
                    Considered Significant?
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-white/60"
                    >
                      {loading
                        ? "Loading data..."
                        : 'No data available. Click "Refresh Data" to load financial information.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((row, index) => (
                    <TableRow
                      key={row.par}
                      className="border-white/10 hover:bg-white/5"
                    >
                      <TableCell className="font-medium text-white">
                        <div>
                          <div>{row.par}</div>
                          {row.note_line && (
                            <div className="mt-1 text-xs text-white/50">
                              {row.note_line}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-white">
                        {formatCurrency(row.closing_balance)}
                      </TableCell>
                      <TableCell className="text-right text-white">
                        {formatCurrency(row.opening_balance)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          row.variance > 0
                            ? "text-green-400"
                            : row.variance < 0
                              ? "text-red-400"
                              : "text-white"
                        }`}
                      >
                        {formatCurrency(row.variance)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          Math.abs(row.variance_percentage) > 10
                            ? "text-yellow-400"
                            : "text-white"
                        }`}
                      >
                        {formatPercentage(row.variance_percentage)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            row.exceeds_materiality
                              ? "destructive"
                              : "secondary"
                          }
                          className={
                            row.exceeds_materiality
                              ? "border-red-500/30 bg-red-500/20 text-red-300"
                              : "border-green-500/30 bg-green-500/20 text-green-300"
                          }
                        >
                          {row.exceeds_materiality ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Select
                          value={row.considered_significant}
                          onValueChange={(
                            newValue: "Significant" | "Not Significant",
                          ) => handleSignificanceChange(index, newValue)}
                          disabled={readonly}
                        >
                          <SelectTrigger className="w-full border-white/10 text-white">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Significant">
                              Significant
                            </SelectItem>
                            <SelectItem value="Not Significant">
                              Not Significant
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredData.length > 0 && (
            <div className="mt-4 grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="mb-1 text-white/70">Total Items</div>
                <div className="font-semibold text-white">
                  {filteredData.length}
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="mb-1 text-white/70">Exceeding Materiality</div>
                <div className="font-semibold text-red-300">
                  {
                    filteredData.filter((item) => item.exceeds_materiality)
                      .length
                  }
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="mb-1 text-white/70">Marked Significant</div>
                <div className="font-semibold text-yellow-300">
                  {
                    filteredData.filter(
                      (item) => item.considered_significant === "Significant",
                    ).length
                  }
                </div>
              </div>
            </div>
          )}
        </CardContent> */}
      </Card>
    </div>
  );
}
