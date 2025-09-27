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

  // Handle ROMM library reading by workspace
  ipcMain.handle("sharepoint:read-romm-library-by-workspace", async (event, workspace: string) => {
    try {
      logger.info(`Reading ROMM library from SharePoint for workspace: ${workspace}`);

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
                // Filter by workspace
                const filteredData = {
                  romm_library: result.data.romm_library.filter((entry: any) => entry.workspace === workspace)
                };
                
                logger.info(`Found ${filteredData.romm_library.length} ROMM entries for workspace: ${workspace}`, { result: filteredData });
                resolve({
                  success: true,
                  data: filteredData
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

  // Handle ROMM entry update
  ipcMain.handle("sharepoint:update-romm-entry", async (event, updateData) => {
    try {
      logger.info("Updating ROMM entry via Python script", { updateData });
      console.log("SharePoint update request:", updateData);

      // Get the path to the Python script
      const scriptPath = path.join(process.cwd(), "scripts", "sharepoint_update_romm.py");
      console.log("Python script path:", scriptPath);
      
      // Execute Python script with arguments
      const pythonProcess = spawn("python", [
        scriptPath,
        updateData.rommId,
        updateData.assessment,
        updateData.documentation,
        JSON.stringify(updateData.controlIds || []),
        JSON.stringify(updateData.procedureIds || [])
      ]);
      
      console.log("Python script command:", `python ${scriptPath} ${updateData.rommId} ${updateData.assessment} ${updateData.documentation}`);

      let output = "";
      let errorOutput = "";

      pythonProcess.stdout.on("data", (data) => {
        const dataStr = data.toString();
        console.log("Python stdout:", dataStr);
        output += dataStr;
      });

        pythonProcess.stderr.on("data", (data) => {
          const dataStr = data.toString();
          console.log("Python stderr:", dataStr);
          errorOutput += dataStr;
        });

      return new Promise((resolve, reject) => {
        pythonProcess.on("close", (code) => {
          console.log("Python script finished with code:", code);
          console.log("Python script output:", output);
          console.log("Python script error output:", errorOutput);
          
          if (code === 0) {
            try {
              const result = JSON.parse(output);
              console.log("Parsed Python result:", result);
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
      logger.error("Error in SharePoint update handler", { error });
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
