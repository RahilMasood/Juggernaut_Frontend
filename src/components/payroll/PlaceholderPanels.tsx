import React from "react";
import { Card, CardContent } from "../ui/card";
import {
  usePayrollDocuments,
  isPreviewableImage,
  toFileUrl,
} from "./PayrollDocumentsContext";
import TailoringQuestions from "./TailoringQuestions";
import InternalControlViewerModal from "../libraries/InternalControlViewerModal";

type PlaceholderProps = {
  title: string;
  blurb: string;
};

function Placeholder({ title, blurb }: PlaceholderProps) {
  const { documents } = usePayrollDocuments();
  return (
    <div className="space-y-4">
      <Card className="border-white/10 bg-white/5 text-white">
        <CardContent className="p-6">
          <h3 className="mb-2 text-lg font-semibold">{title}</h3>
          <p className="text-sm text-white/70">{blurb}</p>
        </CardContent>
      </Card>
      <Card className="border-white/10 bg-white/5 text-white">
        <CardContent className="p-4">
          <div className="mb-2 text-sm font-semibold">Linked Documents</div>
          {documents.length === 0 ? (
            <div className="text-xs text-white/60">
              No documents uploaded yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="overflow-hidden rounded border border-white/10 bg-black/40"
                >
                  {isPreviewableImage(doc.extension) ? (
                    <img
                      src={toFileUrl(doc.filePath)}
                      alt={doc.fileName}
                      className="h-24 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-24 items-center justify-center text-xs text-white/60">
                      {doc.extension.toUpperCase().replace(".", "") || "FILE"}
                    </div>
                  )}
                  <div className="truncate p-2 text-[10px] text-white/70">
                    {doc.fileName}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function TailoringQuestionsPanel() {
  return <TailoringQuestions />;
}

export function RommsPanel() {
  return (
    <Placeholder
      title="Risks of Material Misstatement (RoMMs)"
      blurb="Placeholder: Risk identification and assessment matrix."
    />
  );
}

export function ControlsPanel() {
  const [linkedControls, setLinkedControls] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  // Control viewer modal state
  const [selectedControl, setSelectedControl] = React.useState<any>(null);
  const [controlTemplate, setControlTemplate] = React.useState<any>(null);
  const [isControlViewerOpen, setIsControlViewerOpen] = React.useState(false);

  React.useEffect(() => {
    const loadLinkedControls = async () => {
      try {
        // Load ROMM-control linkages from localStorage
        const savedLinkages = localStorage.getItem('rommControlLinkages');
        if (savedLinkages) {
          const linkages = JSON.parse(savedLinkages);
          
          // Flatten all linked controls from all ROMMs
          const allLinkedControls: any[] = [];
          Object.entries(linkages).forEach(([rommId, controls]: [string, any]) => {
            if (Array.isArray(controls)) {
              controls.forEach(control => {
                // Add ROMM info to control for display
                allLinkedControls.push({
                  ...control,
                  linkedRomm: rommId
                });
              });
            }
          });
          
          // Remove duplicates (same control linked to multiple ROMMs)
          const uniqueControls = allLinkedControls.reduce((acc, current) => {
            const existing = acc.find(item => item.control_id === current.control_id);
            if (existing) {
              // Add to linked ROMMs array
              if (!existing.linkedRomms) {
                existing.linkedRomms = [existing.linkedRomm];
              }
              if (!existing.linkedRomms.includes(current.linkedRomm)) {
                existing.linkedRomms.push(current.linkedRomm);
              }
            } else {
              acc.push({
                ...current,
                linkedRomms: [current.linkedRomm]
              });
            }
            return acc;
          }, []);
          
          setLinkedControls(uniqueControls);
        }
      } catch (error) {
        console.error('Error loading linked controls:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLinkedControls();
    
    // Listen for storage changes to refresh when linkages are updated
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'rommControlLinkages') {
        loadLinkedControls();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events for same-tab updates
    const handleCustomUpdate = () => {
      loadLinkedControls();
    };
    
    window.addEventListener('rommControlLinkagesUpdated', handleCustomUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('rommControlLinkagesUpdated', handleCustomUpdate);
    };
  }, []);

  const handleControlClick = async (control: any) => {
    try {
      // Load the control template based on the control's template type
      const response = await fetch('/Internal%20Controls%20Updated.json');
      if (response.ok) {
        const templateData = await response.json();
        
        // Determine template type from multiple possible sources
        let templateType = 'manual'; // default
        if (control.template === 'automated' || 
            control.control_type === 'Automated' || 
            control.controlMetadata?.subtype === 'Automated') {
          templateType = 'automated';
        }
        
        const template = templateType === 'automated'
          ? templateData.templates?.automated 
          : templateData.templates?.manual;
        
        setSelectedControl(control);
        setControlTemplate(template);
        setIsControlViewerOpen(true);
      }
    } catch (error) {
      console.error('Error loading control template:', error);
    }
  };

  const handleControlSave = (updatedControl: any) => {
    // Update the control in localStorage and refresh linkages
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

  if (loading) {
    return (
      <Card className="border-white/10 bg-white/5 text-white">
        <CardContent className="p-6">
          <div className="text-center text-white/60">
            Loading linked controls...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-white/10 bg-white/5 text-white">
        <CardContent className="p-6">
          <h3 className="mb-2 text-lg font-semibold">Internal Controls</h3>
          <p className="text-sm text-white/70">
            Controls linked from ROMM associations in the execution phase
          </p>
        </CardContent>
      </Card>

      {linkedControls.length === 0 ? (
        <Card className="border-white/10 bg-white/5 text-white">
          <CardContent className="p-6">
            <div className="text-center text-white/60">
              <div className="mb-2">No controls linked yet</div>
              <div className="text-xs">
                Link controls to ROMMs in the execution phase to see them here
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {linkedControls.map((control) => (
            <Card 
              key={control.control_id} 
              className="border-white/10 bg-white/5 text-white cursor-pointer transition-all hover:border-white/20 hover:bg-white/10"
              onClick={() => handleControlClick(control)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-sm font-medium text-white">
                        {control.control_name}
                      </h4>
                      <span className="text-xs text-white/60">
                        ({control.control_id})
                      </span>
                    </div>
                    
                    <p className="text-xs text-white/70 mb-2">
                      {control.control_description}
                    </p>
                    
                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className="rounded bg-blue-500/20 px-2 py-1 text-xs text-blue-300">
                        {control.control_type}
                      </span>
                      <span className="rounded bg-green-500/20 px-2 py-1 text-xs text-green-300">
                        {control.control_attribute}
                      </span>
                    </div>
                    
                    <div className="text-xs text-white/60">
                      <span className="font-medium">Linked to ROMMs:</span>{' '}
                      {control.linkedRomms?.join(', ') || control.linkedRomm}
                    </div>
                  </div>
                  <div className="ml-2 text-white/40">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Control Viewer Modal */}
      <InternalControlViewerModal
        isOpen={isControlViewerOpen}
        onClose={() => setIsControlViewerOpen(false)}
        onSave={handleControlSave}
        control={selectedControl}
        template={controlTemplate}
        mode="view"
      />
    </div>
  );
}

export function SubstantivePanel() {
  return (
    <Placeholder
      title="Substantive Procedures"
      blurb="Placeholder: Detailed procedures and sampling workbench."
    />
  );
}
