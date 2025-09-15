import { BrowserWindow, ipcMain } from "electron";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const CLOUD_WRITE_TEMP_FILE_CHANNEL = "cloud:write-temp-file";
const CLOUD_READ_TEMP_FILE_CHANNEL = "cloud:read-temp-file";
const CLOUD_DELETE_TEMP_FILE_CHANNEL = "cloud:delete-temp-file";

export function addCloudFileOperationListeners(mainWindow: BrowserWindow) {
  console.log('Registering cloud file operation listeners...');
  console.log('CLOUD_WRITE_TEMP_FILE_CHANNEL:', CLOUD_WRITE_TEMP_FILE_CHANNEL);
  
  try {
    // Write temporary file
    ipcMain.handle(
      CLOUD_WRITE_TEMP_FILE_CHANNEL,
      async (_event, { content, filename }: { content: string; filename: string }) => {
        console.log('Cloud write temp file handler called:', { filename });
        try {
          const tempDir = os.tmpdir();
          const tempFilePath = path.join(tempDir, filename);
          
          fs.writeFileSync(tempFilePath, content, 'utf8');
          
          return {
            success: true,
            filePath: tempFilePath
          };
        } catch (error) {
          console.error('Error in write temp file handler:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    );
    console.log('Successfully registered cloud:write-temp-file handler');
  } catch (error) {
    console.error('Error registering cloud:write-temp-file handler:', error);
  }

  try {
    // Read temporary file
    ipcMain.handle(
      CLOUD_READ_TEMP_FILE_CHANNEL,
      async (_event, { filePath }: { filePath: string }) => {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          
          return {
            success: true,
            content
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    );
    console.log('Successfully registered cloud:read-temp-file handler');
  } catch (error) {
    console.error('Error registering cloud:read-temp-file handler:', error);
  }

  try {
    // Delete temporary file
    ipcMain.handle(
      CLOUD_DELETE_TEMP_FILE_CHANNEL,
      async (_event, { filePath }: { filePath: string }) => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          
          return {
            success: true
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    );
    console.log('Successfully registered cloud:delete-temp-file handler');
  } catch (error) {
    console.error('Error registering cloud:delete-temp-file handler:', error);
  }
  
  console.log('Cloud file operation listeners registration completed');
}
