"use client";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/HoverCard";
import { useState } from "react";
import {
  BarChart3,
  Building2,
  Calculator,
  FileText,
  Home,
  TrendingUp,
  Search,
  Filter,
  Settings,
  Download,
  ChevronRight,
  ChevronLeft,
  ClipboardList,
  Play,
  CheckCircle,
  Database,
  Activity,
  Trash2,
  Users,
  Target,
  Flag,
  ChartBar,
  BookOpen,
  Shield,
  AlertTriangle,
  Monitor,
  Workflow,
  XCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import React from "react";

interface LeftPanelProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

// Main icon categories in the icon strip
const mainCategories = [
  {
    id: "engagement-overview",
    title: "Engagement Overview ",
    icon: ChartBar,
    description: "Engagement overview",
  },
  {
    id: "planning-overview",
    title: "Planning ",
    icon: ClipboardList,
    description: "Planning phase ",
  },
  {
    id: "execution",
    title: "Execution",
    icon: Play,
    description: "Audit execution phase",
  },
  {
    id: "concluding",
    title: "Concluding Procedures",
    icon: CheckCircle,
    description: "Final audit procedures",
  },
  {
    id: "financial-data",
    title: "Financial Data",
    icon: Database,
    description: "Financial analysis & reports",
  },
  {
    id: "libraries",
    title: "Libraries",
    icon: Database,
    description: "Access various libraries",
  },
  {
    id: "engagement-diagnostics",
    title: "Engagement Diagnostics",
    icon: Activity,
    description: "Quality metrics & insights",
  },
  {
    id: "settings",
    title: "Settings",
    icon: Settings,
    description: "Configuration & preferences",
  },
  {
    id: "bin",
    title: "Bin",
    icon: Trash2,
    description: "Deleted items",
  },
];

// Financial data menu items (your existing menu)
const financialMenuItems = [
  { id: "overview", title: "Overview", icon: Home, description: "Key metrics" },
  {
    id: "financial-ratios",
    title: "Financial Ratios",
    icon: Calculator,
    description: "YoY Ratio Analysis",
  },
  {
    id: "balance-sheet",
    title: "Balance Sheet",
    icon: FileText,
    description: "Assets & Liabilities",
  },
  {
    id: "profit-loss",
    title: "Profit & Loss",
    icon: TrendingUp,
    description: "Income & Expenses",
  },
  {
    id: "trial-balance",
    title: "Trial Balance",
    icon: FileText,
    description: "Account balances",
  },
];

// Library items
const libraryItems = [
  {
    id: "information-library",
    title: "Information Library",
    description: "Access to information resources",
    icon: BookOpen,
  },
  {
    id: "internal-control-library",
    title: "Internal Control Library",
    description: "Internal control frameworks",
    icon: Shield,
  },
  {
    id: "romm-library",
    title: "ROMM Library",
    description: "Risk of Material Misstatement",
    icon: AlertTriangle,
  },
  {
    id: "control-owner-library",
    title: "Control Owner Library",
    description: "Control ownership matrix",
    icon: Users,
  },
  {
    id: "it-elements-library",
    title: "IT Elements Library",
    description: "IT controls and systems",
    icon: Monitor,
  },
  {
    id: "business-process-library",
    title: "Business Process Library",
    description: "Business process documentation",
    icon: Workflow,
  },
  {
    id: "document-library",
    title: "Document Library",
    description: "Upload and manage documents",
    icon: FileText,
  },
  {
    id: "deficiency-library",
    title: "Deficiency Library",
    description: "Track audit deficiencies",
    icon: XCircle,
  },
];

export function LeftPanel({ activeSection, setActiveSection }: LeftPanelProps) {
  const [searchFilter, setSearchFilter] = useState("");
  const [activeCategory, setActiveCategory] = useState("financial-data");
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Mock data for quick stats (replace with your actual data)
  const mockMetrics = {
    totalDebits: 1250000,
    totalCredits: 1180000,
    netPosition: 70000,
    profitMargin: 12.5,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const renderFinancialDataContent = () => (
    <>
      {/* Search & Filter Section */}
      <div className="border-b border-white/10 bg-white/5 p-4 backdrop-blur-sm">
        <h3 className="mb-3 text-sm font-semibold text-white">
          Search & Filter
        </h3>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-white/40" />
            <Input
              placeholder="Filter reports..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="border-white/10 pl-10 text-sm text-white placeholder:text-white/40 focus-visible:border-[#4da3ff]/60 focus-visible:ring-[#4da3ff]/40"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-white/10 bg-transparent text-xs text-white/80 hover:bg-white/10 hover:text-white"
            >
              <Filter className="mr-1 h-3 w-3" />
              Filter
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-white/10 bg-transparent text-xs text-white/80 hover:bg-white/10 hover:text-white"
            >
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Financial Reports Menu */}
      <div className="flex-1 p-4">
        <div className="mb-6">
          <h3 className="mb-4 flex items-center text-sm font-semibold text-white">
            <Building2 className="mr-2 h-4 w-4 text-[#4da3ff]" />
            Financial Reports
          </h3>
          <div className="space-y-1">
            {financialMenuItems.map((item) => {
              const isActive = activeSection === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm transition-all duration-200 ${
                    isActive
                      ? "border border-[#4da3ff]/30 bg-[#4da3ff]/15 text-white shadow-lg shadow-[#4da3ff]/10"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      isActive
                        ? "text-[#4da3ff]"
                        : "text-white/50 group-hover:text-white"
                    }`}
                  />
                  <div className="flex-1 text-left">
                    <div className="font-medium">{item.title}</div>
                    <div
                      className={`text-xs ${
                        isActive ? "text-[#4da3ff]/70" : "text-white/50"
                      }`}
                    >
                      {item.description}
                    </div>
                  </div>
                  {isActive && <ChevronRight className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 shadow-inner backdrop-blur-sm">
          <h4 className="mb-3 text-sm font-semibold text-white">
            Quick Overview
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/60">Total Debits</span>
              <span className="text-sm font-semibold text-white">
                {formatCurrency(mockMetrics.totalDebits)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/60">Total Credits</span>
              <span className="text-sm font-semibold text-red-400">
                {formatCurrency(mockMetrics.totalCredits)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/60">Net Position</span>
              <span
                className={`text-sm font-semibold ${
                  mockMetrics.netPosition >= 0
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {formatCurrency(mockMetrics.netPosition)}
              </span>
            </div>
            <div className="border-t border-white/10 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">Health Score</span>
                <Badge
                  className={`text-xs ${
                    mockMetrics.profitMargin > 15
                      ? "bg-emerald-500/15 text-emerald-300"
                      : mockMetrics.profitMargin > 5
                        ? "bg-amber-500/15 text-amber-300"
                        : "bg-red-500/15 text-red-300"
                  }`}
                >
                  {mockMetrics.profitMargin > 15
                    ? "Good"
                    : mockMetrics.profitMargin > 5
                      ? "Fair"
                      : "Poor"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderExecutionContent = () => (
    <>
      <div className="border-b border-white/10 bg-white/5 p-4 backdrop-blur-sm">
        <h3 className="mb-1 text-sm font-semibold text-white">Execution</h3>
        <p className="text-xs text-white/60">Run audit procedures</p>
      </div>
      <div className="flex-1 p-4">
        <div className="space-y-1">
          <button
            onClick={() => setActiveSection("execution-payroll")}
            className={`group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm transition-all duration-200 ${
              activeSection === "execution-payroll"
                ? "border border-[#4da3ff]/30 bg-[#4da3ff]/15 text-white shadow-lg shadow-[#4da3ff]/10"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Users
              className={`h-4 w-4 ${activeSection === "execution-payroll" ? "text-[#4da3ff]" : "text-white/50 group-hover:text-white"}`}
            />
            <div className="flex-1 text-left">
              <div className="font-medium">Employee Benefits Expense</div>
              <div
                className={`text-xs ${activeSection === "execution-payroll" ? "text-[#4da3ff]/70" : "text-white/50"}`}
              >
                Process employee benefit expense files
              </div>
            </div>
            {activeSection === "execution-payroll" && (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          
          <button
            onClick={() => setActiveSection("execution-ppe")}
            className={`group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm transition-all duration-200 ${
              activeSection === "execution-ppe"
                ? "border border-[#4da3ff]/30 bg-[#4da3ff]/15 text-white shadow-lg shadow-[#4da3ff]/10"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Building2
              className={`h-4 w-4 ${activeSection === "execution-ppe" ? "text-[#4da3ff]" : "text-white/50 group-hover:text-white"}`}
            />
            <div className="flex-1 text-left">
              <div className="font-medium">Property, Plant & Equipment</div>
              <div
                className={`text-xs ${activeSection === "execution-ppe" ? "text-[#4da3ff]/70" : "text-white/50"}`}
              >
                Process PPE audit procedures
              </div>
            </div>
            {activeSection === "execution-ppe" && (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          <button
            onClick={() => setActiveSection("execution-ia")}
            className={`group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm transition-all duration-200 ${
              activeSection === "execution-ia"
                ? "border border-[#4da3ff]/30 bg-[#4da3ff]/15 text-white shadow-lg shadow-[#4da3ff]/10"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Building2
              className={`h-4 w-4 ${activeSection === "execution-ia" ? "text-[#4da3ff]" : "text-white/50 group-hover:text-white"}`}
            />
            <div className="flex-1 text-left">
              <div className="font-medium">Intangible Assets</div>
              <div
                className={`text-xs ${activeSection === "execution-ia" ? "text-[#4da3ff]/70" : "text-white/50"}`}
              >
                Process Intangible Assets audit procedures
              </div>
            </div>
            {activeSection === "execution-ia" && (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </>
  );

  const renderLibrariesContent = () => (
    <>
      <div className="border-b border-white/10 bg-white/5 p-4 backdrop-blur-sm">
        <h3 className="mb-1 text-sm font-semibold text-white">Libraries</h3>
        <p className="text-xs text-white/60">Access various libraries and resources</p>
      </div>
      <div className="flex-1 p-4">
        <div className="space-y-1">
          {libraryItems.map((library) => {
            const isActive = activeSection === library.id;
            const Icon = library.icon;
            return (
              <button
                key={library.id}
                onClick={() => setActiveSection(library.id)}
                className={`group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm transition-all duration-200 ${
                  isActive
                    ? "border border-[#4da3ff]/30 bg-[#4da3ff]/15 text-white shadow-lg shadow-[#4da3ff]/10"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    isActive
                      ? "text-[#4da3ff]"
                      : "text-white/50 group-hover:text-white"
                  }`}
                />
                <div className="flex-1 text-left">
                  <div className="font-medium">{library.title}</div>
                  <div
                    className={`text-xs ${
                      isActive ? "text-[#4da3ff]/70" : "text-white/50"
                    }`}
                  >
                    {library.description}
                  </div>
                </div>
                {isActive && <ChevronRight className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );

  const renderPlaceholderContent = (
    categoryTitle: string,
    categoryIcon: React.ComponentType<{ className?: string }>,
  ) => {
    const Icon = categoryIcon;
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-white">
        <div className="mb-4 rounded-full bg-white/5 p-6">
          <Icon className="h-12 w-12 text-white/50" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-white">
          {categoryTitle}
        </h3>
        <p className="mb-6 max-w-xs text-sm text-white/60">
          This section is coming soon. Content and features for{" "}
          {categoryTitle.toLowerCase()} will be available here.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="border-white/10 text-xs text-white/80 hover:bg-white/10 hover:text-white"
        >
          Learn More
        </Button>
      </div>
    );
  };

  const planningMenuItems = [
    {
      id: "engagement-acceptance",
      title: "Engagement Acceptance",
      icon: ClipboardList,
      description: "Acceptance & continuance",
    },
    {
      id: "understanding-entity",
      title: "Understanding the Entity",
      icon: Users,
      description: "Entity & environment",
    },
    {
      id: "materiality",
      title: "Materiality",
      icon: Flag,
      description: "Materiality settings",
    },
    {
      id: "preliminary-analytical",
      title: "Preliminary Analytical",
      icon: BarChart3,
      description: "Analytical procedures",
    },
    {
      id: "fraud-risk",
      title: "Fraud Risk",
      icon: Target,
      description: "Fraud risk assessment",
    },
    {
      id: "it-risk",
      title: "IT Risk",
      icon: Activity,
      description: "IT risk assessment",
    },
  ] as const;

  const renderPlanningContent = () => (
    <>
      <div className="border-b border-white/10 bg-white/5 p-4 backdrop-blur-sm">
        <h3 className="mb-3 text-sm font-semibold text-white">
          Planning Workflows
        </h3>
        <p className="text-xs leading-relaxed text-white/60">
          Comprehensive audit planning dashboard with integrated workflows
        </p>
      </div>
      <div className="flex-1 p-4">
        <div className="space-y-3">
          {/* Planning Dashboard Button */}
          <button
            onClick={() => setActiveSection("planning")}
            className={`group flex w-full items-start gap-3 rounded-lg px-3 py-4 text-sm transition-all duration-200 ${
              activeSection === "planning" ||
              [
                "materiality",
                "understanding-entity",
                "engagement-acceptance",
                "fraud-risk",
                "it-risk",
                "preliminary-analytical",
              ].includes(activeSection)
                ? "border border-[#4da3ff]/30 bg-[#4da3ff]/15 text-white shadow-lg shadow-[#4da3ff]/10"
                : "border border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <ClipboardList
              className={`mt-0.5 h-5 w-5 ${
                activeSection === "planning" ||
                [
                  "materiality",
                  "understanding-entity",
                  "engagement-acceptance",
                  "fraud-risk",
                  "it-risk",
                  "preliminary-analytical",
                ].includes(activeSection)
                  ? "text-[#4da3ff]"
                  : "text-white/50 group-hover:text-white"
              }`}
            />
            <div className="flex-1 text-left">
              <div className="font-semibold">Planning Dashboard</div>
              <div
                className={`mt-1 text-xs leading-relaxed ${
                  activeSection === "planning" ||
                  [
                    "materiality",
                    "understanding-entity",
                    "engagement-acceptance",
                    "fraud-risk",
                    "it-risk",
                    "preliminary-analytical",
                  ].includes(activeSection)
                    ? "text-[#4da3ff]/70"
                    : "text-white/50"
                }`}
              >
                Unified interface for all planning workflows including
                materiality, risk assessment, entity understanding, and
                analytical procedures
              </div>
            </div>
            {(activeSection === "planning" ||
              [
                "materiality",
                "understanding-entity",
                "engagement-acceptance",
                "fraud-risk",
                "it-risk",
                "preliminary-analytical",
              ].includes(activeSection)) && (
              <ChevronRight className="mt-1 h-4 w-4" />
            )}
          </button>

          {/* Planning Info Card */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <h4 className="mb-2 text-xs font-semibold text-white/80">
              Includes:
            </h4>
            <div className="space-y-1">
              {[
                "Materiality Planning",
                "Entity Understanding",
                "Engagement Acceptance",
                "Risk Assessments",
                "Analytical Procedures",
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-xs text-white/60"
                >
                  <div className="h-1 w-1 rounded-full bg-[#4da3ff]"></div>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderCategoryContent = () => {
    const category = mainCategories.find((cat) => cat.id === activeCategory);

    switch (activeCategory) {
      case "financial-data":
        return renderFinancialDataContent();
      case "planning-overview":
        return renderPlanningContent();
      case "execution":
        return renderExecutionContent();
      case "libraries":
        return renderLibrariesContent();
      default:
        return renderPlaceholderContent(
          category?.title || "Section",
          category?.icon || Home,
        );
    }
  };

  return (
    <div className="flex border-r border-white/10 bg-black/60 backdrop-blur-lg">
      {/* Icon strip */}
      <div className="flex w-16 flex-col items-center space-y-3 border-r border-white/10 bg-gradient-to-b from-black to-black/90 py-6">
        <div className="mb-4 -rotate-90 transform text-xs font-semibold whitespace-nowrap text-white/40">
          MENU
        </div>
        <div className="flex flex-1 flex-col items-center space-y-3">
          {mainCategories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            return (
              <HoverCard key={category.id}>
                <HoverCardTrigger asChild>
                  <button
                    onClick={() => {
                      setActiveCategory(category.id);
                      // Reset active section when switching categories
                      if (category.id === "financial-data") {
                        setActiveSection("overview");
                      } else if (category.id === "libraries") {
                        setActiveSection("libraries");
                      } else if (category.id === "planning-overview") {
                        setActiveSection("planning");
                      }
                    }}
                    className={`rounded-lg p-2 transition-all duration-300 ${
                      isActive
                        ? "border border-[#4da3ff]/40 bg-[#4da3ff]/20 text-[#4da3ff] shadow-lg shadow-[#4da3ff]/20"
                        : "text-white/60 hover:bg-white/10 hover:text-white"
                    }`}
                    title={category.title}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                </HoverCardTrigger>
                <HoverCardContent className="w-64 border-white/10 bg-black/70 text-white/90 shadow-xl shadow-black/40 backdrop-blur-md">
                  <p>{category.title}</p>
                </HoverCardContent>
              </HoverCard>
            );
          })}
        </div>
        <div className="mt-4">
          <button
            onClick={() => setIsCollapsed((v) => !v)}
            className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            title={isCollapsed ? "Expand panel" : "Collapse panel"}
            aria-label={isCollapsed ? "Expand panel" : "Collapse panel"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Left Panel Content */}
      <div
        className={`flex flex-col bg-black/40 text-white backdrop-blur-xl transition-all duration-300 ${
          isCollapsed ? "pointer-events-none w-0 opacity-0" : "w-72"
        }`}
      >
        {!isCollapsed && renderCategoryContent()}
      </div>
    </div>
  );
}
