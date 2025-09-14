/**
 * Cloud Storage Usage Examples
 * Demonstrates how to use the cloud storage functionality in the application
 */

import { CloudFileEntry } from '../helpers/ipc/cloud/cloud-context';

// Example 1: Upload a file to cloud storage
export async function uploadFileExample() {
  try {
    const result = await window.cloud.upload({
      container: 'client',
      filePath: 'C:\\Users\\shez8\\Desktop\\Juggernaut Frontend\\Cloud\\Client\\document.pdf',
      reference: 'Client financial statement'
    });

    if (result.success) {
      console.log('File uploaded successfully with code:', result.code);
    } else {
      console.error('Upload failed:', result.error);
    }
  } catch (error) {
    console.error('Error uploading file:', error);
  }
}

// Example 2: Download a file from cloud storage
export async function downloadFileExample() {
  try {
    const result = await window.cloud.download({
      container: 'client',
      filename: 'document.pdf',
      downloadPath: 'C:\\Users\\shez8\\Desktop\\Downloads\\document.pdf'
    });

    if (result.success) {
      console.log('File downloaded to:', result.filePath);
    } else {
      console.error('Download failed:', result.error);
    }
  } catch (error) {
    console.error('Error downloading file:', error);
  }
}

// Example 3: List all files in a container
export async function listFilesExample() {
  try {
    const result = await window.cloud.list({
      container: 'client'
    });

    if (result.success && result.files) {
      console.log('Files in client container:');
      result.files.forEach((file: CloudFileEntry) => {
        console.log(`- ${file.name} (${file.code}) - ${file.reference}`);
      });
    } else {
      console.error('Failed to list files:', result.error);
    }
  } catch (error) {
    console.error('Error listing files:', error);
  }
}

// Example 4: Delete a file from cloud storage
export async function deleteFileExample() {
  try {
    const result = await window.cloud.delete({
      container: 'client',
      filename: 'document.pdf'
    });

    if (result.success) {
      console.log('File deleted successfully');
    } else {
      console.error('Delete failed:', result.error);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

// Example 5: Monitor upload progress
export function monitorProgressExample() {
  const unsubscribe = window.cloud.onProgress((payload) => {
    console.log(`Operation: ${payload.operation}`);
    console.log(`Container: ${payload.container}`);
    console.log(`Filename: ${payload.filename}`);
    console.log(`Progress: ${payload.progress}%`);
    console.log(`Status: ${payload.status}`);
    
    if (payload.error) {
      console.error('Error:', payload.error);
    }
  });

  // Don't forget to unsubscribe when done
  // unsubscribe();
}

// Example 6: Batch operations
export async function batchOperationsExample() {
  const files = [
    { path: 'file1.pdf', reference: 'Document 1' },
    { path: 'file2.xlsx', reference: 'Spreadsheet 2' },
    { path: 'file3.docx', reference: 'Word document 3' }
  ];

  const results = await Promise.allSettled(
    files.map(file => 
      window.cloud.upload({
        container: 'client',
        filePath: file.path,
        reference: file.reference
      })
    )
  );

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.success) {
      console.log(`File ${index + 1} uploaded successfully`);
    } else {
      console.error(`File ${index + 1} upload failed:`, result.reason);
    }
  });
}

// Example 7: Integration with file manager
export async function fileManagerIntegrationExample() {
  const { fileManager } = await import('../utils/file-manager');
  
  // Upload to cloud after saving locally
  const fileMetadata = await fileManager.saveFile(
    new File(['test content'], 'test.txt', { type: 'text/plain' }),
    'information',
    'test.txt',
    { useCloud: true, container: 'client', reference: 'Test file' }
  );

  console.log('File saved with metadata:', fileMetadata);

  // Upload to cloud
  const cloudResult = await fileManager.uploadToCloud(
    fileMetadata.filePath,
    'client',
    'Test file upload'
  );

  if (cloudResult.success) {
    console.log('File uploaded to cloud with code:', cloudResult.code);
  }
}

// Example 8: Error handling best practices
export async function errorHandlingExample() {
  try {
    const result = await window.cloud.upload({
      container: 'invalid-container', // This will fail
      filePath: 'test.pdf',
      reference: 'Test'
    });

    if (!result.success) {
      // Handle specific error cases
      if (result.error?.includes('Invalid container')) {
        console.error('Please select a valid container');
      } else if (result.error?.includes('File not found')) {
        console.error('Please check the file path');
      } else {
        console.error('Upload failed:', result.error);
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}


