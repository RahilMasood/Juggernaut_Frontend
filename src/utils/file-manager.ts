/**
 * File Manager Utility
 * Handles file operations for the Cloud/Client folder
 */

export interface FileMetadata {
  id: string;
  fileName: string;
  filePath: string;
  library: string;
  size: number;
  uploadDate: Date;
  extension: string;
  mimeType: string;
}

export interface LibraryFile {
  library: string;
  files: FileMetadata[];
}

class FileManager {
  private basePath = "C:\\Users\\shez8\\Desktop\\Juggernaut Frontend\\Cloud\\Client";
  
  /**
   * Get all files organized by library
   */
  async getFilesByLibrary(): Promise<LibraryFile[]> {
    try {
      // In a real implementation, this would read from the file system
      // For now, we'll return mock data
      const mockData: LibraryFile[] = [
        {
          library: "information",
          files: [
            {
              id: "info-1",
              fileName: "Company_Policies.pdf",
              filePath: `${this.basePath}\\information\\Company_Policies.pdf`,
              library: "information",
              size: 1024000,
              uploadDate: new Date("2024-01-15"),
              extension: ".pdf",
              mimeType: "application/pdf"
            }
          ]
        },
        {
          library: "document",
          files: [
            {
              id: "doc-1",
              fileName: "Financial_Statement_2023.xlsx",
              filePath: `${this.basePath}\\document\\Financial_Statement_2023.xlsx`,
              library: "document",
              size: 2048000,
              uploadDate: new Date("2024-01-20"),
              extension: ".xlsx",
              mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            }
          ]
        }
      ];
      
      return mockData;
    } catch (error) {
      console.error("Error getting files by library:", error);
      return [];
    }
  }

  /**
   * Get files for a specific library
   */
  async getFilesForLibrary(libraryId: string): Promise<FileMetadata[]> {
    try {
      const allFiles = await this.getFilesByLibrary();
      const libraryFiles = allFiles.find(lib => lib.library === libraryId);
      return libraryFiles?.files || [];
    } catch (error) {
      console.error(`Error getting files for library ${libraryId}:`, error);
      return [];
    }
  }

  /**
   * Save file to Cloud/Client folder organized by library
   */
  async saveFile(
    file: File, 
    libraryId: string, 
    customFileName?: string
  ): Promise<FileMetadata> {
    try {
      const fileName = customFileName || file.name;
      const filePath = `${this.basePath}\\${libraryId}\\${fileName}`;
      
      // In a real implementation, this would:
      // 1. Create the library directory if it doesn't exist
      // 2. Save the file to the directory
      // 3. Update the database with file metadata
      
      const fileMetadata: FileMetadata = {
        id: `${libraryId}-${Date.now()}`,
        fileName,
        filePath,
        library: libraryId,
        size: file.size,
        uploadDate: new Date(),
        extension: this.getFileExtension(fileName),
        mimeType: file.type
      };

      console.log(`File saved to: ${filePath}`);
      
      return fileMetadata;
    } catch (error) {
      console.error("Error saving file:", error);
      throw error;
    }
  }

  /**
   * Delete file from Cloud/Client folder
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      // In a real implementation, this would:
      // 1. Find the file in the database
      // 2. Delete the physical file from the file system
      // 3. Remove the record from the database
      
      console.log(`File deleted: ${fileId}`);
      return true;
    } catch (error) {
      console.error("Error deleting file:", error);
      return false;
    }
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Get file icon based on extension
   */
  getFileIcon(extension: string): string {
    const ext = extension.toLowerCase();
    
    if (['.pdf'].includes(ext)) return '📄';
    if (['.doc', '.docx'].includes(ext)) return '📝';
    if (['.xls', '.xlsx'].includes(ext)) return '📊';
    if (['.ppt', '.pptx'].includes(ext)) return '📋';
    if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) return '🖼️';
    if (['.mp4', '.avi', '.mov'].includes(ext)) return '🎥';
    if (['.mp3', '.wav', '.flac'].includes(ext)) return '🎵';
    if (['.zip', '.rar', '.7z'].includes(ext)) return '📦';
    
    return '📄'; // Default file icon
  }
}

// Export singleton instance
export const fileManager = new FileManager();
