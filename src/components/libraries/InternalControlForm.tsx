"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { RichTextEditor } from "../ui/rich-text-editor";
import { 
  X, 
  Shield,
  Save,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface ControlMetadata {
  typeOfControl: "Direct" | "Indirect" | "GITC";
  subtype: "Manual" | "Automated";
  controlId: string;
  controlName: string;
  workspace: string;
}

interface InternalControlFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (controlData: any) => void;
  metadata: ControlMetadata;
  template: any;
}

export default function InternalControlForm({ 
  isOpen, 
  onClose, 
  onSave,
  metadata,
  template
}: InternalControlFormProps) {
  const [formData, setFormData] = useState<any>({});
  const [activeSection, setActiveSection] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  useEffect(() => {
    if (isOpen && template) {
      // Initialize form data with metadata
      setFormData({
        controlMetadata: metadata,
        ...initializeFormData(template)
      });
      
      // Set first section as active
      if (template.sections && template.sections.length > 0) {
        setActiveSection(template.sections[0].id);
      }
    }
  }, [isOpen, template, metadata]);

  const initializeFormData = (template: any) => {
    const data: any = {};
    
    if (template.sections) {
      template.sections.forEach((section: any) => {
        data[section.id] = {};
        if (section.fields) {
          section.fields.forEach((field: any) => {
            // Handle nested fields (like control_attributes)
            if (field.fields) {
              field.fields.forEach((nestedField: any) => {
                data[section.id][nestedField.id] = getDefaultValueWithMetadata(nestedField, section.id);
              });
            } else {
              data[section.id][field.id] = getDefaultValueWithMetadata(field, section.id);
            }
          });
        }
      });
    }
    
    return data;
  };

  const getDefaultValueWithMetadata = (field: any, sectionId: string) => {
    // Map metadata fields to template fields
    const metadataMapping: { [key: string]: any } = {
      // Control Summary section mappings
      'control_id': metadata.controlId,
      'control_name': metadata.controlName,
      'workspace': metadata.workspace,
      'type_of_control': metadata.typeOfControl,
      'nature': metadata.subtype,
    };

    // If this field should be populated from metadata, use that value
    if (metadataMapping.hasOwnProperty(field.id)) {
      return metadataMapping[field.id] || getDefaultValue(field);
    }

    // Otherwise use default value
    return getDefaultValue(field);
  };

  const getDefaultValue = (field: any) => {
    switch (field.type) {
      case 'text':
        return '';
      case 'richText':
        return '';
      case 'dropdown':
        return field.options?.[0] || '';
      case 'multiSelectDropdown':
        return [];
      case 'toggle':
        return false;
      case 'number':
        return 0;
      case 'date':
        return '';
      case 'dateRange':
        return { start: '', end: '' };
      case 'table':
        return [];
      case 'repeatableGroup':
        return [];
      default:
        return '';
    }
  };

  const updateFormData = (sectionId: string, fieldId: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [fieldId]: value
      }
    }));
  };

  const renderField = (field: any, sectionId: string) => {
    const value = formData[sectionId]?.[field.id];
    
    switch (field.type) {
      case 'text':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-medium text-white">
              {field.label}
            </Label>
            <Input
              value={value || ''}
              onChange={(e) => updateFormData(sectionId, field.id, e.target.value)}
              className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
            />
          </div>
        );

      case 'richText':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-medium text-white">
              {field.label}
            </Label>
            <RichTextEditor
              content={value || ''}
              onChange={(content) => updateFormData(sectionId, field.id, content)}
              className="border-white/10 bg-white/5 text-white"
            />
          </div>
        );

      case 'dropdown':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-medium text-white">
              {field.label}
            </Label>
            <select
              value={value || ''}
              onChange={(e) => updateFormData(sectionId, field.id, e.target.value)}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white"
            >
              {field.options?.map((option: string) => (
                <option key={option} value={option} className="bg-gray-800">
                  {option}
                </option>
              ))}
            </select>
          </div>
        );

      case 'toggle':
        return (
          <div key={field.id} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => updateFormData(sectionId, field.id, e.target.checked)}
              className="h-4 w-4 rounded border-white/10 bg-white/5"
            />
            <Label className="text-sm font-medium text-white">
              {field.label}
            </Label>
          </div>
        );

      case 'display':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-medium text-white">
              {field.label}
            </Label>
            <div className="rounded-md border border-white/10 bg-white/5 p-3 text-white/80">
              {metadata.controlName || 'No description available'}
            </div>
          </div>
        );

      default:
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-medium text-white">
              {field.label} <Badge variant="outline" className="ml-2 text-xs">{field.type}</Badge>
            </Label>
            <Input
              value={value || ''}
              onChange={(e) => updateFormData(sectionId, field.id, e.target.value)}
              className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
              placeholder={`Enter ${field.label.toLowerCase()}`}
            />
          </div>
        );
    }
  };

  const renderSection = (section: any) => {
    if (!section.fields) return null;

    return (
      <div className="space-y-6">
        {section.fields.map((field: any) => {
          // Handle nested fields
          if (field.fields) {
            return (
              <div key={field.id} className="space-y-4">
                <h4 className="text-sm font-medium text-white">{field.label}</h4>
                <div className="space-y-4 pl-4 border-l border-white/10">
                  {field.fields.map((nestedField: any) => renderField(nestedField, section.id))}
                </div>
              </div>
            );
          }
          return renderField(field, section.id);
        })}
      </div>
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus({ type: null, message: '' });

    try {
      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update metadata from template fields if they were changed
      const updatedMetadata = { ...metadata };
      if (formData.control_summary) {
        if (formData.control_summary.control_id) {
          updatedMetadata.controlId = formData.control_summary.control_id;
        }
        if (formData.control_summary.control_name) {
          updatedMetadata.controlName = formData.control_summary.control_name;
        }
        if (formData.control_summary.workspace) {
          updatedMetadata.workspace = formData.control_summary.workspace;
        }
        if (formData.control_summary.control_attributes) {
          if (formData.control_summary.control_attributes.type_of_control) {
            updatedMetadata.typeOfControl = formData.control_summary.control_attributes.type_of_control;
          }
          if (formData.control_summary.control_attributes.nature) {
            updatedMetadata.subtype = formData.control_summary.control_attributes.nature;
          }
        }
      }

      const controlData = {
        ...formData,
        controlMetadata: updatedMetadata,
        createdAt: new Date().toISOString(),
        template: metadata.subtype.toLowerCase()
      };

      onSave(controlData);
      
      setSaveStatus({ 
        type: 'success', 
        message: 'Internal control saved successfully!' 
      });

      // Close after successful save
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus({ 
        type: 'error', 
        message: 'Failed to save control. Please try again.' 
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !template) return null;

  const currentSection = template.sections?.find((s: any) => s.id === activeSection);

  return (
    <div className="fixed inset-0 z-50 flex bg-black/50 backdrop-blur-sm">
      {/* Sidebar */}
      <div className="w-80 border-r border-white/10 bg-black/80">
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-[#4da3ff]" />
            <h2 className="font-semibold text-white">Internal Control</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Control Info */}
        <div className="border-b border-white/10 p-4">
          <h3 className="font-medium text-white">{metadata.controlName}</h3>
          <p className="text-sm text-white/60">{metadata.controlId}</p>
          <div className="mt-2 flex gap-2">
            <Badge variant="outline" className="text-xs">
              {metadata.typeOfControl}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {metadata.subtype}
            </Badge>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-2">
            {template.sections?.map((section: any, index: number) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full rounded-lg p-3 text-left text-sm transition-all ${
                  activeSection === section.id
                    ? "bg-[#4da3ff]/20 text-[#4da3ff]"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-white/10 text-xs">
                    {index + 1}
                  </span>
                  {section.label}
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Save Button */}
        <div className="border-t border-white/10 p-4">
          {saveStatus.type && (
            <div className={`mb-3 flex items-center gap-2 rounded-lg p-2 text-sm ${
              saveStatus.type === 'success' 
                ? 'bg-green-500/10 text-green-400' 
                : 'bg-red-500/10 text-red-400'
            }`}>
              {saveStatus.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {saveStatus.message}
            </div>
          )}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#4da3ff] text-white hover:bg-[#4da3ff]/80"
          >
            {saving ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Control
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-black/80">
        <div className="p-6">
          {currentSection && (
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-white">{currentSection.label}</CardTitle>
              </CardHeader>
              <CardContent>
                {renderSection(currentSection)}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
