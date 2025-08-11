/**
 * UI Manager for QGEN_IMPFRAG Frontend
 * ====================================
 * 
 * Manages user interface components, notifications, and state updates
 * Provides a clean, professional interface for fragment viewing
 */

export interface NotificationOptions {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number; // milliseconds, 0 for persistent
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number; // 0-100
}

export class UIManager {
  private notifications: Map<string, HTMLElement> = new Map();
  private loadingOverlay: HTMLElement | null = null;

  /**
   * Initialize UI components
   */
  public initialize(): void {
    this.createNotificationContainer();
    this.createLoadingOverlay();
    this.setupGlobalStyles();
  }

  /**
   * Show notification to user
   */
  public showNotification(options: NotificationOptions): string {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const notification = this.createNotificationElement(id, options);
    
    const container = document.getElementById('notification-container');
    if (container) {
      container.appendChild(notification);
      this.notifications.set(id, notification);

      // Auto-dismiss if duration is set
      if (options.duration && options.duration > 0) {
        setTimeout(() => this.hideNotification(id), options.duration);
      }

      // Animate in
      requestAnimationFrame(() => {
        notification.classList.add('notification-show');
      });
    }

    return id;
  }

  /**
   * Hide specific notification
   */
  public hideNotification(id: string): void {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.classList.remove('notification-show');
      notification.classList.add('notification-hide');
      
      setTimeout(() => {
        notification.remove();
        this.notifications.delete(id);
      }, 300);
    }
  }

  /**
   * Update loading state
   */
  public setLoadingState(state: LoadingState): void {
    if (!this.loadingOverlay) return;

    if (state.isLoading) {
      this.loadingOverlay.style.display = 'flex';
      
      const messageEl = this.loadingOverlay.querySelector('.loading-message') as HTMLElement;
      const progressEl = this.loadingOverlay.querySelector('.loading-progress') as HTMLElement;
      const progressBarEl = this.loadingOverlay.querySelector('.loading-progress-bar') as HTMLElement;

      if (messageEl) {
        messageEl.textContent = state.message || 'Loading...';
      }

      if (state.progress !== undefined && progressEl && progressBarEl) {
        progressEl.style.display = 'block';
        progressBarEl.style.width = `${Math.max(0, Math.min(100, state.progress))}%`;
      } else if (progressEl) {
        progressEl.style.display = 'none';
      }
    } else {
      this.loadingOverlay.style.display = 'none';
    }
  }

  /**
   * Update status display
   */
  public updateStatus(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    const statusEl = document.getElementById('status');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = `status status-${type}`;
    }
  }

  /**
   * Update fragment list in UI
   */
  public updateFragmentList(fragments: Array<{ filename: string; size_mb: number; created: string }>): void {
    const listEl = document.getElementById('fragment-list');
    if (!listEl) return;

    if (fragments.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📁</div>
          <div class="empty-title">No fragments available</div>
          <div class="empty-message">Upload IFC files to the backend to generate fragments</div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = fragments.map(fragment => `
      <div class="fragment-item" data-filename="${fragment.filename}">
        <div class="fragment-info">
          <div class="fragment-name">${fragment.filename}</div>
          <div class="fragment-meta">
            ${fragment.size_mb} MB • ${new Date(fragment.created).toLocaleDateString()}
          </div>
        </div>
        <button class="load-fragment-btn" data-filename="${fragment.filename}">
          Load
        </button>
      </div>
    `).join('');
  }

  /**
   * Setup global UI styles
   */
  private setupGlobalStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      /* Notification Styles */
      #notification-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        pointer-events: none;
      }
      
      .notification {
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        margin-bottom: 10px;
        padding: 16px;
        min-width: 300px;
        max-width: 400px;
        pointer-events: auto;
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s ease;
      }
      
      .notification-show {
        transform: translateX(0);
        opacity: 1;
      }
      
      .notification-hide {
        transform: translateX(100%);
        opacity: 0;
      }
      
      .notification-success { border-left: 4px solid #10b981; }
      .notification-error { border-left: 4px solid #ef4444; }
      .notification-warning { border-left: 4px solid #f59e0b; }
      .notification-info { border-left: 4px solid #3b82f6; }
      
      .notification-title {
        font-weight: 600;
        margin-bottom: 4px;
        color: #1f2937;
      }
      
      .notification-message {
        color: #6b7280;
        font-size: 14px;
      }
      
      /* Loading Overlay */
      .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }
      
      .loading-content {
        background: white;
        border-radius: 12px;
        padding: 32px;
        text-align: center;
        min-width: 280px;
      }
      
      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #e5e7eb;
        border-top: 4px solid #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 16px;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .loading-progress {
        width: 100%;
        height: 6px;
        background: #e5e7eb;
        border-radius: 3px;
        margin-top: 16px;
        overflow: hidden;
      }
      
      .loading-progress-bar {
        height: 100%;
        background: #3b82f6;
        border-radius: 3px;
        transition: width 0.3s ease;
      }
      
      /* Fragment List Styles */
      .fragment-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        margin-bottom: 8px;
        background: white;
      }
      
      .fragment-info {
        flex: 1;
      }
      
      .fragment-name {
        font-weight: 500;
        color: #1f2937;
      }
      
      .fragment-meta {
        font-size: 12px;
        color: #6b7280;
        margin-top: 2px;
      }
      
      .load-fragment-btn {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 6px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
      }
      
      .load-fragment-btn:hover {
        background: #2563eb;
      }
      
      /* Status Styles */
      .status {
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
      }
      
      .status-success { background: #d1fae5; color: #065f46; }
      .status-error { background: #fee2e2; color: #991b1b; }
      .status-warning { background: #fef3c7; color: #92400e; }
      .status-info { background: #dbeafe; color: #1e40af; }
      
      /* Empty State */
      .empty-state {
        text-align: center;
        padding: 40px 20px;
      }
      
      .empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
      
      .empty-title {
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 8px;
      }
      
      .empty-message {
        color: #6b7280;
      }
      
      /* Drag and Drop */
      .drag-over {
        border: 2px dashed #3b82f6 !important;
        background: rgba(59, 130, 246, 0.05) !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Create notification container
   */
  private createNotificationContainer(): void {
    const container = document.createElement('div');
    container.id = 'notification-container';
    document.body.appendChild(container);
  }

  /**
   * Create loading overlay
   */
  private createLoadingOverlay(): void {
    this.loadingOverlay = document.createElement('div');
    this.loadingOverlay.className = 'loading-overlay';
    this.loadingOverlay.innerHTML = `
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-message">Loading...</div>
        <div class="loading-progress" style="display: none;">
          <div class="loading-progress-bar"></div>
        </div>
      </div>
    `;
    document.body.appendChild(this.loadingOverlay);
  }

  /**
   * Create notification element
   */
  private createNotificationElement(id: string, options: NotificationOptions): HTMLElement {
    const notification = document.createElement('div');
    notification.id = id;
    notification.className = `notification notification-${options.type}`;
    notification.innerHTML = `
      <div class="notification-title">${options.title}</div>
      <div class="notification-message">${options.message}</div>
    `;

    // Add click to dismiss
    notification.addEventListener('click', () => this.hideNotification(id));

    return notification;
  }
}

// Export singleton instance
export const uiManager = new UIManager();
export default uiManager;
