"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Loader2 } from "lucide-react";
import { logger } from "../../utils/logger";

interface RommFormData {
  "romm-id": string;
  workspace: string;
  description: string;
  assertion: string;
}

interface RommFormProps {
  onSubmit: (data: RommFormData) => Promise<void>;
  isLoading?: boolean;
}

const WORKSPACE_OPTIONS = [
  "Equity & Reserves",
  "Borrowings",
  "Lease Liability",
  "Other Liabilities",
  "Trade Payable",
  "Provisions and Contingent Liabilities",
  "Income Tax",
  "Statutory Remittances",
  "Property, Plant & Equipment",
  "Intangible Assets",
  "Intangible Assets Under Development",
  "Impairment",
  "Investments",
  "Other Assets",
  "Trade Receivables",
  "Inventory",
  "Cash & Cash Equivalents",
  "Revenue from Operations",
  "Other Income",
  "Cost of materials consumed",
  "Employee Benefits Expense",
  "Depreciation & Amortisation Expense",
  "Finance Costs",
  "Other Expenses",
  "Service Auditor's Report",
  "Use of Auditor Specialist",
  "Management use of Expert",
  "Related Party Transaction",
  "Going Concern",
  "Opening Balance Testing",
  "Litigations & Claims",
  "Non-compliance with laws and regulations",
  "Using work of other auditor",
  "Review of estimates for management bias"
];

const ASSERTION_OPTIONS = [
  "Occurence",
  "Classification",
  "Cutoff",
  "Accuracy",
  "Existence",
  "Rights & Obligations",
  "Valuation",
  "Completeness"
];

export default function RommForm({ onSubmit, isLoading = false }: RommFormProps) {
  const [formData, setFormData] = useState<RommFormData>({
    "romm-id": "",
    workspace: "",
    description: "",
    assertion: ""
  });

  const [errors, setErrors] = useState<Partial<RommFormData>>({});

  const handleInputChange = (field: keyof RommFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<RommFormData> = {};

    if (!formData["romm-id"].trim()) {
      newErrors["romm-id"] = "ROMM ID is required";
    }

    if (!formData.workspace) {
      newErrors.workspace = "Workspace is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.assertion) {
      newErrors.assertion = "Assertion is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      logger.warn("Form validation failed", { errors });
      return;
    }

    try {
      await onSubmit(formData);
      // Reset form on successful submission for multiple entries
      setFormData({
        "romm-id": "",
        workspace: "",
        description: "",
        assertion: ""
      });
      setErrors({});
    } catch (error) {
      logger.error("Failed to submit ROMM form", { error, formData });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ROMM ID Field */}
      <div className="space-y-2">
        <Label htmlFor="romm-id" className="text-sm font-medium text-white">
          ROMM ID *
        </Label>
        <Input
          id="romm-id"
          value={formData["romm-id"]}
          onChange={(e) => handleInputChange("romm-id", e.target.value)}
          placeholder="Enter ROMM ID (e.g., EBE.SR.006)"
          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#4da3ff] focus:ring-[#4da3ff]/20"
          disabled={isLoading}
        />
        {errors["romm-id"] && (
          <p className="text-sm text-red-400">{errors["romm-id"]}</p>
        )}
      </div>

      {/* Workspace Field */}
      <div className="space-y-2">
        <Label htmlFor="workspace" className="text-sm font-medium text-white">
          Workspace *
        </Label>
        <Select
          value={formData.workspace}
          onValueChange={(value) => handleInputChange("workspace", value)}
          disabled={isLoading}
        >
          <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-[#4da3ff] focus:ring-[#4da3ff]/20">
            <SelectValue placeholder="Select workspace" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700">
            {WORKSPACE_OPTIONS.map((option) => (
              <SelectItem
                key={option}
                value={option}
                className="text-white hover:bg-gray-800 focus:bg-gray-800"
              >
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.workspace && (
          <p className="text-sm text-red-400">{errors.workspace}</p>
        )}
      </div>

      {/* Description Field */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium text-white">
          Description *
        </Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="Enter description"
          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#4da3ff] focus:ring-[#4da3ff]/20"
          disabled={isLoading}
        />
        {errors.description && (
          <p className="text-sm text-red-400">{errors.description}</p>
        )}
      </div>

      {/* Assertion Field */}
      <div className="space-y-2">
        <Label htmlFor="assertion" className="text-sm font-medium text-white">
          Assertion *
        </Label>
        <Select
          value={formData.assertion}
          onValueChange={(value) => handleInputChange("assertion", value)}
          disabled={isLoading}
        >
          <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-[#4da3ff] focus:ring-[#4da3ff]/20">
            <SelectValue placeholder="Select assertion" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700">
            {ASSERTION_OPTIONS.map((option) => (
              <SelectItem
                key={option}
                value={option}
                className="text-white hover:bg-gray-800 focus:bg-gray-800"
              >
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.assertion && (
          <p className="text-sm text-red-400">{errors.assertion}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-[#4da3ff] text-white hover:bg-[#4da3ff]/80 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit ROMM Entry"
          )}
        </Button>
      </div>
    </form>
  );
}
