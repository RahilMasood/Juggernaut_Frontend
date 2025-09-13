"use client";

import React from "react";
import { Building2 } from "lucide-react";
import { getCompanyName } from "../lib/textron-data-processor";
import PayrollLanding from "./payroll/PayrollLanding";
import {
  mainContentRoutes,
  specialRoutes,
  renderSpecialRoute,
} from "./main-content-routes";

interface MainContentProps {
  activeSection: string;
  searchTerm: string;
  setActiveSection?: (section: string) => void;
}

export function MainContent({
  activeSection,
  searchTerm,
  setActiveSection,
}: MainContentProps) {
  const companyName = getCompanyName();

  const renderContent = () => {
    // Handle special routes with custom logic
    if (activeSection in specialRoutes) {
      const specialContent = renderSpecialRoute(
        activeSection,
        searchTerm,
        setActiveSection,
      );
      if (specialContent) return specialContent;
    }

    // Handle regular routes using configuration
    const routeConfig = mainContentRoutes[activeSection];
    if (routeConfig) {
      const Component = routeConfig.component;
      const props = { ...routeConfig.props };

      // Replace searchTerm placeholder with actual value
      if (props.searchTerm === true) {
        props.searchTerm = searchTerm;
      }

      // Handle components that need setActiveSection
      if (routeConfig.requiresSetActiveSection && setActiveSection) {
        return <PayrollLanding onSelect={setActiveSection} />;
      }

      return <Component {...props} />;
    }

    // Default fallback
    return (
      <div className="flex h-full items-center justify-center">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100">
            <Building2 className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="mb-3 text-2xl font-bold text-gray-900">
            Select a Report
          </h2>
          <p className="leading-relaxed text-gray-600">
            Choose a financial report from the left panel to view detailed
            analysis and insights for {companyName}.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-auto bg-transparent">
      <div className="p-8">{renderContent()}</div>
    </div>
  );
}
