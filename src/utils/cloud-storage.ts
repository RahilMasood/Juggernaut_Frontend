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
  code: string;
  reference: string;
}

export interface CloudMapping {
  Juggernaut: CloudFileEntry[];
  Client: CloudFileEntry[];
  Tools: CloudFileEntry[];
  Recycle_bin: CloudFileEntry[];
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

async function loadMapping(): Promise<CloudMapping> {
  const mappingPath = getMappingFilePath();
  try {
    if (!fs.existsSync(mappingPath)) {
      return { Juggernaut: [], Client: [], Tools: [], Recycle_bin: [] };
    }
    const data = fs.readFileSync(mappingPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading mapping file:', error);
    return { Juggernaut: [], Client: [], Tools: [], Recycle_bin: [] };
  }
}

async function saveMapping(mapping: CloudMapping): Promise<void> {
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
    
    // For juggernaut container, use filename as code; for others, generate unique code
    const code = container.toLowerCase() === 'juggernaut' ? filename : generateUniqueCode();

    // Upload file to Azure with blob name = code
    const client = await getBlobServiceClient();
    const containerClient = client.getContainerClient(container);
    const blobClient = containerClient.getBlobClient(code);
    const blockBlobClient = blobClient.getBlockBlobClient();
    
    const fileData = fs.readFileSync(filePath);
    
    await blockBlobClient.upload(fileData, fileData.length, {
      blobHTTPHeaders: {
        blobContentType: getMimeType(filename)
      }
    });

    // Update mapping only for non-juggernaut containers
    if (container.toLowerCase() !== 'juggernaut') {
      const entry: CloudFileEntry = {
        name: filename,
        code: code,
        reference: reference
      };

      const containerKey = container.charAt(0).toUpperCase() + container.slice(1) as keyof CloudMapping;
      mapping[containerKey].push(entry);
      await saveMapping(mapping);
    }

    console.log(`Uploaded ${filename} as blob ${code} in container ${container}`);
    return {
      success: true,
      code: code
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

    // For juggernaut container, use filename directly; for others, lookup code from mapping
    let blobName = filename;
    
    if (container.toLowerCase() !== 'juggernaut') {
      // For other containers, use mapping system
      const mapping = await loadMapping();
      const containerKey = container.charAt(0).toUpperCase() + container.slice(1) as keyof CloudMapping;
      
      // Find entry by filename
      const entry = mapping[containerKey].find(item => item.name === filename);
      if (!entry) {
        return {
          success: false,
          error: `File ${filename} not found in mapping under ${container}`
        };
      }
      blobName = entry.code;
    }

    const client = await getBlobServiceClient();
    const containerClient = client.getContainerClient(container);
    const blobClient = containerClient.getBlobClient(blobName);
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

    console.log(`Downloaded ${filename} (blob ${blobName}) from ${container} → ${downloadPath}`);
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

    // For juggernaut container, list files directly from Azure; for others, use mapping
    if (container.toLowerCase() === 'juggernaut') {
      // List files directly from Azure Blob Storage for juggernaut
      const client = await getBlobServiceClient();
      const containerClient = client.getContainerClient(container);
      
      const files: CloudFileEntry[] = [];
      
      // List all blobs in the container
      for await (const blob of containerClient.listBlobsFlat()) {
        files.push({
          name: blob.name,
          code: blob.name, // For juggernaut, code = name
          reference: blob.name
        });
      }
      
      console.log(`Found ${files.length} files in container ${container}`);
      return files;
    } else {
      // For other containers, use mapping system
      const mapping = await loadMapping();
      const containerKey = container.charAt(0).toUpperCase() + container.slice(1) as keyof CloudMapping;
      return mapping[containerKey];
    }
  } catch (error) {
    console.error('Error listing files from Azure:', error);
    return [];
  }
}

export async function deleteFile(container: string, filename: string): Promise<boolean> {
  try {
    if (!CONTAINERS.includes(container.toLowerCase())) {
      throw new Error(`Invalid container. Must be one of: ${CONTAINERS.join(', ')}`);
    }

    // For juggernaut container, use filename directly; for others, use mapping
    let blobName = filename;
    
    if (container.toLowerCase() === 'juggernaut') {
      // For juggernaut, use filename as blob name directly
      blobName = filename;
    } else {
      // For other containers, use mapping system
      const mapping = await loadMapping();
      const containerKey = container.charAt(0).toUpperCase() + container.slice(1) as keyof CloudMapping;
      
      // Find entry by filename
      const entryIndex = mapping[containerKey].findIndex(item => item.name === filename);
      if (entryIndex === -1) {
        return false;
      }

      const entry = mapping[containerKey][entryIndex];
      blobName = entry.code;

      // Remove from mapping
      mapping[containerKey].splice(entryIndex, 1);
      await saveMapping(mapping);
    }

    // Delete from Azure
    const client = await getBlobServiceClient();
    const containerClient = client.getContainerClient(container);
    const blobClient = containerClient.getBlobClient(blobName);
    await blobClient.delete();

    console.log(`Deleted ${filename} (blob ${blobName}) from ${container}`);
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

export { CONTAINERS };


