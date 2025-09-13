import React from "react";
import { OverviewSection } from "./overview-section";
import { FinancialRatiosSection } from "./financial-ratios-section";
import { BalanceSheetSection } from "./balance-sheet-section";
import { TrialBalanceSection } from "./trial-balance-section";
import { ProfitLossSection } from "./profit-loss-section";
import { ChartsSection } from "./charts-section";
import DocumentsPage from "./documents/DocumentsPage";
import LibrariesPage from "./libraries/LibrariesPage";
import PayrollRunner from "./payroll/PayrollRunner";
import PayrollLanding from "./payroll/PayrollLanding";
import PayrollRomms from "./payroll/PayrollRomms";
import {
  ControlsPanel,
  TailoringQuestionsPanel,
} from "./payroll/PlaceholderPanels";
import SubstantiveProcedures from "./payroll/SubstantiveProcedures";
import { PlanningWorkflow } from "./planning/planning-workflow";
import { logger } from "../utils/logger";

export interface RouteConfig {
  component: React.ComponentType<any>;
  props?: Record<string, any>;
  requiresSetActiveSection?: boolean;
}

/**
 * Configuration object for main content routes.
 * Maps section names to their corresponding components and props.
 */
export const mainContentRoutes: Record<string, RouteConfig> = {
  overview: {
    component: OverviewSection,
  },
  "financial-ratios": {
    component: FinancialRatiosSection,
  },
  "balance-sheet": {
    component: BalanceSheetSection,
    props: { searchTerm: true }, // Will be replaced with actual searchTerm
  },
  "trial-balance": {
    component: TrialBalanceSection,
    props: { searchTerm: true }, // Will be replaced with actual searchTerm
  },
  "profit-loss": {
    component: ProfitLossSection,
    props: { searchTerm: true }, // Will be replaced with actual searchTerm
  },
  charts: {
    component: ChartsSection,
  },
  libraries: {
    component: LibrariesPage,
  },
  "information-library": {
    component: LibrariesPage,
  },
  "internal-control-library": {
    component: LibrariesPage,
  },
  "romm-library": {
    component: LibrariesPage,
  },
  "control-owner-library": {
    component: LibrariesPage,
  },
  "it-elements-library": {
    component: LibrariesPage,
  },
  "business-process-library": {
    component: LibrariesPage,
  },
  "document-library": {
    component: DocumentsPage,
  },
  "deficiency-library": {
    component: LibrariesPage,
  },
  "execution-payroll": {
    component: PayrollRunner,
    requiresSetActiveSection: true,
  },
  "payroll-tailoring": {
    component: TailoringQuestionsPanel,
  },
  "payroll-controls": {
    component: ControlsPanel,
  },
};

/**
 * Special routes that require custom rendering logic
 */
export const specialRoutes = {
  "payroll-romms": "payroll-romms",
  "payroll-substantive": "payroll-substantive",
  planning: "planning",
  "engagement-acceptance": "planning",
  "fraud-risk": "planning",
  "it-risk": "planning",
  materiality: "planning",
  "preliminary-analytical": "planning",
  "understanding-entity": "planning",
};

/**
 * Renders special route components that require custom logic
 */
export function renderSpecialRoute(
  activeSection: string,
  searchTerm: string,
  setActiveSection?: (section: string) => void
): React.ReactNode {
  switch (activeSection) {
    case "payroll-romms":
      return (
        <PayrollRomms
          onBack={() => setActiveSection?.("execution-payroll")}
          onComplete={(data: any) => {
            logger.dataSave("ROMMS", data);
            setActiveSection?.("execution-payroll");
          }}
        />
      );

    case "payroll-substantive":
      return (
        <SubstantiveProcedures
          onBack={() => setActiveSection?.("execution-payroll")}
        />
      );

    case "execution-payroll":
      if (!setActiveSection) return <PayrollRunner />;
      return <PayrollLanding onSelect={setActiveSection} />;

    case "planning":
    case "engagement-acceptance":
    case "fraud-risk":
    case "it-risk":
    case "materiality":
    case "preliminary-analytical":
    case "understanding-entity":
      const initialTab = activeSection === "planning" ? "dashboard" : activeSection;
      return <PlanningWorkflow initialTab={initialTab} />;

    default:
      return null;
  }
}
