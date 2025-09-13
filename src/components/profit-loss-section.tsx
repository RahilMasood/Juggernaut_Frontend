import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
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
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calculator,
} from "lucide-react";
import {
  getTextronProfitLossData,
  formatCurrency,
  getCompanyName,
} from "../lib/textron-data-processor";
import React, { useState } from "react";

interface ProfitLossSectionProps {
  searchTerm: string;
}

export function ProfitLossSection({ searchTerm }: ProfitLossSectionProps) {
  const [sortBy, setSortBy] = useState<"name" | "amount">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showDetails, setShowDetails] = useState(false);
  const [viewMode, setViewMode] = useState<"summary" | "detailed" | "formal">(
    "summary",
  );

  const companyName = getCompanyName();
  const profitLossData = getTextronProfitLossData();

  const filteredData = profitLossData.filter(
    (item) =>
      item.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.fsSubLine.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const sortedData = [...filteredData].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortBy) {
      case "name":
        aValue = a.account.toLowerCase();
        bValue = b.account.toLowerCase();
        break;
      case "amount":
        aValue = a.type === "Income" ? -a.amount : a.amount;
        bValue = b.type === "Income" ? -b.amount : b.amount;
        break;
      default:
        aValue = a.account.toLowerCase();
        bValue = b.account.toLowerCase();
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortOrder === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortOrder === "asc"
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  // Calculate totals
  const totalIncome = profitLossData
    .filter((item) => item.type === "Income")
    .reduce((sum, item) => {
      // Income accounts have negative balances (credits), so we negate to get positive revenue
      return sum + -item.amount;
    }, 0);

  const totalExpenses = profitLossData
    .filter((item) => item.type === "Expense")
    .reduce((sum, item) => {
      // Expense accounts have positive balances (debits)
      return sum + item.amount;
    }, 0);

  const netIncome = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;

  // Group by FS Sub Line for better organization
  const groupedData = sortedData.reduce(
    (acc, item) => {
      const key = item.fsSubLine ?? "Other";
      acc[key] ??= [];
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, typeof sortedData>,
  );

  const handleSort = (column: "name" | "amount") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Profit & Loss Statement
          </h2>
          <p className="text-white/60">Income and expenses for {companyName}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "summary" ? "default" : "outline"}
            onClick={() => setViewMode("summary")}
            className={`flex items-center gap-2 ${
              viewMode === "summary"
                ? ""
                : "border-white/10 text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            Summary
          </Button>
          <Button
            variant={viewMode === "detailed" ? "default" : "outline"}
            onClick={() => setViewMode("detailed")}
            className={`flex items-center gap-2 ${
              viewMode === "detailed"
                ? ""
                : "border-white/10 text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Calculator className="h-4 w-4" />
            Detailed
          </Button>
          <Button
            variant={viewMode === "formal" ? "default" : "outline"}
            onClick={() => setViewMode("formal")}
            className={`flex items-center gap-2 ${
              viewMode === "formal"
                ? ""
                : "border-white/10 text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            Formal Statement
          </Button>
          {viewMode === "detailed" && (
            <Button
              variant="outline"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 border-white/10 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <Calculator className="h-4 w-4" />
              {showDetails ? "Hide Details" : "Show Details"}
            </Button>
          )}
          {viewMode !== "formal" && (
            <Button
              variant="outline"
              onClick={() =>
                setSortOrder(sortOrder === "desc" ? "asc" : "desc")
              }
              className="flex items-center gap-2 border-white/10 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <ArrowUpDown className="h-4 w-4" />
              Sort by Amount
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">Total Income</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">
              {formatCurrency(totalIncome)}
            </div>
            <p className="text-xs text-white/60">Revenue and other income</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <CardTitle className="text-lg">Total Expenses</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              {formatCurrency(totalExpenses)}
            </div>
            <p className="text-xs text-white/60">
              Operating and other expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <DollarSign
                className={`h-5 w-5 ${
                  netIncome >= 0 ? "text-green-600" : "text-red-600"
                }`}
              />
              <CardTitle className="text-lg">Net Income</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                netIncome >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {formatCurrency(netIncome)}
            </div>
            <p className="text-xs text-white/60">
              {netIncome >= 0 ? "Profit" : "Loss"} for the period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Profit Margin</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                profitMargin >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {profitMargin.toFixed(2)}%
            </div>
            <p className="text-xs text-white/60">Net income as % of revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Formal P&L Statement */}
      {viewMode === "formal" && (
        <Card>
          <CardHeader>
            <CardTitle>Profit & Loss Statement</CardTitle>
            <CardDescription>
              Formal statement as per Indian accounting standards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormalPLStatementView companyName={companyName} />
          </CardContent>
        </Card>
      )}

      {/* Detailed P&L Statement */}
      {viewMode !== "formal" && (
        <Card>
          <CardHeader>
            <CardTitle>Profit & Loss Statement</CardTitle>
            <CardDescription>
              {viewMode === "summary"
                ? "Summary by FS Sub-line categories"
                : "Detailed breakdown by FS Sub-line categories"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {viewMode === "detailed" && showDetails ? (
              // Detailed view grouped by FS Sub Line
              <div className="space-y-6">
                {Object.entries(groupedData).map(([fsSubLine, items]) => (
                  <div key={fsSubLine}>
                    <h4 className="mb-3 border-b border-white/10 pb-2 text-lg font-semibold">
                      {fsSubLine}
                      <span className="ml-2 text-sm font-normal text-white/60">
                        ({items.length} accounts)
                      </span>
                    </h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("name")}
                              className="h-auto p-0 font-semibold"
                            >
                              Account Name
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("amount")}
                              className="h-auto p-0 font-semibold"
                            >
                              Amount
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {item.account}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  item.type === "Income"
                                    ? "border-white/10 text-emerald-300"
                                    : "border-white/10 text-red-300"
                                }`}
                              >
                                {item.type}
                              </Badge>
                            </TableCell>
                            <TableCell
                              className={`text-right font-mono ${
                                item.type === "Income"
                                  ? "text-emerald-400"
                                  : "text-red-400"
                              }`}
                            >
                              {item.type === "Income"
                                ? formatCurrency(-item.amount)
                                : formatCurrency(item.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>
            ) : (
              // Summary view by FS Sub Line
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>FS Sub Line</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Accounts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(groupedData).map(([fsSubLine, items]) => {
                    const total = items.reduce((sum, item) => {
                      return item.type === "Income"
                        ? sum + -item.amount
                        : sum + item.amount;
                    }, 0);
                    const type = items[0]?.type ?? "Other";
                    return (
                      <TableRow key={fsSubLine}>
                        <TableCell className="font-medium">
                          {fsSubLine}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              type === "Income"
                                ? "border-white/10 text-emerald-300"
                                : "border-white/10 text-red-300"
                            }`}
                          >
                            {type}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={`text-right font-mono ${
                            type === "Income"
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {formatCurrency(total)}
                        </TableCell>
                        <TableCell className="text-right text-white/60">
                          {items.length} accounts
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Formal P&L Statement Component
function FormalPLStatementView({ companyName }: { companyName: string }) {
  // Create a simple formal P&L structure using the existing data
  const profitLossData = getTextronProfitLossData();

  // Calculate totals from actual data
  const revenueFromOperations = profitLossData
    .filter(
      (item) =>
        item.fsSubLine === "Revenue from Operations" && item.type === "Income",
    )
    .reduce((sum, item) => sum + -item.amount, 0);

  const otherIncome = profitLossData
    .filter(
      (item) => item.fsSubLine === "Other Income" && item.type === "Income",
    )
    .reduce((sum, item) => sum + -item.amount, 0);

  const totalRevenue = revenueFromOperations + otherIncome;

  const costOfMaterialsConsumed = profitLossData
    .filter(
      (item) =>
        item.fsSubLine === "Cost of materials consumed" &&
        item.type === "Expense",
    )
    .reduce((sum, item) => sum + item.amount, 0);

  const purchasesOfStockInTrade = profitLossData
    .filter(
      (item) =>
        item.fsSubLine === "Purchases of stock-in-trade" &&
        item.type === "Expense",
    )
    .reduce((sum, item) => sum + item.amount, 0);

  const employeeBenefitsExpense = profitLossData
    .filter(
      (item) =>
        item.fsSubLine === "Employee Benefits Expense" &&
        item.type === "Expense",
    )
    .reduce((sum, item) => sum + item.amount, 0);

  const financeCosts = profitLossData
    .filter(
      (item) => item.fsSubLine === "Finance Costs" && item.type === "Expense",
    )
    .reduce((sum, item) => sum + item.amount, 0);

  const depreciationExpense = profitLossData
    .filter(
      (item) =>
        item.fsSubLine === "Depreciation & Amortisation Expense" &&
        item.type === "Expense",
    )
    .reduce((sum, item) => sum + item.amount, 0);

  const otherExpenses = profitLossData
    .filter(
      (item) => item.fsSubLine === "Other Expenses" && item.type === "Expense",
    )
    .reduce((sum, item) => sum + item.amount, 0);

  const totalExpenses =
    costOfMaterialsConsumed +
    purchasesOfStockInTrade +
    employeeBenefitsExpense +
    financeCosts +
    depreciationExpense +
    otherExpenses;

  const profitBeforeTax = totalRevenue - totalExpenses;
  const profitForThePeriod = profitBeforeTax; // Simplified - no tax calculation for now

  const formalPLData = [
    {
      label: "I. Revenue from Operations",
      amount: revenueFromOperations,
      level: 0,
    },
    { label: "II. Other Income", amount: otherIncome, level: 0 },
    {
      label: "III. TOTAL REVENUE",
      amount: totalRevenue,
      level: 0,
      isTotal: true,
    },
    { label: "IV. EXPENSES", amount: 0, level: 0 },
    {
      label: "Cost of materials consumed",
      amount: costOfMaterialsConsumed,
      level: 1,
    },
    {
      label: "Purchases of stock-in-trade",
      amount: purchasesOfStockInTrade,
      level: 1,
    },
    {
      label: "Employee benefits expense",
      amount: employeeBenefitsExpense,
      level: 1,
    },
    { label: "Finance costs", amount: financeCosts, level: 1 },
    {
      label: "Depreciation and amortisation expense",
      amount: depreciationExpense,
      level: 1,
    },
    { label: "Other Expenses", amount: otherExpenses, level: 1 },
    { label: "TOTAL EXPENSES", amount: totalExpenses, level: 0, isTotal: true },
    {
      label: "V. PROFIT BEFORE TAX (III-IV)",
      amount: profitBeforeTax,
      level: 0,
      isTotal: true,
    },
    {
      label: "VI. PROFIT/(LOSS) FOR THE PERIOD",
      amount: profitForThePeriod,
      level: 0,
      isTotal: true,
    },
  ];

  return (
    <div className="space-y-4 text-white">
      <div className="border-b border-white/10 pb-4 text-center">
        <h3 className="text-lg font-semibold">{companyName}</h3>
        <p className="text-white/60">Profit and Loss Statement</p>
        <p className="text-sm text-white/60">
          For the year ended March 31, 2023
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-2/3">Particulars</TableHead>
            <TableHead className="text-right">
              For the year ended 2023
            </TableHead>
            <TableHead className="text-right">
              For the year ended 2022
            </TableHead>
            <TableHead className="text-right">Variance</TableHead>
            <TableHead className="text-right">Variance %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {formalPLData.map((item, index) => (
            <TableRow
              key={index}
              className={`${
                item.isTotal
                  ? "border-t border-b border-white/10 bg-white/5 font-semibold"
                  : item.level === 0
                    ? "font-medium"
                    : ""
              }`}
            >
              <TableCell
                className={`${
                  item.level === 1 ? "pl-6" : item.level === 2 ? "pl-12" : ""
                }`}
              >
                {item.label}
              </TableCell>
              <TableCell className="text-right font-mono">
                {item.amount === 0 && !item.isTotal
                  ? ""
                  : formatCurrency(item.amount)}
              </TableCell>
              <TableCell className="text-right font-mono text-white/60">
                XXX
              </TableCell>
              <TableCell className="text-right font-mono text-white/60">
                XXX
              </TableCell>
              <TableCell className="text-right font-mono text-white/60">
                X%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
