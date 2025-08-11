/**
 * QGEN_IMPFRAG Frontend - Standalone Fragment Viewer
 * =================================================
 * 
 * Simple 3D viewer for fragment files without backend dependency
 * 
 * Features:
 * 1. Direct fragment file loading (drag & drop or file input)
 * 2. 3D visualization using ThatOpen Components
 * 3. Camera controls and navigation
 * 4. No backend API dependency
 * 
 * Author: XQG4_AXIS Team
 * Version: 1.0.0
 */


import * as THREE from "three";
import * as OBC from "@thatopen/components";
import * as FRAGS from "@thatopen/fragments";

// API Configuration - Use Vite proxy for development, Nginx proxy for production
const API_CONFIG = {
  // Empty string uses same origin - Vite or Nginx will proxy /api/ to backend
  BASE_URL: ''
};

console.log("🚀 QGEN_IMPFRAG Standalone Fragment Viewer initializing...");
console.log(`🔧 API Base URL: ${API_CONFIG.BASE_URL}`);

/**
 * Simple UI Manager for standalone fragment viewer
 */
class SimpleUI {
  private statusElement: HTMLElement;
  private propertiesPanel: HTMLElement | null = null;
  public propertiesDropdown: HTMLSelectElement | null = null;
  public propertiesContent: HTMLElement | null = null;
  public visibilityPanel: HTMLElement | null = null;

  constructor() {
    this.createUI();
    this.statusElement = document.getElementById("status")!;
  }

  private createUI() {
    // Remove loading screen after a delay to ensure proper initialization
    setTimeout(() => {
      const loading = document.getElementById("loading");
      if (loading) loading.style.display = "none";
      // Remove or clear any top blue band/header text if present
      const topBar = document.querySelector('header, .top-bar, .topband, .navbar, .app-header');
      if (topBar) {
        topBar.innerHTML = "";
        const bar = topBar as HTMLElement;
        bar.style.background = "#1e293b";
        bar.style.height = "48px";
      }
    }, 2000);

    // 🔍 Create Enhanced View & Visibility Controls Panel
    const viewControlsPanel = document.createElement("div");
    viewControlsPanel.id = "view-controls-panel";
    viewControlsPanel.style.cssText = `
      position: fixed;
      top: 350px;
      right: 20px;
      width: 280px;
      background: rgba(30, 41, 59, 0.95);
      border: 1px solid #3b82f6;
      border-radius: 8px;
      padding: 12px;
      color: #f3f4f6;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 0.9rem;
      z-index: 2000;
      backdrop-filter: blur(10px);
      max-height: 450px;
      overflow-y: auto;
    `;
    viewControlsPanel.innerHTML = `
      <div style='font-weight:600;color:#60a5fa;margin-bottom:8px;text-align:center;'>🔍 View & Visibility Controls</div>
      
      <div style='margin-bottom:12px;'>
        <button id='fit-view-btn' style='width:100%;background:#10b981;color:#fff;border:none;padding:8px 0;border-radius:5px;cursor:pointer;font-weight:500;'>📐 Fit All Models to View</button>
      </div>
      
      <div style='margin-bottom:10px;border-top:1px solid #475569;padding-top:10px;'>
        <div style='font-weight:600;color:#fbbf24;margin-bottom:6px;'>🏗️ Category Visibility</div>
        <div style='display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:8px;'>
          <button id='toggle-walls-btn' data-category='IFCWALL' style='background:#8b5cf6;color:#fff;border:none;padding:4px 6px;border-radius:4px;cursor:pointer;font-size:0.8rem;'>🧱 Walls</button>
          <button id='toggle-roofs-btn' data-category='IFCROOF' style='background:#f59e0b;color:#fff;border:none;padding:4px 6px;border-radius:4px;cursor:pointer;font-size:0.8rem;'>🏠 Roofs</button>
          <button id='toggle-slabs-btn' data-category='IFCSLAB' style='background:#6b7280;color:#fff;border:none;padding:4px 6px;border-radius:4px;cursor:pointer;font-size:0.8rem;'>🟫 Slabs</button>
          <button id='toggle-doors-btn' data-category='IFCDOOR' style='background:#dc2626;color:#fff;border:none;padding:4px 6px;border-radius:4px;cursor:pointer;font-size:0.8rem;'>🚪 Doors</button>
          <button id='toggle-windows-btn' data-category='IFCWINDOW' style='background:#0ea5e9;color:#fff;border:none;padding:4px 6px;border-radius:4px;cursor:pointer;font-size:0.8rem;'>🪟 Windows</button>
          <button id='toggle-columns-btn' data-category='IFCCOLUMN' style='background:#059669;color:#fff;border:none;padding:4px 6px;border-radius:4px;cursor:pointer;font-size:0.8rem;'>🏛️ Columns</button>
        </div>
        <div style='display:flex;gap:4px;'>
          <button id='show-all-btn' style='flex:1;background:#22c55e;color:#fff;border:none;padding:6px 0;border-radius:4px;cursor:pointer;font-size:0.8rem;'>👁️ Show All</button>
          <button id='hide-all-btn' style='flex:1;background:#ef4444;color:#fff;border:none;padding:6px 0;border-radius:4px;cursor:pointer;font-size:0.8rem;'>🙈 Hide All</button>
        </div>
      </div>
      
      <div style='margin-bottom:10px;border-top:1px solid #475569;padding-top:10px;'>
        <div style='font-weight:600;color:#34d399;margin-bottom:6px;'>📹 Camera Presets</div>
        <div style='display:grid;grid-template-columns:1fr 1fr;gap:4px;'>
          <button id='view-top-btn' style='background:#6366f1;color:#fff;border:none;padding:5px 6px;border-radius:4px;cursor:pointer;font-size:0.8rem;'>🔝 Top</button>
          <button id='view-front-btn' style='background:#6366f1;color:#fff;border:none;padding:5px 6px;border-radius:4px;cursor:pointer;font-size:0.8rem;'>➡️ Front</button>
          <button id='view-side-btn' style='background:#6366f1;color:#fff;border:none;padding:5px 6px;border-radius:4px;cursor:pointer;font-size:0.8rem;'>↗️ Side</button>
          <button id='view-iso-btn' style='background:#6366f1;color:#fff;border:none;padding:5px 6px;border-radius:4px;cursor:pointer;font-size:0.8rem;'>🎯 Isometric</button>
        </div>
      </div>
      
      <div style='border-top:1px solid #475569;padding-top:8px;'>
        <div style='font-weight:600;color:#f87171;margin-bottom:6px;'>⚙️ Advanced</div>
        <button id='reset-view-btn' style='width:100%;background:#ef4444;color:#fff;border:none;padding:6px 0;border-radius:5px;cursor:pointer;font-size:0.85rem;'>🔄 Reset View</button>
      </div>
    `;
    document.body.appendChild(viewControlsPanel);
    
    setTimeout(() => {
      const loading = document.getElementById("loading");
      if (loading) loading.style.display = "none";
      // Remove or clear any top blue band/header text if present
      const topBar = document.querySelector('header, .top-bar, .topband, .navbar, .app-header');
      if (topBar) {
        topBar.innerHTML = "";
        const bar = topBar as HTMLElement;
        bar.style.background = "#1e293b";
        bar.style.height = "48px";
      }
    }, 2000);

    // Create or update the top-left main heading
    let mainHeader = document.getElementById("main-header");
    if (!mainHeader) {
      mainHeader = document.createElement("div");
      mainHeader.id = "main-header";
      mainHeader.style.cssText = `
        position: fixed;
        top: 24px;
        left: 40px;
        z-index: 1100;
        font-size: 1.6rem;
        font-weight: 700;
        color: #f3f4f6;
        letter-spacing: 0.01em;
        background: rgba(24,32,48,0.92);
        padding: 10px 28px 10px 18px;
        border-radius: 10px;
        box-shadow: 0 4px 18px 0 rgba(0,0,0,0.13);
        font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
      `;
      document.body.appendChild(mainHeader);
    }
    mainHeader.textContent = "IFC File Conversion - Load Test";

    // Create IFC conversion zone (NEW)
    const ifcZone = document.createElement("div");
    ifcZone.id = "ifc-zone";
    ifcZone.innerHTML = `
      <div class="ifc-content">
        <h3>📁 IFC Converter</h3>
        <p>Convert IFC files to fragments</p>
        <input type="file" id="ifc-input" accept=".ifc" style="display: none;">
        <button id="ifc-browse-btn">Browse IFC Files</button>
        <div id="conversion-status" style="
          margin-top: 10px;
          padding: 8px;
          border-radius: 4px;
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          font-size: 0.9rem;
          display: none;
        "></div>
        <div id="conversion-progress" style="
          margin-top: 10px;
          display: none;
        ">
          <div style="
            background: rgba(59, 130, 246, 0.2);
            border-radius: 4px;
            height: 8px;
            overflow: hidden;
            margin-bottom: 5px;
          ">
            <div id="progress-bar" style="
              background: #3b82f6;
              height: 100%;
              width: 0%;
              transition: width 0.3s ease;
              border-radius: 4px;
            "></div>
          </div>
          <div id="progress-text" style="
            font-size: 0.85rem;
            color: #a1a1aa;
            text-align: center;
          ">Processing...</div>
        </div>
      </div>
    `;
    ifcZone.style.cssText = `
      position: fixed;
      top: 80px;
      left: 40px;
      width: 320px;
      background: rgba(34, 197, 94, 0.1);
      color: #f3f4f6;
      padding: 28px 24px 20px 24px;
      border-radius: 14px;
      border: 2px solid #22c55e;
      z-index: 1001;
      box-shadow: 0 8px 32px 0 rgba(0,0,0,0.18);
      transition: all 0.3s cubic-bezier(.4,2,.6,1);
      font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
    `;
    document.body.appendChild(ifcZone);

    // Create Subprocess Converter zone (NEW)
    const subprocessZone = document.createElement("div");
    subprocessZone.id = "subprocess-zone";
    subprocessZone.innerHTML = `
      <div class="subprocess-content">
        <h3>⚡ Subprocess Converter</h3>
        <p>External converter with process isolation</p>
        <input type="file" id="subprocess-input" accept=".ifc" style="display: none;">
        <button id="subprocess-browse-btn">Browse IFC Files</button>
        <div id="subprocess-status" style="
          margin-top: 10px;
          padding: 8px;
          border-radius: 4px;
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
          font-size: 0.9rem;
          display: none;
        "></div>
        <div id="subprocess-progress" style="
          margin-top: 10px;
          display: none;
        ">
          <div style="
            background: rgba(139, 92, 246, 0.2);
            border-radius: 4px;
            height: 8px;
            overflow: hidden;
            margin-bottom: 5px;
          ">
            <div id="subprocess-progress-bar" style="
              background: #8b5cf6;
              height: 100%;
              width: 0%;
              transition: width 0.3s ease;
              border-radius: 4px;
            "></div>
          </div>
          <div id="subprocess-progress-text" style="
            font-size: 0.85rem;
            color: #a1a1aa;
            text-align: center;
          ">Processing with external converter...</div>
        </div>
      </div>
    `;
    subprocessZone.style.cssText = `
      position: fixed;
      top: 240px;
      left: 40px;
      width: 320px;
      background: rgba(139, 92, 246, 0.1);
      color: #f3f4f6;
      padding: 28px 24px 20px 24px;
      border-radius: 14px;
      border: 2px solid #8b5cf6;
      z-index: 1001;
      box-shadow: 0 8px 32px 0 rgba(0,0,0,0.18);
      transition: all 0.3s cubic-bezier(.4,2,.6,1);
      font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
    `;
    document.body.appendChild(subprocessZone);

    // Create file drop zone overlay (moved down)
    const dropZone = document.createElement("div");
    dropZone.id = "drop-zone";
    dropZone.innerHTML = `
      <div class="drop-content">
        <h3>🗂️ Fragment Viewer</h3>
        <p>Drop .frag files here or click to browse</p>
        <input type="file" id="file-input" accept=".frag" multiple style="display: none;">
        <button id="browse-btn">Browse Files</button>
        <hr style="margin: 10px 0; border: 1px solid #3b82f6;">
        <button id="test-load-btn" style="
          background: #059669;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          width: 100%;
          margin-top: 5px;
        ">🧪 Load Test Fragment</button>
      </div>
    `;
    dropZone.style.cssText = `
      position: fixed;
      top: 440px;
      left: 40px;
      width: 320px;
      background: rgba(24, 32, 48, 0.96);
      color: #f3f4f6;
      padding: 28px 24px 20px 24px;
      border-radius: 14px;
      border: 2px dashed #3b82f6;
      z-index: 1001;
      box-shadow: 0 8px 32px 0 rgba(0,0,0,0.18);
      transition: all 0.3s cubic-bezier(.4,2,.6,1);
      font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
    `;
    document.body.appendChild(dropZone);

    // Create status display
    const status = document.createElement("div");
    status.id = "status";
    status.style.cssText = `
      position: fixed;
      bottom: 32px;
      left: 40px;
      background: rgba(24, 32, 48, 0.92);
      color: #f3f4f6;
      padding: 12px 22px;
      border-radius: 7px;
      z-index: 1002;
      font-size: 1rem;
      box-shadow: 0 2px 12px 0 rgba(0,0,0,0.12);
      font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
    `;
    status.textContent = "Ready to load fragments";
    document.body.appendChild(status);

    // Create file list
    const fileList = document.createElement("div");
    fileList.id = "file-list";
    fileList.style.cssText = `
      position: fixed;
      top: 80px;
      right: 40px;
      width: 270px;
      background: rgba(24, 32, 48, 0.96);
      color: #f3f4f6;
      padding: 22px 18px 16px 18px;
      border-radius: 14px;
      z-index: 1001;
      max-height: 420px;
      overflow-y: auto;
      box-shadow: 0 8px 32px 0 rgba(0,0,0,0.18);
      font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
    `;
    fileList.innerHTML = `
      <h4 style="margin:0 0 10px 0;font-size:1.1rem;font-weight:600;letter-spacing:0.01em;">🏗️ Loaded Fragments</h4>
      <div id="loaded-files"></div>
      <button id="clear-all" style="
        margin-top: 14px;
        padding: 7px 0;
        background: #dc2626;
        color: #fff;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        width: 100%;
        font-size: 1rem;
        font-weight: 500;
        letter-spacing: 0.01em;
        box-shadow: 0 2px 8px 0 rgba(0,0,0,0.10);
        transition: background 0.2s;
      ">Clear All</button>
    `;
    document.body.appendChild(fileList);

    // --- Component Properties Panel ---
    this.propertiesPanel = document.createElement('div');
    this.propertiesPanel.id = 'properties-panel';
    this.propertiesPanel.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 20px;
      width: 420px;
      height: 38.5vh;
      background: rgba(30, 41, 59, 0.95);
      border: 1px solid #3b82f6;
      border-radius: 12px;
      padding: 20px;
      color: #f3f4f6;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 0.9rem;
      z-index: 1000;
      backdrop-filter: blur(12px);
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: #64748b #1e293b;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    `;
    // Dropdown
    this.propertiesDropdown = document.createElement('select');
    this.propertiesDropdown.id = 'properties-dropdown';
    this.propertiesDropdown.style.cssText = `
      width: 100%;
      padding: 7px 8px;
      border-radius: 6px;
      border: 1px solid #3b82f6;
      background: #1e293b;
      color: #f3f4f6;
      margin-bottom: 10px;
      font-size: 1rem;
      font-family: inherit;
    `;
    // Content area
    this.propertiesContent = document.createElement('div');
    this.propertiesContent.id = 'properties-content';
    this.propertiesContent.style.cssText = `
      max-height: 240px;
      overflow-y: auto;
      background: rgba(30,41,59,0.92);
      border-radius: 6px;
      padding: 12px 10px;
      font-size: 0.98rem;
      margin-top: 2px;
      color: #e0e7ef;
      border: 1px solid #334155;
      min-height: 40px;
    `;
    // Title
    const propTitle = document.createElement('div');
    propTitle.textContent = 'Component Properties';
    propTitle.style.cssText = 'font-weight:600;font-size:1.08rem;margin-bottom:7px;letter-spacing:0.01em;';
    this.propertiesPanel.appendChild(propTitle);
    this.propertiesPanel.appendChild(this.propertiesDropdown);
    this.propertiesPanel.appendChild(this.propertiesContent);
    // Insert into body (fixed position, so order does not matter)
    document.body.appendChild(this.propertiesPanel);
  }

  // Call this after a new model is loaded or removed
  updatePropertiesDropdown(modelList: { model: any, fileName: string }[]) {
    if (!this.propertiesDropdown) return;
    // Clear and repopulate dropdown
    this.propertiesDropdown.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Select Fragment --';
    this.propertiesDropdown.appendChild(defaultOption);
    modelList.forEach(({ fileName }, idx) => {
      const opt = document.createElement('option');
      opt.value = idx.toString();
      opt.textContent = fileName;
      if (this.propertiesDropdown) this.propertiesDropdown.appendChild(opt);
    });
  }

  updateStatus(message: string) {
    this.statusElement.textContent = message;
    console.log("Status:", message);
  }

  addLoadedFile(filename: string, onRemove: () => void) {
    const loadedFiles = document.getElementById("loaded-files");
    if (!loadedFiles) return;

    const fileItem = document.createElement("div");
    fileItem.style.cssText = `
      margin: 6px 0;
      padding: 7px 6px 7px 10px;
      background: rgba(59, 130, 246, 0.10);
      border-radius: 5px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
      box-shadow: 0 1px 4px 0 rgba(0,0,0,0.06);
    `;
    
    fileItem.innerHTML = `
      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:170px;display:inline-block;">${filename}</span>
      <button style="
        background: #dc2626;
        color: #fff;
        border: none;
        border-radius: 3px;
        padding: 2px 8px;
        cursor: pointer;
        font-size: 13px;
        font-weight: bold;
        margin-left: 8px;
        transition: background 0.2s;
      ">×</button>
    `;

    const removeBtn = fileItem.querySelector("button");
    removeBtn?.addEventListener("click", () => {
      fileItem.remove();
      onRemove();
    });

    loadedFiles.appendChild(fileItem);
  }

  clearLoadedFiles() {
    const loadedFiles = document.getElementById("loaded-files");
    if (loadedFiles) loadedFiles.innerHTML = "";
  }
}

/**
 * Main Fragment Viewer Application
 */
class FragmentViewer {
  private components!: OBC.Components;
  private world!: OBC.World;
  private fragments!: FRAGS.FragmentsModels;
  private ui: SimpleUI;
  private loadedModels: { model: any, fileName: string }[] = [];
  private workerUrl!: string;

  // 🎛️ User-Adjustable Camera Settings
  public cameraSettings = {
    // Clipping Planes (adjustable for different model scales)
    nearPlane: 0.1,       // Default: 0.1 - Minimum distance for fine details
    farPlane: 50000,      // Default: 50,000 - Maximum viewing distance for large BIM models
    
    // Distance Multipliers (how far the camera sits from models)
    closeFitMultiplier: 5.0,  // Default: 5.0 - Close viewing distance
    farFitMultiplier: 8.0,    // Default: 8.0 - Far overview distance
    
    // Camera Height Offsets (bird's eye perspective)
    closeHeightOffset: 2.0,   // Default: 2.0 - Height for close viewing
    farHeightOffset: 3.0,     // Default: 3.0 - Height for overview
    
    // Model Scaling Thresholds and Multipliers
    minimumDistance: 200,     // Default: 200 - Minimum camera distance
    mediumModelThreshold: 100,  // Default: 100 - When to apply 2x scaling
    largeModelThreshold: 500,   // Default: 500 - When to apply 3x scaling
    veryLargeModelThreshold: 1000, // Default: 1000 - When to apply 4x scaling
  };

  // Fit camera to all loaded models (tight or wide)
  private fitCameraToModels(wide: boolean = false) {
    if (this.loadedModels.length === 0) return;
    
    // Compute a combined bounding box for all loaded fragment models
    const combinedBox = new THREE.Box3();
    let hasBox = false;
    this.loadedModels.forEach(({ model }) => {
      if (model && model.object && model.object instanceof THREE.Object3D) {
        const box = new THREE.Box3().setFromObject(model.object);
        if (!box.isEmpty()) {
          combinedBox.union(box);
          hasBox = true;
        }
      }
    });
    
    if (!hasBox) return;
    
    const center = combinedBox.getCenter(new THREE.Vector3());
    const size = combinedBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // Enhanced distance calculation for BIM models - use configurable settings
    // Access user-adjustable multipliers for flexible camera positioning
    let distanceMultiplier: number;
    let cameraOffset: number;
    
    if (wide) {
      // Far fit: Use configurable far distance for complete project overview
      distanceMultiplier = this.cameraSettings.farFitMultiplier;
      cameraOffset = this.cameraSettings.farHeightOffset;
    } else {
      // Close fit: Use configurable close distance for detailed viewing
      distanceMultiplier = this.cameraSettings.closeFitMultiplier;
      cameraOffset = this.cameraSettings.closeHeightOffset;
    }
    
    // Calculate base distance with configurable minimum
    const baseDistance = Math.max(maxDim * distanceMultiplier, this.cameraSettings.minimumDistance);
    
    // Progressive scaling based on configurable thresholds
    let modelScale = 1.0;
    if (maxDim > this.cameraSettings.mediumModelThreshold) modelScale = 2.0;
    if (maxDim > this.cameraSettings.largeModelThreshold) modelScale = 3.0;
    if (maxDim > this.cameraSettings.veryLargeModelThreshold) modelScale = 4.0;
    
    const finalDistance = baseDistance * modelScale;
    
    // Position camera much farther back with better architectural viewing angles
    const cameraPosition = new THREE.Vector3(
      center.x + finalDistance * 0.9,     // Farther diagonal offset
      center.y + finalDistance * cameraOffset, // Configurable height for perspective
      center.z + finalDistance * 0.8      // Farther back for better building viewing
    );
    
    // Update camera position and target
    if (this.world.camera.controls) {
      this.world.camera.controls.setLookAt(
        cameraPosition.x,
        cameraPosition.y,
        cameraPosition.z,
        center.x,
        center.y,
        center.z
      );
    } else {
      this.world.camera.three.position.copy(cameraPosition);
      this.world.camera.three.lookAt(center);
    }
    
    // Force render update
    this.world.renderer?.three.render(this.world.scene.three, this.world.camera.three);
    
    // Log for debugging (can be removed later)
    console.log(`📐 Camera fit: Model size=${maxDim.toFixed(1)}, Distance=${finalDistance.toFixed(1)}, Wide=${wide}`);
    console.log(`🎛️ Used settings: distanceMultiplier=${distanceMultiplier}, cameraOffset=${cameraOffset}, modelScale=${modelScale}`);
  }

  /**
   * 🎛️ Update camera settings and apply them immediately
   */
  public updateCameraSettings(newSettings: Partial<typeof this.cameraSettings>) {
    // Update the settings
    Object.assign(this.cameraSettings, newSettings);
    
    // Re-apply clipping planes if camera exists
    if (this.world?.camera?.three instanceof THREE.PerspectiveCamera) {
      const camera = this.world.camera.three;
      camera.near = this.cameraSettings.nearPlane;
      camera.far = this.cameraSettings.farPlane;
      camera.updateProjectionMatrix();
      
      console.log(`📷 Updated camera clipping planes: near=${camera.near}, far=${camera.far}`);
    }
    
    // Optionally re-fit the camera to show changes
    this.fitCameraToModels(false); // Re-fit with close settings
  }

  /**
   * 🎛️ Get current camera settings (for UI display)
   */
  public getCameraSettings() {
    return { ...this.cameraSettings };
  }

  /**
   * 🔍 Automatically fit all loaded models in the camera view using ThatOpen best practices
   * Enhanced to handle different model scales and ensure full visibility
   */
  private async fitAllModelsToView() {
    if (!this.world?.camera || this.loadedModels.length === 0) {
      console.warn("No camera or models to fit");
      return;
    }

    try {
      const boxes: THREE.Box3[] = [];
      
      // Get bounding boxes for all loaded models
      for (const { model } of this.loadedModels) {
        try {
          // Use ThatOpen's BoxManager to get the model bounds
          if (model.boundingBoxes) {
            const box = await model.boundingBoxes.getMergedBox(model);
            if (box) {
              boxes.push(box);
            }
          } else {
            // Fallback: use model object bounds
            const box = new THREE.Box3().setFromObject(model.object);
            if (!box.isEmpty()) {
              boxes.push(box);
            }
          }
        } catch (error) {
          console.warn(`Failed to get bounds for model:`, error);
        }
      }

      if (boxes.length === 0) {
        console.warn("No valid bounding boxes found");
        return;
      }

      // Calculate combined bounding box
      const combinedBox = boxes[0].clone();
      for (let i = 1; i < boxes.length; i++) {
        combinedBox.union(boxes[i]);
      }

      // Validate the combined bounding box
      if (combinedBox.isEmpty()) {
        console.warn("Combined bounding box is empty");
        return;
      }

      // Calculate camera position to fit the model with improved logic
      const size = combinedBox.getSize(new THREE.Vector3());
      const center = combinedBox.getCenter(new THREE.Vector3());
      
      // Enhanced distance calculation with safety margins
      const maxDim = Math.max(size.x, size.y, size.z);
      const camera = this.world.camera.three;
      const fov = camera instanceof THREE.PerspectiveCamera ? camera.fov : 60;
      
      // Base distance calculation with additional safety margin
      const baseFitDistance = maxDim / (2 * Math.tan((fov * Math.PI) / 360));
      const safetyMargin = 1.5; // 50% extra distance for full visibility
      const distance = baseFitDistance * safetyMargin;
      
      // Ensure camera far plane can handle the model
      if (camera instanceof THREE.PerspectiveCamera) {
        const requiredFarPlane = distance + maxDim;
        if (camera.far < requiredFarPlane) {
          camera.far = Math.max(requiredFarPlane * 1.2, this.cameraSettings.farPlane);
          camera.updateProjectionMatrix();
          console.log(`📷 Updated far plane to ${camera.far} for model visibility`);
        }
      }
      
      // Position camera at optimal isometric angle with improved positioning
      const cameraPosition = center.clone();
      const offsetMultiplier = Math.max(1.0, distance / maxDim); // Dynamic offset based on model scale
      
      cameraPosition.x += distance * 0.7 * offsetMultiplier;
      cameraPosition.y += distance * 0.8 * offsetMultiplier; // Slightly higher view
      cameraPosition.z += distance * 0.7 * offsetMultiplier;

      // Use camera controls to smoothly move to the position
      if (this.world.camera.controls?.setLookAt) {
        await this.world.camera.controls.setLookAt(
          cameraPosition.x, cameraPosition.y, cameraPosition.z,
          center.x, center.y, center.z,
          true // animate
        );
      }

      console.log(`🎯 Fitted camera to view ${this.loadedModels.length} models`);
      console.log(`📐 Model size: ${size.x.toFixed(1)} x ${size.y.toFixed(1)} x ${size.z.toFixed(1)}`);
      console.log(`📍 Model center: ${center.x.toFixed(1)}, ${center.y.toFixed(1)}, ${center.z.toFixed(1)}`);
      console.log(`📷 Camera distance: ${distance.toFixed(1)} (safety margin: ${safetyMargin}x)`);
      
      // Update fragments to reflect new camera position
      if (this.fragments?.update) {
        this.fragments.update(true);
      }

    } catch (error) {
      console.error("Failed to fit models to view:", error);
    }
  }

  /**
   * 🔍 Toggle visibility of specific IFC categories using ThatOpen API
   */
  private async toggleCategoryVisibility(category: string) {
    if (this.loadedModels.length === 0) return;

    try {
      console.log(`🔄 Toggling visibility for category: ${category}`);
      
      // Get the Classifier component for finding items by category
      const classifier = this.components.get(OBC.Classifier);
      
      // Get the Hider component for visibility control
      const hider = this.components.get(OBC.Hider);
      
      // Find items by entity type (category)
      // The classifier uses entity-based classification
      const filter = { entities: [category] };
      const result = classifier.find(filter);
      
      // Count total items found across all models
      let totalItems = 0;
      for (const modelId in result) {
        const itemIds = result[modelId];
        totalItems += itemIds ? itemIds.size : 0;
      }
      
      console.log(`📊 Found ${totalItems} items for category ${category}`);
      console.log(`� Result structure:`, result);
      
      if (totalItems > 0) {
        // Check current visibility state using localStorage
        const hiddenCategories = JSON.parse(localStorage.getItem('hiddenCategories') || '{}');
        
        // Check if our category items are currently hidden
        let categoryCurrentlyHidden = hiddenCategories[category] || false;
        
        console.log(`Category ${category} currently hidden: ${categoryCurrentlyHidden}`);
        
        if (categoryCurrentlyHidden) {
          // Show the category items
          await hider.set(true, result);
          // Update localStorage
          const hiddenCategories = JSON.parse(localStorage.getItem('hiddenCategories') || '{}');
          delete hiddenCategories[category];
          localStorage.setItem('hiddenCategories', JSON.stringify(hiddenCategories));
          console.log(`Showed ${totalItems} ${category} items`);
        } else {
          // Hide the category items
          await hider.set(false, result);
          // Update localStorage
          const hiddenCategories = JSON.parse(localStorage.getItem('hiddenCategories') || '{}');
          hiddenCategories[category] = true;
          localStorage.setItem('hiddenCategories', JSON.stringify(hiddenCategories));
          console.log(`Hid ${totalItems} ${category} items`);
        }
        
        // Force render update
        this.forceRenderUpdate();
        
      } else {
        console.warn(`⚠️ No items found for category: ${category}`);
        
        // Try fallback with alternative patterns
        await this.toggleCategoryVisibilityFallback(category);
      }
      
    } catch (error) {
      console.error(`❌ Failed to toggle ${category} visibility with ItemsFinder:`, error);
      
      // Fallback to old method
      try {
        console.log(`🔄 Trying fallback method for ${category}...`);
        await this.toggleCategoryVisibilityFallback(category);
      } catch (fallbackError) {
        console.error(`❌ Fallback also failed:`, fallbackError);
      }
    }
  }

  /**
   * 🔄 Force a render update to ensure visual changes are displayed
   */
  private forceRenderUpdate() {
    try {
      // Update all loaded models to refresh geometry
      for (const { model } of this.loadedModels) {
        // Try different update methods that might be available
        if (model.update) {
          model.update();
        }
        if (model.refresh) {
          model.refresh();
        }
        if (model.redraw) {
          model.redraw();
        }
        
        // Ensure the model object is properly updated
        if (model.object) {
          model.object.visible = true; // Ensure the model container is visible
          
          // Try to trigger geometry updates
          if (model.object.children) {
            model.object.children.forEach((child: any) => {
              if (child.material) {
                child.material.needsUpdate = true;
              }
              if (child.geometry) {
                child.geometry.computeBoundingBox();
              }
            });
          }
        }
      }

      // Update fragments system with force flag
      if (this.fragments?.update) {
        this.fragments.update(true);
      }
      
      // Update the world if it has an update method
      if (this.world?.update) {
        this.world.update();
      }

      // Force multiple render passes to ensure changes take effect
      if (this.world?.renderer?.three && this.world?.scene?.three && this.world?.camera?.three) {
        // Render multiple times to ensure changes are applied
        for (let i = 0; i < 3; i++) {
          this.world.renderer.three.render(this.world.scene.three, this.world.camera.three);
        }
        console.log("🎨 Forced render update (3x passes)");
      }
      
      // Also trigger a camera control update if available
      if (this.world?.camera?.controls?.update) {
        this.world.camera.controls.update(0);
      }
      
    } catch (error) {
      console.warn("Failed to force render update:", error);
    }
  }

  /**
   * 🔄 Fallback method for category visibility using different approaches
   */
  private async toggleCategoryVisibilityFallback(category: string) {
    for (const { model } of this.loadedModels) {
      try {
        // Try different category name variations
        const variations = [
          category,
          category.toLowerCase(),
          category.replace('IFC', ''),
          category.replace('IFC', '').toLowerCase()
        ];

        for (const variation of variations) {
          if (model.getItemsOfCategories) {
            const items = await model.getItemsOfCategories([variation]);
            const itemIds = items[variation] || [];
            
            if (itemIds.length > 0) {
              if (model.setVisible) {
                const isVisible = model.isVisible ? await model.isVisible(itemIds[0]) : true;
                await model.setVisible(itemIds, !isVisible);
              } else if (model.toggleVisible) {
                await model.toggleVisible(itemIds);
              }
              console.log(`✅ Fallback succeeded with variation: ${variation}`);
              
              // Force render update for fallback as well
              this.forceRenderUpdate();
              return;
            }
          }
        }
      } catch (error) {
        console.warn(`Fallback variation failed:`, error);
      }
    }
  }

  /**
   * 🔍 Debug function to list all available categories in loaded models
   */
  private async listAvailableCategories() {
    if (this.loadedModels.length === 0) {
      console.log("📝 No models loaded");
      return;
    }

    console.log("📊 Available categories in loaded models:");
    
    for (const { model, fileName } of this.loadedModels) {
      console.log(`\n🏗️ Model: ${fileName}`);
      
      try {
        // Try to get all available categories
        if (model.getCategories) {
          const categories = await model.getCategories();
          console.log(`📂 Categories found:`, categories);
        }
        
        // Alternative: try common IFC categories
        const commonCategories = [
          'IFCWALL', 'IFCDOOR', 'IFCWINDOW', 'IFCSLAB', 'IFCROOF', 'IFCCOLUMN',
          'IFCBEAM', 'IFCSTAIR', 'IFCRAILING', 'IFCFURNISHINGELEMENT'
        ];
        
        for (const category of commonCategories) {
          if (model.getItemsOfCategories) {
            try {
              const items = await model.getItemsOfCategories([category]);
              const count = items[category]?.length || 0;
              if (count > 0) {
                console.log(`✅ ${category}: ${count} items`);
              }
            } catch (e) {
              // Silently continue
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to get categories for ${fileName}:`, error);
      }
    }
  }

  /**
   * 🔍 Show all model elements
   */
  private async showAllElements() {
    console.log("🔄 Show All Elements button clicked");
    if (this.loadedModels.length === 0) {
      console.log("⚠️ No models loaded");
      return;
    }

    try {
      console.log(`📊 Processing ${this.loadedModels.length} loaded models...`);
      for (const { model } of this.loadedModels) {
        if (!model.getItemsByVisibility || !model.setVisible) {
          console.log("⚠️ Model does not support visibility methods");
          continue;
        }

        // Get all hidden items and make them visible
        const hiddenItems = await model.getItemsByVisibility(false);
        if (hiddenItems.length > 0) {
          await model.setVisible(hiddenItems, true);
          console.log(`👁️ Made ${hiddenItems.length} items visible`);
        } else {
          console.log(`📝 No hidden items found in this model`);
        }
      }

      if (this.fragments?.update) {
        this.fragments.update(true);
      }

      // Force render update to show changes
      this.forceRenderUpdate();
      
    } catch (error) {
      console.error("Failed to show all elements:", error);
    }
  }

  /**
   * 🔍 Hide all model elements
   */
  private async hideAllElements() {
    console.log("🔄 Hide All Elements button clicked");
    if (this.loadedModels.length === 0) {
      console.log("⚠️ No models loaded");
      return;
    }

    try {
      console.log(`📊 Processing ${this.loadedModels.length} loaded models...`);
      for (const { model } of this.loadedModels) {
        if (!model.getItemsByVisibility || !model.setVisible) {
          console.log("⚠️ Model does not support visibility methods");
          continue;
        }

        // Get all visible items and hide them
        const visibleItems = await model.getItemsByVisibility(true);
        if (visibleItems.length > 0) {
          await model.setVisible(visibleItems, false);
          console.log(`🙈 Hid ${visibleItems.length} items`);
        }
      }

      if (this.fragments?.update) {
        this.fragments.update(true);
      }

      // Force render update to show changes
      this.forceRenderUpdate();
      
    } catch (error) {
      console.error("Failed to hide all elements:", error);
    }
  }

  /**
   * 🔍 Set camera to specific preset views
   */
  private setCameraPreset(view: 'top' | 'front' | 'side' | 'isometric') {
    if (!this.world?.camera || this.loadedModels.length === 0) return;

    try {
      // Calculate the center of all models
      const boxes: THREE.Box3[] = [];
      for (const { model } of this.loadedModels) {
        const box = new THREE.Box3().setFromObject(model.object);
        if (!box.isEmpty()) {
          boxes.push(box);
        }
      }

      if (boxes.length === 0) return;

      const combinedBox = boxes[0].clone();
      for (let i = 1; i < boxes.length; i++) {
        combinedBox.union(boxes[i]);
      }

      const center = combinedBox.getCenter(new THREE.Vector3());
      const size = combinedBox.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const distance = maxDim * 2;

      let cameraPosition = center.clone();

      switch (view) {
        case 'top':
          cameraPosition.y += distance;
          break;
        case 'front':
          cameraPosition.z += distance;
          break;
        case 'side':
          cameraPosition.x += distance;
          break;
        case 'isometric':
          cameraPosition.x += distance * 0.7;
          cameraPosition.y += distance * 0.7;
          cameraPosition.z += distance * 0.7;
          break;
      }

      if (this.world.camera.controls?.setLookAt) {
        this.world.camera.controls.setLookAt(
          cameraPosition.x, cameraPosition.y, cameraPosition.z,
          center.x, center.y, center.z,
          true
        );
      }

      console.log(`📹 Set camera to ${view} view`);
    } catch (error) {
      console.error(`Failed to set ${view} view:`, error);
    }
  }

  /**
   * Setup picking for showing properties of clicked fragments using ThatOpen API
   */
  private setupPicking() {
    const container = document.getElementById("container");
    if (!container) return;
    
    container.addEventListener("click", async (event) => {
      if (!this.fragments || this.loadedModels.length === 0) return;
      
      // Use ThatOpen's proper raycast API
      const mouse = new THREE.Vector2();
      mouse.x = event.clientX;
      mouse.y = event.clientY;
      
      // Try raycasting on each model using ThatOpen's built-in raycast method
      for (const { model, fileName } of this.loadedModels) {
        if (!model.raycast) continue;
        
        try {
          if (!this.world.renderer || !this.world.renderer.three || !this.world.renderer.three.domElement) {
            console.warn("Renderer or DOM element not available for raycast");
            continue;
          }
          
          const result = await model.raycast({
            camera: this.world.camera.three,
            mouse: mouse,
            dom: this.world.renderer.three.domElement
          });
          
          if (result && result.localId !== undefined) {
            await this.displayComponentProperties(model, result.localId, fileName);
            return;
          }
        } catch (error) {
          console.log(`Raycast failed for ${fileName}:`, error);
          // Try alternative method if raycast fails
          continue;
        }
      }
      
      // If no component clicked, clear properties display
      if (this.ui.propertiesContent) {
        this.ui.propertiesContent.innerHTML = `
          <div style="color:#94a3b8;font-style:italic;text-align:center;padding:20px;">
            🎯 Click on a BIM component to view properties
            <br><small style="margin-top:8px;display:block;">Make sure your model is loaded and visible</small>
          </div>
        `;
      }
    });
  }

  /**
   * Display comprehensive component properties using ThatOpen best practices
   */
  private async displayComponentProperties(model: any, localId: number, fileName: string) {
    if (!this.ui.propertiesContent) return;

    try {
      let html = `
        <div style='font-weight:600;color:#60a5fa;margin-bottom:8px;padding:8px;background:rgba(59,130,246,0.1);border-radius:6px;'>
          🏗️ Component Details
        </div>
      `;

      // Fragment Information Section
      html += `
        <div style='background:rgba(30,41,59,0.5);padding:8px;border-radius:6px;margin-bottom:8px;'>
          <div style='font-weight:600;color:#7dd3fc;margin-bottom:4px;'>📦 Fragment Info</div>
          <table style="width:100%;font-size:0.9rem;">
            <tr><td style='color:#94a3b8;padding:2px 4px;'>Local ID:</td><td style='color:#f3f4f6;padding:2px 4px;'>${localId}</td></tr>
            <tr><td style='color:#94a3b8;padding:2px 4px;'>Model:</td><td style='color:#f3f4f6;padding:2px 4px;'>${fileName}</td></tr>
          </table>
        </div>
      `;

      // Get component data using proper ThatOpen API
      let componentData: any = null;
      if (model.getItemsData) {
        try {
          const itemsData = await model.getItemsData([localId]);
          if (itemsData && itemsData.length > 0) {
            componentData = itemsData[0];
          }
        } catch (error) {
          console.warn("getItemsData failed:", error);
        }
      }

      // Alternative method: try getProperties if getItemsData not available
      if (!componentData && model.getProperties) {
        try {
          componentData = await model.getProperties(localId);
        } catch (error) {
          console.warn("getProperties failed:", error);
        }
      }

      // IFC Properties Section
      if (componentData) {
        html += `
          <div style='background:rgba(16,185,129,0.1);padding:8px;border-radius:6px;margin-bottom:8px;'>
            <div style='font-weight:600;color:#10b981;margin-bottom:4px;'>🏛️ IFC Properties</div>
            <table style="width:100%;font-size:0.9rem;">
        `;

        // Display all available properties from the component data
        const propertiesToShow = Object.keys(componentData).filter(key => 
          componentData[key] !== undefined && 
          componentData[key] !== null && 
          componentData[key] !== '' &&
          typeof componentData[key] !== 'function'
        );

        if (propertiesToShow.length > 0) {
          propertiesToShow.forEach(key => {
            let value = componentData[key];
            
            // Handle different value types
            if (typeof value === 'object') {
              // For objects, try to extract meaningful information
              if (value.value !== undefined) {
                value = value.value;
              } else if (Array.isArray(value)) {
                value = value.join(', ');
              } else {
                value = JSON.stringify(value, null, 2);
              }
            }

            // Limit very long values
            const displayValue = String(value).length > 100 
              ? String(value).substring(0, 100) + '...' 
              : String(value);

            html += `<tr><td style='color:#94a3b8;padding:2px 4px;'>${key}:</td><td style='color:#f3f4f6;padding:2px 4px;'>${displayValue}</td></tr>`;
          });
        } else {
          html += `<tr><td colspan="2" style='color:#94a3b8;padding:8px;text-align:center;font-style:italic;'>No properties available</td></tr>`;
        }

        html += `</table></div>`;
      } else {
        // If no component data found
        html += `
          <div style='background:rgba(239,68,68,0.1);padding:8px;border-radius:6px;color:#f87171;text-align:center;'>
            ⚠️ No properties available for this component
            <br><small style='color:#94a3b8;'>Local ID: ${localId}</small>
            <br><small style='color:#94a3b8;'>Try clicking on a different component</small>
          </div>
        `;
      }

      this.ui.propertiesContent.innerHTML = html;

      // Update dropdown selection
      if (this.ui.propertiesDropdown) {
        for (let i = 0; i < this.ui.propertiesDropdown.options.length; i++) {
          if (this.ui.propertiesDropdown.options[i].text === fileName) {
            this.ui.propertiesDropdown.selectedIndex = i;
            break;
          }
        }
      }

    } catch (error) {
      console.error("Error displaying component properties:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (this.ui.propertiesContent) {
        this.ui.propertiesContent.innerHTML = `
          <div style='color:#f87171;text-align:center;padding:8px;'>
            ❌ Error loading properties
            <br><small style='color:#94a3b8;'>Check console for details</small>
            <br><small style='color:#94a3b8;'>Error: ${errorMessage}</small>
          </div>
        `;
      }
    }
  }

  constructor() {
    this.ui = new SimpleUI();
    this.init();
  }

  /**
   * Initialize the 3D viewer
   */
  private async init() {
    try {
      console.log("🔧 Initializing 3D components...");
      await this.setupScene();
      await this.setupWorker();
      await this.setupFragments();
      this.setupFileHandling();
      this.setupPicking();
      this.setupViewControlsListeners();
      console.log("✅ Fragment viewer ready");
      this.ui.updateStatus("✅ Ready - Drop .frag files to view them");
    } catch (error) {
      console.error("❌ Failed to initialize:", error);
      this.ui.updateStatus("❌ Failed to initialize viewer");
    }
  }

  /**
   * 🔍 Setup event listeners for view controls panel
   */
  private setupViewControlsListeners() {
    // Fit all models to view
    const fitViewBtn = document.getElementById('fit-view-btn');
    fitViewBtn?.addEventListener('click', () => {
      this.fitAllModelsToView();
    });

    // Category visibility toggles
    const categoryButtons = [
      { id: 'toggle-walls-btn', category: 'IFCWALL' },
      { id: 'toggle-roofs-btn', category: 'IFCROOF' },
      { id: 'toggle-slabs-btn', category: 'IFCSLAB' },
      { id: 'toggle-doors-btn', category: 'IFCDOOR' },
      { id: 'toggle-windows-btn', category: 'IFCWINDOW' },
      { id: 'toggle-columns-btn', category: 'IFCCOLUMN' }
    ];

    categoryButtons.forEach(({ id, category }) => {
      const btn = document.getElementById(id);
      btn?.addEventListener('click', () => {
        this.toggleCategoryVisibility(category);
      });
    });

    // Show/Hide all buttons
    const showAllBtn = document.getElementById('show-all-btn');
    const hideAllBtn = document.getElementById('hide-all-btn');
    
    showAllBtn?.addEventListener('click', () => {
      this.showAllElements();
    });
    
    hideAllBtn?.addEventListener('click', () => {
      this.hideAllElements();
    });

    // Camera preset views
    const viewButtons = [
      { id: 'view-top-btn', view: 'top' as const },
      { id: 'view-front-btn', view: 'front' as const },
      { id: 'view-side-btn', view: 'side' as const },
      { id: 'view-iso-btn', view: 'isometric' as const }
    ];

    viewButtons.forEach(({ id, view }) => {
      const btn = document.getElementById(id);
      btn?.addEventListener('click', () => {
        this.setCameraPreset(view);
      });
    });

    // Reset view button
    const resetViewBtn = document.getElementById('reset-view-btn');
    resetViewBtn?.addEventListener('click', () => {
      this.fitAllModelsToView();
    });
  }

  /**
   * Setup the 3D scene
   */
  private async setupScene() {
    const container = document.getElementById("container");
    if (!container) throw new Error("Container element not found");

    // Initialize components
    this.components = new OBC.Components();
    console.log("🔧 Components system initialized");

    // Create world
    const worlds = this.components.get(OBC.Worlds);
    this.world = worlds.create<
      OBC.SimpleScene,
      OBC.SimpleCamera,
      OBC.SimpleRenderer
    >();

    console.log("🌍 World created");

    // Setup scene
    this.world.scene = new OBC.SimpleScene(this.components);
    
    // Set scene background if it's a Scene object
    const scene = this.world.scene.three;
    if ('background' in scene) {
      (scene as THREE.Scene).background = new THREE.Color(0x202020);
    }

    // Setup renderer
    this.world.renderer = new OBC.SimpleRenderer(this.components, container);
    
    // Ensure renderer is properly configured
    const renderer = this.world.renderer.three;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Setup camera
    this.world.camera = new OBC.SimpleCamera(this.components);
    
    // Set initial camera position further back
    const camera = this.world.camera.three;
    camera.position.set(50, 50, 50);
    camera.lookAt(0, 0, 0);
    
    // Configure clipping planes for much larger viewing distances
    // This is crucial for the enhanced camera distances we're now using
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.near = this.cameraSettings.nearPlane;   // User-adjustable near plane
      camera.far = this.cameraSettings.farPlane;     // User-adjustable far plane
      camera.updateProjectionMatrix();
      
      console.log(`📷 Camera clipping planes: near=${camera.near}, far=${camera.far}`);
    }
    
    // Setup controls with better defaults
    if (this.world.camera.controls) {
      this.world.camera.controls.setLookAt(50, 50, 50, 0, 0, 0);
      this.world.camera.controls.dollySpeed = 2;
      this.world.camera.controls.truckSpeed = 2;
    }

    // Add lighting
    this.setupLighting();

    // Initialize components
    await this.components.init();
    console.log("🚀 Components initialized");

    // Add grid
    const grids = this.components.get(OBC.Grids);
    grids.create(this.world);
    console.log("📐 Grid added");

    // Handle window resize
    window.addEventListener('resize', () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      // Type guard for PerspectiveCamera
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
      renderer.setSize(width, height);
    });
  }

  /**
   * Setup lighting for better visibility
   */
  private setupLighting() {
    const scene = this.world.scene.three;

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Additional light from different angle
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-30, 30, -30);
    scene.add(directionalLight2);

    console.log("💡 Lighting setup complete");
  }

  /**
   * Setup fragments manager
   */
  private async setupWorker() {
    // Use ThatOpen's public worker as in the example
    const githubUrl = "https://thatopen.github.io/engine_fragment/resources/worker.mjs";
    const fetchedUrl = await fetch(githubUrl);
    const workerBlob = await fetchedUrl.blob();
    const workerFile = new File([workerBlob], "worker.mjs", { type: "text/javascript" });
    this.workerUrl = URL.createObjectURL(workerFile);
    console.log("🧑‍💻 Worker set up for FragmentsModels");
  }

  private async setupFragments() {
    this.fragments = new FRAGS.FragmentsModels(this.workerUrl);
    // Update fragments on camera rest
    if (this.world.camera.controls) {
      this.world.camera.controls.addEventListener("rest", () => this.fragments.update(true));
    }
    // When a model is loaded, add to scene and update
    this.fragments.models.list.onItemSet.add(({ value: model }) => {
      // Cast to PerspectiveCamera for useCamera
      const cam = this.world.camera.three;
      if (cam && (cam as any).isPerspectiveCamera) {
        model.useCamera(cam as THREE.PerspectiveCamera);
      }
      this.world.scene.three.add(model.object);
      this.fragments.update(true);
    });
    console.log("📦 FragmentsModels ready");
  }

  /**
   * Setup file drag & drop and browse functionality
   */
  private setupFileHandling() {
    const dropZone = document.getElementById("drop-zone");
    const fileInput = document.getElementById("file-input") as HTMLInputElement;
    const browseBtn = document.getElementById("browse-btn");
    const clearAllBtn = document.getElementById("clear-all");
    const testLoadBtn = document.getElementById("test-load-btn");

    if (!dropZone || !fileInput || !browseBtn || !clearAllBtn || !testLoadBtn) return;

    // File input change handler
    fileInput.addEventListener("change", (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files) {
        this.handleFiles(Array.from(files));
      }
    });

    // Browse button
    browseBtn.addEventListener("click", () => {
      fileInput.click();
    });

    // Clear all button
    clearAllBtn.addEventListener("click", () => {
      this.clearAllFragments();
    });

    // Test load button - loads a fragment from the public directory
    testLoadBtn.addEventListener("click", async () => {
      try {
        this.ui.updateStatus("Loading test fragment...");
        const response = await fetch("/test-fragments/Village_STR_Building_C_R22-2023.01.27.frag");
        if (response.ok) {
          const blob = await response.blob();
          const file = new File([blob], "Village_STR_Building_C_R22-2023.01.27.frag", { type: "application/octet-stream" });
          await this.loadFragmentFile(file);
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error("Failed to load test fragment:", error);
        this.ui.updateStatus("❌ Test fragment not found - try drag & drop instead");
      }
    });

    // Drag and drop handlers
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.style.borderColor = "#10b981";
      dropZone.style.backgroundColor = "rgba(16, 185, 129, 0.1)";
    });

    dropZone.addEventListener("dragleave", (e) => {
      e.preventDefault();
      dropZone.style.borderColor = "#3b82f6";
      dropZone.style.backgroundColor = "rgba(0,0,0,0.8)";
    });

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.style.borderColor = "#3b82f6";
      dropZone.style.backgroundColor = "rgba(0,0,0,0.8)";
      
      const files = Array.from(e.dataTransfer?.files || []);
      this.handleFiles(files);
    });

    // === IFC CONVERSION HANDLERS ===
    const ifcInput = document.getElementById("ifc-input") as HTMLInputElement;
    const ifcBrowseBtn = document.getElementById("ifc-browse-btn");
    const conversionStatus = document.getElementById("conversion-status");

    if (ifcInput && ifcBrowseBtn && conversionStatus) {
      // IFC file input change handler
      ifcInput.addEventListener("change", (event) => {
        const files = (event.target as HTMLInputElement).files;
        if (files && files.length > 0) {
          this.handleIfcConversion(files[0], conversionStatus);
        }
      });

      // IFC browse button
      ifcBrowseBtn.addEventListener("click", () => {
        ifcInput.click();
      });
    }

    // === SUBPROCESS CONVERSION HANDLERS ===
    const subprocessInput = document.getElementById("subprocess-input") as HTMLInputElement;
    const subprocessBrowseBtn = document.getElementById("subprocess-browse-btn");
    const subprocessStatus = document.getElementById("subprocess-status");

    if (subprocessInput && subprocessBrowseBtn && subprocessStatus) {
      // Subprocess file input change handler
      subprocessInput.addEventListener("change", (event) => {
        const files = (event.target as HTMLInputElement).files;
        if (files && files.length > 0) {
          this.handleSubprocessConversion(files[0], subprocessStatus);
        }
      });

      // Subprocess browse button
      subprocessBrowseBtn.addEventListener("click", () => {
        subprocessInput.click();
      });
    }

    console.log("📁 File handling setup complete");
  }

  /**
   * Handle dropped or selected files
   */
  private async handleFiles(files: File[]) {
    const fragFiles = files.filter(file => file.name.endsWith(".frag"));
    
    if (fragFiles.length === 0) {
      this.ui.updateStatus("⚠️ Please select .frag files");
      return;
    }

    for (const file of fragFiles) {
      await this.loadFragmentFile(file);
    }
  }

  /**
   * Load a fragment file directly
   */
  private async loadFragmentFile(file: File) {
    try {
      console.log(`📦 Loading fragment: ${file.name}`);
      this.ui.updateStatus(`Loading ${file.name}...`);

      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      console.log(`📊 Fragment data size: ${arrayBuffer.byteLength} bytes`);

      // Load fragment using FragmentsModels (returns a FragmentsModel)
      const model = await this.fragments.load(arrayBuffer, { modelId: file.name });
      if (!model) throw new Error("Failed to create fragment model");

      // Add to loadedModels for UI management
      this.loadedModels.push({ model, fileName: file.name });

      // Debug: List available categories for this model
      setTimeout(() => {
        this.listAvailableCategories();
      }, 200);

      // Wait for model to be fully processed and geometry to be available
      await this.waitForModelReady(model);
      
      // Fit camera to view with proper timing
      await this.fitAllModelsToView();

      // Update UI
      this.ui.updateStatus(`✅ Loaded ${file.name} (${this.loadedModels.length} total)`);
      this.ui.addLoadedFile(file.name, () => this.removeModel(model));
      this.ui.updatePropertiesDropdown(this.loadedModels);
      // Attach dropdown event for properties
      if (this.ui.propertiesDropdown && this.ui.propertiesContent) {
        this.ui.propertiesDropdown.onchange = async (e) => {
          const idx = (e.target as HTMLSelectElement).value;
          if (!idx) {
            if (this.ui.propertiesContent) {
              this.ui.propertiesContent.innerHTML = `<div style="color:#94a3b8;font-style:italic;">Select a fragment to view model overview</div>`;
            }
            return;
          }
          const selected = this.loadedModels[parseInt(idx)];
          if (!selected) return;
          
          await this.displayModelOverview(selected.model, selected.fileName);
        };
      }
      // ...existing code...
    } catch (error) {
      console.error(`❌ Failed to load ${file.name}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.ui.updateStatus(`❌ Failed to load ${file.name}: ${errorMessage}`);
    }
  }

  /**
   * Wait for model to be fully ready with geometry available for proper bounding box calculation
   */
  private async waitForModelReady(model: any, maxWaitTime: number = 5000): Promise<void> {
    const startTime = Date.now();
    const checkInterval = 50; // Check every 50ms
    
    return new Promise((resolve) => {
      const checkReady = () => {
        const elapsedTime = Date.now() - startTime;
        
        // Check if we've exceeded max wait time
        if (elapsedTime > maxWaitTime) {
          console.warn(`⏰ Model readiness check timed out after ${maxWaitTime}ms, proceeding anyway`);
          resolve();
          return;
        }
        
        // Check if model has geometry available
        let hasGeometry = false;
        try {
          if (model.object && model.object.children && model.object.children.length > 0) {
            // Check if any child has geometry
            const hasValidGeometry = model.object.children.some((child: any) => {
              return child.geometry && 
                     child.geometry.attributes && 
                     child.geometry.attributes.position &&
                     child.geometry.attributes.position.count > 0;
            });
            
            if (hasValidGeometry) {
              hasGeometry = true;
            }
          }
          
          // Alternative check for bounding boxes
          if (!hasGeometry && model.boundingBoxes) {
            // Try to get a bounding box to verify geometry is processed
            model.boundingBoxes.getMergedBox(model).then((box: any) => {
              if (box && !box.isEmpty()) {
                hasGeometry = true;
                console.log(`✅ Model geometry ready after ${elapsedTime}ms`);
                resolve();
                return;
              }
            }).catch(() => {
              // Continue checking
            });
          }
          
          if (hasGeometry) {
            console.log(`✅ Model geometry ready after ${elapsedTime}ms`);
            resolve();
            return;
          }
          
        } catch (error) {
          console.warn("Error checking model readiness:", error);
        }
        
        // Continue checking
        setTimeout(checkReady, checkInterval);
      };
      
      // Start checking
      checkReady();
    });
  }

  /**
   * Display comprehensive model overview when selected from dropdown
   */
  private async displayModelOverview(model: any, fileName: string) {
    if (!this.ui.propertiesContent) return;

    try {
      let html = `
        <div style='font-weight:600;color:#60a5fa;margin-bottom:8px;padding:8px;background:rgba(59,130,246,0.1);border-radius:6px;'>
          📊 Model Overview: ${fileName}
        </div>
      `;

      // Model Information Section
      html += `
        <div style='background:rgba(30,41,59,0.5);padding:8px;border-radius:6px;margin-bottom:8px;'>
          <div style='font-weight:600;color:#7dd3fc;margin-bottom:4px;'>📋 Model Information</div>
          <table style="width:100%;font-size:0.9rem;">
            <tr><td style='color:#94a3b8;padding:2px 4px;'>File Name:</td><td style='color:#f3f4f6;padding:2px 4px;'>${fileName}</td></tr>
      `;

      // Try to get model schema and basic info
      if (model.schema) {
        html += `<tr><td style='color:#94a3b8;padding:2px 4px;'>IFC Schema:</td><td style='color:#f3f4f6;padding:2px 4px;'>${model.schema}</td></tr>`;
      }

      if (model.modelId) {
        html += `<tr><td style='color:#94a3b8;padding:2px 4px;'>Model ID:</td><td style='color:#f3f4f6;padding:2px 4px;'>${model.modelId}</td></tr>`;
      }

      // Fragment count and statistics
      if (model.fragments && model.fragments.size) {
        html += `<tr><td style='color:#94a3b8;padding:2px 4px;'>Fragments:</td><td style='color:#f3f4f6;padding:2px 4px;'>${model.fragments.size}</td></tr>`;
      }

      html += `</table></div>`;

      // Element Statistics Section
      html += `
        <div style='background:rgba(16,185,129,0.1);padding:8px;border-radius:6px;margin-bottom:8px;'>
          <div style='font-weight:600;color:#10b981;margin-bottom:4px;'>🏗️ Element Statistics</div>
          <table style="width:100%;font-size:0.9rem;">
      `;

      // Try to get element counts by type
      const elementTypes = ['IfcWall', 'IfcSlab', 'IfcColumn', 'IfcBeam', 'IfcDoor', 'IfcWindow', 'IfcStair', 'IfcRoof', 'IfcSpace'];
      let totalElements = 0;

      for (const elementType of elementTypes) {
        try {
          if (model.getItemsOfCategory) {
            const items = await model.getItemsOfCategory(elementType);
            if (items && items.length > 0) {
              totalElements += items.length;
              html += `<tr><td style='color:#94a3b8;padding:2px 4px;'>${elementType}:</td><td style='color:#f3f4f6;padding:2px 4px;'>${items.length}</td></tr>`;
            }
          }
        } catch (err) {
          // Skip if method doesn't exist or fails
        }
      }

      if (totalElements > 0) {
        html += `<tr style='border-top:1px solid #374151;'><td style='color:#10b981;padding:4px 4px;font-weight:600;'>Total Elements:</td><td style='color:#f3f4f6;padding:4px 4px;font-weight:600;'>${totalElements}</td></tr>`;
      } else {
        html += `<tr><td colspan='2' style='color:#94a3b8;padding:4px 4px;text-align:center;font-style:italic;'>Element counts not available</td></tr>`;
      }

      html += `</table></div>`;

      // Model Properties Section
      let modelProperties: any = {};
      try {
        if (model.getProperties) {
          modelProperties = await model.getProperties();
        }
      } catch (err) {
        // Properties not available
      }

      if (modelProperties && Object.keys(modelProperties).length > 0) {
        html += `
          <div style='background:rgba(168,85,247,0.1);padding:8px;border-radius:6px;margin-bottom:8px;'>
            <div style='font-weight:600;color:#a855f7;margin-bottom:4px;'>⚙️ Model Properties</div>
            <table style="width:100%;font-size:0.9rem;">
        `;

        // Display first 10 properties to avoid overwhelming the UI
        const propKeys = Object.keys(modelProperties).slice(0, 10);
        for (const key of propKeys) {
          const value = typeof modelProperties[key] === 'object' ? 
            JSON.stringify(modelProperties[key]).substring(0, 50) + '...' : 
            String(modelProperties[key]);
          html += `<tr><td style='color:#94a3b8;padding:2px 4px;'>${key}:</td><td style='color:#f3f4f6;padding:2px 4px;'>${value}</td></tr>`;
        }

        if (Object.keys(modelProperties).length > 10) {
          html += `<tr><td colspan='2' style='color:#94a3b8;padding:4px 4px;text-align:center;font-style:italic;'>... and ${Object.keys(modelProperties).length - 10} more properties</td></tr>`;
        }

        html += `</table></div>`;
      }

      // Instructions
      html += `
        <div style='background:rgba(59,130,246,0.1);padding:8px;border-radius:6px;color:#94a3b8;text-align:center;font-size:0.85rem;'>
          💡 Click on individual components in the 3D view to see detailed properties
        </div>
      `;

      this.ui.propertiesContent.innerHTML = html;

    } catch (error) {
      console.error("Error displaying model overview:", error);
      if (this.ui.propertiesContent) {
        this.ui.propertiesContent.innerHTML = `
          <div style='color:#f87171;text-align:center;padding:8px;'>
            ❌ Error loading model overview
            <br><small style='color:#94a3b8;'>Check console for details</small>
          </div>
        `;
      }
    }
  }

  /**
   * Inspect the fragment structure to understand its hierarchy
   */
  private inspectFragmentStructure(model: THREE.Object3D, depth: number = 0) {
    const indent = "  ".repeat(depth);
    console.log(`${indent}🔍 ${model.constructor.name} - ${model.type || 'Unknown'}`);
    console.log(`${indent}   Name: ${model.name || 'Unnamed'}`);
    console.log(`${indent}   Children: ${model.children.length}`);
    console.log(`${indent}   Position: (${model.position.x.toFixed(2)}, ${model.position.y.toFixed(2)}, ${model.position.z.toFixed(2)})`);
    console.log(`${indent}   Visible: ${model.visible}`);
    
    if (model instanceof THREE.Mesh) {
      console.log(`${indent}   🔺 MESH FOUND!`);
      console.log(`${indent}     Geometry: ${model.geometry?.constructor.name}`);
      console.log(`${indent}     Material: ${model.material?.constructor.name}`);
      if (model.geometry) {
        console.log(`${indent}     Vertices: ${model.geometry.attributes.position?.count || 'Unknown'}`);
        console.log(`${indent}     BoundingBox: ${model.geometry.boundingBox ? 'Available' : 'Not computed'}`);
      }
    }
    
    // Recurse through children
    if (depth < 5) { // Limit depth to avoid too much output
      model.children.forEach(child => {
        this.inspectFragmentStructure(child, depth + 1);
      });
    } else if (model.children.length > 0) {
      console.log(`${indent}   ... (${model.children.length} more children, depth limit reached)`);
    }
  }

  /**
   * Remove a specific model
   */
  private removeModel(model: any) {
    // Remove the model's object from the scene
    if (model && model.object) {
      this.world.scene.three.remove(model.object);
    }
    // Remove from loadedModels
    this.loadedModels = this.loadedModels.filter(m => m.model !== model);
    this.ui.updateStatus(`Removed model (${this.loadedModels.length} remaining)`);
    this.ui.updatePropertiesDropdown(this.loadedModels);
    if (this.loadedModels.length > 0) {
      this.fitAllModelsToView();
    }
  }

  /**
   * Clear all loaded fragments
   */
  private clearAllFragments() {
    this.loadedModels.forEach(({ model }) => {
      if (model && model.object) {
        this.world.scene.three.remove(model.object);
      }
    });
    this.loadedModels = [];
    this.ui.clearLoadedFiles();
    this.ui.updateStatus("All fragments cleared");
    // Reset camera
    this.world.camera.controls?.setLookAt(10, 10, 10, 0, 0, 0);
  }

  /**
   * Handle IFC file conversion
   */
  private async handleIfcConversion(file: File, statusElement: HTMLElement) {
    const progressDiv = document.getElementById("conversion-progress");
    const progressBar = document.getElementById("progress-bar");
    const progressText = document.getElementById("progress-text");
    
    try {
      // Show progress bar and initial status
      statusElement.style.display = 'block';
      statusElement.style.background = 'rgba(59, 130, 246, 0.1)';
      statusElement.style.color = '#3b82f6';
      statusElement.textContent = `🔄 Starting conversion...`;
      
      if (progressDiv) progressDiv.style.display = 'block';
      if (progressBar) progressBar.style.width = '10%';
      if (progressText) progressText.textContent = 'Uploading file...';
      
      this.ui.updateStatus(`Converting IFC file: ${file.name}`);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Update progress
      if (progressBar) progressBar.style.width = '30%';
      if (progressText) progressText.textContent = 'Processing IFC data...';
      statusElement.textContent = `🔄 Converting ${file.name}...`;

      // Send to backend for conversion
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/convert`, {
        method: 'POST',
        body: formData
      });

      // Update progress
      if (progressBar) progressBar.style.width = '70%';
      if (progressText) progressText.textContent = 'Generating fragments...';

      const result = await response.json();

      if (result.success) {
        // Complete progress
        if (progressBar) progressBar.style.width = '100%';
        if (progressText) progressText.textContent = 'Conversion complete!';
        
        // Show success
        statusElement.style.background = 'rgba(34, 197, 94, 0.1)';
        statusElement.style.color = '#22c55e';
        statusElement.textContent = `✅ Converted to ${result.output_file} (${result.size_mb} MB)`;
        this.ui.updateStatus(`✅ Conversion complete: ${result.output_file}`);

        // Auto-load the converted fragment
        setTimeout(async () => {
          try {
            if (progressText) progressText.textContent = 'Loading in 3D viewer...';
            
            const fragmentResponse = await fetch(`${API_CONFIG.BASE_URL}/api/fragments/${result.output_file}`);
            if (fragmentResponse.ok) {
              const blob = await fragmentResponse.blob();
              const fragmentFile = new File([blob], result.output_file, { type: "application/octet-stream" });
              await this.loadFragmentFile(fragmentFile);
              
              statusElement.textContent = `✅ Loaded ${result.output_file} in 3D viewer`;
              if (progressText) progressText.textContent = 'Ready for next conversion';
              
              // Hide progress after success
              setTimeout(() => {
                if (progressDiv) progressDiv.style.display = 'none';
              }, 2000);
            }
          } catch (loadError) {
            console.error('Failed to auto-load fragment:', loadError);
            statusElement.textContent = `✅ Converted but auto-load failed - manually load ${result.output_file}`;
            if (progressDiv) progressDiv.style.display = 'none';
          }
        }, 500);

      } else {
        throw new Error(result.error || 'Conversion failed');
      }

    } catch (error) {
      console.error('IFC Conversion error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Hide progress and show error
      if (progressDiv) progressDiv.style.display = 'none';
      statusElement.style.background = 'rgba(239, 68, 68, 0.1)';
      statusElement.style.color = '#ef4444';
      statusElement.textContent = `❌ Conversion failed: ${errorMessage}`;
      this.ui.updateStatus(`❌ IFC conversion failed: ${errorMessage}`);
    }
  }

  /**
   * Handle subprocess IFC file conversion
   */
  private async handleSubprocessConversion(file: File, statusElement: HTMLElement) {
    const progressDiv = document.getElementById("subprocess-progress");
    const progressBar = document.getElementById("subprocess-progress-bar");
    const progressText = document.getElementById("subprocess-progress-text");
    
    try {
      // Show progress bar and initial status
      statusElement.style.display = 'block';
      statusElement.style.background = 'rgba(139, 92, 246, 0.1)';
      statusElement.style.color = '#8b5cf6';
      statusElement.textContent = `⚡ Starting subprocess conversion...`;
      
      if (progressDiv) progressDiv.style.display = 'block';
      if (progressBar) progressBar.style.width = '10%';
      if (progressText) progressText.textContent = 'Uploading file to subprocess converter...';
      
      this.ui.updateStatus(`Converting IFC file with subprocess: ${file.name}`);
      console.log(`🔄 Starting subprocess conversion for: ${file.name}`);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Update progress
      if (progressBar) progressBar.style.width = '20%';
      if (progressText) progressText.textContent = 'Initializing external converter process...';
      statusElement.textContent = `⚡ Processing ${file.name} with subprocess converter...`;

      console.log(`📤 Sending request to: ${API_CONFIG.BASE_URL}/api/convert-subprocess`);
      
      // Send to backend subprocess converter endpoint
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/convert-subprocess`, {
        method: 'POST',
        body: formData
      });

      console.log(`📥 Response status: ${response.status} ${response.statusText}`);

      // Update progress
      if (progressBar) progressBar.style.width = '50%';
      if (progressText) progressText.textContent = 'External process running...';

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📋 Subprocess result:', result);

      if (result.success) {
        // Complete progress
        if (progressBar) progressBar.style.width = '100%';
        if (progressText) progressText.textContent = 'Subprocess conversion complete!';
        
        // Show success with subprocess-specific styling
        statusElement.style.background = 'rgba(139, 92, 246, 0.1)';
        statusElement.style.color = '#8b5cf6';
        statusElement.textContent = `⚡ Subprocess converted to ${result.output_file} (${result.size_mb} MB)`;
        this.ui.updateStatus(`⚡ Subprocess conversion complete: ${result.output_file}`);

        // Auto-load the converted fragment
        setTimeout(async () => {
          try {
            if (progressText) progressText.textContent = 'Loading in 3D viewer...';
            
            const fragmentResponse = await fetch(`${API_CONFIG.BASE_URL}/api/fragments/${result.output_file}`);
            if (fragmentResponse.ok) {
              const blob = await fragmentResponse.blob();
              const fragmentFile = new File([blob], result.output_file, { type: "application/octet-stream" });
              await this.loadFragmentFile(fragmentFile);
              
              statusElement.textContent = `⚡ Loaded ${result.output_file} in 3D viewer (subprocess)`;
              if (progressText) progressText.textContent = 'Ready for next conversion';
              
              // Hide progress after success
              setTimeout(() => {
                if (progressDiv) progressDiv.style.display = 'none';
              }, 2000);
            }
          } catch (loadError) {
            console.error('Failed to auto-load subprocess fragment:', loadError);
            statusElement.textContent = `⚡ Converted but auto-load failed - manually load ${result.output_file}`;
            if (progressDiv) progressDiv.style.display = 'none';
          }
        }, 500);

      } else {
        throw new Error(result.error || 'Subprocess conversion failed');
      }

    } catch (error) {
      console.error('🚨 Subprocess Conversion error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Hide progress and show error
      if (progressDiv) progressDiv.style.display = 'none';
      statusElement.style.background = 'rgba(239, 68, 68, 0.1)';
      statusElement.style.color = '#ef4444';
      statusElement.textContent = `❌ Subprocess conversion failed: ${errorMessage}`;
      this.ui.updateStatus(`❌ Subprocess conversion failed: ${errorMessage}`);
      
      // Log detailed error information
      console.error('🔍 Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  document.title = "IFC File Conversion - Load Test";
  new FragmentViewer();
});

export { FragmentViewer };
