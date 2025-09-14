"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RichTextEditor } from "../ui/rich-text-editor";
import { 
  X, 
  Shield,
  Save,
  Edit,
  Eye,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface InternalControlViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updatedControl: any) => void;
  control: any; // The control data to display
  template: any; // The template structure
  mode?: 'view' | 'edit'; // View mode or edit mode
}

export default function InternalControlViewerModal({ 
  isOpen, 
  onClose, 
  onSave,
  control,
  template,
  mode = 'view'
}: InternalControlViewerModalProps) {
  
  const [formData, setFormData] = useState<any>({});
  const [activeSection, setActiveSection] = useState<string>("");
  const [isEditing, setIsEditing] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  useEffect(() => {
    if (isOpen && control && template) {
      // Initialize form data with control data, ensuring metadata is properly mapped
      const mappedData = mapControlDataToTemplate(control, template);
      setFormData(mappedData);
      
      // Set first section as active
      if (template.sections && template.sections.length > 0) {
        setActiveSection(template.sections[0].id);
      }
    }
  }, [isOpen, control, template]);

  const mapControlDataToTemplate = (control: any, template: any) => {
    // Start with the existing control data
    const mappedData = { ...control };
    
    // Ensure control_summary section has the metadata properly mapped
    if (control.controlMetadata && template.sections) {
      const controlSummarySection = template.sections.find((s: any) => s.id === 'control_summary');
      if (controlSummarySection && !mappedData.control_summary) {
        mappedData.control_summary = {};
      }
      
      // Map metadata to template fields
      if (mappedData.control_summary) {
        mappedData.control_summary.control_id = control.controlMetadata.controlId || '';
        mappedData.control_summary.control_name = control.controlMetadata.controlName || '';
        mappedData.control_summary.workspace = control.controlMetadata.workspace || '';
        
        // Handle nested control_attributes
        if (!mappedData.control_summary.control_attributes) {
          mappedData.control_summary.control_attributes = {};
        }
        mappedData.control_summary.control_attributes.type_of_control = control.controlMetadata.typeOfControl || '';
        mappedData.control_summary.control_attributes.nature = control.controlMetadata.subtype || '';
      }
    }
    
    return mappedData;
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

  const renderField = (field: any, sectionId: string, isReadOnly: boolean) => {
    const value = formData[sectionId]?.[field.id];
    
    switch (field.type) {
      case 'text':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-white">{field.label}</Label>
            {isReadOnly ? (
              <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                {value || '-'}
              </div>
            ) : (
              <Input
                value={value || ''}
                onChange={(e) => updateFormData(sectionId, field.id, e.target.value)}
                className="border-white/10 bg-white/5 text-white"
              />
            )}
          </div>
        );
      
      case 'richText':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-white">{field.label}</Label>
            {isReadOnly ? (
              <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                <div dangerouslySetInnerHTML={{ __html: value || '-' }} />
              </div>
            ) : (
              <RichTextEditor
                content={value || ''}
                onChange={(content) => updateFormData(sectionId, field.id, content)}
              />
            )}
          </div>
        );
      
      case 'dropdown':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-white">{field.label}</Label>
            {isReadOnly ? (
              <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                {value || '-'}
              </div>
            ) : (
              <select
                value={value || ''}
                onChange={(e) => updateFormData(sectionId, field.id, e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white"
              >
                <option value="">Select...</option>
                {field.options?.map((option: string) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            )}
          </div>
        );
      
      case 'toggle':
        return (
          <div key={field.id} className="flex items-center space-x-2">
            {isReadOnly ? (
              <div className="flex items-center space-x-2">
                <div className={`h-4 w-4 rounded ${value ? 'bg-green-500' : 'bg-gray-500'}`} />
                <Label className="text-white">{field.label}</Label>
              </div>
            ) : (
              <>
                <input
                  type="checkbox"
                  checked={value || false}
                  onChange={(e) => updateFormData(sectionId, field.id, e.target.checked)}
                  className="rounded border-white/10"
                />
                <Label className="text-white">{field.label}</Label>
              </>
            )}
          </div>
        );
      
      default:
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-white">{field.label}</Label>
            <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
              {value || '-'}
            </div>
          </div>
        );
    }
  };

  const renderSection = (section: any) => {
    return (
      <div className="space-y-6">
        {section.fields?.map((field: any) => {
          if (field.fields) {
            // Handle nested fields
            return (
              <div key={field.id} className="space-y-4">
                <h3 className="text-lg font-medium text-white">{field.label}</h3>
                <div className="space-y-4">
                  {field.fields.map((nestedField: any) => 
                    renderField(nestedField, section.id, !isEditing)
                  )}
                </div>
              </div>
            );
          }
          return renderField(field, section.id, !isEditing);
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
      const updatedMetadata = { ...control.controlMetadata };
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

      const updatedControl = {
        ...formData,
        controlMetadata: updatedMetadata,
        updatedAt: new Date().toISOString()
      };

      if (onSave) {
        onSave(updatedControl);
      }
      
      setSaveStatus({ 
        type: 'success', 
        message: 'Control updated successfully!' 
      });

      setIsEditing(false);

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

  const handleClose = () => {
    setIsEditing(mode === 'edit');
    setSaveStatus({ type: null, message: '' });
    onClose();
  };

  if (!isOpen || !control || !template) {
    return null;
  }

  const currentSection = template.sections?.find((s: any) => s.id === activeSection);

  return (
    <div className="fixed inset-0 z-50 flex bg-black/50 backdrop-blur-sm">
      {/* Sidebar */}
      <div className="w-80 border-r border-white/10 bg-black/80">
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-[#4da3ff]" />
            <h2 className="font-semibold text-white">
              {isEditing ? 'Edit Control' : 'View Control'}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-white/60 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Control Info */}
        <div className="border-b border-white/10 p-4">
          <h3 className="font-medium text-white">{control.controlMetadata?.controlName}</h3>
          <p className="text-sm text-white/60">{control.controlMetadata?.controlId}</p>
          <div className="mt-2 flex gap-2">
            <Badge variant="outline" className="text-xs">
              {control.controlMetadata?.typeOfControl}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {control.controlMetadata?.subtype}
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
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-black/90">
        {/* Header */}
        <div className="border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-white">
                {currentSection?.label || 'Control Details'}
              </h1>
              <p className="text-sm text-white/60 mt-1">
                {control.controlMetadata?.controlName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="border-white/20 text-white hover:bg-white/5"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-600 text-white hover:bg-green-700"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Save Status */}
          {saveStatus.type && (
            <div className={`mt-4 flex items-center gap-2 rounded-lg p-3 ${
              saveStatus.type === 'success' 
                ? 'bg-green-600/20 border border-green-600/30' 
                : 'bg-red-600/20 border border-red-600/30'
            }`}>
              {saveStatus.type === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-400" />
              )}
              <span className={`text-sm ${
                saveStatus.type === 'success' ? 'text-green-300' : 'text-red-300'
              }`}>
                {saveStatus.message}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentSection ? (
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  {currentSection.label}
                  {isEditing && <Badge variant="outline" className="text-xs">Editing</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderSection(currentSection)}
              </CardContent>
            </Card>
          ) : (
            <div className="text-center text-white/60 py-12">
              <Shield className="mx-auto h-12 w-12 mb-4 text-white/40" />
              <p>Select a section from the sidebar to view its details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}