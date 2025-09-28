import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { AlertCircle, CheckCircle2, Shield, Plus, X, Play } from "lucide-react";
import combinedData from "../../data/Combined.json";
import ControlSelectorModal from "./ControlSelectorModal";
import ProcedureSelectorModal from "./ProcedureSelectorModal";
import InternalControlViewerModal from "../libraries/InternalControlViewerModal";
import { 
  associateControlWithRomm, 
  disassociateControlFromRomm, 
  getControlsForRomm,
  loadPayrollMetadata 
} from "../../utils/payroll-metadata";

interface RommItem {
  id: string;
  risk: string;
  assertion: string;
  options: string[];
  selectedOption?: string;
}

interface InternalControl {
  control_id: string;
  control_name: string;
  control_type: string;
  control_attribute: string;
  control_description: string;
}

interface SubstantiveProcedure {
  id: string;
  name: string;
  description: string;
  requiredFiles: string[];
  optionalFiles?: string[];
  questions?: QuestionConfig[];
}

interface QuestionConfig {
  id: string;
  question: string;
  type: string;
  required: boolean;
  options?: string[];
}

interface PayrollRommsProps {
  onBack: () => void;
  onComplete: (data: Record<string, string>) => void;
}

export default function PayrollRomms({
  onBack,
  onComplete,
}: PayrollRommsProps) {
  const [romms, setRomms] = useState<RommItem[]>([]);
  const [selectedRommId, setSelectedRommId] = useState<string | null>(null);
  const [rommSelections, setRommSelections] = useState<Record<string, string>>({});
  const [rommDocumentation, setRommDocumentation] = useState<Record<string, string>>({});
  const [associatedControls, setAssociatedControls] = useState<Record<string, InternalControl[]>>({});
  const [associatedProcedures, setAssociatedProcedures] = useState<Record<string, SubstantiveProcedure[]>>({});
  const [isControlSelectorOpen, setIsControlSelectorOpen] = useState(false);
  const [isProcedureSelectorOpen, setIsProcedureSelectorOpen] = useState(false);
  const [employeeBenefitsNoteLines, setEmployeeBenefitsNoteLines] = useState<string[]>([]);
  
  // Control viewer modal state
  const [selectedControlForViewing, setSelectedControlForViewing] = useState<any>(null);
  const [controlViewerTemplate, setControlViewerTemplate] = useState<any>(null);
  const [isControlViewerOpen, setIsControlViewerOpen] = useState(false);
  
  // Autosave status state
  const [autosaveStatus, setAutosaveStatus] = useState<{
    [rommId: string]: {
      status: 'saving' | 'saved' | 'error';
      lastSaved?: Date;
      error?: string;
    }
  }>({});

  // Load persisted ROMM-control linkages
  useEffect(() => {
    try {
      const savedLinkages = localStorage.getItem('rommControlLinkages');
      if (savedLinkages) {
        setAssociatedControls(JSON.parse(savedLinkages));
      }
    } catch (error) {
      console.error('Error loading ROMM-control linkages:', error);
    }
  }, []);

  // Load ROMMS data from SharePoint for Employee Benefits Expense
  useEffect(() => {
    const loadRommsData = async () => {
      try {
        // Check if SharePoint API is available
        console.log("SharePoint API available:", !!window.sharePointAPI);
        console.log("SharePoint updateRommEntry available:", !!window.sharePointAPI?.updateRommEntry);
        
        // Try to fetch from SharePoint first
        if (window.sharePointAPI?.readRommLibraryByWorkspace) {
          console.log("Fetching ROMM data from SharePoint for Employee Benefits Expense...");
          const sharePointResponse = await window.sharePointAPI.readRommLibraryByWorkspace("Employee Benefits Expense");
          
          if (sharePointResponse.success && sharePointResponse.data?.romm_library) {
            console.log("Successfully loaded ROMM data from SharePoint:", sharePointResponse.data);
            
            // Transform SharePoint data to component format
            const rommsData: RommItem[] = sharePointResponse.data.romm_library.map((entry: any) => ({
              id: entry["romm-id"],
              risk: entry.description, // Use description as the risk text
              assertion: entry.assertion,
              options: ["Lower", "Higher", "Significant", "NRPMM"], // Standard options
            }));

            setRomms(rommsData);
            if (rommsData.length > 0) {
              setSelectedRommId(rommsData[0].id);
            }

            // Load saved assessments and documentation from SharePoint
            const savedSelections: Record<string, string> = {};
            const savedDocumentation: Record<string, string> = {};
            
            sharePointResponse.data.romm_library.forEach((entry: any) => {
              if (entry["assesment"] && entry["assesment"] !== "") {
                savedSelections[entry["romm-id"]] = entry["assesment"];
              }
              if (entry["documentation"] && entry["documentation"] !== "") {
                savedDocumentation[entry["romm-id"]] = entry["documentation"];
              }
            });

            console.log("Loaded saved assessments from SharePoint:", savedSelections);
            console.log("Loaded saved documentation from SharePoint:", savedDocumentation);
            
            setRommSelections(savedSelections);
            setRommDocumentation(savedDocumentation);
            return; // Successfully loaded from SharePoint
          } else {
            console.warn("SharePoint data not available, falling back to local data:", sharePointResponse.error);
          }
        }

        // Fallback to local Instructions.json
        console.log("Falling back to local Instructions.json...");
        const response = await fetch("/payroll/Instructions.json");
        if (!response.ok) {
          throw new Error("Failed to load Instructions.json");
        }
        const instructionsData = await response.json();

        // Extract ROMMS data from the instructions
        const rommsData: RommItem[] = instructionsData.romms || [];

        // If romms array is missing or empty, use sensible defaults
        const effectiveRomms: RommItem[] =
          rommsData.length > 0
            ? rommsData
            : [
                {
                  id: "romm-1",
                  risk: "Payroll expenses is recorded that did not occur",
                  assertion: "Occurrence",
                  options: ["Lower", "Higher", "Significant", "NRPMM"],
                },
                {
                  id: "romm-2",
                  risk: "Payroll expenses is incomplete",
                  assertion: "C",
                  options: ["Lower", "Higher", "Significant", "NRPMM"],
                },
                {
                  id: "romm-3",
                  risk: "Payroll expenses is recorded in incorrect period",
                  assertion: "Cu",
                  options: ["Lower", "Higher", "Significant", "NRPMM"],
                },
                {
                  id: "romm-4",
                  risk: "Payroll expenses is not recorded at proper amount",
                  assertion: "A",
                  options: ["Lower", "Higher", "Significant", "NRPMM"],
                },
                {
                  id: "romm-5",
                  risk: "Payroll expenses is not recorded in proper account",
                  assertion: "Cl",
                  options: ["Lower", "Higher", "Significant", "NRPMM"],
                },
              ];

        setRomms(effectiveRomms);
        if (effectiveRomms.length > 0) {
          setSelectedRommId(effectiveRomms[0].id);
        }
      } catch (error) {
        console.error("Error loading ROMMS data:", error);
        // Final fallback to hardcoded data if all else fails
        const fallbackData: RommItem[] = [
          {
            "id": "EBE.SR.001",
            "risk": "Payroll expenses is recorded that did not occur",
            "assertion": "Occurrence",
            "options": ["Lower", "Higher", "Significant", "NRPMM"]
          },
          {
            "id": "EBE.SR.002",
            "risk": "Payroll expenses is incomplete",
            "assertion": "Completeness",
            "options": ["Lower", "Higher", "Significant", "NRPMM"]
          },
          {
            "id": "EBE.SR.003",
            "risk": "Payroll expenses is recorded in incorrect period",
            "assertion": "Cutoff",
            "options": ["Lower", "Higher", "Significant", "NRPMM"]
          },
          {
            "id": "EBE.SR.004",
            "risk": "Payroll expenses is not recorded at proper amount",
            "assertion": "Accuracy",
            "options": ["Lower", "Higher", "Significant", "NRPMM"]
          },
          {
            "id": "EBE.SR.005",
            "risk": "Payroll expenses is not recorded in proper account",
            "assertion": "Classification",
            "options": ["Lower", "Higher", "Significant", "NRPMM"]
          },
        ];
        setRomms(fallbackData);
        if (fallbackData.length > 0) {
          setSelectedRommId(fallbackData[0].id);
        }
      }
    };

    loadRommsData();
  }, []);

  const selectedRomm = romms.find((r) => r.id === selectedRommId);


  // Extract Employee Benefits Expense note lines from Combined.json
  useEffect(() => {
    try {
      const employeeBenefitsEntries = combinedData.data.filter(
        (entry: any) => entry.par === "Employee Benefits Expense"
      );
      
      const uniqueNoteLines = [...new Set(
        employeeBenefitsEntries.map((entry: any) => entry.note_line)
      )].filter(Boolean);
      
      setEmployeeBenefitsNoteLines(uniqueNoteLines as string[]);
    } catch (error) {
      console.error('Error extracting Employee Benefits note lines:', error);
    }
  }, []);

  const handleRommSelection = async (rommId: string, option: string) => {
    // Update local state immediately for UI responsiveness
    setRommSelections((prev) => ({
      ...prev,
      [rommId]: option,
    }));

    // Set saving status
    setAutosaveStatus(prev => ({
      ...prev,
      [rommId]: { status: 'saving' }
    }));

    // Autosave to SharePoint
    try {
      if (window.sharePointAPI?.updateRommEntry) {
        console.log(`Autosaving ROMM ${rommId} assessment to SharePoint:`, { 
          rommId, 
          assessment: option, 
          documentation: rommDocumentation[rommId] || "" 
        });
        
        const updateResponse = await window.sharePointAPI.updateRommEntry({
          rommId: rommId,
          assessment: option,
          documentation: rommDocumentation[rommId] || "" // Include existing documentation
        });
        
        console.log(`SharePoint update response for ${rommId}:`, updateResponse);
        
        if (updateResponse.success) {
          console.log(`Successfully autosaved ROMM ${rommId} assessment to SharePoint`);
          setAutosaveStatus(prev => ({
            ...prev,
            [rommId]: { 
              status: 'saved',
              lastSaved: new Date()
            }
          }));
        } else {
          console.error(`Failed to autosave ROMM ${rommId} assessment to SharePoint:`, updateResponse.error);
          setAutosaveStatus(prev => ({
            ...prev,
            [rommId]: { 
              status: 'error',
              error: updateResponse.error || 'Unknown error'
            }
          }));
        }
      } else {
        console.warn("SharePoint API not available for autosave");
        setAutosaveStatus(prev => ({
          ...prev,
          [rommId]: { 
            status: 'error',
            error: 'SharePoint API not available'
          }
        }));
      }
    } catch (error) {
      console.error(`Error autosaving ROMM ${rommId} assessment:`, error);
      setAutosaveStatus(prev => ({
        ...prev,
        [rommId]: { 
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    }
  };

  // Debounced autosave function for documentation
  const debouncedAutosave = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (rommId: string, documentation: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          // Set saving status
          setAutosaveStatus(prev => ({
            ...prev,
            [rommId]: { status: 'saving' }
          }));

          // Autosave to SharePoint
          try {
            if (window.sharePointAPI?.updateRommEntry) {
              console.log(`Autosaving ROMM ${rommId} documentation to SharePoint:`, { documentation });
              
              const updateResponse = await window.sharePointAPI.updateRommEntry({
                rommId: rommId,
                assessment: rommSelections[rommId] || "", // Include existing assessment
                documentation: documentation
              });
              
              if (updateResponse.success) {
                console.log(`Successfully autosaved ROMM ${rommId} documentation to SharePoint`);
                setAutosaveStatus(prev => ({
                  ...prev,
                  [rommId]: { 
                    status: 'saved',
                    lastSaved: new Date()
                  }
                }));
              } else {
                console.error(`Failed to autosave ROMM ${rommId} documentation to SharePoint:`, updateResponse.error);
                setAutosaveStatus(prev => ({
                  ...prev,
                  [rommId]: { 
                    status: 'error',
                    error: updateResponse.error || 'Unknown error'
                  }
                }));
              }
            } else {
              console.warn("SharePoint API not available for autosave");
              setAutosaveStatus(prev => ({
                ...prev,
                [rommId]: { 
                  status: 'error',
                  error: 'SharePoint API not available'
                }
              }));
            }
          } catch (error) {
            console.error(`Error autosaving ROMM ${rommId} documentation:`, error);
            setAutosaveStatus(prev => ({
              ...prev,
              [rommId]: { 
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            }));
          }
        }, 1000); // 1 second delay
      };
    })(),
    [rommSelections]
  );

  const handleDocumentationChange = (rommId: string, documentation: string) => {
    // Update local state immediately for UI responsiveness
    setRommDocumentation((prev) => ({
      ...prev,
      [rommId]: documentation,
    }));

    // Trigger debounced autosave
    debouncedAutosave(rommId, documentation);
  };

  const handleAssociateControls = async (selectedControls: InternalControl[]) => {
    if (selectedRommId) {
      // Update local state
      const newAssociations = {
        ...associatedControls,
        [selectedRommId]: selectedControls
      };
      setAssociatedControls(newAssociations);
      
      // Update payroll metadata
      selectedControls.forEach(control => {
        associateControlWithRomm(control.control_id, selectedRommId, {
          controlId: control.control_id,
          controlName: control.control_name,
          controlType: control.control_type,
          controlAttribute: control.control_attribute,
          controlDescription: control.control_description
        });
      });
      
      // Save ROMM-control linkages to localStorage for persistence (legacy support)
      localStorage.setItem('rommControlLinkages', JSON.stringify(newAssociations));
      
      // Save to SharePoint
      try {
        if (window.sharePointAPI?.updateRommEntry) {
          console.log(`Saving control associations for ROMM ${selectedRommId} to SharePoint:`, selectedControls.map(c => c.control_id));
          
          const updateResponse = await window.sharePointAPI.updateRommEntry({
            rommId: selectedRommId,
            assessment: rommSelections[selectedRommId] || "",
            documentation: rommDocumentation[selectedRommId] || "",
            controlIds: selectedControls.map(control => control.control_id),
            procedureIds: associatedProcedures[selectedRommId]?.map(p => p.name) || []
          });
          
          if (updateResponse.success) {
            console.log(`Successfully saved control associations for ROMM ${selectedRommId} to SharePoint`);
          } else {
            console.error(`Failed to save control associations for ROMM ${selectedRommId} to SharePoint:`, updateResponse.error);
          }
        } else {
          console.warn("SharePoint API not available for saving control associations");
        }
      } catch (error) {
        console.error(`Error saving control associations for ROMM ${selectedRommId}:`, error);
      }
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('rommControlLinkagesUpdated'));
    }
  };

  const handleRemoveControl = async (rommId: string, controlId: string) => {
    const newAssociations = {
      ...associatedControls,
      [rommId]: associatedControls[rommId]?.filter(control => control.control_id !== controlId) || []
    };
    setAssociatedControls(newAssociations);
    
    // Update payroll metadata
    disassociateControlFromRomm(controlId, rommId);
    
    // Save updated ROMM-control linkages to localStorage (legacy support)
    localStorage.setItem('rommControlLinkages', JSON.stringify(newAssociations));
    
    // Save to SharePoint
    try {
      if (window.sharePointAPI?.updateRommEntry) {
        console.log(`Saving updated control associations for ROMM ${rommId} to SharePoint after removal`);
        
        const updateResponse = await window.sharePointAPI.updateRommEntry({
          rommId: rommId,
          assessment: rommSelections[rommId] || "",
          documentation: rommDocumentation[rommId] || "",
          controlIds: newAssociations[rommId]?.map(c => c.control_id) || [],
          procedureIds: associatedProcedures[rommId]?.map(p => p.name) || []
        });
        
        if (updateResponse.success) {
          console.log(`Successfully saved updated control associations for ROMM ${rommId} to SharePoint`);
        } else {
          console.error(`Failed to save updated control associations for ROMM ${rommId} to SharePoint:`, updateResponse.error);
        }
      } else {
        console.warn("SharePoint API not available for saving updated control associations");
      }
    } catch (error) {
      console.error(`Error saving updated control associations for ROMM ${rommId}:`, error);
    }
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('rommControlLinkagesUpdated'));
  };

  const handleAssociateProcedures = async (selectedProcedures: SubstantiveProcedure[]) => {
    if (selectedRommId) {
      setAssociatedProcedures(prev => ({
        ...prev,
        [selectedRommId]: selectedProcedures
      }));

      // Save to SharePoint
      try {
        if (window.sharePointAPI?.updateRommEntry) {
          console.log(`Saving procedure associations for ROMM ${selectedRommId} to SharePoint:`, selectedProcedures.map(p => p.procedure_id));
          
          const updateResponse = await window.sharePointAPI.updateRommEntry({
            rommId: selectedRommId,
            assessment: rommSelections[selectedRommId] || "",
            documentation: rommDocumentation[selectedRommId] || "",
            controlIds: associatedControls[selectedRommId]?.map(c => c.control_id) || [],
            procedureIds: selectedProcedures.map(procedure => procedure.name)
          });
          
          if (updateResponse.success) {
            console.log(`Successfully saved procedure associations for ROMM ${selectedRommId} to SharePoint`);
          } else {
            console.error(`Failed to save procedure associations for ROMM ${selectedRommId} to SharePoint:`, updateResponse.error);
          }
        } else {
          console.warn("SharePoint API not available for saving procedure associations");
        }
      } catch (error) {
        console.error(`Error saving procedure associations for ROMM ${selectedRommId}:`, error);
      }
    }
  };

  const handleRemoveProcedure = async (rommId: string, procedureId: string) => {
    const updatedProcedures = {
      ...associatedProcedures,
      [rommId]: associatedProcedures[rommId]?.filter(procedure => procedure.id !== procedureId) || []
    };
    
    setAssociatedProcedures(updatedProcedures);

    // Save to SharePoint
    try {
      if (window.sharePointAPI?.updateRommEntry) {
        console.log(`Saving updated procedure associations for ROMM ${rommId} to SharePoint after removal`);
        
        const updateResponse = await window.sharePointAPI.updateRommEntry({
          rommId: rommId,
          assessment: rommSelections[rommId] || "",
          documentation: rommDocumentation[rommId] || "",
          controlIds: associatedControls[rommId]?.map(c => c.control_id) || [],
          procedureIds: updatedProcedures[rommId]?.map(p => p.name) || []
        });
        
        if (updateResponse.success) {
          console.log(`Successfully saved updated procedure associations for ROMM ${rommId} to SharePoint`);
        } else {
          console.error(`Failed to save updated procedure associations for ROMM ${rommId} to SharePoint:`, updateResponse.error);
        }
      } else {
        console.warn("SharePoint API not available for saving updated procedure associations");
      }
    } catch (error) {
      console.error(`Error saving updated procedure associations for ROMM ${rommId}:`, error);
    }
  };

  const isRommComplete = (rommId: string) => {
    return rommSelections[rommId] !== undefined;
  };

  const allRommsComplete = romms.every((r) => isRommComplete(r.id));

  const handleControlClickInRomm = async (control: InternalControl) => {
    try {
      // Load the control template
      // Use IPC to read the Internal Controls configuration file
      const templateData = await window.internalControls?.readTemplate?.();
      if (templateData) {
        
        // Determine template type from multiple possible sources
        let templateType = 'manual'; // default
        if (control.template === 'automated' || 
            control.control_type === 'Automated' || 
            control.control_type === 'automated' ||
            (control as any).controlMetadata?.subtype === 'Automated') {
          templateType = 'automated';
        }
        
        const template = templateType === 'automated'
          ? templateData.templates?.automated 
          : templateData.templates?.manual;
        
        setSelectedControlForViewing(control);
        setControlViewerTemplate(template);
        setIsControlViewerOpen(true);
      }
    } catch (error) {
      console.error('Error loading control template:', error);
    }
  };

  const handleControlSaveInRomm = (updatedControl: any) => {
    // Update the control in localStorage
    try {
      const savedControls = JSON.parse(localStorage.getItem('internalControls') || '[]');
      const updatedControls = savedControls.map((c: any) => 
        c.id === updatedControl.id ? updatedControl : c
      );
      localStorage.setItem('internalControls', JSON.stringify(updatedControls));
      
      // Trigger refresh of linked controls
      window.dispatchEvent(new CustomEvent('rommControlLinkagesUpdated'));
    } catch (error) {
      console.error('Error saving updated control:', error);
    }
  };

  const getRiskLevelColor = (option: string) => {
    switch (option) {
      case "Lower":
        return "bg-yellow-300/20 text-yellow-300 border-yellow-300/30";
      case "Higher":
        return "bg-yellow-700/30 text-yellow-400 border-yellow-700/30";
      case "Significant":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "NRPMM":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getOptionDescription = (option: string) => {
    switch (option) {
      case "Lower":
        return "Lower risk of material misstatement";
      case "Higher":
        return "Higher risk of material misstatement";
      case "Significant":
        return "Significant risk requiring special audit consideration";
      case "NRPMM":
        return "Not a Risk of Material Misstatement";
      default:
        return "";
    }
  };

  // Handle individual ROMM submission
  const handleSubmitRomm = async (rommId: string) => {
    try {
      console.log(`Submitting ROMM ${rommId} to SharePoint:`, {
        rommId,
        assessment: rommSelections[rommId] || "",
        documentation: rommDocumentation[rommId] || "",
        controlIds: associatedControls[rommId]?.map(c => c.control_id) || [],
        procedureNames: associatedProcedures[rommId]?.map(p => p.name) || []
      });

      if (window.sharePointAPI?.updateRommEntry) {
        const updateResponse = await window.sharePointAPI.updateRommEntry({
          rommId: rommId,
          assessment: rommSelections[rommId] || "",
          documentation: rommDocumentation[rommId] || "",
          controlIds: associatedControls[rommId]?.map(c => c.control_id) || [],
          procedureIds: associatedProcedures[rommId]?.map(p => p.name) || [] // Map to procedure names as requested
        });

        if (updateResponse.success) {
          console.log(`Successfully submitted ROMM ${rommId} to SharePoint`);
          // Show success feedback
          setAutosaveStatus(prev => ({
            ...prev,
            [rommId]: { 
              status: 'saved',
              lastSaved: new Date()
            }
          }));
        } else {
          console.error(`Failed to submit ROMM ${rommId} to SharePoint:`, updateResponse.error);
          setAutosaveStatus(prev => ({
            ...prev,
            [rommId]: { 
              status: 'error',
              error: updateResponse.error || 'Unknown error'
            }
          }));
        }
      } else {
        console.warn("SharePoint API not available for submission");
        setAutosaveStatus(prev => ({
          ...prev,
          [rommId]: { 
            status: 'error',
            error: 'SharePoint API not available'
          }
        }));
      }
    } catch (error) {
      console.error(`Error submitting ROMM ${rommId}:`, error);
      setAutosaveStatus(prev => ({
        ...prev,
        [rommId]: { 
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    }
  };

  const handleComplete = () => {
    // Data is already saved via autosave, just complete the form
    const completeData = {
      selections: rommSelections,
      documentation: rommDocumentation,
    };
    onComplete(completeData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            Risk of Material Misstatement (RoMMs)
          </h2>
          <p className="text-sm text-white/60">
            Assess the risk level for each payroll-related assertion
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-white/10 text-white/80">
            {Object.keys(rommSelections).length} / {romms.length} Complete
          </Badge>
          
          {/* Autosave Status Indicator */}
          {selectedRommId && autosaveStatus[selectedRommId] && (
            <div className="flex items-center gap-2">
              {autosaveStatus[selectedRommId].status === 'saving' && (
                <div className="flex items-center gap-1 text-yellow-400">
                  <div className="h-2 w-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-xs">Saving...</span>
                </div>
              )}
              {autosaveStatus[selectedRommId].status === 'saved' && (
                <div className="flex items-center gap-1 text-green-400">
                  <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                  <span className="text-xs">
                    Saved {autosaveStatus[selectedRommId].lastSaved && 
                      `at ${autosaveStatus[selectedRommId].lastSaved!.toLocaleTimeString()}`}
                  </span>
                </div>
              )}
              {autosaveStatus[selectedRommId].status === 'error' && (
                <div className="flex items-center gap-1 text-red-400">
                  <div className="h-2 w-2 bg-red-400 rounded-full"></div>
                  <span className="text-xs">Save failed</span>
                </div>
              )}
            </div>
          )}
          
          {/* Debug: Manual test button */}
          {selectedRommId && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={async () => {
                console.log("Manual test of autosave for:", selectedRommId);
                if (window.sharePointAPI?.updateRommEntry) {
                  try {
                    const response = await window.sharePointAPI.updateRommEntry({
                      rommId: selectedRommId,
                      assessment: "Test",
                      documentation: "Manual test"
                    });
                    console.log("Manual test response:", response);
                  } catch (error) {
                    console.error("Manual test error:", error);
                  }
                }
              }}
              className="text-xs"
            >
              Test Save
            </Button>
          )}
          
          <Button variant="outline" onClick={onBack}>
            Back to Landing
          </Button>
        </div>
      </div>

      {/* Two Column Layout - 30% Left, 70% Right */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left Panel - ROMMS List */}
        <Card className="border-white/10 bg-white/5 text-white lg:w-[30%] lg:flex-shrink-0">
          <CardHeader>
            <CardTitle className="text-lg">Payroll Risks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {romms.map((romm) => (
              <div
                key={romm.id}
                className={`cursor-pointer rounded-lg border p-3 transition-all ${
                  selectedRommId === romm.id
                    ? "border-blue-500/50 bg-blue-500/10"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                }`}
                onClick={() => setSelectedRommId(romm.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {romm.id}
                      </Badge>
                      {isRommComplete(romm.id) ? (
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-400" />
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-white/80">
                      {romm.risk}
                    </p>
                    {rommSelections[romm.id] && (
                      <div className="mt-2">
                        {rommSelections[romm.id] === 'Lower' && 
                          <svg width="16" height="16" viewBox="0 0 16 16" style={{verticalAlign: 'middle'}}>
                            <defs>
                              <mask id={`lowerMaskLeft${romm.id}`}>
                                <rect width="16" height="16" fill="black"/>
                                <polygon points="8,2 14,14 2,14" fill="white"/>
                              </mask>
                            </defs>
                            <polygon points="8,2 14,14 2,14" fill="none" stroke="#CCCC00" strokeWidth="1"/>
                            <rect x="0" y="10" width="16" height="6" fill="#CCCC00" mask={`url(#lowerMaskLeft${romm.id})`}/>
                          </svg>
                        }
                        {rommSelections[romm.id] === 'Higher' && 
                          <svg width="16" height="16" viewBox="0 0 16 16" style={{verticalAlign: 'middle'}}>
                            <defs>
                              <mask id={`higherMaskLeft${romm.id}`}>
                                <rect width="16" height="16" fill="black"/>
                                <polygon points="8,2 14,14 2,14" fill="white"/>
                              </mask>
                            </defs>
                            <polygon points="8,2 14,14 2,14" fill="none" stroke="#FFA500" strokeWidth="1"/>
                            <rect x="0" y="8" width="16" height="8" fill="#FFA500" mask={`url(#higherMaskLeft${romm.id})`}/>
                          </svg>
                        }
                        {rommSelections[romm.id] === 'Significant' && 
                          <svg width="16" height="16" viewBox="0 0 16 16" style={{verticalAlign: 'middle'}}>
                            <polygon points="8,2 14,14 2,14" fill="#FF0000"/>
                          </svg>
                        }
                        {rommSelections[romm.id] === 'NRPMM' && 
                          <svg width="16" height="16" viewBox="0 0 16 16" style={{verticalAlign: 'middle'}}>
                            <polygon points="8,2 14,14 2,14" fill="none" stroke="#008000" strokeWidth="2"/>
                          </svg>
                        }
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Right Panel - Four Column Layout */}
        <Card className="border-white/10 bg-white/5 text-white lg:w-[70%] lg:flex-shrink-0">
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedRomm?.id || "Select a ROMM"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Table Header */}
            <div className="mb-4 hidden rounded-lg border border-white/20 bg-white/10 p-3 md:grid md:grid-cols-4 md:gap-4">
              <div className="text-sm font-semibold text-white">Description</div>
              <div className="text-sm font-semibold text-white">Accounts/Areas</div>
              <div className="text-sm font-semibold text-white">Assertions/Type</div>
              <div className="text-sm font-semibold text-white">Assessment</div>
            </div>

            {/* Table Rows - Show only selected ROMM */}
            <div className="space-y-4">
              {selectedRomm && (
                <div
                  key={selectedRomm.id}
                  className="rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10 md:grid md:grid-cols-4 md:gap-4 md:p-3"
                >
                  {/* Description Column */}
                  <div className="mb-4 md:mb-0">
                    <div className="mb-2 block text-xs font-semibold text-white/60 md:hidden">Description</div>
                    <div className="text-sm text-white/80">
                      {selectedRomm.risk}
                    </div>
                  </div>

                  {/* Accounts/Areas Column */}
                  <div className="mb-4 md:mb-0">
                    <div className="mb-2 block text-xs font-semibold text-white/60 md:hidden">Accounts/Areas</div>
                    <div className="space-y-1">
                      {employeeBenefitsNoteLines.length > 0 ? (
                        employeeBenefitsNoteLines.map((noteLine, index) => (
                          <div key={index} className="flex items-center gap-1 text-xs text-orange-400">
                            <span className="h-2 w-2 rounded-full bg-orange-400"></span>
                            {noteLine}
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-white/60">Loading accounts/areas...</div>
                      )}
                    </div>
                  </div>

                  {/* Assertions/Type Column */}
                  <div className="mb-4 md:mb-0">
                    <div className="mb-2 block text-xs font-semibold text-white/60 md:hidden">Assertions/Type</div>
                    <div className="flex items-center">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                        {selectedRomm.assertion === 'Completeness' ? 'C' : 
                         selectedRomm.assertion === 'Classification' ? 'Cl' : 
                         selectedRomm.assertion === 'Cutoff' ? 'Cu' : 
                         selectedRomm.assertion === 'Accuracy' ? 'A' : 
                         selectedRomm.assertion === 'Occurrence' ? 'O' : selectedRomm.assertion}
                      </div>
                      <span className="ml-2 text-sm text-white">{selectedRomm.assertion}</span>
                    </div>
                  </div>

                  {/* Assessment Column */}
                  <div>
                    <div className="mb-2 block text-xs font-semibold text-white/60 md:hidden">Assessment</div>
                    <div className="flex items-center gap-2">
                      {/* Triangle indicator on the left */}
                      <div className="flex-shrink-0">
                        {rommSelections[selectedRomm.id] === 'Lower' && 
                          <svg width="16" height="16" viewBox="0 0 16 16" style={{verticalAlign: 'middle'}}>
                            <defs>
                              <mask id="lowerMask">
                                <rect width="16" height="16" fill="black"/>
                                <polygon points="8,2 14,14 2,14" fill="white"/>
                              </mask>
                            </defs>
                            <polygon points="8,2 14,14 2,14" fill="none" stroke="#CCCC00" strokeWidth="1"/>
                            <rect x="0" y="10" width="16" height="6" fill="#CCCC00" mask="url(#lowerMask)"/>
                          </svg>
                        }
                        {rommSelections[selectedRomm.id] === 'Higher' && 
                          <svg width="16" height="16" viewBox="0 0 16 16" style={{verticalAlign: 'middle'}}>
                            <defs>
                              <mask id="higherMask">
                                <rect width="16" height="16" fill="black"/>
                                <polygon points="8,2 14,14 2,14" fill="white"/>
                              </mask>
                            </defs>
                            <polygon points="8,2 14,14 2,14" fill="none" stroke="#FFA500" strokeWidth="1"/>
                            <rect x="0" y="8" width="16" height="8" fill="#FFA500" mask="url(#higherMask)"/>
                          </svg>
                        }
                        {rommSelections[selectedRomm.id] === 'Significant' && 
                          <svg width="16" height="16" viewBox="0 0 16 16" style={{verticalAlign: 'middle'}}>
                            <polygon points="8,2 14,14 2,14" fill="#FF0000"/>
                          </svg>
                        }
                        {rommSelections[selectedRomm.id] === 'NRPMM' && 
                          <svg width="16" height="16" viewBox="0 0 16 16" style={{verticalAlign: 'middle'}}>
                            <polygon points="8,2 14,14 2,14" fill="none" stroke="#008000" strokeWidth="2"/>
                          </svg>
                        }
                      </div>
                      <Select
                        value={rommSelections[selectedRomm.id] || ""}
                        onValueChange={(value) => handleRommSelection(selectedRomm.id, value)}
                      >
                        <SelectTrigger className="w-full">
                           <SelectValue placeholder="Select assessment">
                             {rommSelections[selectedRomm.id] && (
                               <div className="flex items-center gap-2">
                                 {rommSelections[selectedRomm.id] === 'Lower' && 
                                   <svg width="16" height="16" viewBox="0 0 16 16" style={{verticalAlign: 'middle'}}>
                                     <defs>
                                       <mask id="lowerMaskSelect">
                                         <rect width="16" height="16" fill="black"/>
                                         <polygon points="8,2 14,14 2,14" fill="white"/>
                                       </mask>
                                     </defs>
                                     <polygon points="8,2 14,14 2,14" fill="none" stroke="#CCCC00" strokeWidth="1"/>
                                     <rect x="0" y="10" width="16" height="6" fill="#CCCC00" mask="url(#lowerMaskSelect)"/>
                                   </svg>
                                 }
                                 {rommSelections[selectedRomm.id] === 'Higher' && 
                                   <svg width="16" height="16" viewBox="0 0 16 16" style={{verticalAlign: 'middle'}}>
                                     <defs>
                                       <mask id="higherMaskSelect">
                                         <rect width="16" height="16" fill="black"/>
                                         <polygon points="8,2 14,14 2,14" fill="white"/>
                                       </mask>
                                     </defs>
                                     <polygon points="8,2 14,14 2,14" fill="none" stroke="#FFA500" strokeWidth="1"/>
                                     <rect x="0" y="8" width="16" height="8" fill="#FFA500" mask="url(#higherMaskSelect)"/>
                                   </svg>
                                 }
                                 {rommSelections[selectedRomm.id] === 'Significant' && 
                                   <svg width="16" height="16" viewBox="0 0 16 16" style={{verticalAlign: 'middle'}}>
                                     <polygon points="8,2 14,14 2,14" fill="#FF0000"/>
                                   </svg>
                                 }
                                 {rommSelections[selectedRomm.id] === 'NRPMM' && 
                                   <svg width="16" height="16" viewBox="0 0 16 16" style={{verticalAlign: 'middle'}}>
                                     <polygon points="8,2 14,14 2,14" fill="none" stroke="#008000" strokeWidth="2"/>
                                   </svg>
                                 }
                                 <Badge className={`text-xs ${getRiskLevelColor(rommSelections[selectedRomm.id])}`}>
                                   {rommSelections[selectedRomm.id]}
                                 </Badge>
                               </div>
                             )}
                           </SelectValue>
                         </SelectTrigger>
                        <SelectContent>
                           {selectedRomm.options.map((option) => (
                             <SelectItem key={option} value={option}>
                               <div className="flex items-center gap-2">
                                 {option === 'Lower' && 
                                   <svg width="16" height="16" viewBox="0 0 16 16" style={{verticalAlign: 'middle'}}>
                                     <defs>
                                       <mask id={`lowerMaskItem${option}`}>
                                         <rect width="16" height="16" fill="black"/>
                                         <polygon points="8,2 14,14 2,14" fill="white"/>
                                       </mask>
                                     </defs>
                                     <polygon points="8,2 14,14 2,14" fill="none" stroke="#CCCC00" strokeWidth="1"/>
                                     <rect x="0" y="10" width="16" height="6" fill="#CCCC00" mask={`url(#lowerMaskItem${option})`}/>
                                   </svg>
                                 }
                                 {option === 'Higher' && 
                                   <svg width="16" height="16" viewBox="0 0 16 16" style={{verticalAlign: 'middle'}}>
                                     <defs>
                                       <mask id={`higherMaskItem${option}`}>
                                         <rect width="16" height="16" fill="black"/>
                                         <polygon points="8,2 14,14 2,14" fill="white"/>
                                       </mask>
                                     </defs>
                                     <polygon points="8,2 14,14 2,14" fill="none" stroke="#FFA500" strokeWidth="1"/>
                                     <rect x="0" y="8" width="16" height="8" fill="#FFA500" mask={`url(#higherMaskItem${option})`}/>
                                   </svg>
                                 }
                                 {option === 'Significant' && 
                                   <svg width="16" height="16" viewBox="0 0 16 16" style={{verticalAlign: 'middle'}}>
                                     <polygon points="8,2 14,14 2,14" fill="#FF0000"/>
                                   </svg>
                                 }
                                 {option === 'NRPMM' && 
                                   <svg width="16" height="16" viewBox="0 0 16 16" style={{verticalAlign: 'middle'}}>
                                     <polygon points="8,2 14,14 2,14" fill="none" stroke="#008000" strokeWidth="2"/>
                                   </svg>
                                 }
                                 <Badge className={`text-xs ${getRiskLevelColor(option)}`}>
                                   {option}
                                 </Badge>
                               </div>
                             </SelectItem>
                           ))}
                         </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Risk Assessment Documentation */}
            {selectedRomm && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-medium text-white">
                    Risk Assessment Documentation
                  </h4>
                  <Button
                    onClick={() => handleSubmitRomm(selectedRomm.id)}
                    className="bg-green-600 text-white hover:bg-green-700"
                    disabled={!rommSelections[selectedRomm.id]}
                  >
                    Submit to SharePoint
                  </Button>
                </div>
                <Textarea
                  placeholder="Enter your risk assessment documentation here..."
                  value={rommDocumentation[selectedRomm.id] || ""}
                  onChange={(e) => handleDocumentationChange(selectedRomm.id, e.target.value)}
                  className="min-h-[120px] bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-blue-500/50 focus:ring-blue-500/20"
                />
              </div>
            )}

            {/* Associated Controls */}
            {selectedRomm && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-medium text-white flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Associated Controls
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsControlSelectorOpen(true)}
                    className="flex items-center gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10"
                  >
                    <Plus className="h-4 w-4" />
                    Associate Control
                  </Button>
                </div>
                
                {associatedControls[selectedRomm.id] && associatedControls[selectedRomm.id].length > 0 ? (
                  <div className="space-y-2">
                    {associatedControls[selectedRomm.id].map((control) => (
                      <Card key={control.control_id} className="border-white/10 bg-white/5 cursor-pointer transition-all hover:border-white/20 hover:bg-white/10">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div 
                              className="flex-1"
                              onClick={() => handleControlClickInRomm(control)}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="text-sm font-medium text-white">
                                  {control.control_name}
                                </h5>
                                <Badge variant="outline" className="text-xs">
                                  {control.control_id}
                                </Badge>
                              </div>
                              <p className="text-xs text-white/70 mb-2">
                                {control.control_description}
                              </p>
                              <div className="flex gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {control.control_type}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {control.control_attribute}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="text-white/40">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveControl(selectedRomm.id, control.control_id);
                                }}
                                className="text-white/60 hover:text-white hover:bg-white/10"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-white/60 border border-white/10 rounded-lg bg-white/5">
                    <Shield className="h-8 w-8 mx-auto mb-2 text-white/40" />
                    <p className="text-sm">No controls associated with this ROMM</p>
                    <p className="text-xs mt-1">Click "Associate Control" to add controls from the Internal Control Library</p>
                  </div>
                )}
              </div>
            )}

            {/* Substantive Procedures */}
            {selectedRomm && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-medium text-white flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Substantive Procedures
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsProcedureSelectorOpen(true)}
                    className="flex items-center gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10"
                  >
                    <Plus className="h-4 w-4" />
                    Associate Procedure
                  </Button>
                </div>
                
                {associatedProcedures[selectedRomm.id] && associatedProcedures[selectedRomm.id].length > 0 ? (
                  <div className="space-y-2">
                    {associatedProcedures[selectedRomm.id].map((procedure) => (
                      <Card key={procedure.id} className="border-white/10 bg-white/5">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="text-sm font-medium text-white">
                                  {procedure.name}
                                </h5>
                                <Badge variant="outline" className="text-xs">
                                  {procedure.id}
                                </Badge>
                              </div>
                              <p className="text-xs text-white/70 mb-2">
                                {procedure.description}
                              </p>
                              
                              {/* Required Files */}
                              <div className="space-y-1 mb-2">
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-white/60">Required Files:</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {procedure.requiredFiles.map((file, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {file}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              {/* Questions Count */}
                              {procedure.questions && procedure.questions.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {procedure.questions.length} question(s)
                                </Badge>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveProcedure(selectedRomm.id, procedure.id)}
                              className="text-white/60 hover:text-white hover:bg-white/10"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-white/60 border border-white/10 rounded-lg bg-white/5">
                    <Play className="h-8 w-8 mx-auto mb-2 text-white/40" />
                    <p className="text-sm">No procedures associated with this ROMM</p>
                    <p className="text-xs mt-1">Click "Associate Procedure" to add procedures from Substantive Procedures</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-white/60">
          Complete all risk assessments to proceed to the next step
        </div>
        <Button
          onClick={handleComplete}
          disabled={!allRommsComplete}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          Complete Risk Assessment
        </Button>
      </div>

      {/* Control Selector Modal */}
      <ControlSelectorModal
        isOpen={isControlSelectorOpen}
        onClose={() => setIsControlSelectorOpen(false)}
        onControlsSelected={handleAssociateControls}
        existingControls={selectedRommId ? associatedControls[selectedRommId] || [] : []}
      />

      {/* Procedure Selector Modal */}
      <ProcedureSelectorModal
        isOpen={isProcedureSelectorOpen}
        onClose={() => setIsProcedureSelectorOpen(false)}
        onProceduresSelected={handleAssociateProcedures}
        existingProcedures={selectedRommId ? associatedProcedures[selectedRommId] || [] : []}
      />
      
      {/* Control Viewer Modal */}
      <InternalControlViewerModal
        isOpen={isControlViewerOpen}
        onClose={() => setIsControlViewerOpen(false)}
        onSave={handleControlSaveInRomm}
        control={selectedControlForViewing}
        template={controlViewerTemplate}
        mode="view"
      />
    </div>
  );
}
