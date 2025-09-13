import { Bell, HelpCircle, User, Wifi, Search, Database, Plus } from "lucide-react";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  getCompanyName,
  getFinancialYear,
} from "../lib/textron-data-processor";
import React from "react";

interface TopHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onToggleLibraries?: () => void;
  onAddFile?: () => void;
}

export function TopHeader({
  searchTerm,
  setSearchTerm,
  onToggleLibraries,
  onAddFile,
}: TopHeaderProps) {
  const companyName = getCompanyName();
  const financialYear = getFinancialYear();

  return (
    <div className="border-b border-white/10 bg-black/40 backdrop-blur-md">
      {/* Top row */}
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4da3ff]/20 ring-1 ring-[#4da3ff]/40">
            <span className="text-sm font-bold text-[#4da3ff]">TI</span>
          </div>
          <span className="text-lg font-semibold text-white">
            Textron Financial Dashboard
          </span>
        </div>
        <div className="flex items-center gap-6 text-white/70">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-white/50">Version</span>
            <Badge
              variant="outline"
              className="border-white/10 text-xs text-white/80"
            >
              1.0
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Wifi className="h-4 w-4 text-emerald-400" />
            <span className="text-white">Connected</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              title="Libraries"
              onClick={onToggleLibraries}
            >
              <Database className="h-5 w-5" />
            </button>
            <HelpCircle className="h-5 w-5 cursor-pointer text-white/70 transition-colors hover:text-white" />
            <div className="relative">
              <Bell className="h-5 w-5 cursor-pointer text-white/70 transition-colors hover:text-white" />
              <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500 ring-1 ring-white/40"></div>
            </div>
            <div className="flex cursor-pointer items-center gap-2 transition-colors hover:text-blue-600">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-white">Admin</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between bg-black/30 px-6 py-4 backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-bold text-white">
            {companyName} {financialYear}
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Financial Analysis & Reporting
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-white/50 md:block">
            Search across all data
          </span>
          <div className="relative w-80">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-white/40" />
            <Input
              placeholder="Search accounts, reports, transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-white/10 bg-transparent pl-10 text-white placeholder:text-white/40 focus-visible:border-[#4da3ff]/60 focus-visible:ring-[#4da3ff]/40"
            />
          </div>
          <button
            onClick={onAddFile}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 transition-all hover:bg-white/10 hover:text-white"
            title="Add file to library"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
