# Cloud Storage Integration

This document describes the Azure Blob Storage integration implemented in the Juggernaut Frontend application.

## Overview

The application now supports cloud storage operations through Azure Blob Storage, allowing users to upload, download, list, and delete files from four containers: `juggernaut`, `client`, `tools`, and `rbin`.

## Architecture

### Core Components

1. **Cloud Storage Utility** (`src/utils/cloud-storage.ts`)
   - Main cloud operations handler
   - Implements upload, download, list, and delete functions
   - Manages the mapping file (`cloud_tree.json`) for file name to UUID mapping

2. **IPC Integration** (`src/helpers/ipc/cloud/`)
   - `cloud-channels.ts`: Defines IPC channel names
   - `cloud-context.ts`: Exposes cloud API to renderer process
   - `cloud-listeners.ts`: Handles IPC requests in main process

3. **UI Components** (`src/components/cloud/`)
   - `CloudStorageManager.tsx`: Main cloud storage management interface

4. **File Manager Integration** (`src/utils/file-manager.ts`)
   - Extended to support cloud storage options
   - Maintains backward compatibility with local file operations

## Key Features

### File Operations
- **Upload**: Files are uploaded to Azure Blob Storage with original filenames
- **Download**: Files are retrieved using their original filenames
- **List**: View all files in a specific container from metadata
- **Delete**: Remove files from both cloud storage and metadata

### Metadata System
- Files are stored in Azure with their original filenames as blob names
- A local `cloud_tree.json` file contains metadata for each container
- Supports reference/description fields for additional metadata

### Containers
- `juggernaut`: For application-specific files
- `client`: For client-related documents
- `tools`: For utility and tool files
- `rbin`: For deleted files that can be restored

## Usage

### Accessing Cloud Storage
1. Navigate to the Libraries section in the left panel
2. Click on "Cloud Storage" to open the cloud management interface
3. Select a container from the dropdown
4. Use the interface to upload, download, or manage files

### Programmatic Usage
```typescript
// Upload a file
const result = await window.cloud.upload({
  container: 'client',
  filePath: '/path/to/file.pdf',
  reference: 'Client document'
});

// Download a file
const result = await window.cloud.download({
  container: 'client',
  filename: 'document.pdf',
  downloadPath: '/downloads/document.pdf'
});

// List files
const result = await window.cloud.list({
  container: 'client'
});

// Delete a file
const result = await window.cloud.delete({
  container: 'client',
  filename: 'document.pdf'
});
```

## Configuration

### Azure Connection
The Azure Blob Storage connection string is configured in `src/utils/cloud-storage.ts`:
```typescript
const CONNECTION_STRING = "DefaultEndpointsProtocol=https;AccountName=auditfirmone;AccountKey=...";
```

### Metadata File
The metadata file (`cloud_tree.json`) is automatically created and managed. It has the following structure:
```json
{
  "juggernaut": ["Libraries_InternControlResponses_Table.json", "abc.json"],
  "client": [
    {
      "name": "ed.xlsx",
      "reference": "TB 2"
    },
    {
      "name": "abc.xlsx",
      "reference": ""
    }
  ],
  "tools": [
    {
      "name": "xyz.json",
      "reference": ""
    },
    {
      "name": "def.xlsx",
      "reference": ""
    }
  ],
  "rbin": ["xyz.json", "def.xlsx"]
}
```

## Security Considerations

- The Azure connection string contains sensitive credentials
- In production, consider using environment variables or secure configuration management
- File access is controlled through the mapping system
- All operations are logged for audit purposes

## Error Handling

The system includes comprehensive error handling:
- Network connectivity issues
- Invalid container names
- File not found errors
- Azure service errors
- Local file system errors

## Progress Tracking

Cloud operations support progress tracking through IPC events:
- Upload progress
- Download progress
- Operation status updates
- Error notifications

## Integration with Existing Systems

The cloud storage system integrates seamlessly with:
- Document management system
- File upload components
- Library management
- Audit workflow processes

## Future Enhancements

Potential improvements include:
- Batch operations
- File versioning
- Advanced search and filtering
- Integration with audit workflows
- Automatic backup and sync
- File sharing and collaboration features


