/**
 * Storage Manager
 * Handles localStorage operations with proper namespacing.
 */
export class StorageManager {
    /**
     * Create a new StorageManager
     * @param {string} namespace - The namespace to use for storage keys
     */
    constructor(namespace) {
        this.namespace = namespace;
    }

    /**
     * Get the full storage key with namespace
     * @param {string} key - The key to namespace
     * @returns {string} The namespaced key
     * @private
     */
    _getNamespacedKey(key) {
        return `${this.namespace}.${key}`;
    }

    /**
     * Set a value in localStorage
     * @param {string} key - The key to store under
     * @param {any} value - The value to store (will be JSON stringified)
     * @returns {boolean} True if successful, false otherwise
     */
    set(key, value) {
        try {
            const namespacedKey = this._getNamespacedKey(key);
            const stringValue = JSON.stringify(value);
            localStorage.setItem(namespacedKey, stringValue);
            return true;
        } catch (error) {
            console.error(`StorageManager: Error setting ${key}`, error);
            return false;
        }
    }

    /**
     * Get a value from localStorage
     * @param {string} key - The key to retrieve
     * @param {any} defaultValue - The default value to return if key doesn't exist
     * @returns {any} The retrieved value or defaultValue if not found
     */
    get(key, defaultValue = null) {
        try {
            const namespacedKey = this._getNamespacedKey(key);
            const value = localStorage.getItem(namespacedKey);

            if (value === null) {
                return defaultValue;
            }

            return JSON.parse(value);
        } catch (error) {
            console.error(`StorageManager: Error getting ${key}`, error);
            return defaultValue;
        }
    }

    /**
     * Remove a value from localStorage
     * @param {string} key - The key to remove
     * @returns {boolean} True if successful, false otherwise
     */
    remove(key) {
        try {
            const namespacedKey = this._getNamespacedKey(key);
            localStorage.removeItem(namespacedKey);
            return true;
        } catch (error) {
            console.error(`StorageManager: Error removing ${key}`, error);
            return false;
        }
    }

    /**
     * Clear all values for this namespace
     * @returns {boolean} True if successful, false otherwise
     */
    clear() {
        try {
            // Find all items with this namespace
            const keysToRemove = [];

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(`${this.namespace}.`)) {
                    keysToRemove.push(key);
                }
            }

            // Remove all found keys
            keysToRemove.forEach((key) => localStorage.removeItem(key));

            return true;
        } catch (error) {
            console.error(
                `StorageManager: Error clearing namespace ${this.namespace}`,
                error
            );
            return false;
        }
    }

    /**
     * Get all keys for this namespace
     * @returns {string[]} Array of keys without the namespace prefix
     */
    getAllKeys() {
        const keys = [];
        const prefix = `${this.namespace}.`;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(prefix)) {
                keys.push(key.substring(prefix.length));
            }
        }

        return keys;
    }

    /**
     * Get all items for this namespace
     * @returns {Object} An object with all key-value pairs
     */
    getAllItems() {
        const items = {};
        const keys = this.getAllKeys();

        keys.forEach((key) => {
            items[key] = this.get(key);
        });

        return items;
    }

    /**
     * Check if a key exists
     * @param {string} key - The key to check
     * @returns {boolean} True if the key exists, false otherwise
     */
    has(key) {
        const namespacedKey = this._getNamespacedKey(key);
        return localStorage.getItem(namespacedKey) !== null;
    }
}
