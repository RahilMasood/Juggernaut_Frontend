import { exposeThemeContext } from "./theme/theme-context";
import { exposeWindowContext } from "./window/window-context";
import { exposePlanningContext } from "./planning/planning-context";
import { exposeDocumentContext } from "./documents/document-context";
import { exposePayrollContext } from "./payroll/payroll-context";
import { exposeInternalControlsContext } from "./internal-controls/internal-controls-context";
import { exposeCloudContext } from "./cloud/cloud-context";
import { exposeAzureContext } from "./azure/azure-context";

export default function exposeContexts() {
  exposeWindowContext();
  exposeThemeContext();
  exposePlanningContext();
  exposeDocumentContext();
  exposePayrollContext();
  exposeInternalControlsContext();
  exposeCloudContext();
  exposeAzureContext();
}
