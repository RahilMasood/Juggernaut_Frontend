import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { ArrowUpDown, FileText, Calculator } from "lucide-react";

// Import JSON data directly
import combinedData from "../data/Combined.json";
import formulaData from "../data/Formula.json";

// Import structured data function from processor
import { getStructuredBalanceSheetData } from "../lib/textron-data-processor";

interface BalanceSheetSectionProps {
  searchTerm: string;
}

// Interface for ledger entry from JSON
interface LedgerEntry {
  ledger_name: string;
  opening_balance: number;
  closing_balance: number;
  note_line: string;
  note_line_id: number;
  fs_sub_line: string;
  fs_sub_line_id: number;
  fs_line: string;
  fs_line_id: number;
  type: string;
  mapping: string;
  book_name?: string;
}

// Interface for balance sheet item (for basic list view)
interface BalanceSheetItem {
  name: string;
  amount: number;
  type: "asset" | "liability" | "equity";
  category: string;
  fsLine: string;
  fsSubLine: string;
  noteLine: string;
}

// Interface for structured balance sheet item (from data processor)
interface StructuredBalanceSheetItem {
  name: string;
  amount: number;
  type: "asset" | "liability" | "equity";
  fsLine: string;
  fsSubLine: string;
  noteLine: string;
}

// Interface for formal balance sheet structure
interface FormalBalanceSheetItem {
  name: string;
  currentYear: number;
  previousYear: number;
  variance: number;
  variancePercent: number;
  isSubItem?: boolean;
  isTotal?: boolean;
  level?: number;
}

interface FormalBalanceSheetSection {
  title: string;
  items: FormalBalanceSheetItem[];
  total: FormalBalanceSheetItem;
}

// Interface for debit/credit metrics
interface DebitCreditMetrics {
  totalDebits: number;
  totalCredits: number;
  netPosition: number;
  totalDebitEntries: number;
  totalCreditEntries: number;
}

// Format currency function
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Get company name from data
const getCompanyName = (): string => {
  // Extract from first entry or use a default
  return "Textron India Private Limited";
};

// Get balance sheet data directly from JSON
const getBalanceSheetData = (): BalanceSheetItem[] => {
  const data = combinedData.data as LedgerEntry[];

  return data
    .filter(
      (entry) =>
        (entry.type === "Asset" ||
          entry.type === "Liability" ||
          entry.type === "Equity") &&
        Math.abs(entry.closing_balance) > 0,
    )
    .map((entry) => ({
      name: entry.ledger_name,
      amount: entry.closing_balance,
      type: entry.type.toLowerCase() as "asset" | "liability" | "equity",
      category: entry.fs_sub_line ?? entry.fs_line ?? "Other",
      fsLine: entry.fs_line ?? "Other",
      fsSubLine: entry.fs_sub_line ?? "Other",
      noteLine: entry.note_line ?? "Other",
    }))
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
};

// Get structured balance sheet data from data processor (no calculations here)
const getStructuredData = (): Record<
  string,
  Record<string, StructuredBalanceSheetItem[]>
> => {
  return getStructuredBalanceSheetData("combined");
};

// Get debit/credit breakdown directly from JSON
const getDebitCreditBreakdown = (): Record<string, DebitCreditMetrics> => {
  const data = combinedData.data as LedgerEntry[];
  const breakdown: Record<string, DebitCreditMetrics> = {};

  data.forEach((entry) => {
    const type = entry.type;
    const closingBalance = entry.closing_balance;

    breakdown[type] ??= {
      totalDebits: 0,
      totalCredits: 0,
      netPosition: 0,
      totalDebitEntries: 0,
      totalCreditEntries: 0,
    };

    if (closingBalance > 0) {
      breakdown[type].totalDebits += closingBalance;
      breakdown[type].totalDebitEntries++;
    } else if (closingBalance < 0) {
      breakdown[type].totalCredits += Math.abs(closingBalance);
      breakdown[type].totalCreditEntries++;
    }
  });

  // Calculate net position for each type
  Object.keys(breakdown).forEach((type) => {
    const typeData = breakdown[type];
    if (typeData) {
      typeData.netPosition = typeData.totalDebits - typeData.totalCredits;
    }
  });

  return breakdown;
};

// Get formal balance sheet data directly from Formula.json
const getFormalBalanceSheetData = (): {
  equityAndLiabilities: FormalBalanceSheetSection;
  assets: FormalBalanceSheetSection;
} => {
  const bsData = formulaData["BS-AS"];

  const createItem = (
    name: string,
    value: number,
    isSubItem = false,
    isTotal = false,
    level = 1,
  ): FormalBalanceSheetItem => {
    return {
      name,
      currentYear: value,
      previousYear: 0,
      variance: 0,
      variancePercent: 0,
      isSubItem,
      isTotal,
      level,
    };
  };

  // Direct values from Formula.json
  const shareCapital = bsData["Share Capital"] || 0;
  const reservesSurplus = bsData["Reserves & Surplus"] || 0;
  const moneyReceivedWarrants =
    bsData["Money Received Against Share Warrants"] || 0;
  const shareApplicationMoney =
    bsData["Share Application Money Pending Allotment"] || 0;

  const longTermBorrowings = bsData["Long-term borrowings"] || 0;
  const deferredTaxLiabilities = bsData["Deferred Tax Liabilities"] || 0;
  const otherLongTermLiabilities = bsData["Other long-term Liabilities"] || 0;
  const longTermProvisions = bsData["Long-term Provisions"] || 0;

  const shortTermBorrowings = bsData["Short-term borrowings"] || 0;
  const tradeMsme = bsData["Total outstanding dues of MSME"] || 0;
  const tradeOthers =
    bsData["Total outstanding dues of creditors other than MSME"] || 0;
  const otherCurrentLiabilities = bsData["Other current liabilities"] || 0;
  const shortTermProvisions = bsData["Short-term Provisions"] || 0;

  const tangibleAssets = bsData["Tangible Assets"] || 0;
  const intangibleAssets = bsData["Intangible Assets"] || 0;
  const capitalWorkProgress = bsData["Capital work-in progress"] || 0;
  const intangibleUnderDev = bsData["Intangible Assets Under Development"] || 0;
  const nonCurrentInvestments = bsData["Non-Current Investments"] || 0;
  const deferredTaxAssets = bsData["Deferred Tax Assets"] || 0;
  const longTermLoansAdvances = bsData["Long-term Loans & Advances"] || 0;
  const otherNonCurrentAssets = bsData["Other non-current Assets"] || 0;

  const currentInvestments = bsData["Current Investments"] || 0;
  const inventories = bsData.Inventories || 0;
  const tradeReceivables = bsData["Trade Receivables"] || 0;
  const cashEquivalents = bsData["Cash & Cash Equivalents"] || 0;
  const shortTermLoansAdvances = bsData["Short-term Loans & Advances"] || 0;
  const otherCurrentAssets = bsData["Other Current Assets"] || 0;

  // Use pre-calculated totals from Formula.json
  const shareholdersFunds = bsData["Shareholder Fund"] || 0;
  const nonCurrentLiabilities = bsData["Non-Current Liabilities"] || 0;
  const currentLiabilities = bsData["Current Liabilities"] || 0;
  const nonCurrentAssets = bsData["Non-Current Assets"] || 0;
  const currentAssets = bsData["Current Assets"] || 0;
  const totalLiabilities = bsData["Total Liabilities"] || 0;
  const totalAssets = bsData["Total Assets"] || 0;

  const equityAndLiabilitiesItems: FormalBalanceSheetItem[] = [
    createItem("1. Shareholders' Funds", shareholdersFunds, false, true, 1),
    createItem("a. Share Capital", shareCapital, true, false, 2),
    createItem("b. Reserves & Surplus", reservesSurplus, true, false, 2),
    createItem(
      "c. Money Received Against Share Warrants",
      moneyReceivedWarrants,
      true,
      false,
      2,
    ),
    createItem(
      "2. Share Application Money Pending Allotment",
      shareApplicationMoney,
      false,
      false,
      1,
    ),
    createItem(
      "3. Non-Current Liabilities",
      nonCurrentLiabilities,
      false,
      true,
      1,
    ),
    createItem("a. Long-term borrowings", longTermBorrowings, true, false, 2),
    createItem(
      "b. Deferred Tax Liabilities",
      deferredTaxLiabilities,
      true,
      false,
      2,
    ),
    createItem(
      "c. Other Long-term Liabilities",
      otherLongTermLiabilities,
      true,
      false,
      2,
    ),
    createItem("d. Long-term Provisions", longTermProvisions, true, false, 2),
    createItem("4. Current Liabilities", currentLiabilities, false, true, 1),
    createItem("a. Short-term borrowings", shortTermBorrowings, true, false, 2),
    createItem("b. Trade Payables - MSME", tradeMsme, true, false, 2),
    createItem("c. Trade Payables - Others", tradeOthers, true, false, 2),
    createItem(
      "d. Other Current Liabilities",
      otherCurrentLiabilities,
      true,
      false,
      2,
    ),
    createItem("e. Short-term Provisions", shortTermProvisions, true, false, 2),
  ];

  const assetsItems: FormalBalanceSheetItem[] = [
    createItem("1. Non-Current Assets", nonCurrentAssets, false, true, 1),
    createItem(
      "a. Property, Plant & Equipment",
      tangibleAssets +
        intangibleAssets +
        capitalWorkProgress +
        intangibleUnderDev,
      true,
      false,
      2,
    ),
    createItem("(i) Tangible Assets", tangibleAssets, true, false, 3),
    createItem("(ii) Intangible Assets", intangibleAssets, true, false, 3),
    createItem(
      "(iii) Capital Work-in-Progress",
      capitalWorkProgress,
      true,
      false,
      3,
    ),
    createItem(
      "(iv) Intangible Assets Under Development",
      intangibleUnderDev,
      true,
      false,
      3,
    ),
    createItem(
      "b. Non-Current Investments",
      nonCurrentInvestments,
      true,
      false,
      2,
    ),
    createItem("c. Deferred Tax Assets", deferredTaxAssets, true, false, 2),
    createItem(
      "d. Long-term Loans & Advances",
      longTermLoansAdvances,
      true,
      false,
      2,
    ),
    createItem(
      "e. Other Non-current Assets",
      otherNonCurrentAssets,
      true,
      false,
      2,
    ),
    createItem("2. Current Assets", currentAssets, false, true, 1),
    createItem("a. Current Investments", currentInvestments, true, false, 2),
    createItem("b. Inventories", inventories, true, false, 2),
    createItem("c. Trade Receivables", tradeReceivables, true, false, 2),
    createItem("d. Cash & Cash Equivalents", cashEquivalents, true, false, 2),
    createItem(
      "e. Short-term Loans & Advances",
      shortTermLoansAdvances,
      true,
      false,
      2,
    ),
    createItem("f. Other Current Assets", otherCurrentAssets, true, false, 2),
  ];

  return {
    equityAndLiabilities: {
      title: "Equity & Liabilities",
      items: equityAndLiabilitiesItems,
      total: createItem("TOTAL LIABILITIES", totalLiabilities, false, true),
    },
    assets: {
      title: "Assets",
      items: assetsItems,
      total: createItem("TOTAL ASSETS", totalAssets, false, true),
    },
  };
};

export function BalanceSheetSection({ searchTerm }: BalanceSheetSectionProps) {
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showStructured, setShowStructured] = useState(true);
  const [showFormalView, setShowFormalView] = useState(false);

  // Get data directly from JSON files
  const balanceSheetData = getBalanceSheetData();
  const structuredData = getStructuredData();
  const companyName = getCompanyName();
  const debitCreditBreakdown = getDebitCreditBreakdown();
  const formalBalanceSheetData = getFormalBalanceSheetData();

  const filteredData = balanceSheetData.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const sortedData = [...filteredData].sort((a, b) => {
    const aValue = Math.abs(a.amount);
    const bValue = Math.abs(b.amount);
    return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
  });

  const assets = sortedData.filter((item) => item.type === "asset");
  const liabilities = sortedData.filter((item) => item.type === "liability");
  const equity = sortedData.filter((item) => item.type === "equity");

  const renderFormalBalanceSheetSection = (
    section: FormalBalanceSheetSection,
  ) => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">{section.title}</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-2/5">Particulars</TableHead>
            <TableHead className="text-right">As at 2023</TableHead>
            <TableHead className="text-right">As at 2022</TableHead>
            <TableHead className="text-right">Variance</TableHead>
            <TableHead className="text-right">Variance %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {section.items.map((item, index) => (
            <TableRow
              key={index}
              className={item.isTotal ? "bg-gray-50 font-semibold" : ""}
            >
              <TableCell
                className={`${
                  item.level === 1
                    ? "font-semibold"
                    : item.level === 2
                      ? "pl-6"
                      : "pl-10"
                } ${item.isSubItem ? "text-gray-700" : ""}`}
              >
                {item.name}
              </TableCell>
              <TableCell className="text-right font-mono">
                {item.currentYear === 0 && !item.isTotal
                  ? "—"
                  : formatCurrency(item.currentYear)}
              </TableCell>
              <TableCell className="text-right font-mono">
                {item.previousYear === 0 && !item.isTotal
                  ? "—"
                  : formatCurrency(item.previousYear)}
              </TableCell>
              <TableCell
                className={`text-right font-mono ${
                  item.variance >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {item.variance === 0 && !item.isTotal
                  ? "—"
                  : formatCurrency(item.variance)}
              </TableCell>
              <TableCell
                className={`text-right font-mono ${
                  item.variancePercent >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {item.variancePercent === 0 && !item.isTotal
                  ? "—"
                  : `${item.variancePercent.toFixed(1)}%`}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="border-t-2 bg-gray-100 font-bold">
            <TableCell className="font-bold">{section.total.name}</TableCell>
            <TableCell className="text-right font-mono font-bold">
              {formatCurrency(section.total.currentYear)}
            </TableCell>
            <TableCell className="text-right font-mono font-bold">
              {formatCurrency(section.total.previousYear)}
            </TableCell>
            <TableCell
              className={`text-right font-mono font-bold ${
                section.total.variance >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCurrency(section.total.variance)}
            </TableCell>
            <TableCell
              className={`text-right font-mono font-bold ${
                section.total.variancePercent >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {section.total.variancePercent.toFixed(1)}%
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Balance Sheet</h2>
          <p className="text-white/60">
            Financial position based on ledger entries
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFormalView(!showFormalView)}
            className="flex items-center gap-2 border-white/10 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <Calculator className="h-4 w-4" />
            {showFormalView ? "Analysis View" : "Formal View"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowStructured(!showStructured)}
            className="flex items-center gap-2 border-white/10 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <FileText className="h-4 w-4" />
            {showStructured ? "List View" : "Structured View"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="flex items-center gap-2 border-white/10 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <ArrowUpDown className="h-4 w-4" />
            Sort by Amount
          </Button>
        </div>
      </div>

      {showFormalView ? (
        // Formal Balance Sheet View using real data
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Formal Balance Sheet - {companyName}</CardTitle>
              <CardDescription>
                Real balance sheet data from Formula.json with comparative
                analysis using opening balances for previous year
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Equity & Liabilities Section */}
              {renderFormalBalanceSheetSection(
                formalBalanceSheetData.equityAndLiabilities,
              )}

              {/* Assets Section */}
              {renderFormalBalanceSheetSection(formalBalanceSheetData.assets)}
            </CardContent>
          </Card>
        </div>
      ) : (
        // Original views
        <>
          {/* Debit/Credit Breakdown by Account Type */}
          <Card>
            <CardHeader>
              <CardTitle>Debit/Credit Analysis by Account Type</CardTitle>
              <CardDescription>
                Breakdown of debit and credit entries by account classification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Type</TableHead>
                    <TableHead className="text-right">Total Debits</TableHead>
                    <TableHead className="text-right">Total Credits</TableHead>
                    <TableHead className="text-right">Net Position</TableHead>
                    <TableHead className="text-right">Entries</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(debitCreditBreakdown).map(
                    ([type, metrics]) => (
                      <TableRow key={type}>
                        <TableCell className="font-medium">{type}</TableCell>
                        <TableCell className="text-right font-mono text-emerald-400">
                          {formatCurrency(metrics.totalDebits)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-red-400">
                          {formatCurrency(metrics.totalCredits)}
                        </TableCell>
                        <TableCell
                          className={`text-right font-mono ${
                            metrics.netPosition >= 0
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {formatCurrency(metrics.netPosition)}
                        </TableCell>
                        <TableCell className="text-right text-white/60">
                          {(
                            metrics.totalDebitEntries +
                            metrics.totalCreditEntries
                          ).toLocaleString()}
                          <span className="ml-1 text-xs">
                            ({metrics.totalDebitEntries}D +{" "}
                            {metrics.totalCreditEntries}C)
                          </span>
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {showStructured ? (
            // Structured view by FS Sub-line
            <div className="space-y-6">
              {["Asset", "Liability", "Equity"].map((type) => {
                const typeData = structuredData[type];
                if (!typeData || Object.keys(typeData).length === 0)
                  return null;

                // Get totals directly from Formula.json (no calculations)
                const typeTotal =
                  type === "Asset"
                    ? formulaData["BS-AS"]["Total Assets"]
                    : type === "Liability"
                      ? formulaData["BS-AS"]["Total Liabilities"]
                      : formulaData["BS-AS"]["Shareholder Fund"]; // Equity

                return (
                  <Card key={type}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{type}</span>
                        <span
                          className={`font-mono text-lg ${
                            type === "Asset"
                              ? "text-emerald-400"
                              : type === "Liability"
                                ? "text-red-400"
                                : "text-[#4da3ff]"
                          }`}
                        >
                          {formatCurrency(typeTotal)}
                        </span>
                      </CardTitle>
                      <CardDescription>
                        Grouped by Financial Statement Sub-lines
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(typeData)
                          .filter(([, items]) =>
                            items.some((item) =>
                              item.name
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase()),
                            ),
                          )
                          .map(([fsSubLine, items]) => {
                            // Remove sub-line total calculation as requested
                            const filteredItems = items.filter((item) =>
                              item.name
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase()),
                            );

                            return (
                              <div
                                key={fsSubLine}
                                className="rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                              >
                                <div className="mb-3">
                                  <h4 className="text-lg font-semibold">
                                    {fsSubLine}
                                  </h4>
                                </div>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Account Name</TableHead>
                                      <TableHead className="text-right">
                                        Amount
                                      </TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {filteredItems.map((item, index) => (
                                      <TableRow key={index}>
                                        <TableCell className="font-medium">
                                          {item.name}
                                        </TableCell>
                                        <TableCell
                                          className={`text-right font-mono ${
                                            item.amount > 0
                                              ? "text-emerald-400"
                                              : "text-red-400"
                                          }`}
                                        >
                                          {formatCurrency(item.amount)}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            // Traditional list view
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Assets</CardTitle>
                  <CardDescription>Company assets by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assets.slice(0, 10).map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {item.name}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className="border-white/10 bg-white/5 text-white/80"
                            >
                              {item.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-emerald-400">
                            {formatCurrency(Math.abs(item.amount))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {assets.length > 10 && (
                    <p className="mt-2 text-sm text-white/60">
                      Showing top 10 of {assets.length} assets
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Liabilities & Equity</CardTitle>
                  <CardDescription>
                    Company liabilities and equity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...liabilities, ...equity]
                        .slice(0, 10)
                        .map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {item.name}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  item.type === "liability"
                                    ? "destructive"
                                    : "outline"
                                }
                                className={`${
                                  item.type === "liability"
                                    ? "bg-red-500/15 text-red-300"
                                    : "border-white/10 text-white/80"
                                }`}
                              >
                                {item.category}
                              </Badge>
                            </TableCell>
                            <TableCell
                              className={`text-right font-mono ${
                                item.amount > 0
                                  ? "text-emerald-400"
                                  : "text-red-400"
                              }`}
                            >
                              {formatCurrency(item.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                  {liabilities.length + equity.length > 10 && (
                    <p className="mt-2 text-sm text-white/60">
                      Showing top 10 of {liabilities.length + equity.length}{" "}
                      liabilities & equity
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
