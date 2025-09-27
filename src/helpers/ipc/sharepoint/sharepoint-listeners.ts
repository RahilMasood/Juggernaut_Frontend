import { ipcMain } from "electron";
import { spawn } from "child_process";
import path from "path";
import { logger } from "../../../utils/logger";

/**
 * SharePoint IPC Listeners
 * Handles SharePoint operations via IPC from renderer process
 */

export function registerSharePointListeners() {
  logger.info("Registering SharePoint IPC listeners");

  // Handle ROMM library reading
  ipcMain.handle("sharepoint:read-romm-library", async (event) => {
    try {
      logger.info("Reading ROMM library from SharePoint");

      // Get the path to the Python script
      const scriptPath = path.join(process.cwd(), "scripts", "sharepoint_read_romm.py");
      
      // Execute Python script
      const pythonProcess = spawn("python", [scriptPath]);

      let output = "";
      let errorOutput = "";

      pythonProcess.stdout.on("data", (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      return new Promise((resolve) => {
        pythonProcess.on("close", (code) => {
          if (code === 0) {
            try {
              const result = JSON.parse(output);
              if (result.success) {
                logger.info("ROMM library data retrieved successfully", { result });
                resolve({
                  success: true,
                  data: result.data
                });
              } else {
                logger.error("Failed to read ROMM library", { error: result.error });
                resolve({
                  success: false,
                  error: result.error
                });
              }
            } catch (parseError) {
              logger.error("Failed to parse Python script output", { parseError, output });
              resolve({
                success: false,
                error: "Failed to parse Python script output"
              });
            }
          } else {
            logger.error("Python script failed with exit code", { code, errorOutput });
            resolve({
              success: false,
              error: `Python script failed with exit code ${code}: ${errorOutput}`
            });
          }
        });

        pythonProcess.on("error", (error) => {
          logger.error("Failed to execute Python script", { error });
          resolve({
            success: false,
            error: `Failed to execute Python script: ${error.message}`
          });
        });
      });

    } catch (error) {
      logger.error("Error in SharePoint read handler", { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  });

  // Handle ROMM entry addition
  ipcMain.handle("sharepoint:add-romm-entry", async (event, formData) => {
    try {
      logger.info("Adding ROMM entry via Python script", { formData });

      // Get the path to the Python script
      const scriptPath = path.join(process.cwd(), "scripts", "sharepoint_romm.py");
      
      // Execute Python script with arguments
      const pythonProcess = spawn("python", [
        scriptPath,
        formData["romm-id"],
        formData.workspace,
        formData.description,
        formData.assertion
      ]);

      let output = "";
      let errorOutput = "";

      pythonProcess.stdout.on("data", (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      return new Promise((resolve, reject) => {
        pythonProcess.on("close", (code) => {
          if (code === 0) {
            try {
              const result = JSON.parse(output);
              if (result.success) {
                logger.info("Python script executed successfully", { result });
                resolve({
                  success: true,
                  data: result.data
                });
              } else {
                logger.error("Python script failed", { error: result.error });
                resolve({
                  success: false,
                  error: result.error
                });
              }
            } catch (parseError) {
              logger.error("Failed to parse Python script output", { parseError, output });
              resolve({
                success: false,
                error: "Failed to parse Python script output"
              });
            }
          } else {
            logger.error("Python script failed with exit code", { code, errorOutput });
            resolve({
              success: false,
              error: `Python script failed with exit code ${code}: ${errorOutput}`
            });
          }
        });

        pythonProcess.on("error", (error) => {
          logger.error("Failed to execute Python script", { error });
          resolve({
            success: false,
            error: `Failed to execute Python script: ${error.message}`
          });
        });
      });

    } catch (error) {
      logger.error("Error in SharePoint IPC handler", { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  });

  logger.info("SharePoint IPC listeners registered successfully");
}
