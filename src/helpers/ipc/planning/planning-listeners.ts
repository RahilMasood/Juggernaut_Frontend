import { BrowserWindow, app, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import {
  PLANNING_READ_SECTION_CHANNEL,
  PLANNING_SAVE_SECTION_CHANNEL,
  PLANNING_READ_COMBINED_DATA_CHANNEL,
} from "./planning-channels";

function getUserDataPath(): string {
  return app.getPath("userData");
}

function getPlanningDir(companyName: string): string {
  const dir = path.join(getUserDataPath(), "planning", companyName);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function inferConstantFileName(sectionKey: string): string {
  // Map section keys to constant filenames
  switch (sectionKey) {
    case "engagement-acceptance":
      return "EngagementAcceptance.json";
    case "fraud-risk":
      return "FraudRisk.json";
    case "it-risk":
      return "ItRisk.json";
    case "materiality":
      return "Materiality.json";
    case "preliminary-analytical":
      return "PrelimAnlytical.json";
    case "understanding-entity":
      return "understandingEntity.json";
    default:
      return sectionKey + ".json";
  }
}

function getDefaultConstantPath(filename: string): string {
  // When packaged, constants are bundled within app.asar; we read them via relative path from main.js
  // Our build outputs main.js under .vite/build/main.js, and renderer assets separately.
  // We know source resides under src/constants in development; for production, the plugin copies assets.
  // We'll attempt to resolve from the compiled path first and fallback to src.
  const compiled = path.join(__dirname, "../constants", filename);
  if (fs.existsSync(compiled)) return compiled;
  const dev = path.join(process.cwd(), "src", "constants", filename);
  return dev;
}

export function addPlanningEventListeners(_mainWindow: BrowserWindow) {
  ipcMain.handle(PLANNING_READ_SECTION_CHANNEL, async (_evt, args: { companyName: string; sectionKey: string }) => {
    const { companyName, sectionKey } = args;
    const planningDir = getPlanningDir(companyName);
    const fileName = inferConstantFileName(sectionKey);
    const userFile = path.join(planningDir, fileName);

    if (fs.existsSync(userFile)) {
      const content = fs.readFileSync(userFile, "utf-8");
      return JSON.parse(content);
    }

    const defaultPath = getDefaultConstantPath(fileName);
    const defaultContent = fs.readFileSync(defaultPath, "utf-8");
    // Write an initial copy for the engagement to persist answers alongside questions
    if (!fs.existsSync(planningDir)) fs.mkdirSync(planningDir, { recursive: true });
    fs.writeFileSync(userFile, defaultContent, "utf-8");
    return JSON.parse(defaultContent);
  });

  ipcMain.handle(
    PLANNING_SAVE_SECTION_CHANNEL,
    async (
      _evt,
      args: { companyName: string; sectionKey: string; content: unknown },
    ) => {
      const { companyName, sectionKey, content } = args;
      const planningDir = getPlanningDir(companyName);
      const fileName = inferConstantFileName(sectionKey);
      const userFile = path.join(planningDir, fileName);
      fs.writeFileSync(userFile, JSON.stringify(content, null, 2), "utf-8");
      return { ok: true };
    },
  );

  ipcMain.handle(PLANNING_READ_COMBINED_DATA_CHANNEL, async () => {
    try {
      // Read the Combined.json file from the data directory
      const combinedDataPath = path.join(__dirname, "../data/Combined.json");
      if (fs.existsSync(combinedDataPath)) {
        const content = fs.readFileSync(combinedDataPath, "utf-8");
        return JSON.parse(content);
      }
      
      // Fallback to development path
      const devPath = path.join(process.cwd(), "src", "data", "Combined.json");
      if (fs.existsSync(devPath)) {
        const content = fs.readFileSync(devPath, "utf-8");
        return JSON.parse(content);
      }
      
      throw new Error("Combined.json not found");
    } catch (error) {
      console.error("Error reading Combined.json:", error);
      return { data: [] };
    }
  });
}


