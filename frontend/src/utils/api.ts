/**
 * API Client for QGEN_IMPFRAG Backend Communication
 * =================================================
 * 
 * Handles all HTTP communication between frontend and backend services
 * Provides type-safe API interfaces for fragment management
 */

export interface FragmentInfo {
  filename: string;
  size_mb: number;
  created: string;
  modified: string;
  url: string;
}

export interface IfcFileInfo {
  filename: string;
  size_mb: number;
  modified: string;
  has_fragments: boolean;
  fragment_file: string | null;
  fragment_size_mb: number | null;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  timestamp?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    // Use environment variable for backend URL, fallback to default
    this.baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  }

  private async makeRequest<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return { data, timestamp: new Date().toISOString() };
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      return { 
        error: error instanceof Error ? error.message : 'Unknown API error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get health status of the backend service
   */
  async getHealth(): Promise<ApiResponse<{ status: string; service: string }>> {
    return this.makeRequest('/health');
  }

  /**
   * List all available fragment files
   */
  async getFragments(): Promise<ApiResponse<{ fragments: FragmentInfo[]; count: number; total_size_mb: number }>> {
    return this.makeRequest('/api/fragments');
  }

  /**
   * Get URL for a specific fragment file
   */
  getFragmentUrl(filename: string): string {
    return `${this.baseUrl}/api/fragments/${encodeURIComponent(filename)}`;
  }

  /**
   * List all IFC files and their conversion status
   */
  async getIfcFiles(): Promise<ApiResponse<{ ifc_files: IfcFileInfo[]; count: number; total_size_mb: number }>> {
    return this.makeRequest('/api/ifc');
  }

  /**
   * Get overall system status
   */
  async getStatus(): Promise<ApiResponse<{ 
    status: string; 
    ifc_files: number; 
    fragment_files: number; 
    conversion_complete: boolean 
  }>> {
    return this.makeRequest('/api/status');
  }

  /**
   * Download fragment file as blob for processing
   */
  async downloadFragment(filename: string): Promise<Blob | null> {
    try {
      const response = await fetch(this.getFragmentUrl(filename));
      if (!response.ok) {
        throw new Error(`Failed to download fragment: ${response.statusText}`);
      }
      return await response.blob();
    } catch (error) {
      console.error(`Fragment download error:`, error);
      return null;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;