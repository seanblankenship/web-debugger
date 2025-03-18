/**
 * Web Debugger - Dev Overlay
 * A comprehensive development overlay tool for debugging and design assessment.
 *
 * Features:
 * - Shadow DOM isolation from host page
 * - Catpuccin themes (Latte, Frappe, Macchiato, Mocha)
 * - Multiple development tools (color picker, DOM explorer, etc.)
 * - Responsive design
 * - Modern UI/UX with animations
 */

// Import modules
import { ThemeManager } from './modules/theme-manager.js';
import { StorageManager } from './modules/storage-manager.js';
import { DragManager } from './modules/drag-manager.js';
import { ResizeManager } from './modules/resize-manager.js';
import { UIManager } from './modules/ui-manager.js';
import { IconManager } from './modules/icon-manager.js';
import { KeyboardShortcutsManager } from './modules/keyboard-shortcuts-manager.js';

// Import tools with correct export formats
import { DOMExplorer } from './tools/dom-explorer.js';
import { ColorPicker } from './tools/color-picker.js';
import { FontInspector } from './tools/font-inspector.js';
import { ResponsiveChecker } from './tools/responsive-checker.js';
import { StorageInspector } from './tools/storage-inspector.js';
import { NetworkMonitor } from './tools/network-monitor.js';
import { JSValidator } from './tools/js-validator.js';
import { CSSValidator } from './tools/css-validator.js';
import { SpacingVisualizer } from './tools/spacing-visualizer.js';
import { PerformanceMonitor } from './tools/performance-monitor.js';
import { AccessibilityChecker } from './tools/accessibility-checker.js';
import { SettingsPanel } from './tools/settings-panel.js';

// Create and append styles
const styleElement = document.createElement('style');
styleElement.textContent = `
  /* Basic styles for the overlay */
  .dev-overlay {
    position: fixed;
    top: 20px;
    right: 20px;
    width: 360px;
    background-color: #fff;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    color: #333;
    transition: all 0.3s ease;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  /* Debugger container styles */
  .debugger-container {
    position: fixed;
    top: 20px;
    right: 20px;
    width: 360px;
    background-color: #fff;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    color: #333;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .debugger-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #f5f5f5;
    border-bottom: 1px solid #ddd;
    padding: 8px 12px;
    cursor: move;
    user-select: none;
  }
  
  .debugger-drag-handle {
    font-weight: bold;
    font-size: 14px;
  }
  
  .debugger-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 8px;
    background-color: #f9f9f9;
    border-bottom: 1px solid #eee;
  }
  
  .debugger-content {
    flex: 1;
    overflow: auto;
    padding: 12px;
  }
  
  .debugger-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 12px;
    background-color: #f5f5f5;
    border-top: 1px solid #ddd;
    font-size: 12px;
  }
  
  .dev-overlay-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background-color: #f5f5f5;
    border-bottom: 1px solid #ddd;
    border-radius: 8px 8px 0 0;
    cursor: move;
  }
  
  .dev-overlay-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
  }
  
  .dev-overlay-header-actions {
    display: flex;
    gap: 8px;
  }
  
  .dev-overlay-btn {
    background-color: transparent;
    border: none;
    cursor: pointer;
    font-size: 14px;
    color: #666;
    padding: 4px 8px;
    border-radius: 4px;
  }
  
  .dev-overlay-btn:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  .dev-overlay-body {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    flex: 1;
  }
  
  .dev-overlay-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 8px;
    border-bottom: 1px solid #ddd;
    background-color: #fafafa;
  }
  
  .dev-overlay-content {
    flex: 1;
    overflow: auto;
    padding: 12px;
  }
  
  .dev-overlay-tool {
    margin-bottom: 12px;
  }
  
  .dev-overlay-tool h3 {
    font-size: 14px;
    margin: 0 0 8px;
  }
  
  .dev-overlay-resize {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 16px;
    height: 16px;
    cursor: nwse-resize;
    background: linear-gradient(135deg, transparent 0%, transparent 50%, #ccc 50%, #ccc 100%);
    border-radius: 0 0 8px 0;
  }
  
  /* Themes */
  .theme-latte {
    --bg-color: #fff;
    --text-color: #333;
    --border-color: #ddd;
    --header-bg: #f5f5f5;
    --toolbar-bg: #fafafa;
  }
  
  .theme-frappe {
    --bg-color: #303446;
    --text-color: #c6d0f5;
    --border-color: #414559;
    --header-bg: #232634;
    --toolbar-bg: #292c3c;
  }
  
  .theme-macchiato {
    --bg-color: #24273a;
    --text-color: #cad3f5;
    --border-color: #363a4f;
    --header-bg: #1e2030;
    --toolbar-bg: #181926;
  }
  
  .theme-mocha {
    --bg-color: #1e1e2e;
    --text-color: #cdd6f4;
    --border-color: #313244;
    --header-bg: #181825;
    --toolbar-bg: #11111b;
  }
  
  /* Theme application */
  .dev-overlay.theme-latte,
  .dev-overlay.theme-frappe,
  .dev-overlay.theme-macchiato,
  .dev-overlay.theme-mocha {
    background-color: var(--bg-color);
    color: var(--text-color);
  }
  
  .dev-overlay.theme-latte .dev-overlay-header,
  .dev-overlay.theme-frappe .dev-overlay-header,
  .dev-overlay.theme-macchiato .dev-overlay-header,
  .dev-overlay.theme-mocha .dev-overlay-header {
    background-color: var(--header-bg);
    border-color: var(--border-color);
  }
  
  .dev-overlay.theme-latte .dev-overlay-toolbar,
  .dev-overlay.theme-frappe .dev-overlay-toolbar,
  .dev-overlay.theme-macchiato .dev-overlay-toolbar,
  .dev-overlay.theme-mocha .dev-overlay-toolbar {
    background-color: var(--toolbar-bg);
    border-color: var(--border-color);
  }
`;

// DevOverlay class - Main application
class DevOverlay {
    constructor() {
        // Only check flag if it's not being reset already
        if (window._webDebuggerInitialized && !window._webDebuggerResetting) {
            console.warn(
                'Web Debugger already initialized - preventing duplicate instance'
            );
            return;
        }

        // Set global flag to indicate initialization
        window._webDebuggerInitialized = true;
        window._webDebuggerResetting = false;

        // Ensure the global reference is set
        window.devOverlay = this;

        // Constants
        this.NAMESPACE = 'web-debugger-overlay';
        this.VERSION = '1.0.0';

        // Property initialization
        this.root = null; // Shadow DOM root
        this.container = null; // Main container element
        this.isVisible = true; // Visibility state
        this.isMinimized = false; // Minimized state
        this.isCollapsed = false; // Collapsed state
        this.activeTools = []; // Currently active tools
        this.tools = {}; // Tool instances

        // Module managers
        this.storageManager = null;
        this.theme = null;
        this.drag = null;
        this.resize = null;
        this.uiManager = null;
        this.icons = null;
        this.keyboardShortcutsManager = null;

        // Initialize the overlay
        this.init();
    }

    /**
     * Initialize the dev overlay
     */
    init() {
        // Skip initialization if the constructor has already returned
        if (!window._webDebuggerInitialized) {
            console.warn(
                'DevOverlay: Initialization aborted due to duplicate instance check'
            );
            return false;
        }

        // Remove any existing elements with our ID
        const existingHost = document.getElementById(this.NAMESPACE);
        if (existingHost) {
            console.warn(
                'DevOverlay: Removing existing host element to ensure clean initialization'
            );
            existingHost.remove();
        }

        // Create the host element and shadow DOM
        this.createHostElement();

        // Initialize managers
        this.initManagers();

        // Build UI
        this.buildUI();

        // Load tools
        this.loadTools();

        // Register keyboard shortcuts if keyboard shortcuts manager is available
        if (this.keyboardShortcutsManager) {
            this.registerKeyboardShortcuts();
        }

        // Ensure global reference is maintained
        window.devOverlay = this;

        // Log initialization
        console.log(`DevOverlay: Initialized (v${this.VERSION})`);

        return true;
    }

    /**
     * Create the host element and shadow DOM
     */
    createHostElement() {
        // First check if the element already exists
        let existingHost = document.getElementById(this.NAMESPACE);

        // If it exists, remove it to avoid duplicate elements
        if (existingHost) {
            console.warn(
                'DevOverlay: Removing existing host element to prevent duplicates'
            );
            existingHost.remove();
        }

        // Create host element
        this.host = document.createElement('div');
        this.host.id = this.NAMESPACE;
        this.host.className = 'dev-overlay';
        document.body.appendChild(this.host);

        // Create shadow DOM
        this.root = this.host.attachShadow({ mode: 'open' });

        // Add styles to shadow DOM
        this.injectStyles();

        // Add transition class for animations after a delay
        setTimeout(() => {
            this.host.classList.add('theme-transition');
            console.log('DevOverlay: Created resize handle');
        }, 100);
    }

    /**
     * Inject global styles into the shadow DOM
     */
    injectStyles() {
        if (!this.root) {
            console.warn('DevOverlay: Cannot inject styles - no shadow root');
            return;
        }

        const styleElement = document.createElement('style');
        styleElement.textContent = `
            /* Basic styles for the overlay */
            :host {
                all: initial;
            }
            
            .debugger-container {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 360px;
                background-color: #fff;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                border-radius: 8px;
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                color: #333;
                max-height: 80vh;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                transition: all 0.3s ease;
            }
            
            .debugger-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                background-color: #f5f5f5;
                border-bottom: 1px solid #ddd;
                padding: 8px 12px;
                cursor: move;
                user-select: none;
            }
            
            .debugger-drag-handle {
                font-weight: bold;
                font-size: 14px;
            }
            
            .debugger-controls {
                display: flex;
                gap: 4px;
            }
            
            .debugger-minimize, .debugger-close {
                background: none;
                border: none;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .debugger-minimize:hover, .debugger-close:hover {
                background-color: rgba(0, 0, 0, 0.05);
            }
            
            .debugger-toolbar {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                padding: 8px;
                background-color: #f9f9f9;
                border-bottom: 1px solid #eee;
            }
            
            .debugger-content {
                flex: 1;
                overflow: auto;
                padding: 12px;
                background-color: white;
            }
            
            .debugger-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 6px 12px;
                background-color: #f5f5f5;
                border-top: 1px solid #ddd;
                font-size: 12px;
            }
        `;

        this.root.appendChild(styleElement);
    }

    /**
     * Initialize all the required managers
     */
    initManagers() {
        // Initialize storage manager first (used by other managers)
        this.storageManager = new StorageManager({
            namespace: this.NAMESPACE,
        });

        // Initialize theme manager
        this.theme = new ThemeManager({
            shadow: this.root,
            storage: this.storageManager,
            host: this.host,
        });

        // Initialize icon manager
        this.icons = new IconManager();

        // Initialize UI manager
        this.uiManager = new UIManager({
            shadow: this.root,
            overlay: this.host,
            iconManager: this.icons,
            themeManager: this.theme,
            storageManager: this.storageManager,
        });
        this.uiManager.init();

        // Set default theme from storage or default to 'latte'
        const savedTheme = this.storageManager.get('theme') || 'latte';
        this.theme.setTheme(savedTheme);

        // Initialize keyboard shortcuts manager
        this.keyboardShortcutsManager = new KeyboardShortcutsManager({
            overlay: this.host,
            uiManager: this.uiManager,
        });

        // Create container for overlay (now using Shadow DOM's existing container)
        this.container = this.uiManager.elements.container;
    }

    /**
     * Build the UI components and set up drag and resize handlers
     */
    buildUI() {
        // Initialize drag manager (after UI is created)
        const dragHandle = this.uiManager.elements.header.querySelector(
            '.debugger-drag-handle'
        );
        if (dragHandle) {
            this.drag = new DragManager({
                element: this.container,
                handle: dragHandle,
                shadow: this.root,
                storage: this.storageManager,
            });
        } else {
            console.warn('DevOverlay: No drag handle found');
        }

        // Initialize resize manager
        this.resize = new ResizeManager({
            element: this.container,
            shadow: this.root,
            minSize: { width: 300, height: 200 },
            storage: this.storageManager,
        });

        // Add event listeners
        this.bindEvents();

        // Restore position and size from storage
        this.restoreState();
    }

    /**
     * Load and register all tools
     */
    loadTools() {
        // Clear any existing tools
        this.tools = {};

        // Create instances of all tools
        this.tools.domExplorer = new DOMExplorer({
            storage: this.storageManager,
            ui: this.uiManager,
            theme: this.theme,
        });

        this.tools.colorPicker = new ColorPicker({
            storage: this.storageManager,
            ui: this.uiManager,
            theme: this.theme,
        });

        this.tools.fontInspector = new FontInspector({
            storage: this.storageManager,
            ui: this.uiManager,
            theme: this.theme,
        });

        this.tools.responsiveChecker = new ResponsiveChecker({
            storage: this.storageManager,
            ui: this.uiManager,
            theme: this.theme,
        });

        this.tools.storageInspector = new StorageInspector({
            storage: this.storageManager,
            ui: this.uiManager,
            theme: this.theme,
        });

        this.tools.networkMonitor = new NetworkMonitor({
            storage: this.storageManager,
            ui: this.uiManager,
            theme: this.theme,
        });

        this.tools.cssValidator = new CSSValidator({
            storage: this.storageManager,
            ui: this.uiManager,
            theme: this.theme,
        });

        this.tools.jsValidator = new JSValidator({
            storage: this.storageManager,
            ui: this.uiManager,
            theme: this.theme,
        });

        this.tools.spacingVisualizer = new SpacingVisualizer({
            storage: this.storageManager,
            ui: this.uiManager,
            theme: this.theme,
        });

        this.tools.performanceMonitor = new PerformanceMonitor({
            storage: this.storageManager,
            ui: this.uiManager,
            theme: this.theme,
        });

        this.tools.accessibilityChecker = new AccessibilityChecker({
            storage: this.storageManager,
            ui: this.uiManager,
            theme: this.theme,
        });

        this.tools.settingsPanel = new SettingsPanel({
            storage: this.storageManager,
            ui: this.uiManager,
            theme: this.theme,
            devOverlay: this,
        });

        // Register tools with UI manager
        Object.entries(this.tools).forEach(([name, tool]) => {
            try {
                if (!tool) {
                    console.error(`Tool ${name} is undefined`);
                    return;
                }

                // Skip tool if it's BaseTool itself (not an instance)
                if (tool.constructor && tool.constructor.name === 'BaseTool') {
                    console.warn(`Skipping direct BaseTool registration`);
                    return;
                }

                // Ensure each tool has an ID property
                if (!tool.id) {
                    // Convert camelCase or PascalCase to kebab-case
                    tool.id = name
                        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
                        .toLowerCase();
                    console.warn(`Setting ID for ${name} to ${tool.id}`);
                } else {
                    // Ensure existing IDs are kebab-case
                    const kebabId = tool.id
                        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
                        .toLowerCase();
                    if (kebabId !== tool.id) {
                        console.warn(
                            `Converting ID from ${tool.id} to ${kebabId}`
                        );
                        tool.id = kebabId;
                    }
                }

                // Ensure each tool has required methods
                if (typeof tool.getPanel !== 'function') {
                    console.warn(
                        `Tool ${name} missing getPanel method, adding fallback`
                    );
                    tool.getPanel = function () {
                        return this.panel;
                    };
                }

                // Register tool with UI manager
                this.uiManager.registerTool(tool);
            } catch (error) {
                console.error(`Error registering tool ${name}:`, error);
            }
        });
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Add window resize handler
        window.addEventListener('resize', this.handleWindowResize.bind(this));

        // Add event listeners for controls
        const minimizeButton =
            this.uiManager.elements.header.querySelector('.debugger-minimize');
        if (minimizeButton) {
            minimizeButton.addEventListener('click', () =>
                this.toggleMinimize()
            );
        }

        const closeButton =
            this.uiManager.elements.header.querySelector('.debugger-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => this.hide());
        }

        // Theme buttons are already handled by the UIManager
    }

    /**
     * Handle window resize
     */
    handleWindowResize() {
        Object.values(this.tools).forEach((tool) => {
            if (typeof tool.onWindowResize === 'function') {
                tool.onWindowResize();
            }
        });
    }

    /**
     * Activate a tool
     * @param {string} toolId - The ID of the tool to activate
     */
    activateTool(toolId) {
        // Get the tool from the tools object
        // First try direct lookup with the ID
        let tool = null;

        // Handle kebab-case vs camelCase by converting all to kebab-case
        const kebabId = toolId
            .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
            .toLowerCase();

        // Try to find the tool by iterating through all tools
        for (const [name, toolObj] of Object.entries(this.tools)) {
            const currentToolId =
                toolObj.id ||
                name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
            if (currentToolId === kebabId) {
                tool = toolObj;
                break;
            }
        }

        if (!tool || this.activeTools.includes(kebabId)) {
            console.warn(`Tool ${toolId} not found or already active`);
            return;
        }

        // Initialize the tool if needed
        if (typeof tool.init === 'function') {
            tool.init();
        }

        // Activate the tool
        if (typeof tool.activate === 'function') {
            tool.activate();
        }

        // Add the tool panel to the UI if it has one
        if (tool.panel && this.uiManager) {
            this.uiManager.showToolPanel(tool.id);
        }

        this.activeTools.push(kebabId);
        if (this.storageManager) {
            this.storageManager.set('activeTools', this.activeTools);
        }

        // Log activation
        console.log(`DevOverlay: Activated tool ${toolId}`);

        // Update toolbar button states
        this.updateToolbarButtons();
    }

    /**
     * Update toolbar button states to reflect active tools
     */
    updateToolbarButtons() {
        const buttons =
            this.uiManager.elements.toolbar.querySelectorAll('button');

        // Loop through buttons and update their active state
        buttons.forEach((button) => {
            const toolName = button.getAttribute('data-tool');
            if (toolName && this.activeTools.includes(toolName)) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    /**
     * Deactivate a tool
     * @param {string} toolId - The ID of the tool to deactivate
     */
    deactivateTool(toolId) {
        // Convert to kebab-case for consistency
        const kebabId = toolId
            .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
            .toLowerCase();

        // Find the tool
        let tool = null;
        for (const [name, toolObj] of Object.entries(this.tools)) {
            const currentToolId =
                toolObj.id ||
                name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
            if (currentToolId === kebabId) {
                tool = toolObj;
                break;
            }
        }

        if (!tool || !this.activeTools.includes(kebabId)) {
            console.warn(`Tool ${toolId} not found or not active`);
            return;
        }

        // Deactivate the tool
        if (typeof tool.deactivate === 'function') {
            tool.deactivate();
        }

        // Update active tools list
        this.activeTools = this.activeTools.filter((id) => id !== kebabId);
        if (this.storageManager) {
            this.storageManager.set('activeTools', this.activeTools);
        }

        // Log deactivation
        console.log(`DevOverlay: Deactivated tool ${toolId}`);

        // Update toolbar button states
        this.updateToolbarButtons();
    }

    /**
     * Toggle overlay visibility
     */
    toggleVisibility() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Show the overlay
     */
    show() {
        this.container.style.display = 'flex';
        this.isVisible = true;
        this.storageManager.set('isVisible', true);

        // Notify tools
        Object.values(this.tools).forEach((tool) => {
            if (typeof tool.onShow === 'function') {
                tool.onShow();
            }
        });
    }

    /**
     * Hide the overlay
     */
    hide() {
        this.container.style.display = 'none';
        this.isVisible = false;
        this.storageManager.set('isVisible', false);

        // Notify tools
        Object.values(this.tools).forEach((tool) => {
            if (typeof tool.onHide === 'function') {
                tool.onHide();
            }
        });
    }

    /**
     * Toggle minimized state
     */
    toggleMinimize() {
        this.isMinimized = !this.isMinimized;

        // Get the content element which should be toggled
        const container = this.uiManager.elements.container;
        if (container) {
            container.classList.toggle('minimized');

            // Update the minimize button icon
            const minimizeBtn = container.querySelector('.debugger-minimize');
            if (minimizeBtn) {
                minimizeBtn.innerHTML = this.isMinimized
                    ? this.icons.getIcon('maximize')
                    : this.icons.getIcon('minimize');
            }

            // Notify tools
            Object.values(this.tools).forEach((tool) => {
                if (this.isMinimized && typeof tool.onMinimize === 'function') {
                    tool.onMinimize();
                } else if (
                    !this.isMinimized &&
                    typeof tool.onMaximize === 'function'
                ) {
                    tool.onMaximize();
                }
            });
        }

        this.storageManager.set('isMinimized', this.isMinimized);
    }

    /**
     * Toggle collapsed state
     */
    toggleCollapse() {
        // Implementation for collapsing the overlay
        // This would be used to reduce the overlay to just the toolbar
    }

    /**
     * Restore state from storage
     */
    restoreState() {
        // Restore visibility
        const isVisible = this.storageManager.get('isVisible', true);
        if (!isVisible) {
            this.hide();
        }

        // Restore minimized state
        const isMinimized = this.storageManager.get('isMinimized', false);
        if (isMinimized) {
            this.toggleMinimize();
        }

        // Restore position
        const position = this.storageManager.get('position');
        if (position) {
            this.container.style.top = `${position.top}px`;
            this.container.style.right = `${position.right}px`;
        }

        // Restore size
        const size = this.storageManager.get('size');
        if (size) {
            this.container.style.width = `${size.width}px`;
            this.container.style.height = `${size.height}px`;
        }
    }

    /**
     * Get the currently active tool
     * @returns {Object|null} The active tool or null if none is active
     */
    getActiveTool() {
        for (const toolId in this.tools) {
            if (this.tools[toolId].isActive) {
                return this.tools[toolId];
            }
        }
        return null;
    }

    /**
     * Register keyboard shortcuts for the debugger
     */
    registerKeyboardShortcuts() {
        if (!this.keyboardShortcutsManager) {
            console.warn(
                'DevOverlay: Keyboard shortcuts manager not available'
            );
            return;
        }

        // Register global shortcuts for the debugger
        this.keyboardShortcutsManager.registerShortcut({
            key: 'Escape',
            callback: () => this.toggleVisibility(),
            description: 'Toggle debugger visibility',
        });

        // Register tool-specific shortcuts
        Object.entries(this.tools).forEach(([name, tool]) => {
            const toolId = tool.id || name;

            // Skip if the tool doesn't have a keyboard shortcut
            if (!tool.keyboardShortcut) return;

            this.keyboardShortcutsManager.registerShortcut({
                key: tool.keyboardShortcut,
                callback: () => this.activateTool(toolId),
                description: `Activate ${tool.name || name}`,
            });
        });

        console.log('DevOverlay: Keyboard shortcuts registered');
    }
}

// Export DevOverlay for manual initialization
window.DevOverlay = DevOverlay;

// Function to initialize manually
window.initWebDebugger = () => {
    // Reset the initialization flag if the debugger isn't visible
    const existingOverlay = document.getElementById('web-debugger-overlay');
    if (!existingOverlay && window._webDebuggerInitialized) {
        console.log(
            'DevOverlay: Resetting initialization flag after page refresh'
        );
        // Set a flag to indicate we're intentionally resetting
        window._webDebuggerResetting = true;
        window._webDebuggerInitialized = false;
    }

    // Always create a new instance after page refresh
    window.devOverlay = new DevOverlay();

    // Make sure we have valid tools reference
    if (
        !window.devOverlay.tools ||
        Object.keys(window.devOverlay.tools).length === 0
    ) {
        console.warn(
            'DevOverlay: Tools reference is empty, forcing tool initialization'
        );
        // Force tool initialization if needed
        if (typeof window.devOverlay.loadTools === 'function') {
            window.devOverlay.loadTools();
        }
    }

    return window.devOverlay;
};

// Only auto-initialize if autoInit parameter is set
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('autoInit') === 'true') {
    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
        window.initWebDebugger();
    });
}
