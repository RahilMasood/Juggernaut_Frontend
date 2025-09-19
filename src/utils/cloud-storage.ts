/**
 * Cloud Storage Utility
 * Handles Azure Blob Storage operations for file upload/download
 * Based on Cloud_logic.py implementation
 */

import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

// === CONFIG ===
const CONNECTION_STRING = "DefaultEndpointsProtocol=https;AccountName=auditfirmone;AccountKey=noJNGotPPflseazBYfQ5zGTL3ulm7Eq1kxhwPNGXzl04celHpi9xjQsrXIYNTWhFzDsCnYuedKLs+AStDYspZg==;EndpointSuffix=core.windows.net";
const DB_CONTAINER = "juggernaut";
const DB_BLOB = "db.json";
const CONTAINERS = ["juggernaut", "client", "tools", "recycle_bin"];

// === INTERFACES ===
export interface CloudFileEntry {
  name: string;
  reference: string;
}

export interface CloudMetadata {
  juggernaut: string[];
  client: CloudFileEntry[];
  tools: CloudFileEntry[];
  recycle_bin: string[];
}

export interface UploadResult {
  success: boolean;
  code?: string;
  error?: string;
}

export interface DownloadResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

// === AZURE CLIENT ===
let blobServiceClient: any = null;

async function getBlobServiceClient() {
  if (!blobServiceClient) {
    try {
      const { BlobServiceClient } = await import('@azure/storage-blob');
      blobServiceClient = BlobServiceClient.fromConnectionString(CONNECTION_STRING);
      console.log('Azure Blob Service Client initialized successfully');
    } catch (error) {
      console.error('Error initializing Azure Blob Service Client:', error);
      throw error;
    }
  }
  return blobServiceClient;
}

// === HELPER FUNCTIONS ===
async function downloadJson(container: string, blobName: string): Promise<CloudMetadata> {
  try {
    const client = await getBlobServiceClient();
    const blobClient = client.getContainerClient(container).getBlobClient(blobName);
    const downloadBlockBlobResponse = await blobClient.download();
    const downloaded = await streamToString(downloadBlockBlobResponse.readableStreamBody);
    return JSON.parse(downloaded);
  } catch (error) {
    // If db.json doesn't exist yet, start with empty structure
    return { juggernaut: [], client: [], tools: [], recycle_bin: [] };
  }
}

async function uploadJson(container: string, blobName: string, data: CloudMetadata): Promise<void> {
  const client = await getBlobServiceClient();
  const blockBlobClient = client.getContainerClient(container).getBlockBlobClient(blobName);
  await blockBlobClient.upload(JSON.stringify(data, null, 4), Buffer.byteLength(JSON.stringify(data, null, 4)), {
    overwrite: true
  });
}

// Helper: convert stream → string
async function streamToString(readableStream: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: string[] = [];
    readableStream.on("data", (data: any) => chunks.push(data.toString()));
    readableStream.on("end", () => resolve(chunks.join("")));
    readableStream.on("error", reject);
  });
}

// Legacy mapping functions for backward compatibility
function getMappingFilePath(): string {
  return path.join(process.cwd(), "cloud_tree.json");
}

async function loadMapping(): Promise<CloudMetadata> {
  // Try to load from db.json first, fallback to local file
  try {
    return await downloadJson(DB_CONTAINER, DB_BLOB);
  } catch (error) {
    console.log('Loading from local mapping file as fallback...');
    const mappingPath = getMappingFilePath();
    try {
      if (!fs.existsSync(mappingPath)) {
        return { juggernaut: [], client: [], tools: [], recycle_bin: [] };
      }
      const data = fs.readFileSync(mappingPath, 'utf-8');
      const parsed = JSON.parse(data);
      
      // Check if this is the old format and migrate it
      if (parsed.Juggernaut || parsed.Client || parsed.Tools || parsed.Recycle_bin) {
        console.log('Migrating from old cloud structure format...');
        const migrated = {
          juggernaut: Array.isArray(parsed.Juggernaut) ? parsed.Juggernaut.map((item: any) => 
            typeof item === 'string' ? item : item.name || item.filename || ''
          ).filter(Boolean) : [],
          client: Array.isArray(parsed.Client) ? parsed.Client.map((item: any) => ({
            name: item.name || item.filename || '',
            reference: item.reference || ''
          })).filter((item: any) => item.name) : [],
          tools: Array.isArray(parsed.Tools) ? parsed.Tools.map((item: any) => ({
            name: item.name || item.filename || '',
            reference: item.reference || ''
          })).filter((item: any) => item.name) : [],
          recycle_bin: Array.isArray(parsed.Recycle_bin) ? parsed.Recycle_bin.map((item: any) => 
            typeof item === 'string' ? item : item.name || item.filename || ''
          ).filter(Boolean) : []
        };
        
        // Save the migrated format to db.json
        await uploadJson(DB_CONTAINER, DB_BLOB, migrated);
        console.log('Migration completed successfully');
        return migrated;
      }
      
      // Ensure all required properties exist and are arrays
      return {
        juggernaut: Array.isArray(parsed.juggernaut) ? parsed.juggernaut : [],
        client: Array.isArray(parsed.client) ? parsed.client : [],
        tools: Array.isArray(parsed.tools) ? parsed.tools : [],
        recycle_bin: Array.isArray(parsed.recycle_bin) ? parsed.recycle_bin : []
      };
    } catch (error) {
      console.error('Error loading mapping file:', error);
      return { juggernaut: [], client: [], tools: [], recycle_bin: [] };
    }
  }
}

async function saveMapping(mapping: CloudMetadata): Promise<void> {
  // Save to db.json in Azure blob storage
  await uploadJson(DB_CONTAINER, DB_BLOB, mapping);
}

function generateUniqueCode(): string {
  return randomUUID();
}

// === MAIN FUNCTIONS ===
// Main Upload + Update Function (jugg function)
export async function jugg(
  localFilePath: string,
  targetContainer: string,
  reference: string = ""
): Promise<UploadResult> {
  try {
    const client = await getBlobServiceClient();
    const containerClient = client.getContainerClient(targetContainer);
    const blobName = path.basename(localFilePath);

    // 1. Upload file
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadFile(localFilePath, {
      overwrite: true
    });

    // 2. Download db.json
    const db = await downloadJson(DB_CONTAINER, DB_BLOB);

    // 3. Update db.json
    const entry = { name: blobName, reference: reference };

    if (targetContainer === "juggernaut") {
      // juggernaut just stores list of names
      db.juggernaut.push(blobName);
    } else if (targetContainer === "client") {
      db.client.push(entry);
    } else if (targetContainer === "tools") {
      db.tools.push(entry);
    } else if (targetContainer === "recycle_bin") {
      db.recycle_bin.push(blobName);
    }

    // 4. Upload updated db.json
    await uploadJson(DB_CONTAINER, DB_BLOB, db);

    console.log(`✅ Uploaded ${localFilePath} to ${targetContainer}/${blobName} and updated db.json`);
    return {
      success: true,
      code: blobName
    };
  } catch (error) {
    console.error('Error in jugg function:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function uploadFile(
  container: string,
  filePath: string,
  reference: string = "",
  customFilename?: string
): Promise<UploadResult> {
  try {
    // Validate inputs
    if (!container || typeof container !== 'string') {
      return {
        success: false,
        error: 'Container parameter is required and must be a string'
      };
    }
    
    if (!filePath || typeof filePath !== 'string') {
      return {
        success: false,
        error: 'File path parameter is required and must be a string'
      };
    }

    // Validate container
    if (!CONTAINERS.includes(container.toLowerCase())) {
      return {
        success: false,
        error: `Invalid container. Must be one of: ${CONTAINERS.join(', ')}`
      };
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        error: `File not found: ${filePath}`
      };
    }

    // Use the new jugg function for upload with db.json management
    return await jugg(filePath, container, reference);

  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function downloadFile(
  container: string,
  filename: string,
  downloadPath: string
): Promise<DownloadResult> {
  try {
    console.log("downloadFile called with:", { container, filename, downloadPath });
    
    // Validate inputs
    if (!container) {
      return { success: false, error: 'Container is required' };
    }
    if (!filename) {
      return { success: false, error: 'Filename is required' };
    }
    if (!downloadPath) {
      return { success: false, error: 'Download path is required' };
    }
    
    // Validate container
    if (!CONTAINERS.includes(container.toLowerCase())) {
      return {
        success: false,
        error: `Invalid container. Must be one of: ${CONTAINERS.join(', ')}`
      };
    }

    // Use filename directly as blob name (no more UUID mapping)
    const client = await getBlobServiceClient();
    const containerClient = client.getContainerClient(container);
    const blobClient = containerClient.getBlobClient(filename);
    const downloadResponse = await blobClient.download();
    
    if (!downloadResponse.readableStreamBody) {
      return {
        success: false,
        error: 'No data received from blob storage'
      };
    }

    // Ensure download directory exists
    const downloadDir = path.dirname(downloadPath);
    console.log("Download directory:", downloadDir);
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    // Write file to download path
    const chunks: Buffer[] = [];
    for await (const chunk of downloadResponse.readableStreamBody) {
      chunks.push(chunk);
    }
    
    const fileData = Buffer.concat(chunks);
    fs.writeFileSync(downloadPath, fileData);

    console.log(`Downloaded ${filename} from ${container} → ${downloadPath}`);
    return {
      success: true,
      filePath: downloadPath
    };

  } catch (error) {
    console.error('Error downloading file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function listFiles(container: string): Promise<CloudFileEntry[]> {
  try {
    if (!CONTAINERS.includes(container.toLowerCase())) {
      throw new Error(`Invalid container. Must be one of: ${CONTAINERS.join(', ')}`);
    }

    const mapping = await loadMapping();
    const containerKey = container.toLowerCase() as keyof CloudMetadata;
    const containerData = mapping[containerKey];

    if (container.toLowerCase() === 'juggernaut' || container.toLowerCase() === 'recycle_bin') {
      // For juggernaut and recycle_bin, convert string array to CloudFileEntry array
      return (containerData as string[]).map(filename => ({
        name: filename,
        reference: ''
      }));
    } else {
      // For client and tools, return the CloudFileEntry array directly
      return containerData as CloudFileEntry[];
    }
  } catch (error) {
    console.error('Error listing files from metadata:', error);
    return [];
  }
}

export async function deleteFile(container: string, filename: string): Promise<boolean> {
  try {
    if (!CONTAINERS.includes(container.toLowerCase())) {
      throw new Error(`Invalid container. Must be one of: ${CONTAINERS.join(', ')}`);
    }

    const mapping = await loadMapping();
    const containerKey = container.toLowerCase() as keyof CloudMetadata;

    // Remove from metadata
    if (container.toLowerCase() === 'juggernaut' || container.toLowerCase() === 'recycle_bin') {
      // For juggernaut and recycle_bin, remove from string array
      const stringArray = mapping[containerKey] as string[];
      if (Array.isArray(stringArray)) {
        const index = stringArray.indexOf(filename);
        if (index > -1) {
          stringArray.splice(index, 1);
        }
      }
    } else {
      // For client and tools, remove from CloudFileEntry array
      const entryArray = mapping[containerKey] as CloudFileEntry[];
      if (Array.isArray(entryArray)) {
        const index = entryArray.findIndex(item => item.name === filename);
        if (index > -1) {
          entryArray.splice(index, 1);
        }
      }
    }

    await saveMapping(mapping);

    // Delete from Azure
    const client = await getBlobServiceClient();
    const containerClient = client.getContainerClient(container);
    const blobClient = containerClient.getBlobClient(filename);
    await blobClient.delete();

    console.log(`Deleted ${filename} from ${container}`);
    return true;

  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

// === UTILITY FUNCTIONS ===
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
    '.zip': 'application/zip'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

// === DIRECT UPLOAD FUNCTION ===
export async function checkFileExists(
  container: string,
  filename: string
): Promise<{ exists: boolean; error?: string }> {
  try {
    if (!CONTAINERS.includes(container.toLowerCase())) {
      return {
        exists: false,
        error: `Invalid container. Must be one of: ${CONTAINERS.join(', ')}`
      };
    }

    const mapping = await loadMapping();
    const containerKey = container.toLowerCase() as keyof CloudMetadata;
    const containerData = mapping[containerKey];

    if (container.toLowerCase() === 'juggernaut' || container.toLowerCase() === 'recycle_bin') {
      // For juggernaut and recycle_bin, check string array
      return {
        exists: (containerData as string[]).includes(filename)
      };
    } else {
      // For client and tools, check CloudFileEntry array
      return {
        exists: (containerData as CloudFileEntry[]).some(file => file.name === filename)
      };
    }
  } catch (error) {
    return {
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function uploadContent(
  container: string,
  content: string,
  filename: string,
  reference: string = "",
  replaceExisting: boolean = false
): Promise<UploadResult> {
  try {
    // Validate inputs
    if (!container || typeof container !== 'string') {
      return {
        success: false,
        error: 'Container parameter is required and must be a string'
      };
    }
    
    if (!content || typeof content !== 'string') {
      return {
        success: false,
        error: 'Content parameter is required and must be a string'
      };
    }
    
    if (!filename || typeof filename !== 'string') {
      return {
        success: false,
        error: 'Filename parameter is required and must be a string'
      };
    }

    // Validate container
    if (!CONTAINERS.includes(container.toLowerCase())) {
      return {
        success: false,
        error: `Invalid container. Must be one of: ${CONTAINERS.join(', ')}`
      };
    }

    // Check if file already exists
    const fileCheck = await checkFileExists(container, filename);
    if (fileCheck.error) {
      return {
        success: false,
        error: fileCheck.error
      };
    }

    if (fileCheck.exists && !replaceExisting) {
      return {
        success: false,
        error: 'FILE_EXISTS',
        code: filename
      };
    }

    const mapping = await loadMapping();

    // Upload content to Azure with blob name = filename
    const client = await getBlobServiceClient();
    const containerClient = client.getContainerClient(container);
    const blobClient = containerClient.getBlobClient(filename);
    const blockBlobClient = blobClient.getBlockBlobClient();
    
    // Check if content is base64 encoded (for binary files)
    let contentBuffer: Buffer;
    try {
      // Try to decode as base64 first
      contentBuffer = Buffer.from(content, 'base64');
      // Verify it's valid base64 by re-encoding and comparing
      if (contentBuffer.toString('base64') !== content) {
        // If not valid base64, treat as regular text
        contentBuffer = Buffer.from(content, 'utf-8');
      }
    } catch {
      // If base64 decoding fails, treat as regular text
      contentBuffer = Buffer.from(content, 'utf-8');
    }
    
    await blockBlobClient.upload(contentBuffer, contentBuffer.length, {
      blobHTTPHeaders: {
        blobContentType: getMimeType(filename)
      }
    });

    // Update metadata based on container type
    if (container.toLowerCase() === 'juggernaut') {
      // For juggernaut, just add filename to array if not exists
      if (Array.isArray(mapping.juggernaut) && !mapping.juggernaut.includes(filename)) {
        mapping.juggernaut.push(filename);
      }
    } else if (container.toLowerCase() === 'client' || container.toLowerCase() === 'tools') {
      // For client and tools, add or update object with name and reference
      const entry: CloudFileEntry = {
        name: filename,
        reference: reference
      };
      
      const containerKey = container.toLowerCase() as keyof CloudMetadata;
      const containerArray = mapping[containerKey] as CloudFileEntry[];
      
      if (Array.isArray(containerArray)) {
        // Check if file already exists and update or add
        const existingIndex = containerArray.findIndex(file => file.name === filename);
        if (existingIndex !== -1) {
          // Update existing entry
          containerArray[existingIndex] = entry;
        } else {
          // Add new entry
          containerArray.push(entry);
        }
      }
    } else if (container.toLowerCase() === 'recycle_bin') {
      // For recycle_bin, just add filename to array if not exists
      if (Array.isArray(mapping.recycle_bin) && !mapping.recycle_bin.includes(filename)) {
        mapping.recycle_bin.push(filename);
      }
    }

    await saveMapping(mapping);

    console.log(`Uploaded content as ${filename} to container ${container}`);
    return {
      success: true,
      code: filename
    };

  } catch (error) {
    console.error('Error uploading content:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export { CONTAINERS };


