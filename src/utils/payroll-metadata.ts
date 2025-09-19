export interface PayrollMetadata {
  rommControlAssociations: Record<string, string[]>; // rommId -> controlIds[]
  controlRommAssociations: Record<string, string[]>; // controlId -> rommIds[]
  lastUpdated: string | null;
  version: string;
}

export interface ControlAssociation {
  controlId: string;
  controlName: string;
  controlType: string;
  controlAttribute: string;
  controlDescription: string;
}

export interface RommAssociation {
  rommId: string;
  rommName: string;
  noteLineId: string;
}

/**
 * Load payroll metadata from localStorage
 */
export function loadPayrollMetadata(): PayrollMetadata {
  try {
    const saved = localStorage.getItem('payrollMetadata');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Error loading payroll metadata:', error);
  }
  
  // Return default metadata
  return {
    rommControlAssociations: {},
    controlRommAssociations: {},
    lastUpdated: null,
    version: "1.0.0"
  };
}

/**
 * Save payroll metadata to localStorage
 */
export function savePayrollMetadata(metadata: PayrollMetadata): void {
  try {
    metadata.lastUpdated = new Date().toISOString();
    localStorage.setItem('payrollMetadata', JSON.stringify(metadata));
  } catch (error) {
    console.error('Error saving payroll metadata:', error);
  }
}

/**
 * Associate a control with a RoMM
 */
export function associateControlWithRomm(
  controlId: string, 
  rommId: string, 
  controlData?: ControlAssociation,
  rommData?: RommAssociation
): void {
  const metadata = loadPayrollMetadata();
  
  // Add control to RoMM's associations
  if (!metadata.rommControlAssociations[rommId]) {
    metadata.rommControlAssociations[rommId] = [];
  }
  if (!metadata.rommControlAssociations[rommId].includes(controlId)) {
    metadata.rommControlAssociations[rommId].push(controlId);
  }
  
  // Add RoMM to control's associations
  if (!metadata.controlRommAssociations[controlId]) {
    metadata.controlRommAssociations[controlId] = [];
  }
  if (!metadata.controlRommAssociations[controlId].includes(rommId)) {
    metadata.controlRommAssociations[controlId].push(rommId);
  }
  
  savePayrollMetadata(metadata);
}

/**
 * Disassociate a control from a RoMM
 */
export function disassociateControlFromRomm(controlId: string, rommId: string): void {
  const metadata = loadPayrollMetadata();
  
  // Remove control from RoMM's associations
  if (metadata.rommControlAssociations[rommId]) {
    metadata.rommControlAssociations[rommId] = metadata.rommControlAssociations[rommId].filter(
      id => id !== controlId
    );
  }
  
  // Remove RoMM from control's associations
  if (metadata.controlRommAssociations[controlId]) {
    metadata.controlRommAssociations[controlId] = metadata.controlRommAssociations[controlId].filter(
      id => id !== rommId
    );
  }
  
  savePayrollMetadata(metadata);
}

/**
 * Get all controls associated with a RoMM
 */
export function getControlsForRomm(rommId: string): string[] {
  const metadata = loadPayrollMetadata();
  return metadata.rommControlAssociations[rommId] || [];
}

/**
 * Get all RoMMs associated with a control
 */
export function getRommsForControl(controlId: string): string[] {
  const metadata = loadPayrollMetadata();
  return metadata.controlRommAssociations[controlId] || [];
}

/**
 * Get all associated controls with their data
 */
export function getAllAssociatedControls(): ControlAssociation[] {
  const metadata = loadPayrollMetadata();
  const allControlIds = new Set<string>();
  
  // Collect all unique control IDs
  Object.values(metadata.rommControlAssociations).forEach(controlIds => {
    controlIds.forEach(controlId => allControlIds.add(controlId));
  });
  
  // Convert to ControlAssociation objects
  // Note: This would need to be enhanced to load actual control data from cloud storage
  return Array.from(allControlIds).map(controlId => ({
    controlId,
    controlName: `Control ${controlId}`,
    controlType: 'Unknown',
    controlAttribute: 'Unknown',
    controlDescription: `Control ${controlId} description`
  }));
}

/**
 * Clear all associations
 */
export function clearAllAssociations(): void {
  const metadata: PayrollMetadata = {
    rommControlAssociations: {},
    controlRommAssociations: {},
    lastUpdated: new Date().toISOString(),
    version: "1.0.0"
  };
  savePayrollMetadata(metadata);
}





