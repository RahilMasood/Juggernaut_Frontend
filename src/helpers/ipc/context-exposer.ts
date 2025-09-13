import { exposeThemeContext } from "./theme/theme-context";
import { exposeWindowContext } from "./window/window-context";
import { exposePlanningContext } from "./planning/planning-context";
import { exposeDocumentContext } from "./documents/document-context";
import { exposePayrollContext } from "./payroll/payroll-context";

export default function exposeContexts() {
  exposeWindowContext();
  exposeThemeContext();
  exposePlanningContext();
  exposeDocumentContext();
  exposePayrollContext();
}
