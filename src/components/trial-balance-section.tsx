"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  getTextronBalanceSheetData,
  getStructuredBalanceSheetData,
  getCompanyName,
  calculateDebitCreditMetrics,
  getDebitCreditBreakdown,
} from "../lib/textron-data-processor";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  ArrowUpDown,
  Calculator,
  Download,
  Save,
  Undo2,
  ToggleLeft,
  ToggleRight,
  Eye,
  DollarSign,
  Building,
  CreditCard,
} from "lucide-react";
import {
  getMappingViewWithoutAmounts,
  getMappingViewWithAmounts,
  formatCurrency,
  type MappingViewWithoutAmounts,
  type MappingViewWithAmounts,
} from "../lib/textron-data-processor";
import { noteLineMapping } from "../constants/NoteLineMapping";
import React from "react";

interface TrialBalanceSectionProps {
  searchTerm: string;
}

type ViewMode = "without-amounts" | "with-amounts";
type BookFilter = "all" | "SEZ" | "Non-SEZ";

type EditableDataWithoutAmounts = Record<
  string,
  {
    noteLine: string;
    noteLineId: number;
    fsSubLine: string;
    fsSubLineId: number;
    fsLine: string;
    fsLineId: number;
    type: string;
  }
>;

type EditableDataWithAmounts = Record<
  string,
  {
    noteLine: string;
    noteLineId: number;
    fsSubLine: string;
    fsSubLineId: number;
    fsLine: string;
    fsLineId: number;
    type: string;
  }
>;

export function TrialBalanceSection({ searchTerm }: TrialBalanceSectionProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("without-amounts");
  const [bookFilter, setBookFilter] = useState<BookFilter>("all");
  const debitCreditMetrics = calculateDebitCreditMetrics();

  const [sortBy, setSortBy] = useState<string>("ledgerName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [editableDataWithoutAmounts, setEditableDataWithoutAmounts] =
    useState<EditableDataWithoutAmounts>({});
  const [editableDataWithAmounts, setEditableDataWithAmounts] =
    useState<EditableDataWithAmounts>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Get original data based on current view mode
  const originalDataWithoutAmounts = getMappingViewWithoutAmounts();
  const originalDataWithAmounts = getMappingViewWithAmounts();

  // Get current editable data based on view mode
  const currentEditableData =
    viewMode === "without-amounts"
      ? editableDataWithoutAmounts
      : editableDataWithAmounts;

  // Merge original data with editable changes
  const enhancedDataWithoutAmounts = originalDataWithoutAmounts.map((item) => ({
    ...item,
    noteLine:
      editableDataWithoutAmounts[item.ledgerName]?.noteLine ?? item.noteLine,
    noteLineId:
      editableDataWithoutAmounts[item.ledgerName]?.noteLineId ??
      item.noteLineId,
    fsSubLine:
      editableDataWithoutAmounts[item.ledgerName]?.fsSubLine ?? item.fsSubLine,
    fsSubLineId:
      editableDataWithoutAmounts[item.ledgerName]?.fsSubLineId ??
      item.fsSubLineId,
    fsLine: editableDataWithoutAmounts[item.ledgerName]?.fsLine ?? item.fsLine,
    fsLineId:
      editableDataWithoutAmounts[item.ledgerName]?.fsLineId ?? item.fsLineId,
    type: editableDataWithoutAmounts[item.ledgerName]?.type ?? item.type,
  }));

  const enhancedDataWithAmounts = originalDataWithAmounts.map((item) => ({
    ...item,
    noteLine:
      editableDataWithAmounts[item.ledgerName]?.noteLine ?? item.noteLine,
    noteLineId:
      editableDataWithAmounts[item.ledgerName]?.noteLineId ?? item.noteLineId,
    fsSubLine:
      editableDataWithAmounts[item.ledgerName]?.fsSubLine ?? item.fsSubLine,
    fsSubLineId:
      editableDataWithAmounts[item.ledgerName]?.fsSubLineId ?? item.fsSubLineId,
    fsLine: editableDataWithAmounts[item.ledgerName]?.fsLine ?? item.fsLine,
    fsLineId:
      editableDataWithAmounts[item.ledgerName]?.fsLineId ?? item.fsLineId,
    type: editableDataWithAmounts[item.ledgerName]?.type ?? item.type,
  }));

  // Get current data based on view mode
  const currentData =
    viewMode === "without-amounts"
      ? enhancedDataWithoutAmounts
      : enhancedDataWithAmounts;

  // Filter data based on search term and book filter
  const filteredData = currentData.filter((item) => {
    const matchesSearch =
      item.ledgerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.noteLine.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.fsLine.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.fsSubLine.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.bookName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBookFilter =
      bookFilter === "all" || item.bookName === bookFilter;

    return matchesSearch && matchesBookFilter;
  });

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    const aValue = a[sortBy as keyof typeof a];
    const bValue = b[sortBy as keyof typeof b];

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortOrder === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleCellEdit = useCallback(
    (ledgerName: string, selectedNoteLineId: number) => {
      // Find the selected note line mapping
      const selectedMapping = noteLineMapping.find(
        (mapping) => mapping.noteLineId === selectedNoteLineId,
      );

      if (!selectedMapping) return;

      if (viewMode === "without-amounts") {
        setEditableDataWithoutAmounts((prev) => ({
          ...prev,
          [ledgerName]: {
            noteLine: selectedMapping.noteLine,
            noteLineId: selectedMapping.noteLineId,
            fsSubLine: selectedMapping.fsSubLine,
            fsSubLineId: selectedMapping.fsSubLineId,
            fsLine: selectedMapping.fsLine,
            fsLineId: selectedMapping.fsLineId,
            type: selectedMapping.type,
          },
        }));
      } else {
        setEditableDataWithAmounts((prev) => ({
          ...prev,
          [ledgerName]: {
            noteLine: selectedMapping.noteLine,
            noteLineId: selectedMapping.noteLineId,
            fsSubLine: selectedMapping.fsSubLine,
            fsSubLineId: selectedMapping.fsSubLineId,
            fsLine: selectedMapping.fsLine,
            fsLineId: selectedMapping.fsLineId,
            type: selectedMapping.type,
          },
        }));
      }
      setHasChanges(true);
    },
    [viewMode],
  );

  const handleSaveChanges = () => {
    console.log("Saving changes:", currentEditableData);
    setHasChanges(false);
    // API call would go here
  };

  const handleResetChanges = () => {
    if (viewMode === "without-amounts") {
      setEditableDataWithoutAmounts({});
    } else {
      setEditableDataWithAmounts({});
    }
    setHasChanges(false);
  };

  const handleViewToggle = () => {
    setViewMode((prev) =>
      prev === "without-amounts" ? "with-amounts" : "without-amounts",
    );
    // Reset sort when switching views
    setSortBy("ledgerName");
    setSortOrder("asc");
  };

  const handleExportToExcel = () => {
    const exportData = sortedData.map((item) => {
      if (viewMode === "without-amounts") {
        return {
          "Book Name": item.bookName,

          "Ledger Name": item.ledgerName,

          "Note Line": item.noteLine,
          "Note Line ID": item.noteLineId,
          "FS Sub Line": item.fsSubLine,
          "FS Sub Line ID": (item as MappingViewWithoutAmounts).fsSubLineId,
          "FS Line": item.fsLine,
          "FS Line ID": item.fsLineId,
          Type: item.type,
        };
      } else {
        const itemWithAmounts = item as MappingViewWithAmounts;
        return {
          "Ledger Name": item.ledgerName,
          "Book Name": item.bookName,
          "Opening Balance": itemWithAmounts.openingBalance.toLocaleString(
            "en-IN",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            },
          ),
          "Closing Balance": itemWithAmounts.closingBalance.toLocaleString(
            "en-IN",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            },
          ),
        };
      }
    });

    const headers = Object.keys(exportData[0] ?? {});
    const csvContent = [
      headers.join(","),
      ...exportData.map((row) =>
        headers
          .map((header) => `"${row[header as keyof typeof row]}"`)
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const bookFilterSuffix =
      bookFilter === "all" ? "combined" : bookFilter.toLowerCase();
    link.setAttribute(
      "download",
      `mapping_view_${viewMode}_${bookFilterSuffix}_${
        new Date().toISOString().split("T")[0]
      }.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getViewDescription = () => {
    return viewMode === "without-amounts"
      ? "Mapping view focused on account structure with dropdown selection for Note Line fields from predefined options"
      : "Simple view with Ledger Name, Opening Balance, and Closing Balance in exact formatted numbers";
  };

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Trial Balance Mapping Views
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-white/10 text-white/80">
            {filteredData.length} Entries
          </Badge>

          {/* Book Filter */}
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm">
            <Building className="h-4 w-4 text-white/80" />
            <span className="text-sm font-medium text-white/80">Book:</span>
            <select
              value={bookFilter}
              onChange={(e) => setBookFilter(e.target.value as BookFilter)}
              className="border-0 bg-transparent text-sm text-white outline-none"
            >
              <option value="all">All</option>
              <option value="SEZ">SEZ</option>
              <option value="Non-SEZ">Non-SEZ</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm">
            <Eye className="h-4 w-4 text-white/80" />
            <span className="text-sm font-medium text-white/80">
              {viewMode === "without-amounts" ? "Mapping" : "Amounts"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewToggle}
              className="h-auto p-1"
            >
              {viewMode === "without-amounts" ? (
                <ToggleLeft className="h-5 w-5" />
              ) : (
                <ToggleRight className="h-5 w-5 text-emerald-400" />
              )}
            </Button>
          </div>

          {hasChanges && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleResetChanges}
                className="border-white/10 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <Undo2 className="mr-1 h-4 w-4" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleSaveChanges}
                className="bg-[#4da3ff] text-black hover:bg-[#4da3ff]/90"
              >
                <Save className="mr-1 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportToExcel}
            className="border-white/10 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <Download className="mr-1 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Mapping View Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {viewMode === "without-amounts" ? (
              <Eye className="h-5 w-5" />
            ) : (
              <DollarSign className="h-5 w-5" />
            )}
            {viewMode === "without-amounts" ? "Mapping View " : "Amounts View"}
          </CardTitle>
          <CardDescription>
            {viewMode === "without-amounts"
              ? `${
                  bookFilter === "all" ? "Combined SEZ & Non-SEZ" : bookFilter
                } data with dropdown selection for Note Line from predefined mapping options. Select from dropdown to update both Note Line and Note Line ID together.`
              : `${
                  bookFilter === "all" ? "Combined SEZ & Non-SEZ" : bookFilter
                } data showing Ledger Name with exact Opening and Closing Balance amounts.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {viewMode === "with-amounts" ? (
              <div className="m-5 grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                    <div className="flex items-center space-x-2">
                      <Building className="h-5 w-5 text-emerald-400" />
                      <CardTitle className="text-lg">Total Debits</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-400">
                      {formatCurrency(debitCreditMetrics.totalDebits)}
                    </div>
                    <p className="text-xs text-white/60">
                      {debitCreditMetrics.totalDebitEntries} debit entries
                      (Combined SEZ + Non-SEZ)
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5 text-red-400" />
                      <CardTitle className="text-lg">Total Credits</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-400">
                      {formatCurrency(debitCreditMetrics.totalCredits)}
                    </div>
                    <p className="text-xs text-white/60">
                      {debitCreditMetrics.totalCreditEntries} credit entries
                      (Combined SEZ + Non-SEZ)
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                    <div className="flex items-center space-x-2">
                      <Building className="h-5 w-5 text-[#4da3ff]" />
                      <CardTitle className="text-lg">Net Position</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold ${
                        debitCreditMetrics.netPosition >= 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {formatCurrency(debitCreditMetrics.netPosition)}
                    </div>
                    <p className="text-xs text-white/60">
                      Total Debits - Total Credits
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : null}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("bookName")}
                      className="h-auto p-0 font-semibold"
                    >
                      Book Name
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[250px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("ledgerName")}
                      className="h-auto p-0 font-semibold"
                    >
                      Ledger Name
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>

                  {/* Conditional columns based on view mode */}
                  {viewMode === "with-amounts" ? (
                    <>
                      <TableHead className="min-w-[150px] text-right">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("openingBalance")}
                          className="h-auto p-0 font-semibold"
                        >
                          Opening Balance
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="min-w-[150px] text-right">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("closingBalance")}
                          className="h-auto p-0 font-semibold"
                        >
                          Closing Balance
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead className="min-w-[200px] bg-white/5">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("noteLine")}
                          className="h-auto p-0 font-semibold"
                        >
                          Note Line (Select from dropdown)
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="min-w-[150px]">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("fsSubLine")}
                          className="h-auto p-0 font-semibold"
                        >
                          FS Sub Line
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="min-w-[120px]">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("fsSubLineId")}
                          className="h-auto p-0 font-semibold"
                        >
                          FS Sub Line ID
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="min-w-[120px]">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("fsLine")}
                          className="h-auto p-0 font-semibold"
                        >
                          FS Line
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="min-w-[100px]">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("fsLineId")}
                          className="h-auto p-0 font-semibold"
                        >
                          FS Line ID
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="min-w-[100px]">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("type")}
                          className="h-auto p-0 font-semibold"
                        >
                          Type
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((item, index) => (
                  <TableRow
                    key={`${item.ledgerName}-${index}`}
                    className="hover:bg-white/5"
                  >
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          item.bookName === "SEZ" ? "default" : "secondary"
                        }
                        className="border-white/10 bg-white/5 text-xs text-white/80"
                      >
                        {item.bookName}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="max-w-[250px] text-sm font-medium"
                      title={item.ledgerName}
                    >
                      <div className="truncate">{item.ledgerName}</div>
                    </TableCell>

                    {/* Conditional columns based on view mode */}
                    {viewMode === "with-amounts" ? (
                      <>
                        <TableCell className="text-right font-mono text-sm">
                          {(
                            item as MappingViewWithAmounts
                          ).openingBalance.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {(
                            item as MappingViewWithAmounts
                          ).closingBalance.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="bg-white/5 p-1">
                          <select
                            value={item.noteLineId}
                            onChange={(e) =>
                              handleCellEdit(
                                item.ledgerName,
                                parseInt(e.target.value) || 0,
                              )
                            }
                            className="w-full rounded border border-white/10 bg-black/40 p-2 text-sm text-white backdrop-blur-sm placeholder:text-white/40 focus:border-[#4da3ff]/60 focus:ring-1 focus:ring-[#4da3ff]/40 focus:outline-none"
                            title="Select Note Line from dropdown"
                          >
                            {noteLineMapping.map((mapping) => (
                              <option
                                key={mapping.noteLineId}
                                value={mapping.noteLineId}
                              >
                                {mapping.noteLine} (ID: {mapping.noteLineId})
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell className="text-sm" title={item.fsSubLine}>
                          <div className="max-w-[150px] truncate">
                            {item.fsSubLine}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm">
                          {(item as MappingViewWithoutAmounts).fsSubLineId}
                        </TableCell>
                        <TableCell className="text-sm" title={item.fsLine}>
                          <div className="max-w-[120px] truncate">
                            {item.fsLine}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm">
                          {item.fsLineId}
                        </TableCell>
                        <TableCell className="text-sm">
                          <Badge
                            variant="outline"
                            className="border-white/10 text-xs text-white/80"
                          >
                            {item.type}
                          </Badge>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
