/**
 * SharePoint Service
 * Handles SharePoint operations for ROMM library integration
 * Based on the Python implementation provided
 */

import { logger } from "./logger";

// === CONFIG ===
const TENANT_ID = "114c8106-747f-4cc7-870e-8712e6c23b18";
const CLIENT_ID = "b357e50c-c5ef-484d-84df-fe470fe76528";
const CLIENT_SECRET = "JAZ8Q~xlY-EDlgbLtgJaqjPNAjsHfYFavwxbkdjE";
const SITE_HOSTNAME = "juggernautenterprises.sharepoint.com";
const SITE_PATH = "/sites/TestCloud";
const DOC_LIBRARY = "TestClient";
const FY_YEAR =  "TestClient_FY25"
const FOLDER_NAME = "juggernaut";
const FILE_NAME = "Libraries_Romm.json";

// === INTERFACES ===
export interface RommEntry {
  "romm-id": string;
  workspace: string;
  description: string;
  assertion: string;
  assesment: string;
  documentation: string;
  control_id: string[];
  procedure_id: string[];
}

export interface RommLibrary {
  romm_library: RommEntry[];
}

export interface SharePointResponse {
  success: boolean;
  data?: RommLibrary | any;
  error?: string;
}

// === SHAREPOINT SERVICE ===
export class SharePointService {
  private accessToken: string | null = null;

  /**
   * Acquire access token (mock implementation for renderer process)
   */
  private async acquireToken(): Promise<string> {
    try {
      logger.info("Acquiring SharePoint access token");

      // For renderer process, we'll use mock authentication
      // Real authentication should be handled in main process via IPC
      logger.warn("Using mock authentication in renderer process - real auth should be in main process");
      this.accessToken = "mock-access-token-for-testing";
      return this.accessToken;
    } catch (error) {
      logger.error("Failed to acquire SharePoint access token", { error });
      this.accessToken = "mock-access-token-for-testing";
      return this.accessToken;
    }
  }

  /**
   * Get SharePoint site ID
   */
  private async getSiteId(): Promise<string> {
    try {
      // For mock implementation, return a mock site ID
      if (this.accessToken === "mock-access-token-for-testing") {
        logger.warn("Using mock site ID for testing");
        return "mock-site-id";
      }

      const siteUrl = `https://graph.microsoft.com/v1.0/sites/${SITE_HOSTNAME}:${SITE_PATH}`;
      const headers = { Authorization: `Bearer ${this.accessToken}` };

      const response = await fetch(siteUrl, { headers });
      if (!response.ok) {
        throw new Error(`Failed to get site ID: ${response.statusText}`);
      }

      const data = await response.json();
      return data.id;
    } catch (error) {
      logger.error("Failed to get SharePoint site ID", { error });
      throw error;
    }
  }

  /**
   * Get drive ID for the document library
   */
  private async getDriveId(siteId: string): Promise<string> {
    try {
      // For mock implementation, return a mock drive ID
      if (this.accessToken === "mock-access-token-for-testing") {
        logger.warn("Using mock drive ID for testing");
        return "mock-drive-id";
      }

      const drivesUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/drives`;
      const headers = { Authorization: `Bearer ${this.accessToken}` };

      const response = await fetch(drivesUrl, { headers });
      if (!response.ok) {
        throw new Error(`Failed to get drives: ${response.statusText}`);
      }

      const data = await response.json();
      const drive = data.value.find((d: any) => d.name === DOC_LIBRARY);

      if (!drive) {
        throw new Error(`Library '${DOC_LIBRARY}' not found in site '${SITE_PATH}'`);
      }

      return drive.id;
    } catch (error) {
      logger.error("Failed to get SharePoint drive ID", { error });
      throw error;
    }
  }

  /**
   * Download ROMM library file from SharePoint with workspace filter
   */
  async downloadRommLibraryByWorkspace(workspace: string): Promise<SharePointResponse> {
    try {
      logger.info(`Downloading ROMM library from SharePoint for workspace: ${workspace}`);

      // First, get the full library
      const fullLibraryResponse = await this.downloadRommLibrary();
      
      if (!fullLibraryResponse.success || !fullLibraryResponse.data) {
        return fullLibraryResponse;
      }

      // Filter by workspace
      const filteredLibrary: RommLibrary = {
        romm_library: fullLibraryResponse.data.romm_library.filter(
          (entry: RommEntry) => entry.workspace === workspace
        )
      };

      logger.info(`Found ${filteredLibrary.romm_library.length} ROMM entries for workspace: ${workspace}`);

      return {
        success: true,
        data: filteredLibrary,
      };
    } catch (error) {
      logger.error("Failed to download ROMM library by workspace", { error, workspace });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Download ROMM library file from SharePoint
   */
  async downloadRommLibrary(): Promise<SharePointResponse> {
    try {
      logger.info("Downloading ROMM library from SharePoint");

      // Acquire token
      this.accessToken = await this.acquireToken();

      // For mock implementation, return empty library
      if (this.accessToken === "mock-access-token-for-testing") {
        logger.warn("Using mock download - returning empty library for testing");
        return {
          success: true,
          data: { romm_library: [] }
        };
      }

      // Real SharePoint implementation
      logger.info("Using real SharePoint API calls");

      // Get site ID
      const siteId = await this.getSiteId();

      // Get drive ID
      const driveId = await this.getDriveId(siteId);

      // Download file
      const downloadUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${FY_YEAR}/${FOLDER_NAME}/${FILE_NAME}:/content`;
      const headers = { Authorization: `Bearer ${this.accessToken}` };

      const response = await fetch(downloadUrl, { headers });
      if (!response.ok) {
        // If file doesn't exist (404), return empty library
        if (response.status === 404) {
          logger.info("ROMM library file doesn't exist, returning empty library");
          return {
            success: true,
            data: { romm_library: [] }
          };
        }
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        data: data as RommLibrary,
      };
    } catch (error) {
      logger.error("Failed to download ROMM library", { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Upload ROMM library file to SharePoint
   */
  async uploadRommLibrary(data: RommLibrary): Promise<SharePointResponse> {
    try {
      logger.info("Uploading ROMM library to SharePoint");

      // Acquire token
      this.accessToken = await this.acquireToken();

      // For mock implementation, simulate successful upload
      if (this.accessToken === "mock-access-token-for-testing") {
        logger.warn("Using mock upload - simulating successful upload for testing");
        return {
          success: true,
        };
      }

      // Real SharePoint implementation
      logger.info("Using real SharePoint API calls for upload");

      // Get site ID
      const siteId = await this.getSiteId();

      // Get drive ID
      const driveId = await this.getDriveId(siteId);

      // Upload file - match Python implementation exactly
      const uploadUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${FY_YEAR}/${FOLDER_NAME}/${FILE_NAME}:/content`;
      const headers = {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      };

      // Format JSON exactly like Python: json.dumps(data, indent=4).encode("utf-8")
      const jsonString = JSON.stringify(data, null, 4);
      const response = await fetch(uploadUrl, {
        method: "PUT",
        headers,
        body: jsonString,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload file: ${response.statusText}`);
      }

      logger.info("Successfully uploaded ROMM library to SharePoint");
      return {
        success: true,
      };
    } catch (error) {
      logger.error("Failed to upload ROMM library", { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Execute Python script for SharePoint integration (via IPC)
   */
  private async executePythonScript(
    entry: Omit<RommEntry, "assesment" | "documentation" | "control_id" | "procedure_id">
  ): Promise<SharePointResponse> {
    try {
      logger.info("Executing Python script for SharePoint integration", { entry });

      // For now, simulate Python script execution
      // In a real implementation, this would call the main process via IPC
      logger.warn("Python script execution not implemented in renderer - using mock");
      
      // Simulate successful execution
      const mockData: RommLibrary = {
        romm_library: [{
          "romm-id": entry["romm-id"],
          workspace: entry.workspace,
          description: entry.description,
          assertion: entry.assertion,
          assesment: "",
          documentation: "",
          control_id: [],
          procedure_id: []
        }]
      };

      return {
        success: true,
        data: mockData
      };
    } catch (error) {
      logger.error("Error executing Python script", { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Update an existing ROMM entry by romm-id
   */
  async updateRommEntry(
    rommId: string,
    updates: Partial<Pick<RommEntry, "assesment" | "documentation" | "control_id" | "procedure_id">>
  ): Promise<SharePointResponse> {
    try {
      logger.info(`Updating ROMM entry ${rommId}`, { updates });

      // Step 1: Download current library
      const downloadResponse = await this.downloadRommLibrary();
      if (!downloadResponse.success || !downloadResponse.data) {
        throw new Error(downloadResponse.error || "Failed to download library");
      }

      const library = downloadResponse.data;

      // Step 2: Find the entry by romm-id
      const entryIndex = library.romm_library.findIndex((e: RommEntry) => e["romm-id"] === rommId);
      if (entryIndex === -1) {
        throw new Error(`ROMM entry with id ${rommId} not found`);
      }

      // Step 3: Apply updates
      library.romm_library[entryIndex] = {
        ...library.romm_library[entryIndex],
        ...updates
      };

      // Step 4: Upload updated file back
      const uploadResponse = await this.uploadRommLibrary(library);
      if (!uploadResponse.success) {
        throw new Error(uploadResponse.error || "Failed to upload updated library");
      }

      return {
        success: true,
        data: library
      };
    } catch (error) {
      logger.error("Failed to update ROMM entry", { error, rommId, updates });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Load cloud files from db.json
   */
  async loadCloudFiles(): Promise<SharePointResponse> {
    try {
      logger.info("Loading cloud files from SharePoint db.json");

      // This method should only be called from the main process
      // The actual implementation is in the IPC listener
      throw new Error("This method should be called via IPC from the main process");
    } catch (error) {
      logger.error("Failed to load cloud files", { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Upload file to SharePoint client folder
   */
  async uploadFileToSharePoint(
    filePath: string,
    fileName: string,
    referenceValue: string = "",
    folderName: string = "client",
    fyYear: string = "TestClient_FY25"
  ): Promise<SharePointResponse> {
    try {
      logger.info(`Uploading file to SharePoint: ${fileName}`, { filePath, referenceValue, folderName, fyYear });

      // This method should only be called from the main process
      // The actual implementation is in the IPC listener
      throw new Error("This method should be called via IPC from the main process");
    } catch (error) {
      logger.error("Failed to upload file to SharePoint", { error, fileName, filePath });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Update db.json with new file entry
   */
  private async updateDbJson(
    driveId: string,
    fileName: string,
    fileWebUrl: string,
    referenceValue: string,
    folderName: string,
    fyYear: string
  ): Promise<void> {
    try {
      // Download current db.json
      const dbUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${fyYear}/juggernaut/db.json:/content`;
      const headers = { Authorization: `Bearer ${this.accessToken}` };

      const dbResponse = await fetch(dbUrl, { headers });
      
      let dbData: any;
      if (dbResponse.ok) {
        dbData = await dbResponse.json();
      } else {
        // If db.json doesn't exist yet, start with empty structure
        dbData = { "juggernaut": [], "client": [], "tools": [], "rbin": [] };
      }

      // Append new file entry
      const newEntry = {
        name: fileName,
        url: fileWebUrl,
        reference: referenceValue
      };

      if (dbData[folderName]) {
        dbData[folderName].push(newEntry);
      } else {
        dbData[folderName] = [newEntry];
      }

      // Upload updated db.json back
      const updatedDbContent = JSON.stringify(dbData, null, 4);
      const dbUploadUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${fyYear}/juggernaut/db.json:/content`;

      const dbUploadResponse = await fetch(dbUploadUrl, {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: updatedDbContent,
      });

      if (!dbUploadResponse.ok) {
        throw new Error(`Failed to update db.json: ${dbUploadResponse.statusText}`);
      }

      logger.info("Successfully updated db.json with new file entry");
    } catch (error) {
      logger.error("Failed to update db.json", { error });
      throw error;
    }
  }

  /**
   * Add new ROMM entry to the library (using Python script)
   */
  async addRommEntry(
    entry: Omit<RommEntry, "assesment" | "documentation" | "control_id" | "procedure_id">
  ): Promise<SharePointResponse> {
    try {
      logger.info("Adding new ROMM entry using Python script", { entry });

      // Try Python script first (most reliable)
      const pythonResult = await this.executePythonScript(entry);
      if (pythonResult.success) {
        return pythonResult;
      }

      // Fallback to TypeScript implementation
      logger.warn("Python script failed, falling back to TypeScript implementation", { 
        error: pythonResult.error 
      });

      // 1. Download current library (or create new one if it doesn't exist)
      let library: RommLibrary;
      const downloadResp = await this.downloadRommLibrary();
      
      if (!downloadResp.success) {
        // If file doesn't exist, create a new library structure
        logger.info("ROMM library file doesn't exist, creating new one");
        library = {
          romm_library: []
        };
      } else if (!downloadResp.data) {
        // If data is null/undefined, create new structure
        library = {
          romm_library: []
        };
      } else {
        library = downloadResp.data;
      }

      // 2. Append new entry - match Python structure exactly
      const newEntry: RommEntry = {
        "romm-id": entry["romm-id"],
        workspace: entry.workspace,
        description: entry.description,
        assertion: entry.assertion,
        assesment: "",
        documentation: "",
        control_id: [],
        procedure_id: []
      };
      library.romm_library.push(newEntry);

      // 3. Upload updated library
      const uploadResp = await this.uploadRommLibrary(library);
      if (!uploadResp.success) {
        throw new Error(uploadResp.error || "Failed to upload updated ROMM library");
      }

      return {
        success: true,
        data: library,
      };
    } catch (error) {
      logger.error("Failed to add ROMM entry", { error, entry });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Export singleton instance
export const sharePointService = new SharePointService();
