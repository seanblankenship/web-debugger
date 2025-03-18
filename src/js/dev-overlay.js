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

// Import SCSS for webpack to process
import '../scss/main.scss';

// Import modules
import { ThemeManager } from './modules/theme-manager';
import { StorageManager } from './modules/storage-manager';
import { DragManager } from './modules/drag-manager';
import { ResizeManager } from './modules/resize-manager';
import { UIManager } from './modules/ui-manager';
import { IconManager } from './modules/icon-manager';

// Import tools
import { DOMExplorer } from './tools/dom-explorer';
import { ColorPicker } from './tools/color-picker';
import { FontInspector } from './tools/font-inspector';
import { GridVisualizer } from './tools/grid-visualizer';
import { ResponsiveChecker } from './tools/responsive-checker';
import { StorageInspector } from './tools/storage-inspector';
import { PerformanceMetrics } from './tools/performance-metrics';
import { AnimationTimeline } from './tools/animation-timeline';
import { ErrorTracker } from './tools/error-tracker';

// DevOverlay class - Main application
class DevOverlay {
    constructor() {
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
        this.storage = null;
        this.theme = null;
        this.drag = null;
        this.resize = null;
        this.ui = null;
        this.icons = null;

        // Initialize the overlay
        this.init();
    }

    /**
     * Initialize the dev overlay
     */
    init() {
        // Check if the overlay is already initialized
        if (document.querySelector(`#${this.NAMESPACE}`)) {
            console.warn('DevOverlay: An instance is already running');
            return;
        }

        // Create the host element and shadow DOM
        this.createHostElement();

        // Initialize managers
        this.initManagers();

        // Build UI
        this.buildUI();

        // Initialize tools
        this.initTools();

        // Add event listeners
        this.bindEvents();

        // Set default theme from storage or default to 'latte'
        const savedTheme = this.storage.get('theme') || 'latte';
        this.theme.setTheme(savedTheme);

        // Restore position and size from storage
        this.restoreState();

        console.log(`DevOverlay: Initialized (v${this.VERSION})`);
    }

    /**
     * Create the host element and shadow DOM
     */
    createHostElement() {
        // Create the host element
        const host = document.createElement('div');
        host.id = this.NAMESPACE;
        host.style.all = 'initial'; // Reset all CSS properties
        document.body.appendChild(host);

        // Create shadow DOM
        this.root = host.attachShadow({ mode: 'closed' });

        // Create container
        this.container = document.createElement('div');
        this.container.className = 'dev-overlay theme-transition';
        this.root.appendChild(this.container);
    }

    /**
     * Initialize module managers
     */
    initManagers() {
        // Storage manager handles localStorage
        this.storage = new StorageManager(this.NAMESPACE);

        // Theme manager handles theme switching
        this.theme = new ThemeManager(this.root, this.storage);

        // Icon manager for SVG icons
        this.icons = new IconManager();

        // UI manager for component creation
        this.ui = new UIManager(this.container, this.icons);

        // Drag manager for moving the overlay
        this.drag = new DragManager(this.container);

        // Resize manager for resizing the overlay
        this.resize = new ResizeManager(this.container, this.storage);
    }

    /**
     * Build the UI components
     */
    buildUI() {
        // Create the header
        const header = this.ui.createHeader('Web Debugger');
        this.container.appendChild(header);

        // Create main body
        const body = document.createElement('div');
        body.className = 'dev-overlay-body';
        this.container.appendChild(body);

        // Create toolbar
        const toolbar = this.ui.createToolbar();
        body.appendChild(toolbar);

        // Create content area
        const content = document.createElement('div');
        content.className = 'dev-overlay-content';
        body.appendChild(content);

        // Create resize handle
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'dev-overlay-resize';
        this.container.appendChild(resizeHandle);

        // Store references
        this.ui.elements = {
            header,
            body,
            toolbar,
            content,
            resizeHandle,
        };
    }

    /**
     * Initialize tool modules
     */
    initTools() {
        // Initialize tool instances
        this.tools = {
            domExplorer: new DOMExplorer(
                this.ui.elements.content,
                this.theme,
                this.storage
            ),
            colorPicker: new ColorPicker(
                this.ui.elements.content,
                this.theme,
                this.storage
            ),
            fontInspector: new FontInspector(
                this.ui.elements.content,
                this.theme,
                this.storage
            ),
            gridVisualizer: new GridVisualizer(
                this.ui.elements.content,
                this.theme,
                this.storage
            ),
            responsiveChecker: new ResponsiveChecker(
                this.ui.elements.content,
                this.theme,
                this.storage
            ),
            storageInspector: new StorageInspector(
                this.ui.elements.content,
                this.theme,
                this.storage
            ),
            performanceMetrics: new PerformanceMetrics(
                this.ui.elements.content,
                this.theme,
                this.storage
            ),
            animationTimeline: new AnimationTimeline(
                this.ui.elements.content,
                this.theme,
                this.storage
            ),
            errorTracker: new ErrorTracker(
                this.ui.elements.content,
                this.theme,
                this.storage
            ),
        };

        // Add tool buttons to toolbar
        for (const [toolName, tool] of Object.entries(this.tools)) {
            const button = this.ui.createToolButton(tool.name, tool.icon, () =>
                this.toggleTool(toolName)
            );
            this.ui.elements.toolbar.appendChild(button);
        }

        // Activate default tools from storage or use defaults
        const activeToolNames = this.storage.get('activeTools') || [
            'domExplorer',
            'colorPicker',
        ];
        activeToolNames.forEach((toolName) => {
            if (this.tools[toolName]) {
                this.activateTool(toolName);
            }
        });
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Theme toggle event
        this.ui.onThemeToggle = (theme) => {
            this.theme.setTheme(theme);
            this.storage.set('theme', theme);
        };

        // Close button event
        this.ui.onClose = () => {
            this.hide();
        };

        // Minimize button event
        this.ui.onMinimize = () => {
            this.toggleMinimize();
        };

        // Collapse button event
        this.ui.onCollapse = () => {
            this.toggleCollapse();
        };

        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Escape to close
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }

            // Ctrl+Shift+D to toggle visibility
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                this.toggleVisibility();
                e.preventDefault();
            }
        });

        // Window resize event
        window.addEventListener('resize', () => {
            // Update any responsive tools
            this.activeTools.forEach((toolName) => {
                if (this.tools[toolName].onWindowResize) {
                    this.tools[toolName].onWindowResize();
                }
            });
        });
    }

    /**
     * Activate a tool
     * @param {string} toolName - The name of the tool to activate
     */
    activateTool(toolName) {
        const tool = this.tools[toolName];
        if (!tool) return;

        // Don't activate if already active
        if (this.activeTools.includes(toolName)) return;

        // Initialize and render the tool
        tool.init();
        tool.render();

        // Add to active tools
        this.activeTools.push(toolName);

        // Save to storage
        this.storage.set('activeTools', this.activeTools);
    }

    /**
     * Deactivate a tool
     * @param {string} toolName - The name of the tool to deactivate
     */
    deactivateTool(toolName) {
        const tool = this.tools[toolName];
        if (!tool) return;

        // Don't deactivate if not active
        if (!this.activeTools.includes(toolName)) return;

        // Destroy tool
        tool.destroy();

        // Remove from active tools
        this.activeTools = this.activeTools.filter((name) => name !== toolName);

        // Save to storage
        this.storage.set('activeTools', this.activeTools);
    }

    /**
     * Toggle a tool on/off
     * @param {string} toolName - The name of the tool to toggle
     */
    toggleTool(toolName) {
        if (this.activeTools.includes(toolName)) {
            this.deactivateTool(toolName);
        } else {
            this.activateTool(toolName);
        }
    }

    /**
     * Toggle the visibility of the overlay
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
        this.container.classList.remove('dev-overlay-hidden');
        this.isVisible = true;

        // Re-activate tools that were active
        this.activeTools.forEach((toolName) => {
            if (this.tools[toolName].onShow) {
                this.tools[toolName].onShow();
            }
        });
    }

    /**
     * Hide the overlay
     */
    hide() {
        this.container.classList.add('dev-overlay-hidden');
        this.isVisible = false;

        // Pause active tools
        this.activeTools.forEach((toolName) => {
            if (this.tools[toolName].onHide) {
                this.tools[toolName].onHide();
            }
        });
    }

    /**
     * Toggle the minimized state
     */
    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        this.container.classList.toggle('minimized', this.isMinimized);
        this.storage.set('minimized', this.isMinimized);

        // Handle tools when minimized/maximized
        this.activeTools.forEach((toolName) => {
            const method = this.isMinimized ? 'onMinimize' : 'onMaximize';
            if (this.tools[toolName][method]) {
                this.tools[toolName][method]();
            }
        });
    }

    /**
     * Toggle the collapsed state
     */
    toggleCollapse() {
        this.isCollapsed = !this.isCollapsed;
        this.container.classList.toggle('collapsed', this.isCollapsed);
        this.storage.set('collapsed', this.isCollapsed);
    }

    /**
     * Restore the state from storage
     */
    restoreState() {
        // Restore minimized state
        this.isMinimized = this.storage.get('minimized') || false;
        if (this.isMinimized) {
            this.container.classList.add('minimized');
        }

        // Restore collapsed state
        this.isCollapsed = this.storage.get('collapsed') || false;
        if (this.isCollapsed) {
            this.container.classList.add('collapsed');
        }

        // Restore size (position is not restored, always starts at default)
        const size = this.storage.get('size');
        if (size) {
            this.container.style.width = size.width;
            this.container.style.height = size.height;
        }
    }
}

// Initialize the overlay when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create and expose the overlay instance
    window.devOverlay = new DevOverlay();
});

// Handle loading via bookmarklet or direct script inclusion
if (
    document.readyState === 'complete' ||
    document.readyState === 'interactive'
) {
    setTimeout(() => {
        if (!window.devOverlay) {
            window.devOverlay = new DevOverlay();
        }
    }, 1);
}

// Export DevOverlay class for module usage
export default DevOverlay;
