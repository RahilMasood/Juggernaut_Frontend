import { BrowserWindow, ipcMain } from "electron";
import * as fs from "fs";
import * as path from "path";

const INTERNAL_CONTROLS_READ_TEMPLATE_CHANNEL = "internal-controls:read-template";

function getInternalControlsPath(): string {
  // Get the path to the Internal Control folder
  const appPath = process.cwd();
  return path.join(appPath, "Internal Control", "Internal Controls Updated.json");
}

export function addInternalControlsEventListeners(_mainWindow: BrowserWindow) {
  console.log("Registering Internal Controls IPC listeners...");
  
  ipcMain.handle(INTERNAL_CONTROLS_READ_TEMPLATE_CHANNEL, async () => {
    try {
      const filePath = getInternalControlsPath();
      console.log(`Attempting to read Internal Controls template from: ${filePath}`);
      
      if (!fs.existsSync(filePath)) {
        console.error(`Internal Controls template file not found at: ${filePath}`);
        // Return a fallback structure
        return {
          templates: {
            manual: { sections: [] },
            automated: { sections: [] }
          }
        };
      }

      const content = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(content);
      console.log("Successfully loaded Internal Controls template:", {
        manualSections: parsed.templates?.manual?.sections?.length || 0,
        automatedSections: parsed.templates?.automated?.sections?.length || 0
      });
      return parsed;
    } catch (error) {
      console.error("Failed to read Internal Controls template:", error);
      // Return a fallback structure
      return {
        templates: {
          manual: { sections: [] },
          automated: { sections: [] }
        }
      };
    }
  });
  
  console.log("Internal Controls IPC listeners registered successfully");
}
