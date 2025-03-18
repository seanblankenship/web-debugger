/**
 * Keyboard Shortcuts Manager
 * Manages keyboard shortcuts for the debugger
 */
export class KeyboardShortcutsManager {
    /**
     * Constructor
     * @param {Object} options - Options for the keyboard shortcuts manager
     * @param {Object} options.overlay - The DevOverlay instance
     * @param {Object} options.storage - Storage manager
     */
    constructor(options = {}) {
        this.overlay = options.overlay || null;
        this.storage = options.storage || null;

        this.shortcuts = [];
        this.isEnabled = true;
        this.toolShortcutMap = {};

        // Initialize shortcuts if overlay is available
        if (this.overlay) {
            this.init();
        }
    }

    /**
     * Initialize the keyboard shortcuts manager
     */
    init() {
        // Load enabled state from storage
        if (this.storage) {
            this.isEnabled = this.storage.get(
                'keyboardShortcuts.enabled',
                true
            );
        }

        // Define default shortcuts
        this.defineDefaultShortcuts();

        // Bind event listener
        this.handleKeyDown = this.handleKeyDown.bind(this);
        document.addEventListener('keydown', this.handleKeyDown);
    }

    /**
     * Define default keyboard shortcuts
     */
    defineDefaultShortcuts() {
        this.registerShortcut({
            id: 'toggle-overlay',
            key: 'd',
            alt: true,
            description: 'Toggle debugger visibility',
            action: () => {
                if (this.overlay.toggleVisibility) {
                    this.overlay.toggleVisibility();
                }
            },
        });

        this.registerShortcut({
            id: 'toggle-minimize',
            key: 'm',
            alt: true,
            description: 'Minimize/restore debugger',
            action: () => {
                if (this.overlay.toggleMinimize) {
                    this.overlay.toggleMinimize();
                }
            },
        });

        this.registerShortcut({
            id: 'close-panel',
            key: 'Escape',
            description: 'Close active panel',
            action: () => {
                if (this.overlay.deactivateTool && this.overlay.getActiveTool) {
                    const activeTool = this.overlay.getActiveTool();
                    if (activeTool) {
                        this.overlay.deactivateTool(activeTool.id);
                    }
                }
            },
        });

        // Define tool shortcuts (Alt + 1-9) if overlay has tools
        if (this.overlay.tools) {
            const toolsArray = Object.values(this.overlay.tools);

            // Set up number keys 1-9 for the first 9 tools
            const toolsForNumberKeys = toolsArray.slice(0, 9);
            toolsForNumberKeys.forEach((tool, index) => {
                const keyNum = index + 1;
                this.registerToolShortcut(tool.id, keyNum.toString(), true);
            });

            // Add special shortcuts for specific tools
            if (this.overlay.tools.settingsPanel) {
                this.registerToolShortcut('settingsPanel', 's', true);
            }

            if (this.overlay.tools.accessibilityChecker) {
                this.registerToolShortcut('accessibilityChecker', 'a', true);
            }

            if (this.overlay.tools.performanceMonitor) {
                this.registerToolShortcut('performanceMonitor', 'p', true);
            }
        }
    }

    /**
     * Register a keyboard shortcut
     * @param {Object} shortcut - Shortcut configuration
     * @param {string} shortcut.id - Unique identifier for the shortcut
     * @param {string} shortcut.key - Key for the shortcut (e.g., 'a', '1', 'F5')
     * @param {boolean} [shortcut.ctrl] - Whether Ctrl key is required
     * @param {boolean} [shortcut.alt] - Whether Alt key is required
     * @param {boolean} [shortcut.shift] - Whether Shift key is required
     * @param {string} shortcut.description - Description of what the shortcut does
     * @param {Function} shortcut.action - Function to call when shortcut is triggered
     * @returns {Object} The registered shortcut
     */
    registerShortcut(shortcut) {
        // Check if this shortcut ID already exists
        const existingIndex = this.shortcuts.findIndex(
            (s) => s.id === shortcut.id
        );
        if (existingIndex !== -1) {
            // Replace existing shortcut
            this.shortcuts[existingIndex] = shortcut;
            return shortcut;
        }

        // Add new shortcut
        this.shortcuts.push(shortcut);
        return shortcut;
    }

    /**
     * Register a tool-specific shortcut
     * @param {string} toolId - ID of the tool
     * @param {string} key - Key for the shortcut
     * @param {boolean} [alt=false] - Whether Alt key is required
     * @param {boolean} [ctrl=false] - Whether Ctrl key is required
     * @param {boolean} [shift=false] - Whether Shift key is required
     */
    registerToolShortcut(
        toolId,
        key,
        alt = false,
        ctrl = false,
        shift = false
    ) {
        if (!this.overlay.tools || !this.overlay.tools[toolId]) {
            console.warn(
                `Cannot register shortcut for tool "${toolId}" as it does not exist.`
            );
            return;
        }

        const tool = this.overlay.tools[toolId];
        const shortcutId = `tool-${toolId}`;

        this.registerShortcut({
            id: shortcutId,
            key,
            alt,
            ctrl,
            shift,
            description: `Toggle ${tool.name}`,
            action: () => {
                if (this.overlay.toggleTool) {
                    this.overlay.toggleTool(toolId);
                }
            },
        });

        // Map toolId to shortcutId for easier lookup
        this.toolShortcutMap[toolId] = shortcutId;
    }

    /**
     * Handle keydown events
     * @param {KeyboardEvent} event - The keydown event
     */
    handleKeyDown(event) {
        // Skip if shortcuts are disabled
        if (!this.isEnabled) return;

        // Skip if target is an input, textarea, or select
        if (
            event.target.tagName === 'INPUT' ||
            event.target.tagName === 'TEXTAREA' ||
            event.target.tagName === 'SELECT' ||
            event.target.isContentEditable
        ) {
            return;
        }

        const key = event.key;
        const ctrl = event.ctrlKey || event.metaKey;
        const alt = event.altKey;
        const shift = event.shiftKey;

        // Find matching shortcut
        const matchingShortcut = this.shortcuts.find((shortcut) => {
            return (
                shortcut.key === key &&
                (shortcut.ctrl === undefined || shortcut.ctrl === ctrl) &&
                (shortcut.alt === undefined || shortcut.alt === alt) &&
                (shortcut.shift === undefined || shortcut.shift === shift)
            );
        });

        if (matchingShortcut) {
            // Prevent default browser behavior
            event.preventDefault();

            // Execute the shortcut action
            matchingShortcut.action();
        }
    }

    /**
     * Enable keyboard shortcuts
     */
    enable() {
        this.isEnabled = true;
        if (this.storage) {
            this.storage.set('keyboardShortcuts.enabled', true);
        }
    }

    /**
     * Disable keyboard shortcuts
     */
    disable() {
        this.isEnabled = false;
        if (this.storage) {
            this.storage.set('keyboardShortcuts.enabled', false);
        }
    }

    /**
     * Get all registered shortcuts
     * @returns {Array} Array of shortcuts
     */
    getShortcuts() {
        return [...this.shortcuts];
    }

    /**
     * Get a shortcut for a specific tool
     * @param {string} toolId - Tool ID
     * @returns {Object|null} Shortcut object or null if not found
     */
    getToolShortcut(toolId) {
        const shortcutId = this.toolShortcutMap[toolId];
        if (!shortcutId) return null;

        return this.shortcuts.find((s) => s.id === shortcutId) || null;
    }

    /**
     * Format a shortcut for display
     * @param {Object} shortcut - Shortcut object
     * @returns {string} Human-readable shortcut string
     */
    formatShortcut(shortcut) {
        const parts = [];

        if (shortcut.ctrl) parts.push('Ctrl');
        if (shortcut.alt) parts.push('Alt');
        if (shortcut.shift) parts.push('Shift');

        // Format key name nicely
        let keyName = shortcut.key;
        if (keyName === ' ') keyName = 'Space';
        else if (keyName.length === 1) keyName = keyName.toUpperCase();

        parts.push(keyName);

        return parts.join(' + ');
    }

    /**
     * Clean up resources
     */
    destroy() {
        document.removeEventListener('keydown', this.handleKeyDown);
    }
}
