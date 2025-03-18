/**
 * Base tool class that all debug tools extend
 */
export default class BaseTool {
    /**
     * Constructor
     * @param {Object} config - Configuration object
     * @param {Object} config.ui - UI Manager instance
     * @param {Object} config.storage - Storage Manager instance
     */
    constructor(config = {}) {
        this.ui = config.ui || null;
        this.storage = config.storage || null;

        this.name = 'Base Tool';
        this.id = '';
        this.icon = '';
        this.description = '';
        this.isActive = false;
        this.panel = null;
        this.panelContent = null;
        this.events = {};
    }

    /**
     * Initialize the tool
     */
    init() {
        // Create panel if it doesn't exist
        if (!this.panel) {
            this.createPanel();
        }
        return this;
    }

    /**
     * Create the panel container for the tool
     * This creates the outer panel structure
     */
    createPanel() {
        if (this.panel) return this.panel;

        // Create panel element with appropriate class names
        this.panel = document.createElement('div');
        this.panel.className = `${this.id}-panel panel`;

        // Create the inner panel content if the specific tool hasn't done it yet
        if (!this.panelContent) {
            this.setupPanel();
        }

        // Add the content to the panel
        if (this.panelContent && !this.panel.contains(this.panelContent)) {
            // Clear any existing content first
            this.panel.innerHTML = '';
            this.panel.appendChild(this.panelContent);
        }

        return this.panel;
    }

    /**
     * Set up the panel content
     * Subclasses should override this to create their specific UI
     */
    setupPanel() {
        if (this.panelContent) return this.panelContent;

        // Create default panel content
        this.panelContent = document.createElement('div');
        this.panelContent.className = `${this.id}-content panel-content`;

        // Add default content (tool name and description)
        const heading = document.createElement('h3');
        heading.textContent = this.name;

        const description = document.createElement('p');
        description.textContent =
            this.description || 'No description available.';

        this.panelContent.appendChild(heading);
        this.panelContent.appendChild(description);

        return this.panelContent;
    }

    /**
     * Activate the tool
     */
    activate() {
        if (this.isActive) return;

        this.isActive = true;

        // Make sure the panel is properly initialized
        this.init();

        // Show the panel if UI manager is available
        if (this.ui && typeof this.ui.showToolPanel === 'function') {
            this.ui.showToolPanel(this.id);
        }

        this.emit('activate', this);
    }

    /**
     * Deactivate the tool
     */
    deactivate() {
        if (!this.isActive) return;

        this.isActive = false;
        this.emit('deactivate', this);
    }

    /**
     * Toggle the tool's active state
     */
    toggle() {
        if (this.isActive) {
            this.deactivate();
        } else {
            this.activate();
        }
    }

    /**
     * Get a setting from storage
     * @param {string} key - Setting key
     * @param {*} defaultValue - Default value if setting doesn't exist
     * @returns {*} Setting value or default
     */
    getSetting(key, defaultValue) {
        if (!this.storage) return defaultValue;

        const fullKey = `${this.id}.${key}`;
        return this.storage.get(fullKey, defaultValue);
    }

    /**
     * Set a setting in storage
     * @param {string} key - Setting key
     * @param {*} value - Setting value
     */
    setSetting(key, value) {
        if (!this.storage) return;

        const fullKey = `${this.id}.${key}`;
        this.storage.set(fullKey, value);
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
     * @param {Function} callback - Event callback
     */
    off(event, callback) {
        if (!this.events[event]) return;

        this.events[event] = this.events[event].filter((cb) => cb !== callback);
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
                console.error(`Error in event handler for ${event}:`, error);
            }
        });
    }

    /**
     * Get the tool's panel element
     * @returns {HTMLElement|null} The panel element or null
     */
    getPanel() {
        // Create the panel if it doesn't exist yet
        if (!this.panel) {
            this.createPanel();
        }
        return this.panel;
    }

    /**
     * Clean up the tool before destruction
     */
    destroy() {
        // Deactivate if active
        if (this.isActive) {
            this.deactivate();
        }

        // Clear all events
        this.events = {};

        // Remove panel if exists
        if (this.panel && this.panel.parentNode) {
            this.panel.parentNode.removeChild(this.panel);
        }

        // Clear references
        this.panel = null;
        this.panelContent = null;

        return true;
    }

    /**
     * Check if an element is inside the overlay
     * @param {HTMLElement} element - Element to check
     * @returns {boolean} True if element is inside the overlay
     */
    isInsideOverlay(element) {
        if (!element) return false;

        // Check if element is in shadow DOM
        if (this.overlay && this.overlay.shadowRoot) {
            return this.overlay.shadowRoot.contains(element);
        }

        // Fallback check for pre-shadow DOM implementation
        const overlayElement = document.querySelector('.dev-overlay');
        if (overlayElement) {
            return overlayElement.contains(element);
        }

        return false;
    }
}
