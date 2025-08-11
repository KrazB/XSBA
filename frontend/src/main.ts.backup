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

console.log("🚀 QGEN_IMPFRAG Standalone Fragment Viewer initializing...");

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

    // --- Visibility & Camera Tools Panel ---
    this.visibilityPanel = document.createElement('div');
    this.visibilityPanel.id = 'visibility-panel';
    this.visibilityPanel.style.cssText = `
      position: fixed;
      top: 580px;
      left: 40px;
      width: 320px;
      background: rgba(24,32,48,0.98);
      border-radius: 10px;
      box-shadow: 0 2px 12px 0 rgba(0,0,0,0.10);
      padding: 14px 14px 10px 14px;
      color: #f3f4f6;
      font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
      font-size: 1rem;
      z-index: 1002;
      margin-top: 10px;
    `;
    this.visibilityPanel.innerHTML = `
      <div style='font-weight:600;font-size:1.08rem;margin-bottom:7px;letter-spacing:0.01em;'>Visibility & Camera Tools</div>
      <div style='display:flex;gap:8px;margin-bottom:8px;'>
        <button id='show-all-btn' style='flex:1;background:#059669;color:#fff;border:none;padding:6px 0;border-radius:5px;cursor:pointer;'>Show All</button>
        <button id='hide-all-btn' style='flex:1;background:#dc2626;color:#fff;border:none;padding:6px 0;border-radius:5px;cursor:pointer;'>Hide All</button>
      </div>
      <div style='display:flex;gap:8px;margin-bottom:8px;'>
        <button id='fit-tight-btn' style='flex:1;background:#2563eb;color:#fff;border:none;padding:6px 0;border-radius:5px;cursor:pointer;'>Fit (Close)</button>
        <button id='fit-wide-btn' style='flex:1;background:#0ea5e9;color:#fff;border:none;padding:6px 0;border-radius:5px;cursor:pointer;'>Fit (Far)</button>
      </div>
      <div style='margin-bottom:6px;'>Toggle Category:</div>
      <select id='category-dropdown' style='width:100%;padding:7px 8px;border-radius:6px;border:1px solid #3b82f6;background:#1e293b;color:#f3f4f6;font-size:1rem;'>
        <option value=''>-- Select Category --</option>
        <option value='IfcWall'>IfcWall</option>
        <option value='IfcSlab'>IfcSlab</option>
        <option value='IfcColumn'>IfcColumn</option>
        <option value='IfcBeam'>IfcBeam</option>
        <option value='IfcDoor'>IfcDoor</option>
        <option value='IfcWindow'>IfcWindow</option>
        <option value='IfcStair'>IfcStair</option>
        <option value='IfcRoof'>IfcRoof</option>
        <option value='IfcSpace'>IfcSpace</option>
        <option value='IfcBuildingStorey'>IfcBuildingStorey</option>
      </select>
      <button id='toggle-category-btn' style='margin-top:8px;width:100%;background:#f59e42;color:#222;border:none;padding:6px 0;border-radius:5px;cursor:pointer;'>Toggle Category</button>
    `;
    document.body.appendChild(this.visibilityPanel);

    // 🎛️ Create Camera Settings Panel
    const cameraPanel = document.createElement("div");
    cameraPanel.id = "camera-settings-panel";
    cameraPanel.style.cssText = `
      position: fixed;
      top: 120px;
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
      max-height: 400px;
      overflow-y: auto;
    `;
    cameraPanel.innerHTML = `
      <div style='font-weight:600;color:#60a5fa;margin-bottom:8px;text-align:center;'>🎛️ Camera Settings</div>
      
      <div style='margin-bottom:10px;'>
        <label>Near Plane: <span id='near-value'>0.1</span></label>
        <input type='range' id='near-plane' min='0.01' max='10' step='0.01' value='0.1' style='width:100%;'>
      </div>
      
      <div style='margin-bottom:10px;'>
        <label>Far Plane: <span id='far-value'>50000</span></label>
        <input type='range' id='far-plane' min='1000' max='100000' step='1000' value='50000' style='width:100%;'>
      </div>
      
      <div style='margin-bottom:10px;'>
        <label>Close Distance: <span id='close-value'>5.0</span>x</label>
        <input type='range' id='close-distance' min='1' max='20' step='0.5' value='5.0' style='width:100%;'>
      </div>
      
      <div style='margin-bottom:10px;'>
        <label>Far Distance: <span id='far-value'>8.0</span>x</label>
        <input type='range' id='far-distance' min='1' max='30' step='0.5' value='8.0' style='width:100%;'>
      </div>
      
      <div style='margin-bottom:10px;'>
        <label>Min Distance: <span id='min-distance-value'>200</span></label>
        <input type='range' id='min-distance' min='50' max='1000' step='50' value='200' style='width:100%;'>
      </div>
      
      <div style='display:flex;gap:4px;margin-top:8px;'>
        <button id='reset-camera-btn' style='flex:1;background:#ef4444;color:#fff;border:none;padding:6px 0;border-radius:5px;cursor:pointer;'>Reset</button>
        <button id='apply-camera-btn' style='flex:1;background:#10b981;color:#fff;border:none;padding:6px 0;border-radius:5px;cursor:pointer;'>Apply & Refit</button>
      </div>
    `;
    document.body.appendChild(cameraPanel);
    
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
      top: 300px;
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
      top: 560px;
      right: 40px;
      width: 270px;
      background: rgba(24,32,48,0.98);
      border-radius: 10px;
      box-shadow: 0 2px 12px 0 rgba(0,0,0,0.10);
      padding: 16px 14px 10px 14px;
      color: #f3f4f6;
      font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
      font-size: 1rem;
      z-index: 1002;
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
      max-height: 180px;
      overflow-y: auto;
      background: rgba(30,41,59,0.92);
      border-radius: 6px;
      padding: 10px 8px;
      font-size: 0.98rem;
      margin-top: 2px;
      color: #e0e7ef;
      border: 1px solid #334155;
      min-height: 32px;
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

  // Show all elements in all loaded models
  private async showAllFragments() {
    for (const { model } of this.loadedModels) {
      if (model && model.setVisible) {
        await model.setVisible(undefined, true); // undefined = all
      }
    }
    this.fragments.update(true);
  }

  // Hide all elements in all loaded models
  private async hideAllFragments() {
    for (const { model } of this.loadedModels) {
      if (model && model.setVisible) {
        await model.setVisible(undefined, false);
      }
    }
    this.fragments.update(true);
  }

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

  // Toggle visibility by IFC category
  private async toggleCategoryVisibility(category: string) {
    for (const { model } of this.loadedModels) {
      if (model && model.getItemsOfCategory && model.toggleVisible) {
        const items = await model.getItemsOfCategory(category);
        const localIds = (await Promise.all(items.map((item: any) => item.getLocalId()))).filter((id: any) => id !== undefined);
        if (localIds.length > 0) {
          await model.toggleVisible(localIds);
        }
      }
    }
    this.fragments.update(true);
  }
  /**
   * Setup picking for showing properties of clicked fragments
   */
  private setupPicking() {
    const container = document.getElementById("container");
    if (!container) return;
    container.addEventListener("pointerdown", async (event) => {
      if (!this.fragments || this.loadedModels.length === 0) return;
      // Get mouse position normalized to [-1, 1]
      const rect = container.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      const mouse = new THREE.Vector2(x, y);
      // Raycast
      const camera = this.world.camera.three;
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      // Check all loaded models
      for (const { model, fileName } of this.loadedModels) {
        if (!model.object) continue;
        const intersects = raycaster.intersectObject(model.object, true);
        if (intersects.length > 0) {
          // Try to get fragment/component ID from intersection
          const intersect = intersects[0];
          // ThatOpen Fragments store fragmentId on mesh.userData.fragmentId
          let fragmentId = null;
          if (intersect.object && intersect.object.userData && intersect.object.userData.fragmentId !== undefined) {
            fragmentId = intersect.object.userData.fragmentId;
          }
          // If fragmentId found, get properties using proper ThatOpen methods
          if (fragmentId !== null) {
            await this.displayComponentProperties(model, fragmentId, fileName);
            return;
          }
        }
      }
      
      // If no component clicked, clear properties display
      if (this.ui.propertiesContent) {
        this.ui.propertiesContent.innerHTML = `<div style="color:#94a3b8;font-style:italic;">Click on a component to view properties</div>`;
      }
    });
  }

  /**
   * Display comprehensive component properties using ThatOpen best practices
   */
  private async displayComponentProperties(model: any, fragmentId: string, fileName: string) {
    if (!this.ui.propertiesContent) return;

    try {
      // Get basic fragment info
      let properties: any = {};
      let ifcElement: any = null;
      let expressID: number | null = null;

      // Try multiple methods to get properties
      if (model.getProperties) {
        try {
          properties = await model.getProperties(fragmentId);
        } catch (err) {
          console.log("getProperties failed, trying alternative methods");
        }
      }

      // Try to get the actual IFC element using ThatOpen methods
      if (model.getElementByFragmentId) {
        try {
          ifcElement = await model.getElementByFragmentId(fragmentId);
          if (ifcElement && ifcElement.expressID) {
            expressID = ifcElement.expressID;
          }
        } catch (err) {
          console.log("getElementByFragmentId failed");
        }
      }

      // Try alternative method to get element by ID
      if (!ifcElement && model.getElementByID && expressID) {
        try {
          ifcElement = await model.getElementByID(expressID);
        } catch (err) {
          console.log("getElementByID failed");
        }
      }

      // Build comprehensive properties display
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
            <tr><td style='color:#94a3b8;padding:2px 4px;'>Fragment ID:</td><td style='color:#f3f4f6;padding:2px 4px;'>${fragmentId}</td></tr>
            <tr><td style='color:#94a3b8;padding:2px 4px;'>Model:</td><td style='color:#f3f4f6;padding:2px 4px;'>${fileName}</td></tr>
            ${expressID ? `<tr><td style='color:#94a3b8;padding:2px 4px;'>Express ID:</td><td style='color:#f3f4f6;padding:2px 4px;'>${expressID}</td></tr>` : ''}
          </table>
        </div>
      `;

      // IFC Properties Section
      if (ifcElement) {
        html += `
          <div style='background:rgba(16,185,129,0.1);padding:8px;border-radius:6px;margin-bottom:8px;'>
            <div style='font-weight:600;color:#10b981;margin-bottom:4px;'>🏛️ IFC Properties</div>
            <table style="width:100%;font-size:0.9rem;">
        `;

        // Essential IFC properties
        const essentialProps = ['GlobalId', 'Name', 'type', 'IfcType', 'Description', 'Tag', 'ObjectType'];
        for (const prop of essentialProps) {
          if (ifcElement[prop] !== undefined && ifcElement[prop] !== null && ifcElement[prop] !== '') {
            const value = typeof ifcElement[prop] === 'object' ? JSON.stringify(ifcElement[prop]) : String(ifcElement[prop]);
            html += `<tr><td style='color:#94a3b8;padding:2px 4px;'>${prop}:</td><td style='color:#f3f4f6;padding:2px 4px;'>${value}</td></tr>`;
          }
        }

        html += `</table></div>`;
      }

      // Additional Properties Section
      if (properties && Object.keys(properties).length > 0) {
        html += `
          <div style='background:rgba(168,85,247,0.1);padding:8px;border-radius:6px;margin-bottom:8px;'>
            <div style='font-weight:600;color:#a855f7;margin-bottom:4px;'>⚙️ Additional Properties</div>
            <table style="width:100%;font-size:0.9rem;">
        `;

        // Filter out already displayed properties
        const displayedProps = ['GlobalId', 'Name', 'type', 'IfcType', 'Description', 'Tag', 'ObjectType'];
        for (const key in properties) {
          if (!displayedProps.includes(key) && properties[key] !== undefined && properties[key] !== null && properties[key] !== '') {
            const value = typeof properties[key] === 'object' ? JSON.stringify(properties[key]) : String(properties[key]);
            html += `<tr><td style='color:#94a3b8;padding:2px 4px;'>${key}:</td><td style='color:#f3f4f6;padding:2px 4px;'>${value}</td></tr>`;
          }
        }

        html += `</table></div>`;
      }

      // If no properties found at all
      if (!ifcElement && (!properties || Object.keys(properties).length === 0)) {
        html += `
          <div style='background:rgba(239,68,68,0.1);padding:8px;border-radius:6px;color:#f87171;text-align:center;'>
            ⚠️ No properties available for this component
            <br><small style='color:#94a3b8;'>Fragment ID: ${fragmentId}</small>
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
      if (this.ui.propertiesContent) {
        this.ui.propertiesContent.innerHTML = `
          <div style='color:#f87171;text-align:center;padding:8px;'>
            ❌ Error loading properties
            <br><small style='color:#94a3b8;'>Check console for details</small>
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
      this.setupVisibilityTools();
      console.log("✅ Fragment viewer ready");
      this.ui.updateStatus("✅ Ready - Drop .frag files to view them");
    } catch (error) {
      console.error("❌ Failed to initialize:", error);
      this.ui.updateStatus("❌ Failed to initialize viewer");
    }
  }

  // Setup event listeners for the visibility/camera tools panel
  private setupVisibilityTools() {
    const showAllBtn = document.getElementById('show-all-btn');
    const hideAllBtn = document.getElementById('hide-all-btn');
    const fitTightBtn = document.getElementById('fit-tight-btn');
    const fitWideBtn = document.getElementById('fit-wide-btn');
    const categoryDropdown = document.getElementById('category-dropdown') as HTMLSelectElement;
    const toggleCategoryBtn = document.getElementById('toggle-category-btn');
    if (showAllBtn) showAllBtn.addEventListener('click', () => this.showAllFragments());
    if (hideAllBtn) hideAllBtn.addEventListener('click', () => this.hideAllFragments());
    if (fitTightBtn) fitTightBtn.addEventListener('click', () => this.fitCameraToModels(false));
    if (fitWideBtn) fitWideBtn.addEventListener('click', () => this.fitCameraToModels(true));
    if (toggleCategoryBtn && categoryDropdown) {
      toggleCategoryBtn.addEventListener('click', () => {
        const category = categoryDropdown.value;
        if (category) this.toggleCategoryVisibility(category);
      });
    }

    // 🎛️ Setup Camera Settings Panel Event Listeners
    this.setupCameraSettingsListeners();
  }

  /**
   * 🎛️ Setup event listeners for camera settings panel
   */
  private setupCameraSettingsListeners() {
    // Get all camera setting elements
    const nearPlane = document.getElementById('near-plane') as HTMLInputElement;
    const farPlane = document.getElementById('far-plane') as HTMLInputElement;
    const closeDistance = document.getElementById('close-distance') as HTMLInputElement;
    const farDistance = document.getElementById('far-distance') as HTMLInputElement;
    const minDistance = document.getElementById('min-distance') as HTMLInputElement;
    const resetBtn = document.getElementById('reset-camera-btn');
    const applyBtn = document.getElementById('apply-camera-btn');

    // Update display values in real-time
    nearPlane?.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      const display = document.getElementById('near-value');
      if (display) display.textContent = value;
    });

    farPlane?.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      const display = document.getElementById('far-value');
      if (display) display.textContent = value;
    });

    closeDistance?.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      const display = document.getElementById('close-value');
      if (display) display.textContent = value;
    });

    farDistance?.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      const display = document.getElementById('far-value');
      if (display) display.textContent = value;
    });

    minDistance?.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      const display = document.getElementById('min-distance-value');
      if (display) display.textContent = value;
    });

    // Reset to defaults
    resetBtn?.addEventListener('click', () => {
      const defaults = {
        nearPlane: 0.1,
        farPlane: 50000,
        closeFitMultiplier: 5.0,
        farFitMultiplier: 8.0,
        minimumDistance: 200
      };
      
      if (nearPlane) nearPlane.value = defaults.nearPlane.toString();
      if (farPlane) farPlane.value = defaults.farPlane.toString();
      if (closeDistance) closeDistance.value = defaults.closeFitMultiplier.toString();
      if (farDistance) farDistance.value = defaults.farFitMultiplier.toString();
      if (minDistance) minDistance.value = defaults.minimumDistance.toString();
      
      // Update displays
      document.getElementById('near-value')!.textContent = defaults.nearPlane.toString();
      document.getElementById('far-value')!.textContent = defaults.farPlane.toString();
      document.getElementById('close-value')!.textContent = defaults.closeFitMultiplier.toString();
      document.getElementById('far-value')!.textContent = defaults.farFitMultiplier.toString();
      document.getElementById('min-distance-value')!.textContent = defaults.minimumDistance.toString();
      
      // Apply the defaults
      this.updateCameraSettings(defaults);
    });

    // Apply current settings and refit camera
    applyBtn?.addEventListener('click', () => {
      const newSettings = {
        nearPlane: parseFloat(nearPlane?.value || '0.1'),
        farPlane: parseFloat(farPlane?.value || '50000'),
        closeFitMultiplier: parseFloat(closeDistance?.value || '5.0'),
        farFitMultiplier: parseFloat(farDistance?.value || '8.0'),
        minimumDistance: parseFloat(minDistance?.value || '200')
      };
      
      this.updateCameraSettings(newSettings);
      console.log('🎛️ Applied new camera settings:', newSettings);
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
    const conversionProgress = document.getElementById("conversion-progress");

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
      const buffer = arrayBuffer instanceof Uint8Array ? arrayBuffer : new Uint8Array(arrayBuffer);
      console.log(`📊 Fragment data size: ${buffer.length} bytes`);

      // Load fragment using FragmentsModels (returns a FragmentsModel)
      const model = await this.fragments.load(buffer, { modelId: file.name });
      if (!model) throw new Error("Failed to create fragment model");

      // Add to loadedModels for UI management
      this.loadedModels.push({ model, fileName: file.name });

      // Frame the model in view after a short delay
      setTimeout(() => {
        this.frameAllModels();
      }, 100);

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
      this.frameAllModels();
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
      const response = await fetch('http://localhost:8111/api/convert', {
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
            
            const fragmentResponse = await fetch(`http://localhost:8111/api/fragments/${result.output_file}`);
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
   * Frame all models in the camera view
   */
  private frameAllModels() {
    if (this.loadedModels.length === 0) return;
    try {
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
      const distance = Math.max(maxDim * 2, 50);
      const cameraPosition = new THREE.Vector3(
        center.x + distance,
        center.y + distance * 0.7,
        center.z + distance
      );
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
      this.world.renderer?.three.render(this.world.scene.three, this.world.camera.three);
    } catch (error) {
      console.error("❌ Failed to frame models:", error);
    }
  }
}

// Initialize when DOM is ready

document.addEventListener("DOMContentLoaded", () => {
  document.title = "IFC File Conversion - Load Test";
  new FragmentViewer();
});

export { FragmentViewer };
