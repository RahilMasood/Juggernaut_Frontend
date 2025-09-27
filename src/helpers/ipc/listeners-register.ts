import { BrowserWindow } from "electron";
import { addThemeEventListeners } from "./theme/theme-listeners";
import { addWindowEventListeners } from "./window/window-listeners";
import { addPlanningEventListeners } from "./planning/planning-listeners";
import { addDocumentEventListeners } from "./documents/document-listeners";
import { addPayrollEventListeners } from "./payroll/payroll-listeners";
import { addInternalControlsEventListeners } from "./internal-controls/internal-controls-listeners";
import { addCloudEventListeners } from "./cloud/cloud-listeners";
import { addAzureUploadListener } from "./cloud/azure-upload";
import { testCloudHandlers } from "./cloud/cloud-handler-test";
import { registerSharePointListeners } from "./sharepoint/sharepoint-listeners";

export default function registerListeners(mainWindow: BrowserWindow) {
  console.log('Registering all IPC listeners...');
  addWindowEventListeners(mainWindow);
  addThemeEventListeners();
  addPlanningEventListeners(mainWindow);
  addDocumentEventListeners(mainWindow);
  addPayrollEventListeners(mainWindow);
  addInternalControlsEventListeners(mainWindow);
  addCloudEventListeners(mainWindow);
  console.log('About to register cloud file operation listeners...');
  addAzureUploadListener(mainWindow);
  registerSharePointListeners();
  console.log('All IPC listeners registered successfully');
  
  // Optional: verify handlers
  try {
    testCloudHandlers();
  } catch (err) {
    console.warn('Cloud handlers test failed:', err);
  }
}
