"use client";

import React from "react";
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
import { Search, Download } from "lucide-react";
import { useState } from "react";

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

interface FilteredAnalyticalTableProps {
  title: string;
  data: PARData[];
  materiality: MaterialityThresholds;
  onChange?: (data: PARData[]) => void;
  readonly?: boolean;
  filterTypes: string[];
  icon?: React.ReactNode;
}

export function FilteredAnalyticalTable({
  title,
  data,
  materiality,
  onChange,
  readonly = false,
  filterTypes,
  icon,
}: FilteredAnalyticalTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter data by types and search term
  const filteredData = data.filter((item) => {
    const matchesType = filterTypes.includes(item.type || "");
    const matchesSearch =
      !searchTerm ||
      item.par.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.note_line &&
        item.note_line.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const handleSignificanceChange = (
    index: number,
    newValue: "Significant" | "Not Significant",
  ) => {
    if (readonly || !onChange) return;

    const updatedData = [...data];
    const actualIndex = data.findIndex(
      (item) => item.par === filteredData[index].par,
    );
    if (actualIndex !== -1) {
      updatedData[actualIndex] = {
        ...updatedData[actualIndex],
        considered_significant: newValue,
      };
      onChange(updatedData);
    }
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
      "Type",
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
          `"${row.type || ""}"`,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-white/10 bg-black/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            {icon}
            {title}
          </CardTitle>
          <div className="flex gap-2">
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
              Group Materiality: {formatCurrency(materiality.group_materiality)}
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
              placeholder={`Search ${title.toLowerCase()} items...`}
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

      <CardContent>
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
                    No {title.toLowerCase()} data available.
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
                        {row.type && (
                          <div className="mt-1">
                            <Badge
                              variant="outline"
                              className="border-white/20 text-xs text-white/60"
                            >
                              {row.type}
                            </Badge>
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
                          row.exceeds_materiality ? "destructive" : "secondary"
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
                {filteredData.filter((item) => item.exceeds_materiality).length}
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
      </CardContent>
    </Card>
  );
}
