import { BrowserWindow, ipcMain } from "electron";
import { BlobServiceClient } from "@azure/storage-blob";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { jugg } from "../../../utils/cloud-storage";

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
          // Create temporary file from base64 content
          const tempDir = os.tmpdir();
          const tempFilePath = path.join(tempDir, `temp_${fileName}`);
          
          // Convert base64 content to buffer and write to temp file
          const fileBuffer = Buffer.from(fileContent, 'base64');
          fs.writeFileSync(tempFilePath, fileBuffer);
          
          // Use jugg function to upload with db.json management
          const result = await jugg(tempFilePath, containerName || CONTAINER_NAME, reference);
          
          // Clean up temp file
          try {
            if (fs.existsSync(tempFilePath)) {
              fs.unlinkSync(tempFilePath);
            }
          } catch (cleanupError) {
            console.warn('Failed to clean up temp file:', cleanupError);
          }
          
          if (result.success) {
            console.log(`Successfully uploaded ${fileName} to Azure Blob Storage with db.json update`);
            
            // Return success response
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

