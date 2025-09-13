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

interface LibraryItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  component?: React.ComponentType<any>;
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

interface LibrariesPageProps {
  onBack?: () => void;
  activeSection?: string;
}

export default function LibrariesPage({ onBack, activeSection }: LibrariesPageProps) {
  const [selectedLibrary, setSelectedLibrary] = useState<string | null>(null);
  const [rommData, setRommData] = useState<RommData[]>([]);
  const [libraryFiles, setLibraryFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [filesLoading, setFilesLoading] = useState(false);

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

  const renderLibraryContent = () => {
    if (!selectedLibrary) return null;

    const library = libraryItems.find(l => l.id === selectedLibrary);
    if (!library) return null;

    switch (selectedLibrary) {
      case "document-library":
        return <DocumentsPage />;
      
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
    </div>
  );
}
