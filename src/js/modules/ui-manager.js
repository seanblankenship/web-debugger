/**
 * UI Manager
 * Handles UI creation and management for the overlay
 */
export class UIManager {
    /**
     * Create a new UI manager
     * @param {Object} config - Configuration object
     * @param {ShadowRoot} config.shadow - Shadow root
     * @param {HTMLElement} config.overlay - Overlay element
     * @param {Object} config.iconManager - Icon manager
     * @param {Object} config.themeManager - Theme manager
     * @param {Object} config.storageManager - Storage manager
     */
    constructor(config = {}) {
        this.overlay = config.overlay || null;
        this.shadow = config.shadow || null;
        this.iconManager = config.iconManager || null;
        this.themeManager = config.themeManager || null;
        this.storageManager = config.storageManager || null;

        this.elements = {
            container: null,
            header: null,
            toolbar: null,
            content: null,
            footer: null,
        };

        this.tools = [];
        this.activeToolId = null;
        this.events = {}; // Event registry for pub/sub pattern
    }

    /**
     * Initialize the UI manager
     */
    init() {
        if (!this.shadow) {
            console.error('UIManager: No shadow DOM provided');
            return false;
        }

        this.createUI();
        return true;
    }

    /**
     * Create the UI elements
     */
    createUI() {
        // Create container
        this.elements.container = document.createElement('div');
        this.elements.container.classList.add('debugger-container');

        // Add inline styles to position the container properly
        Object.assign(this.elements.container.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            width: '360px',
            maxHeight: '80vh',
            backgroundColor: 'white',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            borderRadius: '8px',
            zIndex: '9999999',
            fontFamily:
                'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
            color: '#333',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
        });

        // Create header
        this.elements.header = document.createElement('div');
        this.elements.header.classList.add('debugger-header');

        // Safe access to icons
        const getIconSafe = (name) => {
            if (
                this.iconManager &&
                typeof this.iconManager.getIcon === 'function'
            ) {
                return this.iconManager.getIcon(name);
            }
            return `<span class="icon-fallback">${name}</span>`;
        };

        this.elements.header.innerHTML = `
            <div class="debugger-drag-handle">Dev Debugger</div>
            <div class="debugger-controls">
                <button class="debugger-minimize">${getIconSafe(
                    'minimize'
                )}</button>
                <button class="debugger-close">${getIconSafe('close')}</button>
            </div>
        `;

        // Add minimize button click handler
        const minimizeBtn =
            this.elements.header.querySelector('.debugger-minimize');
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => this.toggleMinimize());
        }

        // Add close button click handler
        const closeBtn = this.elements.header.querySelector('.debugger-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (this.overlay) {
                    this.overlay.destroy();
                }
            });
        }

        // Create toolbar
        this.elements.toolbar = document.createElement('div');
        this.elements.toolbar.classList.add('debugger-toolbar');

        // Create content area
        this.elements.content = document.createElement('div');
        this.elements.content.classList.add('debugger-content');

        // Create footer
        this.elements.footer = document.createElement('div');
        this.elements.footer.classList.add('debugger-footer');
        this.elements.footer.innerHTML = `
            <div class="debugger-info">Dev Debugger v1.0</div>
            <div class="debugger-theme-selector">
                <button class="theme-button" data-theme="latte">${getIconSafe(
                    'theme'
                )}</button>
                <button class="theme-button" data-theme="frappe">${getIconSafe(
                    'theme'
                )}</button>
            </div>
        `;

        // Add theme button click handlers
        const themeButtons =
            this.elements.footer.querySelectorAll('.theme-button');
        themeButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                const theme = btn.getAttribute('data-theme');
                if (this.themeManager) {
                    this.themeManager.setTheme(theme);
                    this.updateThemeButtons(theme);
                }
            });
        });

        // Highlight current theme
        if (this.themeManager) {
            this.updateThemeButtons(this.themeManager.getTheme());
        }

        // Assemble UI
        this.elements.container.appendChild(this.elements.header);
        this.elements.container.appendChild(this.elements.toolbar);
        this.elements.container.appendChild(this.elements.content);
        this.elements.container.appendChild(this.elements.footer);

        // Add to shadow DOM
        this.shadow.appendChild(this.elements.container);
    }

    /**
     * Update theme buttons to highlight the active theme
     * @param {string} activeTheme - Active theme name
     */
    updateThemeButtons(activeTheme) {
        const themeButtons =
            this.elements.footer.querySelectorAll('.theme-button');
        themeButtons.forEach((btn) => {
            const theme = btn.getAttribute('data-theme');
            if (theme === activeTheme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    /**
     * Toggle the minimized state of the overlay
     */
    toggleMinimize() {
        this.elements.container.classList.toggle('minimized');

        const isMinimized =
            this.elements.container.classList.contains('minimized');
        const minimizeBtn =
            this.elements.header.querySelector('.debugger-minimize');

        if (minimizeBtn) {
            // Safe access to icons
            const getIconSafe = (name) => {
                if (
                    this.iconManager &&
                    typeof this.iconManager.getIcon === 'function'
                ) {
                    return this.iconManager.getIcon(name);
                }
                return `<span class="icon-fallback">${name}</span>`;
            };

            if (isMinimized) {
                minimizeBtn.innerHTML = getIconSafe('maximize');
            } else {
                minimizeBtn.innerHTML = getIconSafe('minimize');
            }
        }

        // Save state if storage manager is available
        if (this.storageManager) {
            this.storageManager.set('minimized', isMinimized);
        }
    }

    /**
     * Register a tool with the UI manager
     * @param {Object} tool - Tool instance
     */
    registerTool(tool) {
        try {
            // Verify tool is valid
            if (!tool) {
                console.error('UIManager: Cannot register undefined tool');
                return;
            }

            // Ensure tool has required properties
            if (!tool.id) {
                console.error('UIManager: Tool missing ID property');
                if (tool.name) {
                    // Generate ID from name as fallback
                    tool.id = tool.name.toLowerCase().replace(/\s+/g, '-');
                    console.warn(
                        `UIManager: Generated ID "${tool.id}" from name`
                    );
                } else {
                    console.error(
                        'UIManager: Tool has no name or ID, cannot register'
                    );
                    return;
                }
            }

            // Skip if tool already registered
            if (this.tools.find((t) => t.id === tool.id)) {
                console.warn(`UIManager: Tool ${tool.id} already registered`);
                return;
            }

            // Add tool to list
            this.tools.push(tool);

            // Configure tool to have access to needed dependencies
            tool.storage = this.storageManager;
            tool.overlay = this.overlay;
            tool.ui = this; // Provide reference to UI manager

            // Initialize the tool
            if (typeof tool.init === 'function') {
                tool.init();
            }

            // Create and add the tool button to the toolbar
            const toolButton = this.createToolbarButton(tool);

            if (toolButton) {
                // Add data-tool attribute for identification
                toolButton.setAttribute('data-tool', tool.id);
                this.elements.toolbar.appendChild(toolButton);
            }

            // Add the tool panel to the content area
            // Verify that getPanel is a function before calling it
            if (typeof tool.getPanel === 'function') {
                const toolPanel = tool.getPanel();
                if (toolPanel) {
                    toolPanel.style.display = 'none'; // Hide by default
                    this.elements.content.appendChild(toolPanel);
                } else {
                    console.warn(`Tool ${tool.name} has no panel to display`);
                }
            } else {
                console.error(
                    `Tool ${tool.name} does not have a getPanel method`
                );
                // Fall back to .panel property if getPanel method doesn't exist
                if (tool.panel) {
                    tool.panel.style.display = 'none';
                    this.elements.content.appendChild(tool.panel);
                } else {
                    console.warn(
                        `Tool ${tool.name} has no panel property either`
                    );
                }
            }
        } catch (error) {
            console.error(`Error registering tool:`, error);
        }
    }

    /**
     * Create a toolbar button for a tool
     * @param {Object} tool - The tool to create a button for
     * @returns {HTMLElement} The created button
     */
    createToolbarButton(tool) {
        if (!tool) return null;

        const button = document.createElement('button');
        button.classList.add('toolbar-button');
        button.title = tool.description || tool.name;

        // Safe access to icons
        if (
            this.iconManager &&
            typeof this.iconManager.getIcon === 'function' &&
            tool.icon
        ) {
            button.innerHTML = this.iconManager.getIcon(tool.icon);
        } else {
            button.textContent = tool.name.charAt(0);
        }

        button.addEventListener('click', () => {
            this.setActiveTool(tool.id);
        });

        return button;
    }

    /**
     * Get a registered tool by ID
     * @param {string} toolId - Tool ID
     * @returns {Object|null} Tool instance or null if not found
     */
    getTool(toolId) {
        if (!toolId) return null;

        // Try exact match first (preferred way)
        const exactMatch = this.tools.find((tool) => tool.id === toolId);
        if (exactMatch) return exactMatch;

        // Legacy fallback: try to find by converting name to ID format
        return (
            this.tools.find(
                (tool) =>
                    tool.name &&
                    tool.name.toLowerCase().replace(/\s+/g, '-') ===
                        toolId.toLowerCase()
            ) || null
        );
    }

    /**
     * Set the active tool
     * @param {string} toolId - Tool ID
     */
    setActiveTool(toolId) {
        try {
            // Disable current active tool
            if (this.activeToolId) {
                const currentTool = this.getTool(this.activeToolId);
                if (currentTool) {
                    // Check if deactivate method exists
                    if (typeof currentTool.deactivate === 'function') {
                        currentTool.deactivate();
                    }

                    // Hide the current tool panel
                    const currentPanel = currentTool.getPanel
                        ? currentTool.getPanel()
                        : currentTool.panel;
                    if (currentPanel) {
                        currentPanel.style.display = 'none';
                    }

                    // Remove active class from current tool button
                    const currentButton = this.elements.toolbar.querySelector(
                        `[data-tool="${this.activeToolId}"]`
                    );
                    if (currentButton) {
                        currentButton.classList.remove('active');
                    }
                }
            }

            // Enable new tool
            const newTool = this.getTool(toolId);
            if (newTool) {
                // Activate the tool
                if (typeof newTool.activate === 'function') {
                    newTool.activate();
                }

                // Show the new tool panel
                this.showToolPanel(toolId);

                // Add active class to new tool button
                const newButton = this.elements.toolbar.querySelector(
                    `[data-tool="${toolId}"]`
                );
                if (newButton) {
                    newButton.classList.add('active');
                }

                // Update active tool ID
                this.activeToolId = toolId;

                // Emit event
                this.emit('toolChange', toolId);
            }
        } catch (error) {
            console.error(`Error setting active tool ${toolId}:`, error);
        }
    }

    /**
     * Show a tool's panel
     * @param {string|HTMLElement} toolId - Tool ID or direct panel element
     */
    showToolPanel(toolId) {
        try {
            // If toolId is an HTMLElement, show it directly
            if (toolId instanceof HTMLElement) {
                // Hide all panels first
                const allPanels =
                    this.elements.content.querySelectorAll('.panel');
                allPanels.forEach((p) => {
                    p.style.display = 'none';
                });

                // Make sure the panel is in the DOM
                if (!this.elements.content.contains(toolId)) {
                    console.log(`UIManager: Adding panel to content area`);
                    this.elements.content.appendChild(toolId);
                }

                // Show the target panel
                toolId.style.display = 'block';
                return;
            }

            // Normal case: toolId is a string
            if (typeof toolId !== 'string') {
                console.warn(`Invalid tool ID type: ${typeof toolId}`);
                return;
            }

            const tool = this.getTool(toolId);
            if (!tool) {
                console.warn(`Tool ${toolId} not found`);
                return;
            }

            // Initialize the tool if needed
            if (typeof tool.init === 'function') {
                tool.init();
            }

            // Get the panel
            let panel = null;
            if (typeof tool.getPanel === 'function') {
                panel = tool.getPanel();
            } else if (tool.panel) {
                panel = tool.panel;
            }

            if (!panel) {
                console.warn(`Tool ${toolId} has no panel to display`);
                return;
            }

            // Hide all panels first
            const allPanels = this.elements.content.querySelectorAll('.panel');
            allPanels.forEach((p) => {
                p.style.display = 'none';
            });

            // Make sure the panel is in the DOM
            if (!this.elements.content.contains(panel)) {
                console.log(
                    `UIManager: Adding ${toolId} panel to content area`
                );
                this.elements.content.appendChild(panel);
            }

            // Show the target panel
            panel.style.display = 'block';
        } catch (error) {
            console.error(`Error showing tool panel ${toolId}:`, error);
        }
    }

    /**
     * Restore the UI state from storage
     */
    restoreState() {
        if (!this.storageManager) return;

        // Restore minimized state
        const isMinimized = this.storageManager.get('minimized');
        if (isMinimized) {
            this.toggleMinimize();
        }

        // Restore active tool
        const activeTool = this.storageManager.get('activeTool');
        if (activeTool) {
            this.setActiveTool(activeTool);
        }
    }

    /**
     * Clean up the UI manager
     */
    destroy() {
        // Clean up tools
        this.tools.forEach((tool) => {
            if (typeof tool.destroy === 'function') {
                tool.destroy();
            }
        });

        // Remove DOM elements
        if (this.elements.container && this.elements.container.parentNode) {
            this.elements.container.parentNode.removeChild(
                this.elements.container
            );
        }

        // Clear references
        this.elements = {
            container: null,
            header: null,
            toolbar: null,
            content: null,
            footer: null,
        };

        this.tools = [];
        this.activeToolId = null;
    }

    /**
     * Get the toolbar element
     * @returns {HTMLElement} The toolbar element
     */
    getToolbar() {
        return this.elements.toolbar;
    }

    /**
     * Add an event listener
     * @param {string} event - Event name
     * @param {Function} callback - Event callback
     */
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    /**
     * Remove an event listener
     * @param {string} event - Event name
     * @param {Function} callback - Event callback to remove (optional, removes all if not provided)
     */
    off(event, callback) {
        if (!this.events[event]) return;

        if (callback) {
            this.events[event] = this.events[event].filter(
                (cb) => cb !== callback
            );
        } else {
            delete this.events[event];
        }
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {...*} args - Event arguments
     */
    emit(event, ...args) {
        if (!this.events[event]) return;

        this.events[event].forEach((callback) => {
            try {
                callback(...args);
            } catch (error) {
                console.error(
                    `Error in UIManager event handler for ${event}:`,
                    error
                );
            }
        });
    }

    /**
     * Create a toggle switch element
     * @param {string} id - Element ID
     * @param {boolean} checked - Whether the switch is initially checked
     * @param {Function} onChange - Callback for change event
     * @param {string} label - Optional label text
     * @returns {HTMLElement} The toggle switch container
     */
    createToggleSwitch(id, checked = false, onChange = null, label = '') {
        try {
            const container = document.createElement('div');
            container.className = 'toggle-switch-container';

            if (label) {
                const labelEl = document.createElement('label');
                labelEl.htmlFor = id;
                labelEl.className = 'toggle-switch-label';
                labelEl.textContent = label;
                container.appendChild(labelEl);
            }

            const switchWrapper = document.createElement('div');
            switchWrapper.className = 'toggle-switch-wrapper';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.id = id;
            input.className = 'toggle-switch-input';
            input.checked = checked;

            const slider = document.createElement('span');
            slider.className = 'toggle-switch-slider';

            switchWrapper.appendChild(input);
            switchWrapper.appendChild(slider);
            container.appendChild(switchWrapper);

            if (typeof onChange === 'function') {
                input.addEventListener('change', (e) =>
                    onChange(e.target.checked)
                );
            }

            return container;
        } catch (error) {
            console.error('Error creating toggle switch:', error);
            return document.createElement('div');
        }
    }

    /**
     * Set content for a tool
     * @param {string} toolId - ID of the tool
     * @param {HTMLElement} content - Content to set
     */
    setContent(toolId, content) {
        try {
            if (!toolId || !content) {
                console.warn('UIManager: Invalid parameters for setContent');
                return;
            }

            const tool = this.getTool(toolId);
            if (!tool) {
                console.warn(`UIManager: Tool ${toolId} not found`);
                return;
            }

            // Get the tool panel
            let panel = null;
            if (typeof tool.getPanel === 'function') {
                panel = tool.getPanel();
            } else if (tool.panel) {
                panel = tool.panel;
            }

            if (!panel) {
                console.warn(
                    `UIManager: Tool ${toolId} has no panel to set content in`
                );
                return;
            }

            // Check for circular references - don't allow panel to contain itself
            if (
                panel === content ||
                panel.contains(content) ||
                content.contains(panel)
            ) {
                console.warn(
                    `UIManager: Cannot create circular DOM reference for ${toolId}`
                );
                return;
            }

            // Clear the panel's content
            panel.innerHTML = '';

            // Add the new content
            panel.appendChild(content);
        } catch (error) {
            console.error(`Error setting content for tool ${toolId}:`, error);
        }
    }

    /**
     * Show a notification message
     * @param {string} message - Message to show
     * @param {string} type - Message type (info, warning, error, success)
     * @param {number} duration - Duration in milliseconds
     */
    showNotification(message, type = 'info', duration = 3000) {
        try {
            // Find appropriate parent for notifications
            let notificationParent = null;

            // Try to find a valid parent element
            if (
                this.overlay &&
                typeof this.overlay.appendChild === 'function'
            ) {
                notificationParent = this.overlay;
            } else if (
                this.shadow &&
                typeof this.shadow.appendChild === 'function'
            ) {
                notificationParent = this.shadow;
            } else if (
                this.elements.container &&
                typeof this.elements.container.appendChild === 'function'
            ) {
                notificationParent = this.elements.container;
            } else {
                console.warn(
                    'UIManager: No valid parent for notifications found'
                );
                return;
            }

            // Create notification element if it doesn't exist
            if (!this.elements.notifications) {
                this.elements.notifications = document.createElement('div');
                this.elements.notifications.className =
                    'debugger-notifications';
                notificationParent.appendChild(this.elements.notifications);
            }

            // Create notification
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;

            // Add message
            notification.textContent = message;

            // Add to container
            this.elements.notifications.appendChild(notification);

            // Animate in
            setTimeout(() => {
                notification.classList.add('show');
            }, 10);

            // Remove after duration
            setTimeout(() => {
                notification.classList.remove('show');
                notification.addEventListener('transitionend', () => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                });
            }, duration);

            // Add notification styles if not already added
            if (!document.getElementById('notification-styles')) {
                const style = document.createElement('style');
                style.id = 'notification-styles';
                style.textContent = `
                    .debugger-notifications {
                        position: absolute;
                        top: 10px;
                        right: 10px;
                        z-index: 9999;
                        display: flex;
                        flex-direction: column;
                        gap: 5px;
                        max-width: 300px;
                    }
                    
                    .notification {
                        padding: 8px 12px;
                        border-radius: 4px;
                        color: white;
                        font-size: 13px;
                        opacity: 0;
                        transform: translateY(-10px);
                        transition: opacity 0.3s, transform 0.3s;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                    }
                    
                    .notification.show {
                        opacity: 1;
                        transform: translateY(0);
                    }
                    
                    .notification-info {
                        background-color: #2196F3;
                    }
                    
                    .notification-warning {
                        background-color: #FF9800;
                    }
                    
                    .notification-error {
                        background-color: #F44336;
                    }
                    
                    .notification-success {
                        background-color: #4CAF50;
                    }
                `;
                notificationParent.appendChild(style);
            }
        } catch (error) {
            console.error('UIManager: Error showing notification', error);
        }
    }
}
