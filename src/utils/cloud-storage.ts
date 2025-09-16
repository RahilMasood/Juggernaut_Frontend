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
const MAPPING_FILE = "cloud_tree.json";
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
function getMappingFilePath(): string {
  return path.join(process.cwd(), MAPPING_FILE);
}

async function loadMapping(): Promise<CloudMetadata> {
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
      
      // Save the migrated format
      await saveMapping(migrated);
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

async function saveMapping(mapping: CloudMetadata): Promise<void> {
  const mappingPath = getMappingFilePath();
  try {
    fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving mapping file:', error);
    throw error;
  }
}

function generateUniqueCode(): string {
  return randomUUID();
}

// === MAIN FUNCTIONS ===
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

    const mapping = await loadMapping();
    const filename = customFilename || path.basename(filePath);

    // Upload file to Azure with blob name = filename
    const client = await getBlobServiceClient();
    const containerClient = client.getContainerClient(container);
    const blobClient = containerClient.getBlobClient(filename);
    const blockBlobClient = blobClient.getBlockBlobClient();
    
    const fileData = fs.readFileSync(filePath);
    
    await blockBlobClient.upload(fileData, fileData.length, {
      blobHTTPHeaders: {
        blobContentType: getMimeType(filename)
      }
    });

    // Update metadata based on container type
    if (container.toLowerCase() === 'juggernaut') {
      // For juggernaut, just add filename to array
      if (Array.isArray(mapping.juggernaut) && !mapping.juggernaut.includes(filename)) {
        mapping.juggernaut.push(filename);
      }
    } else if (container.toLowerCase() === 'client' || container.toLowerCase() === 'tools') {
      // For client and tools, add object with name and reference
      const entry: CloudFileEntry = {
        name: filename,
        reference: reference
      };
      
      const containerKey = container.toLowerCase() as keyof CloudMetadata;
      if (Array.isArray(mapping[containerKey])) {
        (mapping[containerKey] as CloudFileEntry[]).push(entry);
      }
    } else if (container.toLowerCase() === 'recycle_bin') {
      // For recycle_bin, just add filename to array
      if (Array.isArray(mapping.recycle_bin) && !mapping.recycle_bin.includes(filename)) {
        mapping.recycle_bin.push(filename);
      }
    }

    await saveMapping(mapping);

    console.log(`Uploaded ${filename} to container ${container}`);
    return {
      success: true,
      code: filename
    };

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
export async function uploadContent(
  container: string,
  content: string,
  filename: string,
  reference: string = ""
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

    const mapping = await loadMapping();

    // Upload content to Azure with blob name = filename
    const client = await getBlobServiceClient();
    const containerClient = client.getContainerClient(container);
    const blobClient = containerClient.getBlobClient(filename);
    const blockBlobClient = blobClient.getBlockBlobClient();
    
    const contentBuffer = Buffer.from(content, 'utf-8');
    
    await blockBlobClient.upload(contentBuffer, contentBuffer.length, {
      blobHTTPHeaders: {
        blobContentType: getMimeType(filename)
      }
    });

    // Update metadata based on container type
    if (container.toLowerCase() === 'juggernaut') {
      // For juggernaut, just add filename to array
      if (Array.isArray(mapping.juggernaut) && !mapping.juggernaut.includes(filename)) {
        mapping.juggernaut.push(filename);
      }
    } else if (container.toLowerCase() === 'client' || container.toLowerCase() === 'tools') {
      // For client and tools, add object with name and reference
      const entry: CloudFileEntry = {
        name: filename,
        reference: reference
      };
      
      const containerKey = container.toLowerCase() as keyof CloudMetadata;
      if (Array.isArray(mapping[containerKey])) {
        (mapping[containerKey] as CloudFileEntry[]).push(entry);
      }
    } else if (container.toLowerCase() === 'recycle_bin') {
      // For recycle_bin, just add filename to array
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


