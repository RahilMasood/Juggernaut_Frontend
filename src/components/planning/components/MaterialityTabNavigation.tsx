import React from "react";
import { TabsList, TabsTrigger } from "../../ui/tabs";
import {
  Calculator,
  RefreshCw,
  FileText,
  Users,
  FileCheck,
} from "lucide-react";

interface MaterialityTabNavigationProps {
  isPlanningComplete: boolean;
}

/**
 * Navigation component for materiality assessment tabs.
 * Displays the tab navigation with appropriate icons and disabled states.
 */
export function MaterialityTabNavigation({
  isPlanningComplete,
}: MaterialityTabNavigationProps) {
  return (
    <TabsList className="grid w-full grid-cols-5">
      <TabsTrigger value="planning" className="flex items-center gap-2">
        <Calculator className="h-4 w-4" />
        Planning
      </TabsTrigger>
      <TabsTrigger value="abcotd" className="flex items-center gap-2">
        <FileText className="h-4 w-4" />
        ABCOTD
      </TabsTrigger>
      <TabsTrigger value="component" className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        Component
      </TabsTrigger>
      <TabsTrigger value="documentation" className="flex items-center gap-2">
        <FileCheck className="h-4 w-4" />
        Documentation
      </TabsTrigger>
      <TabsTrigger
        value="revision"
        className="flex items-center gap-2"
        disabled={!isPlanningComplete}
      >
        <RefreshCw className="h-4 w-4" />
        Revision
      </TabsTrigger>
    </TabsList>
  );
}
