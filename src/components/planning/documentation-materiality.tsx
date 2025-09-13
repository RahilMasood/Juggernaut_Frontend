"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { RichTextEditor } from "../ui/rich-text-editor";
import { Save } from "lucide-react";

interface DocumentationMaterialityData {
  richTextDocumentation: string;
}

interface DocumentationMaterialityProps {
  onDataChange: (data: DocumentationMaterialityData) => void;
  initialData: DocumentationMaterialityData | null;
  crossSectionAnswers?: Record<string, string | number | boolean>;
}

export function DocumentationMateriality({
  onDataChange,
  initialData,
  crossSectionAnswers = {},
}: DocumentationMaterialityProps) {
  const [formData, setFormData] = useState({
    richTextDocumentation: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        richTextDocumentation: initialData.richTextDocumentation || "",
      });
    }
  }, [initialData]);

  const handleSave = () => {
    onDataChange(formData);
  };

  // Debug log for tracking cross-section answers (for future conditional logic)
  console.log(
    "DocumentationMateriality crossSectionAnswers:",
    crossSectionAnswers,
  );

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Additional Documentation</h3>
        <RichTextEditor
          content={formData.richTextDocumentation}
          onChange={(content) =>
            setFormData((prev) => ({ ...prev, richTextDocumentation: content }))
          }
          placeholder="Add any additional documentation, notes, or explanations regarding materiality determination..."
          label="Rich Text Documentation"
          className="space-y-2"
        />
      </div>

      <div className="flex justify-end pt-6">
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Documentation
        </Button>
      </div>
    </div>
  );
}
