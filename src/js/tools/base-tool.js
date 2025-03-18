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
        this.events = {};
    }

    /**
     * Initialize the tool
     */
    init() {
        // Override in subclass
    }

    /**
     * Activate the tool
     */
    activate() {
        this.isActive = true;
        this.emit('activate', this);
    }

    /**
     * Deactivate the tool
     */
    deactivate() {
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
                console.error(`Error in event handler for ${event}:`, error);
            }
        });
    }

    /**
     * Get the tool's panel element
     * @returns {HTMLElement|null} The panel element or null
     */
    getPanel() {
        return this.panel;
    }

    /**
     * Clean up the tool before destruction
     */
    destroy() {
        // Clear all events
        this.events = {};

        // Remove panel if exists
        if (this.panel && this.panel.parentNode) {
            this.panel.parentNode.removeChild(this.panel);
        }

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
