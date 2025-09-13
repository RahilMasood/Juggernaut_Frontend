import { BrowserWindow } from "electron";
import { addThemeEventListeners } from "./theme/theme-listeners";
import { addWindowEventListeners } from "./window/window-listeners";
import { addPlanningEventListeners } from "./planning/planning-listeners";
import { addDocumentEventListeners } from "./documents/document-listeners";
import { addPayrollEventListeners } from "./payroll/payroll-listeners";

export default function registerListeners(mainWindow: BrowserWindow) {
  addWindowEventListeners(mainWindow);
  addThemeEventListeners();
  addPlanningEventListeners(mainWindow);
  addDocumentEventListeners(mainWindow);
  addPayrollEventListeners(mainWindow);
}
