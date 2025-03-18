/**
 * Storage Manager
 * Manages localStorage for the overlay settings
 */
export class StorageManager {
    /**
     * Create a new StorageManager instance
     * @param {string} namespace - Storage namespace to prevent collisions
     */
    constructor(namespace = 'web-debugger') {
        this.namespace = namespace;
    }

    /**
     * Get a value from storage
     * @param {string} key - Key to retrieve
     * @param {*} defaultValue - Default value if key doesn't exist
     * @returns {*} Stored value or default value
     */
    get(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(this.getNamespacedKey(key));
            if (value === null) return defaultValue;
            return JSON.parse(value);
        } catch (error) {
            console.error(`Error retrieving ${key} from storage`, error);
            return defaultValue;
        }
    }

    /**
     * Set a value in storage
     * @param {string} key - Key to store
     * @param {*} value - Value to store
     * @returns {boolean} Success status
     */
    set(key, value) {
        try {
            localStorage.setItem(
                this.getNamespacedKey(key),
                JSON.stringify(value)
            );
            return true;
        } catch (error) {
            console.error(`Error storing ${key} in storage`, error);
            return false;
        }
    }

    /**
     * Remove a value from storage
     * @param {string} key - Key to remove
     * @returns {boolean} Success status
     */
    remove(key) {
        try {
            localStorage.removeItem(this.getNamespacedKey(key));
            return true;
        } catch (error) {
            console.error(`Error removing ${key} from storage`, error);
            return false;
        }
    }

    /**
     * Clear all values in the namespace
     * @returns {boolean} Success status
     */
    clear() {
        try {
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key.startsWith(this.namespace)) {
                    localStorage.removeItem(key);
                }
            }
            return true;
        } catch (error) {
            console.error('Error clearing storage', error);
            return false;
        }
    }

    /**
     * Get all values in the namespace
     * @returns {Object} All stored values in this namespace
     */
    getAll() {
        const values = {};
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(this.namespace)) {
                    const shortKey = key.substring(this.namespace.length + 1);
                    values[shortKey] = JSON.parse(localStorage.getItem(key));
                }
            }
        } catch (error) {
            console.error('Error getting all values from storage', error);
        }
        return values;
    }

    /**
     * Get namespaced key
     * @param {string} key - Original key
     * @returns {string} Namespaced key
     * @private
     */
    getNamespacedKey(key) {
        return `${this.namespace}.${key}`;
    }
}
