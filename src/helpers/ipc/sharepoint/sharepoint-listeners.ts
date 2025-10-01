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

  // Handle file upload to SharePoint
  ipcMain.handle("sharepoint:upload-file", async (event, uploadData) => {
    try {
      logger.info("Uploading file to SharePoint via IPC", { uploadData });
      
      // === CONFIG ===
      const TENANT_ID = "114c8106-747f-4cc7-870e-8712e6c23b18";
      const CLIENT_ID = "b357e50c-c5ef-484d-84df-fe470fe76528";
      const CLIENT_SECRET = "JAZ8Q~xlY-EDlgbLtgJaqjPNAjsHfYFavwxbkdjE";
      const SITE_NAME = "TestCloud";
      const DOC_LIBRARY = "TestClient";

      // === 1️⃣ Get access token ===
      const { ConfidentialClientApplication } = require('@azure/msal-node');
      const msalApp = new ConfidentialClientApplication({
        auth: {
          clientId: CLIENT_ID,
          clientSecret: CLIENT_SECRET,
          authority: `https://login.microsoftonline.com/${TENANT_ID}`
        }
      });

      const tokenResponse = await msalApp.acquireTokenByClientCredential({
        scopes: ["https://graph.microsoft.com/.default"]
      });

      if (!tokenResponse.accessToken) {
        throw new Error("Failed to acquire access token");
      }

      const headers = { "Authorization": `Bearer ${tokenResponse.accessToken}` };

      // === 2️⃣ Get site ID ===
      const siteResp = await fetch(
        `https://graph.microsoft.com/v1.0/sites/juggernautenterprises.sharepoint.com:/sites/${SITE_NAME}`,
        { headers }
      );

      if (!siteResp.ok) {
        throw new Error(`Failed to get site ID: ${siteResp.statusText}`);
      }

      const siteData = await siteResp.json();
      const siteId = siteData.id;

      // === 3️⃣ Get library (drive) ID for TestClient ===
      const drivesResp = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/drives`, { headers });
      
      if (!drivesResp.ok) {
        throw new Error(`Failed to get drives: ${drivesResp.statusText}`);
      }

      const drivesData = await drivesResp.json();
      const drives = drivesData.value;

      let driveId = null;
      for (const d of drives) {
        if (d.name === DOC_LIBRARY) {
          driveId = d.id;
          break;
        }
      }

      if (!driveId) {
        throw new Error(`Library '${DOC_LIBRARY}' not found on site '${SITE_NAME}'`);
      }

      // === 4️⃣ Upload file to folder in the library ===
      const uploadUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${uploadData.fyYear || "TestClient_FY25"}/${uploadData.folderName || "client"}/${uploadData.fileName}:/content`;

      // Convert base64 content to buffer
      const fileContent = Buffer.from(uploadData.fileContent, 'base64');

      const uploadResp = await fetch(uploadUrl, {
        method: "PUT",
        headers,
        body: fileContent,
      });

      if (!uploadResp.ok) {
        throw new Error(`Failed to upload file: ${uploadResp.statusText}`);
      }

      const uploadResult = await uploadResp.json();
      const fileWebUrl = uploadResult.webUrl;

      // === 5️⃣ Download current db.json ===
      const dbUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${uploadData.fyYear || "TestClient_FY25"}/juggernaut/db.json:/content`;
      const dbResp = await fetch(dbUrl, { headers });

      let dbData;
      if (dbResp.status === 200) {
        dbData = await dbResp.json();
      } else {
        // If db.json doesn't exist yet, start with empty structure
        dbData = { "juggernaut": [], "client": [], "tools": [], "rbin": [] };
      }

      // === 6️⃣ Append new file entry ===
      const newEntry = {
        name: uploadData.fileName,
        url: fileWebUrl,
        reference: uploadData.referenceValue || ""
      };

      const folderName = uploadData.folderName || "client";
      if (folderName in dbData) {
        dbData[folderName].push(newEntry);
      } else {
        dbData[folderName] = [newEntry];
      }

      // === 7️⃣ Upload updated db.json back ===
      const updatedDbContent = JSON.stringify(dbData, null, 4);
      const dbUploadUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${uploadData.fyYear || "TestClient_FY25"}/juggernaut/db.json:/content`;

      const dbUploadResp = await fetch(dbUploadUrl, {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: updatedDbContent,
      });

      if (!dbUploadResp.ok) {
        throw new Error(`Failed to update db.json: ${dbUploadResp.statusText}`);
      }

      logger.info("Successfully uploaded file to SharePoint", { fileName: uploadData.fileName, webUrl: fileWebUrl });

      return {
        success: true,
        data: {
          webUrl: fileWebUrl,
          fileName: uploadData.fileName,
          reference: uploadData.referenceValue || ""
        }
      };
    } catch (error) {
      logger.error("Error uploading file to SharePoint", { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  });

  // Handle loading cloud files from db.json
  ipcMain.handle("sharepoint:load-cloud-files", async (event) => {
    try {
      logger.info("Loading cloud files from SharePoint db.json via IPC");
      
      // === CONFIG ===
      const TENANT_ID = "114c8106-747f-4cc7-870e-8712e6c23b18";
      const CLIENT_ID = "b357e50c-c5ef-484d-84df-fe470fe76528";
      const CLIENT_SECRET = "JAZ8Q~xlY-EDlgbLtgJaqjPNAjsHfYFavwxbkdjE";
      const SITE_HOSTNAME = "juggernautenterprises.sharepoint.com";
      const SITE_PATH = "/sites/TestCloud";
      const DOC_LIBRARY = "TestClient";
      const FY_YEAR = "TestClient_FY25";
      const FOLDER_NAME = "juggernaut";
      const FILE_NAME = "db.json";

      // === 1️⃣ Acquire token ===
      const { ConfidentialClientApplication } = require('@azure/msal-node');
      const msalApp = new ConfidentialClientApplication({
        auth: {
          clientId: CLIENT_ID,
          clientSecret: CLIENT_SECRET,
          authority: `https://login.microsoftonline.com/${TENANT_ID}`
        }
      });

      const tokenResponse = await msalApp.acquireTokenByClientCredential({
        scopes: ["https://graph.microsoft.com/.default"]
      });

      if (!tokenResponse.accessToken) {
        throw new Error("Failed to acquire access token");
      }

      const headers = { "Authorization": `Bearer ${tokenResponse.accessToken}` };

      // === 2️⃣ Get site ID ===
      const siteUrl = `https://graph.microsoft.com/v1.0/sites/${SITE_HOSTNAME}:${SITE_PATH}`;
      const siteResp = await fetch(siteUrl, { headers });

      if (!siteResp.ok) {
        throw new Error(`Failed to get site ID: ${siteResp.statusText}`);
      }

      const siteData = await siteResp.json();
      const siteId = siteData.id;

      // === 3️⃣ Get drive ID ===
      const drivesResp = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/drives`, { headers });
      
      if (!drivesResp.ok) {
        throw new Error(`Failed to get drives: ${drivesResp.statusText}`);
      }

      const drivesData = await drivesResp.json();
      const drives = drivesData.value;

      let driveId = null;
      for (const d of drives) {
        if (d.name === DOC_LIBRARY) {
          driveId = d.id;
          break;
        }
      }

      if (!driveId) {
        throw new Error(`Library '${DOC_LIBRARY}' not found in site '${SITE_PATH}'`);
      }

      // === 4️⃣ Fetch file content directly as JSON ===
      const downloadUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${FY_YEAR}/${FOLDER_NAME}/${FILE_NAME}:/content`;
      const resp = await fetch(downloadUrl, { headers });

      if (!resp.ok) {
        throw new Error(`Failed to download db.json: ${resp.statusText}`);
      }

      const data = await resp.json();

      // === 5️⃣ Extract client files ===
      const clientFiles = data.client || [];
      
      logger.info("Successfully loaded cloud files from SharePoint", { count: clientFiles.length });

      return {
        success: true,
        data: {
          files: clientFiles.map((file: any) => ({
            name: file.name || '',
            url: file.url || '',
            reference: file.reference || ''
          }))
        }
      };
    } catch (error) {
      logger.error("Error loading cloud files from SharePoint", { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  });

  // Handle loading ledger data from SharePoint
  ipcMain.handle("sharepoint:load-ledger-data", async (event, filters) => {
    try {
      logger.info("Loading ledger data from SharePoint", { filters });

      // --- Config ---
      const tenantId = "114c8106-747f-4cc7-870e-8712e6c23b18";
      const clientId = "b357e50c-c5ef-484d-84df-fe470fe76528";
      const clientSecret = "JAZ8Q~xlY-EDlgbLtgJaqjPNAjsHfYFavwxbkdjE";

      const siteHostname = "juggernautenterprises.sharepoint.com";
      const sitePath = "/sites/TestCloud";
      const docLibrary = "TestClient";
      const fyYear = "TestClient_FY25";
      const folderName = "juggernaut";
      const fileName = "FinData_LedgerMapping.json";

      // --- 1️⃣ Acquire token ---
      const tokenResponse = await fetch(
        `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
        {
          method: 'POST',
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            scope: "https://graph.microsoft.com/.default",
            grant_type: "client_credentials"
          })
        }
      );

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;
      if (!accessToken) {
        throw new Error("Failed to acquire access token");
      }

      const headers = { Authorization: `Bearer ${accessToken}` };

      // --- 2️⃣ Get site ID ---
      const siteUrl = `https://graph.microsoft.com/v1.0/sites/${siteHostname}:${sitePath}`;
      const siteResp = await fetch(siteUrl, { headers });
      
      if (!siteResp.ok) {
        throw new Error(`Failed to get site: ${siteResp.statusText}`);
      }

      const siteData = await siteResp.json();
      const siteId = siteData.id;

      // --- 3️⃣ Get drive ID ---
      const drivesResp = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/drives`, { headers });
      
      if (!drivesResp.ok) {
        throw new Error(`Failed to get drives: ${drivesResp.statusText}`);
      }

      const drivesData = await drivesResp.json();
      const drives = drivesData.value;

      let driveId = null;
      for (const d of drives) {
        if (d.name === docLibrary) {
          driveId = d.id;
          break;
        }
      }

      if (!driveId) {
        throw new Error(`Library '${docLibrary}' not found in site '${sitePath}'`);
      }

      // --- 4️⃣ Download JSON file ---
      const downloadUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${fyYear}/${folderName}/${fileName}:/content`;
      const resp = await fetch(downloadUrl, { headers });

      if (!resp.ok) {
        throw new Error(`Failed to download file: ${resp.statusText}`);
      }

      const data = await resp.json();

      // --- 5️⃣ Filter data based on filters ---
      let filteredData = data.data || [];
      
      if (filters.fs_sub_line_id) {
        filteredData = filteredData.filter((item: any) => item.fs_sub_line_id === filters.fs_sub_line_id);
      }
      
      if (filters.note_line_id) {
        filteredData = filteredData.filter((item: any) => item.note_line_id === filters.note_line_id);
      }

      // Clean ledger names
      const cleanedData = filteredData.map((item: any) => ({
        ...item,
        ledger_name: item.ledger_name
          ?.replace("_x000D", "")
          .replace("\n", "")
          .replace(/_$/, "")
          .trim() || ""
      }));

      logger.info("Successfully loaded ledger data from SharePoint", { count: cleanedData.length });

      return {
        success: true,
        data: cleanedData
      };
    } catch (error) {
      logger.error("Error loading ledger data from SharePoint", { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  });

  logger.info("SharePoint IPC listeners registered successfully");
}
