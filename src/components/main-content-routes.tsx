import React from "react";
import { OverviewSection } from "./overview-section";
import { FinancialRatiosSection } from "./financial-ratios-section";
import { BalanceSheetSection } from "./balance-sheet-section";
import { TrialBalanceSection } from "./trial-balance-section";
import { ProfitLossSection } from "./profit-loss-section";
import { ChartsSection } from "./charts-section";
import DocumentsPage from "./documents/DocumentsPage";
import LibrariesPage from "./libraries/LibrariesPage";
import RommLibraryPage from "../pages/RommLibraryPage";
import PayrollRunner from "./payroll/PayrollRunner";
import PayrollLanding from "./payroll/PayrollLanding";
import PayrollRomms from "./payroll/PayrollRomms";
import PPELanding from "./ppe/PPELanding";
import PPETailoringQuestions from "./payroll/ppe/PPETailoringQuestions";
import PPERomms from "./payroll/ppe/PPERomms";
import PPEInternalControls from "./payroll/ppe/PPEInternalControls";
import PPESubstantiveProcedures from "./payroll/ppe/PPESubstantiveProcedures";
import PPEIPETesting from "./payroll/ppe/PPEIPETesting";
import PPEExceptionTesting from "./payroll/ppe/PPEExceptionTesting";
import PPECwipAnalysis from "./payroll/ppe/PPECwipAnalysis";
import {
  ControlsPanel,
  TailoringQuestionsPanel,
} from "./payroll/PlaceholderPanels";
import SubstantiveProcedures from "./payroll/SubstantiveProcedures";
import { PlanningWorkflow } from "./planning/planning-workflow";
import { logger } from "../utils/logger";
import IntangibleAssetsLanding from "./intangible/IntangibleAssetsLanding";
import IATailoringQuestions from "./intangible/IATailoringQuestions";
import IAIPETesting from "./intangible/IAIPETesting";
import IAExceptionTesting from "./intangible/IAExceptionTesting";
import IAAdditionsDeletions from "./intangible/IAAdditionsDeletions";
import IASubstantiveProcedures from "./intangible/IASubstantiveProcedures";
import DepreciationLanding from "./intangible/DepreciationLanding";
import DepreciationTailoringQuestions from "./intangible/DepreciationTailoringQuestions";
import DepreciationRomms from "./intangible/DepreciationRomms";
import DepreciationInternalControls from "./intangible/DepreciationInternalControls";
import DepreciationSubstantive from "./intangible/DepreciationSubstantive";
import ImpairmentLanding from "./intangible/ImpairmentLanding";
import ImpairmentTailoringQuestions from "./intangible/ImpairmentTailoringQuestions";
import ImpairmentRomms from "./intangible/ImpairmentRomms";
import ImpairmentInternalControls from "./intangible/ImpairmentInternalControls";
import ImpairmentSubstantive from "./intangible/ImpairmentSubstantive";

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
    component: RommLibraryPage,
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
    component: PayrollLanding,
    requiresSetActiveSection: true,
  },
  "execution-ppe": {
    component: PPELanding,
    requiresSetActiveSection: true,
  },
  "execution-ia": {
    component: IntangibleAssetsLanding,
    requiresSetActiveSection: true,
  },
  "execution-depreciation": {
    component: DepreciationLanding,
    requiresSetActiveSection: true,
  },
  "execution-impairment": {
    component: ImpairmentLanding,
    requiresSetActiveSection: true,
  },
  "payroll-tailoring": {
    component: TailoringQuestionsPanel,
  },
  "payroll-controls": {
    component: ControlsPanel,
  },
  "ppe-tailoring": {
    component: PPETailoringQuestions,
  },
  "ppe-romms": {
    component: PPERomms,
  },
  "ppe-controls": {
    component: PPEInternalControls,
  },
  "ppe-substantive": {
    component: PPESubstantiveProcedures,
  },
  "ppe-ipe-testing": {
    component: PPEIPETesting,
  },
  "ppe-exception-testing": {
    component: PPEExceptionTesting,
  },
  "ppe-cwip-analysis": {
    component: PPECwipAnalysis,
  },
  // Intangible Assets reuse PPE components for substantive procedures
  "ia-tailoring": {
    component: IATailoringQuestions,
  },
  "ia-ipe-testing": {
    component: IAIPETesting,
  },
  "ia-exception-testing": {
    component: IAExceptionTesting,
  },
  "ia-additions-deletions": {
    component: IAAdditionsDeletions,
  },
  "depr-tailoring": { component: DepreciationTailoringQuestions },
  "depr-romms": { component: DepreciationRomms },
  "depr-controls": { component: DepreciationInternalControls },
  "depr-substantive": { component: DepreciationSubstantive },
  "imp-tailoring": { component: ImpairmentTailoringQuestions },
  "imp-romms": { component: ImpairmentRomms },
  "imp-controls": { component: ImpairmentInternalControls },
  "imp-substantive": { component: ImpairmentSubstantive },
};

/**
 * Special routes that require custom rendering logic
 */
export const specialRoutes = {
  "payroll-romms": "payroll-romms",
  "payroll-substantive": "payroll-substantive",
  "ppe-romms": "ppe-romms",
  "ppe-substantive": "ppe-substantive",
  "ia-substantive": "ia-substantive",
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

    case "ppe-romms":
      return (
        <PPERomms
          onBack={() => setActiveSection?.("execution-ppe")}
        />
      );

    case "ppe-substantive":
      return (
        <PPESubstantiveProcedures
          onBack={() => setActiveSection?.("execution-ppe")}
          setActiveSection={setActiveSection}
        />
      );

    case "ia-substantive":
      return (
        <IASubstantiveProcedures
          onBack={() => setActiveSection?.("execution-ia")}
          setActiveSection={setActiveSection}
        />
      );

    case "execution-payroll":
      if (!setActiveSection) return <PayrollRunner />;
      return <PayrollLanding onSelect={setActiveSection} />;

    case "execution-ppe":
      if (!setActiveSection) return <PPELanding onSelect={() => {}} />;
      return <PPELanding onSelect={setActiveSection} />;

    case "execution-ia":
      if (!setActiveSection) return <IntangibleAssetsLanding onSelect={() => {}} />;
      return <IntangibleAssetsLanding onSelect={setActiveSection} />;

    case "execution-depreciation":
      if (!setActiveSection) return <DepreciationLanding onSelect={() => {}} />;
      return <DepreciationLanding onSelect={setActiveSection} />;

    case "execution-impairment":
      if (!setActiveSection) return <ImpairmentLanding onSelect={() => {}} />;
      return <ImpairmentLanding onSelect={setActiveSection} />;

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
