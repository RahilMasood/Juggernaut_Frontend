import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { ChartTooltip } from "./ui/chart";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  LineChart,
  Line,
} from "recharts";
import {
  getTopLedgersByType,
  formatCurrency,
} from "../lib/textron-data-processor";
import React from "react";

export function ChartsSection() {
  // Get top accounts by type from Textron data
  const topAssets = getTopLedgersByType("Asset", 5);
  const topLiabilities = getTopLedgersByType("Liability", 5);
  const topRevenue = getTopLedgersByType("Income", 5);
  const topExpenses = getTopLedgersByType("Expense", 5);

  // Format data for charts
  const assetLiabilityData = [
    ...topAssets.slice(0, 3).map((item) => ({
      name: item["Ledger Name"].substring(0, 20) + "...",
      value: Math.abs(item["Closing Balance"]),
      type: "asset",
    })),
    ...topLiabilities.slice(0, 3).map((item) => ({
      name: item["Ledger Name"].substring(0, 20) + "...",
      value: Math.abs(item["Closing Balance"]),
      type: "liability",
    })),
  ];

  const revenueExpenseData = [
    ...topRevenue.slice(0, 3).map((item) => ({
      name: item["Ledger Name"].substring(0, 15) + "...",
      amount: Math.abs(item["Closing Balance"]),
      type: "income",
    })),
    ...topExpenses.slice(0, 3).map((item) => ({
      name: item["Ledger Name"].substring(0, 15) + "...",
      amount: Math.abs(item["Closing Balance"]),
      type: "expense",
    })),
  ];

  // Mock monthly trend data (since we don't have monthly breakdown in current data)
  const monthlyTrendData = [
    { month: "Apr", revenue: 7500000, expenses: 6500000 },
    { month: "May", revenue: 8200000, expenses: 7100000 },
    { month: "Jun", revenue: 8900000, expenses: 7600000 },
    { month: "Jul", revenue: 9100000, expenses: 7800000 },
    { month: "Aug", revenue: 9400000, expenses: 8000000 },
    { month: "Sep", revenue: 9200000, expenses: 7900000 },
    { month: "Oct", revenue: 9600000, expenses: 8200000 },
    { month: "Nov", revenue: 9800000, expenses: 8400000 },
    { month: "Dec", revenue: 10100000, expenses: 8600000 },
    { month: "Jan", revenue: 10300000, expenses: 8800000 },
    { month: "Feb", revenue: 10500000, expenses: 9000000 },
    { month: "Mar", revenue: 10800000, expenses: 9200000 },
  ];

  const topAccountsData = [
    ...topAssets.slice(0, 3).map((item) => ({
      name: item["Ledger Name"].substring(0, 15) + "...",
      amount: Math.abs(item["Closing Balance"]),
    })),
    ...topRevenue.slice(0, 3).map((item) => ({
      name: item["Ledger Name"].substring(0, 15) + "...",
      amount: Math.abs(item["Closing Balance"]),
    })),
  ];

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
  ];

  const formatChartCurrency = (value: number) => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(1)}Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    } else {
      return `₹${(value / 1000).toFixed(0)}K`;
    }
  };

  return (
    <div className="space-y-6 text-white">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Financial Charts</h2>
        <p className="text-white/60">
          Visual representation of financial data and trends
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assets vs Liabilities</CardTitle>
            <CardDescription>
              Comparison of major assets and liabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={assetLiabilityData}>
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={12}
                />
                <YAxis tickFormatter={formatChartCurrency} />
                <ChartTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded border border-white/10 bg-black/70 p-3 text-white shadow backdrop-blur-sm">
                          <p className="font-semibold">{label}</p>
                          <p className="text-[#4da3ff]">
                            {formatCurrency(payload[0].value as number)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" fill="#4da3ff">
                  {assetLiabilityData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.type === "asset" ? "#10b981" : "#f97316"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Expenses</CardTitle>
            <CardDescription>
              Top revenue sources and expense categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueExpenseData}>
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={12}
                />
                <YAxis tickFormatter={formatChartCurrency} />
                <ChartTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded border border-white/10 bg-black/70 p-3 text-white shadow backdrop-blur-sm">
                          <p className="font-semibold">{label}</p>
                          <p className="text-[#4da3ff]">
                            {formatCurrency(payload[0].value as number)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="amount" fill="#4da3ff">
                  {revenueExpenseData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.type === "income" ? "#10b981" : "#f97316"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
            <CardDescription>
              Revenue and expense trends over the year
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrendData}>
                <XAxis dataKey="month" />
                <YAxis tickFormatter={formatChartCurrency} />
                <ChartTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded border border-white/10 bg-black/70 p-3 text-white shadow backdrop-blur-sm">
                          <p className="font-semibold">{label}</p>
                          <p className="text-emerald-400">
                            Revenue:{" "}
                            {formatCurrency(payload[0].value as number)}
                          </p>
                          <p className="text-red-400">
                            Expenses:{" "}
                            {formatCurrency(payload[1].value as number)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#f97316"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Accounts Distribution</CardTitle>
            <CardDescription>
              Distribution of major accounts by value
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topAccountsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) =>
                    `${name}: ${formatChartCurrency(value)}`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {topAccountsData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded border border-white/10 bg-black/70 p-3 text-white shadow backdrop-blur-sm">
                          <p className="font-semibold">{payload[0].name}</p>
                          <p className="text-[#4da3ff]">
                            {formatCurrency(payload[0].value as number)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
