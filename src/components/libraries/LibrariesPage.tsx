"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { 
  BookOpen, 
  Shield, 
  AlertTriangle, 
  Users, 
  Monitor, 
  Workflow, 
  FileText, 
  XCircle,
  ChevronRight,
  ArrowLeft
} from "lucide-react";
import DocumentsPage from "../documents/DocumentsPage";
import { logger } from "../../utils/logger";
import { fileManager, FileMetadata } from "../../utils/file-manager";
import InternalControlViewerModal from "./InternalControlViewerModal";
import InternalControlForm from "./InternalControlForm";
import { CONTROL_TEMPLATES } from "../../constants/ControlTemplates";

interface LibraryItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  component?: React.ComponentType<any>;
}

interface ControlMetadata {
  typeOfControl: "Direct" | "Indirect" | "GITC";
  subtype: "Manual" | "Automated";
  controlId: string;
  controlName: string;
  workspace: string;
}

const libraryItems: LibraryItem[] = [
  {
    id: "information-library",
    title: "Information Library",
    description: "Access to information resources and documentation",
    icon: BookOpen,
    accent: "from-blue-500/20 to-indigo-500/20",
  },
  {
    id: "internal-control-library",
    title: "Internal Control Library",
    description: "Internal control frameworks and procedures",
    icon: Shield,
    accent: "from-green-500/20 to-emerald-500/20",
  },
  {
    id: "romm-library",
    title: "ROMM Library",
    description: "Risk of Material Misstatement library",
    icon: AlertTriangle,
    accent: "from-amber-500/20 to-orange-500/20",
  },
  {
    id: "control-owner-library",
    title: "Control Owner Library",
    description: "Control ownership and responsibility matrix",
    icon: Users,
    accent: "from-purple-500/20 to-violet-500/20",
  },
  {
    id: "it-elements-library",
    title: "IT Elements Library",
    description: "IT controls and system documentation",
    icon: Monitor,
    accent: "from-cyan-500/20 to-teal-500/20",
  },
  {
    id: "business-process-library",
    title: "Business Process Library",
    description: "Business process documentation and workflows",
    icon: Workflow,
    accent: "from-pink-500/20 to-rose-500/20",
  },
  {
    id: "document-library",
    title: "Document Library",
    description: "Upload and manage supporting documents",
    icon: FileText,
    accent: "from-slate-500/20 to-gray-500/20",
  },
  {
    id: "deficiency-library",
    title: "Deficiency Library",
    description: "Track and manage audit deficiencies",
    icon: XCircle,
    accent: "from-red-500/20 to-rose-500/20",
  },
];

interface RommData {
  id: string;
  risk: string;
  assertion: string;
  options: string[];
  section: string;
}

interface InternalControl {
  id: string;
  controlMetadata: {
    typeOfControl: string;
    subtype: string;
    controlId: string;
    controlName: string;
    workspace: string;
  };
  createdAt: string;
  template: string;
}

interface LibrariesPageProps {
  onBack?: () => void;
  activeSection?: string;
}

export default function LibrariesPage({ onBack, activeSection }: LibrariesPageProps) {
  const [selectedLibrary, setSelectedLibrary] = useState<string | null>(null);
  const [rommData, setRommData] = useState<RommData[]>([]);
  const [libraryFiles, setLibraryFiles] = useState<FileMetadata[]>([]);
  const [internalControls, setInternalControls] = useState<InternalControl[]>([]);
  const [loading, setLoading] = useState(false);
  const [filesLoading, setFilesLoading] = useState(false);
  
  // Control viewer modal state
  const [selectedControl, setSelectedControl] = useState<any>(null);
  const [controlTemplate, setControlTemplate] = useState<any>(null);
  const [isControlViewerOpen, setIsControlViewerOpen] = useState(false);
  
  // Control form state
  const [selectedControlForm, setSelectedControlForm] = useState<{
    metadata: ControlMetadata;
    template: any;
  } | null>(null);

  // Load ROMM data from Structure.json
  useEffect(() => {
    const loadRommData = async () => {
      setLoading(true);
      try {
        // Load the Structure.json file from the payroll directory
        const response = await fetch("/payroll/Structure.json");
        if (!response.ok) {
          throw new Error("Failed to load Structure.json");
        }
        const structureData = await response.json();

        // Load Instructions.json to get ROMM details
        const instructionsResponse = await fetch("/payroll/Instructions.json");
        if (!instructionsResponse.ok) {
          throw new Error("Failed to load Instructions.json");
        }
        const instructionsData = await instructionsResponse.json();

        // Extract ROMM data from structure and instructions
        const romms: RommData[] = [];
        
        // Get ROMMs from Instructions.json
        if (instructionsData.romms) {
          instructionsData.romms.forEach((romm: any) => {
            romms.push({
              id: romm.id,
              risk: romm.risk,
              assertion: romm.assertion,
              options: romm.options,
              section: "Employee Benefits Expense" // Default section for now
            });
          });
        }

        // Also check Structure.json for any additional ROMMs
        Object.keys(structureData).forEach(key => {
          if (key.startsWith("EBE.SR.") && !romms.find(r => r.id === key)) {
            romms.push({
              id: key,
              risk: `Risk for ${key}`,
              assertion: "Unknown",
              options: ["Lower", "Higher", "Significant", "NRPMM"],
              section: "Employee Benefits Expense"
            });
          }
        });

        setRommData(romms);
      } catch (error) {
        console.error("Error loading ROMM data:", error);
        // Fallback to hardcoded data if file loading fails
        const fallbackData: RommData[] = [
          {
            id: "EBE.SR.001",
            risk: "Payroll expenses is recorded that did not occur",
            assertion: "Occurrence",
            options: ["Lower", "Higher", "Significant", "NRPMM"],
            section: "Employee Benefits Expense"
          },
          {
            id: "EBE.SR.002",
            risk: "Payroll expenses is incomplete",
            assertion: "Completeness",
            options: ["Lower", "Higher", "Significant", "NRPMM"],
            section: "Employee Benefits Expense"
          },
          {
            id: "EBE.SR.003",
            risk: "Payroll expenses is recorded in incorrect period",
            assertion: "Cutoff",
            options: ["Lower", "Higher", "Significant", "NRPMM"],
            section: "Employee Benefits Expense"
          },
          {
            id: "EBE.SR.004",
            risk: "Payroll expenses is not recorded at proper amount",
            assertion: "Accuracy",
            options: ["Lower", "Higher", "Significant", "NRPMM"],
            section: "Employee Benefits Expense"
          },
          {
            id: "EBE.SR.005",
            risk: "Payroll expenses is not recorded in proper account",
            assertion: "Classification",
            options: ["Lower", "Higher", "Significant", "NRPMM"],
            section: "Employee Benefits Expense"
          },
        ];
        setRommData(fallbackData);
      } finally {
        setLoading(false);
      }
    };

    loadRommData();
  }, []);

  // Determine selected library based on activeSection
  useEffect(() => {
    if (activeSection && activeSection.includes("-library")) {
      setSelectedLibrary(activeSection);
    } else if (activeSection === "libraries") {
      setSelectedLibrary(null);
    }
  }, [activeSection]);

  // Load files when library is selected
  useEffect(() => {
    if (selectedLibrary) {
      loadLibraryFiles(selectedLibrary);
      if (selectedLibrary === 'internal-control-library') {
        loadInternalControls();
      }
    }
  }, [selectedLibrary]);

  const loadLibraryFiles = async (libraryId: string) => {
    setFilesLoading(true);
    try {
      const files = await fileManager.getFilesForLibrary(libraryId);
      setLibraryFiles(files);
    } catch (error) {
      console.error("Error loading library files:", error);
      setLibraryFiles([]);
    } finally {
      setFilesLoading(false);
    }
  };

  const loadInternalControls = async () => {
    try {
      const controls: any[] = [];
      
      // Load from cloud storage
      if (window.cloud) {
        try {
          const result = await window.cloud.list({ container: 'juggernaut' });
          if (result.success && result.files) {
            // Filter for internal control files (JSON files)
            const controlFiles = result.files.filter((file: any) => 
              file.name.endsWith('.json') && 
              file.reference && 
              file.reference.includes('Internal Control:')
            );
            
            // Load each control file
            for (const file of controlFiles) {
              try {
                const downloadResult = await window.cloud.download({
                  container: 'juggernaut',
                  filename: file.name,
                  downloadPath: `temp_${file.name}`
                });
                
                if (downloadResult.success) {
                  const fs = window.require('fs');
                  const path = window.require('path');
                  const os = window.require('os');
                  
                  const tempFilePath = path.join(os.tmpdir(), `temp_${file.name}`);
                  const fileContent = fs.readFileSync(tempFilePath, 'utf8');
                  const controlData = JSON.parse(fileContent);
                  
                  // Clean up temp file
                  fs.unlinkSync(tempFilePath);
                  
                  // Add to controls list
                  controls.push({
                    id: controlData.controlMetadata.controlId,
                    ...controlData,
                    createdAt: file.name.replace('.json', ''), // Use controlId as timestamp for now
                    template: controlData.controlMetadata.subtype.toLowerCase()
                  });
                }
              } catch (fileError) {
                console.error(`Error loading control file ${file.name}:`, fileError);
              }
            }
          }
        } catch (cloudError) {
          console.error('Error loading from cloud storage:', cloudError);
        }
      }
      
      // Fallback to localStorage if cloud storage fails or no controls found
      if (controls.length === 0) {
        const savedControls = localStorage.getItem('internalControls');
        if (savedControls) {
          const parsedControls = JSON.parse(savedControls);
          controls.push(...parsedControls);
        } else {
          // Load from the existing payroll internal control library as examples
          const response = await fetch('/payroll/InternalControlLibrary.json');
          if (response.ok) {
            const existingControls = await response.json();
            const formattedControls = existingControls.map((control: any, index: number) => ({
              id: `ic-${index}`,
              controlMetadata: {
                typeOfControl: 'Direct',
                subtype: control.control_type === 'Detective' ? 'Manual' : 'Manual',
                controlId: control.control_id,
                controlName: control.control_name,
                workspace: 'Payroll'
              },
              createdAt: new Date().toISOString(),
              template: 'manual'
            }));
            controls.push(...formattedControls);
          }
        }
      }
      
      setInternalControls(controls);
    } catch (error) {
      console.error('Error loading internal controls:', error);
      setInternalControls([]);
    }
  };

  const handleLibrarySelect = (libraryId: string) => {
    setSelectedLibrary(libraryId);
    logger.dataAccess("Library", libraryId);
  };

  const handleRommSelect = (rommId: string) => {
    // Navigate to the specific ROMM in execution
    logger.dataAccess("ROMM", rommId);
    // Navigate to execution-payroll and then to the specific ROMM
    if (window.setActiveSection) {
      window.setActiveSection("execution-payroll");
      // After a short delay, navigate to the specific ROMM
      setTimeout(() => {
        if (window.setActiveSection) {
          window.setActiveSection("payroll-romms");
        }
      }, 100);
    }
  };

  const handleControlClick = async (control: InternalControl) => {
    try {
      console.log('Loading control template for:', control);
      console.log('window.internalControls:', window.internalControls);
      
      let templateData;
      
      // Check if we're in Electron mode
      if (window.internalControls?.readTemplate) {
        // Use IPC to read the Internal Controls configuration file
        templateData = await window.internalControls.readTemplate();
        console.log('Loaded template data via IPC:', templateData);
      } else {
        console.log('Not in Electron mode, trying to load from public folder...');
        // Fallback: try to load from public folder (for web mode)
        try {
          const response = await fetch('/Internal%20Controls%20Updated.json');
          if (response.ok) {
            templateData = await response.json();
            console.log('Loaded template data from public folder:', templateData);
          } else {
            console.error('Failed to load from public folder');
            return;
          }
        } catch (fetchError) {
          console.error('Failed to load from public folder:', fetchError);
          return;
        }
      }
      
      if (templateData) {
        
        // Determine template type from multiple possible sources
        let templateType = 'manual'; // default
        if (control.template === 'automated' || 
            control.controlMetadata?.subtype === 'Automated') {
          templateType = 'automated';
        }
        
        const template = templateType === 'automated'
          ? templateData.templates?.automated 
          : templateData.templates?.manual;
        
        console.log('Using template type:', templateType, 'Template:', template);
        
        setSelectedControl(control);
        setControlTemplate(template);
        setIsControlViewerOpen(true);
        
        logger.dataAccess("Internal Control", control.controlMetadata?.controlId || control.id);
      }
    } catch (error) {
      console.error('Error loading control template:', error);
    }
  };

  const handleCreateControl = (type: "manual" | "automated") => {
    const metadata: ControlMetadata = {
      typeOfControl: "Direct",
      subtype: type === "manual" ? "Manual" : "Automated",
      controlId: `IC${Date.now()}`,
      controlName: `New ${type} Control`,
      workspace: "General"
    };

    // Get the appropriate template
    const template = type === "manual" 
      ? CONTROL_TEMPLATES.manual
      : CONTROL_TEMPLATES.automated;

    setSelectedControlForm({ metadata, template });
  };

  const handleSaveControl = (controlData: any) => {
    const newControl = {
      id: controlData.controlMetadata.controlId,
      ...controlData
    };
    
    setInternalControls(prev => {
      const updated = [...prev, newControl];
      // Also save to localStorage as backup
      localStorage.setItem('internalControls', JSON.stringify(updated));
      return updated;
    });
    
    setSelectedControlForm(null);
  };

  const handleControlSave = (updatedControl: any) => {
    // Update the control in localStorage
    try {
      const savedControls = JSON.parse(localStorage.getItem('internalControls') || '[]');
      const updatedControls = savedControls.map((c: any) => 
        c.id === updatedControl.id ? updatedControl : c
      );
      localStorage.setItem('internalControls', JSON.stringify(updatedControls));
      
      // Refresh the controls list
      setInternalControls(updatedControls);
      
      logger.dataSave("Internal Control Update", updatedControl.controlMetadata?.controlId);
    } catch (error) {
      console.error('Error saving updated control:', error);
    }
  };

  const renderLibraryContent = () => {
    if (!selectedLibrary) return null;

    const library = libraryItems.find(l => l.id === selectedLibrary);
    if (!library) return null;

    switch (selectedLibrary) {
      case "document-library":
        return <DocumentsPage />;
      
      case "internal-control-library":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedLibrary(null)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Libraries
              </Button>
              <div>
                <h2 className="text-xl font-semibold text-white">Internal Control Library</h2>
                <p className="text-sm text-white/60">
                  Internal control frameworks and procedures
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">Controls</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {internalControls.length} control(s)
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleCreateControl("manual")}
                      className="bg-[#4da3ff] text-white hover:bg-[#4da3ff]/80"
                    >
                      + Manual Control
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleCreateControl("automated")}
                      className="bg-[#4da3ff] text-white hover:bg-[#4da3ff]/80"
                    >
                      + Automated Control
                    </Button>
                  </div>
                </div>
              </div>

              {filesLoading ? (
                <div className="text-center text-white/60 py-8">
                  Loading controls...
                </div>
              ) : internalControls.length === 0 ? (
                <Card className="border-white/10 bg-white/5 text-white">
                  <CardContent className="p-6">
                    <div className="text-center text-white/60">
                      <Shield className="mx-auto h-12 w-12 mb-4 text-white/40" />
                      <p>No internal controls created yet.</p>
                      <p className="text-sm mt-2">Use the "Add" button to create new internal controls.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {internalControls.map((control) => (
                    <div
                      key={control.id}
                      onClick={() => handleControlClick(control)}
                      className="cursor-pointer rounded-lg border border-white/10 bg-white/5 p-4 text-white transition-all hover:border-white/20 hover:bg-white/10"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-sm font-medium text-white">
                              {control.controlMetadata.controlId}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {control.controlMetadata.typeOfControl}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {control.controlMetadata.subtype}
                            </Badge>
                          </div>
                          <p className="text-sm text-white/80 mb-2">
                            {control.controlMetadata.controlName}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {control.controlMetadata.workspace}
                            </Badge>
                            <span className="text-xs text-white/50">
                              Created: {new Date(control.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-white/40" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case "romm-library":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedLibrary(null)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Libraries
              </Button>
              <div>
                <h2 className="text-xl font-semibold text-white">ROMM Library</h2>
                <p className="text-sm text-white/60">
                  Risk of Material Misstatement library from execution
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {loading ? (
                <div className="text-center text-white/60 py-8">
                  Loading ROMMs...
                </div>
              ) : rommData.length === 0 ? (
                <div className="text-center text-white/60 py-8">
                  No ROMMs found
                </div>
              ) : (
                rommData.map((romm) => (
                  <div
                    key={romm.id}
                    className="cursor-pointer rounded-lg border border-white/10 bg-white/5 p-4 text-white transition-all hover:border-white/20 hover:bg-white/10"
                    onClick={() => handleRommSelect(romm.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-sm font-medium text-white">
                            {romm.id}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {romm.assertion}
                          </Badge>
                        </div>
                        <p className="text-xs text-white/80 mb-2">
                          {romm.risk}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {romm.section}
                          </Badge>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-white/40" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedLibrary(null)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Libraries
              </Button>
              <div>
                <h2 className="text-xl font-semibold text-white">{library.title}</h2>
                <p className="text-sm text-white/60">{library.description}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">Files</h3>
                <Badge variant="outline" className="text-xs">
                  {libraryFiles.length} file(s)
                </Badge>
              </div>
              
              {filesLoading ? (
                <div className="text-center text-white/60 py-8">
                  Loading files...
                </div>
              ) : libraryFiles.length === 0 ? (
                <Card className="border-white/10 bg-white/5 text-white">
                  <CardContent className="p-6">
                    <div className="text-center text-white/60">
                      <library.icon className="mx-auto h-12 w-12 mb-4 text-white/40" />
                      <p>No files in this library yet.</p>
                      <p className="text-sm mt-2">Use the "Add" button to upload files to this library.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {libraryFiles.map((file) => (
                    <Card
                      key={file.id}
                      className="cursor-pointer border-white/10 bg-white/5 text-white transition-all hover:border-white/20 hover:bg-white/10"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">
                            {fileManager.getFileIcon(file.extension)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-white truncate" title={file.fileName}>
                              {file.fileName}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {fileManager.formatFileSize(file.size)}
                              </Badge>
                              <span className="text-xs text-white/50">
                                {file.uploadDate.toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  if (selectedLibrary) {
    return renderLibraryContent();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Libraries</h2>
          <p className="text-sm text-white/60">
            Access various libraries and resources
          </p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {libraryItems.map((library) => {
          const Icon = library.icon;
          return (
            <Card
              key={library.id}
              className="group cursor-pointer border-white/10 bg-white/5 text-white transition-all hover:border-white/20 hover:bg-white/10"
              onClick={() => handleLibrarySelect(library.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`rounded-lg p-2 bg-gradient-to-br ${library.accent}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <ChevronRight className="h-4 w-4 text-white/40 transition-transform group-hover:translate-x-1" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardTitle className="text-sm font-medium mb-1">
                  {library.title}
                </CardTitle>
                <p className="text-xs text-white/60">
                  {library.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Control Viewer Modal */}
      <InternalControlViewerModal
        isOpen={isControlViewerOpen}
        onClose={() => setIsControlViewerOpen(false)}
        onSave={handleControlSave}
        control={selectedControl}
        template={controlTemplate}
        mode="view"
      />
      
      {/* Control Form Modal */}
      {selectedControlForm && (
        <InternalControlForm
          isOpen={!!selectedControlForm}
          onClose={() => setSelectedControlForm(null)}
          onSave={handleSaveControl}
          metadata={selectedControlForm.metadata}
          template={selectedControlForm.template}
        />
      )}
    </div>
  );
}
