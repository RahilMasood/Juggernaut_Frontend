import { BrowserWindow, ipcMain } from "electron";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { uploadFile } from "../../../utils/cloud-storage";

const CLOUD_DIRECT_UPLOAD_CHANNEL = "cloud:direct-upload";

export function addCloudDirectUploadListener(mainWindow: BrowserWindow) {
  console.log('Registering cloud direct upload listener...');
  
  try {
    ipcMain.handle(
      CLOUD_DIRECT_UPLOAD_CHANNEL,
      async (_event, { content, filename, container, reference }: { 
        content: string; 
        filename: string; 
        container: string; 
        reference: string; 
      }) => {
        console.log('Cloud direct upload handler called:', { filename, container });
        
        try {
          // Create temporary file
          const tempDir = os.tmpdir();
          const tempFilePath = path.join(tempDir, `temp_${filename}`);
          
          // Write content to temp file
          fs.writeFileSync(tempFilePath, content, 'utf8');
          console.log('Temp file created:', tempFilePath);
          
          // Upload to cloud storage with the original filename
          const uploadResult = await uploadFile(container, tempFilePath, reference, filename);
          console.log('Upload result:', uploadResult);
          
          // Clean up temp file
          try {
            if (fs.existsSync(tempFilePath)) {
              fs.unlinkSync(tempFilePath);
              console.log('Temp file cleaned up');
            }
          } catch (cleanupError) {
            console.warn('Failed to clean up temp file:', cleanupError);
          }
          
          return uploadResult;
        } catch (error) {
          console.error('Error in direct upload handler:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    );
    console.log('Successfully registered cloud:direct-upload handler');
  } catch (error) {
    console.error('Error registering cloud:direct-upload handler:', error);
  }
}
