import { BrowserWindow, ipcMain } from "electron";
import { BlobServiceClient } from "@azure/storage-blob";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { uploadContent } from "../../../utils/cloud-storage";

const AZURE_UPLOAD_CHANNEL = "azure:upload-file";

// Azure configuration
const CONNECTION_STRING = "";
const CONTAINER_NAME = "client";

export function addAzureUploadListener(mainWindow: BrowserWindow) {
  console.log('Registering Azure upload listener...');
  
  try {
    ipcMain.handle(
      AZURE_UPLOAD_CHANNEL,
      async (_event, { 
        containerName, 
        fileName, 
        fileContent, 
        contentType,
        reference = ""
      }: { 
        containerName: string; 
        fileName: string; 
        fileContent: string; 
        contentType: string;
        reference?: string;
      }) => {
        console.log('Azure upload handler called:', { fileName, containerName });
        
        try {
          // Upload content directly with the original filename (no temp_ prefix)
          const result = await uploadContent(
            containerName || CONTAINER_NAME,
            fileContent,
            fileName,
            reference,
            true // overwrite if exists
          );
          
          if (result.success) {
            console.log(`Successfully uploaded ${fileName} with db.json update`);
            return {
              success: true,
              cloudUrl: `https://auditfirmone.blob.core.windows.net/${containerName}/${fileName}`,
              fileName: fileName
            };
          } else {
            throw new Error(result.error || 'Upload failed');
          }
          
        } catch (error) {
          console.error('Error uploading file to Azure:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          };
        }
      }
    );
    console.log('Successfully registered azure:upload-file handler');
  } catch (error) {
    console.error('Error registering azure:upload-file handler:', error);
  }
}

