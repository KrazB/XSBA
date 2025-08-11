/**
 * File Manager Utility for QGEN_IMPFRAG
 * =====================================
 * 
 * Handles file operations, validation, and fragment loading
 * Provides drag-and-drop functionality and file validation
 */

export interface FileValidation {
  isValid: boolean;
  error?: string;
  fileInfo?: {
    name: string;
    size: number;
    type: string;
    lastModified: Date;
  };
}

export class FileManager {
  private static readonly SUPPORTED_EXTENSIONS = ['.frag'];
  private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  /**
   * Validate uploaded file
   */
  static validateFile(file: File): FileValidation {
    // Check file extension
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!this.SUPPORTED_EXTENSIONS.includes(extension)) {
      return {
        isValid: false,
        error: `Unsupported file type. Supported formats: ${this.SUPPORTED_EXTENSIONS.join(', ')}`
      };
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File too large. Maximum size: ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`
      };
    }

    // Check file name
    if (file.name.includes(' ') || !/^[a-zA-Z0-9._-]+$/.test(file.name)) {
      return {
        isValid: false,
        error: 'File name contains invalid characters. Use only letters, numbers, dots, hyphens, and underscores.'
      };
    }

    return {
      isValid: true,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified)
      }
    };
  }

  /**
   * Read file as ArrayBuffer for fragment loading
   */
  static async readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Setup drag and drop functionality
   */
  static setupDragAndDrop(
    dropZone: HTMLElement,
    onFileDropped: (file: File) => void,
    onDragStateChange?: (isDragging: boolean) => void
  ): () => void {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (dragCounter === 1) {
        onDragStateChange?.(true);
        dropZone.classList.add('drag-over');
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter === 0) {
        onDragStateChange?.(false);
        dropZone.classList.remove('drag-over');
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      onDragStateChange?.(false);
      dropZone.classList.remove('drag-over');

      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length > 0) {
        onFileDropped(files[0]); // Only handle first file
      }
    };

    dropZone.addEventListener('dragenter', handleDragEnter);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('drop', handleDrop);

    // Return cleanup function
    return () => {
      dropZone.removeEventListener('dragenter', handleDragEnter);
      dropZone.removeEventListener('dragleave', handleDragLeave);
      dropZone.removeEventListener('dragover', handleDragOver);
      dropZone.removeEventListener('drop', handleDrop);
    };
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  }

  /**
   * Generate unique filename to avoid conflicts
   */
  static generateUniqueFilename(originalName: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = originalName.substring(originalName.lastIndexOf('.'));
    const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
    return `${baseName}_${timestamp}${extension}`;
  }
}
