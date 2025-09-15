/**
 * Cloud Storage Utility
 * Handles Azure Blob Storage operations for file upload/download
 * Based on Cloud_logic.py implementation
 */

import { BlobServiceClient } from '@azure/storage-blob';
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
const blobServiceClient = BlobServiceClient.fromConnectionString(CONNECTION_STRING);

// === HELPER FUNCTIONS ===
function getMappingFilePath(): string {
  return path.join(process.cwd(), MAPPING_FILE);
}

async function loadMapping(): Promise<CloudMapping> {
  const mappingPath = getMappingFilePath();
  try {
    if (!fs.existsSync(mappingPath)) {
      return { Juggernaut: [], Client: [], Tools: [] };
    }
    const data = fs.readFileSync(mappingPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading mapping file:', error);
    return { Juggernaut: [], Client: [], Tools: [] };
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
  reference: string = ""
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
    const filename = path.basename(filePath);
    const code = generateUniqueCode();

    // Upload file to Azure with blob name = code
    const blobClient = blobServiceClient.getBlobClient(container, code);
    const fileData = fs.readFileSync(filePath);
    
    await blobClient.upload(fileData, fileData.length, {
      blobHTTPHeaders: {
        blobContentType: getMimeType(filename)
      }
    });

    // Update mapping
    const entry: CloudFileEntry = {
      name: filename,
      code: code,
      reference: reference
    };

    const containerKey = container.charAt(0).toUpperCase() + container.slice(1) as keyof CloudMapping;
    mapping[containerKey].push(entry);
    await saveMapping(mapping);

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

    const code = entry.code;

    // Download file from Azure
    const blobClient = blobServiceClient.getBlobClient(container, code);
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

    console.log(`Downloaded ${filename} (blob ${code}) from ${container} → ${downloadPath}`);
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
    const containerKey = container.charAt(0).toUpperCase() + container.slice(1) as keyof CloudMapping;
    return mapping[containerKey];
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
}

export async function deleteFile(container: string, filename: string): Promise<boolean> {
  try {
    if (!CONTAINERS.includes(container.toLowerCase())) {
      throw new Error(`Invalid container. Must be one of: ${CONTAINERS.join(', ')}`);
    }

    const mapping = await loadMapping();
    const containerKey = container.charAt(0).toUpperCase() + container.slice(1) as keyof CloudMapping;
    
    // Find entry by filename
    const entryIndex = mapping[containerKey].findIndex(item => item.name === filename);
    if (entryIndex === -1) {
      return false;
    }

    const entry = mapping[containerKey][entryIndex];
    const code = entry.code;

    // Delete from Azure
    const blobClient = blobServiceClient.getBlobClient(container, code);
    await blobClient.delete();

    // Remove from mapping
    mapping[containerKey].splice(entryIndex, 1);
    await saveMapping(mapping);

    console.log(`Deleted ${filename} (blob ${code}) from ${container}`);
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


