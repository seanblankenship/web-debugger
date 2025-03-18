/**
 * Theme Manager
 * Handles theme switching and initialization for the overlay.
 */
export class ThemeManager {
    /**
     * Create a new ThemeManager
     * @param {ShadowRoot} root - The shadow root of the overlay
     * @param {Object} storage - Storage manager instance
     */
    constructor(root, storage) {
        // Available themes
        this.themes = ['latte', 'frappe', 'macchiato', 'mocha'];
        this.currentTheme = null;
        this.root = root;
        this.storage = storage;

        // Reference to the container element
        this.container = root.querySelector('.dev-overlay');

        // Create stylesheet for overriding page styles (for website toggler)
        this.createPageStyleOverride();
    }

    /**
     * Set the theme of the overlay
     * @param {string} themeName - The name of the theme to set
     * @returns {boolean} True if successful, false otherwise
     */
    setTheme(themeName) {
        // Validate theme name
        if (!this.themes.includes(themeName)) {
            console.error(`ThemeManager: Invalid theme "${themeName}"`);
            return false;
        }

        // Skip if already set to this theme
        if (this.currentTheme === themeName) {
            return true;
        }

        // Remove current theme class
        if (this.currentTheme) {
            this.container.classList.remove(`theme-${this.currentTheme}`);
        }

        // Add new theme class
        this.container.classList.add(`theme-${themeName}`);
        this.currentTheme = themeName;

        // Store theme preference
        this.storage.set('theme', themeName);

        return true;
    }

    /**
     * Get the current theme name
     * @returns {string} The current theme name
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Toggle between themes
     * @returns {string} The new theme name
     */
    toggleTheme() {
        const currentIndex = this.themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.themes.length;
        const nextTheme = this.themes[nextIndex];

        this.setTheme(nextTheme);
        return nextTheme;
    }

    /**
     * Create a stylesheet for overriding page styles
     * This is used for the website theme toggler which affects the host page
     * @private
     */
    createPageStyleOverride() {
        // Create stylesheet for page overrides
        this.pageStylesheet = document.createElement('style');
        this.pageStylesheet.id = 'web-debugger-page-style';
        document.head.appendChild(this.pageStylesheet);
    }

    /**
     * Toggle the website's color scheme between light and dark
     * Note: This affects the host website, not the overlay
     * @param {string} mode - 'light', 'dark', or 'toggle'
     * @returns {string} The current mode after toggling
     */
    toggleWebsiteColorScheme(mode = 'toggle') {
        // Get current mode or default to what the browser prefers
        const currentMode =
            this.storage.get('websiteColorScheme') ||
            (window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light');

        // Determine the new mode
        let newMode;
        if (mode === 'toggle') {
            newMode = currentMode === 'dark' ? 'light' : 'dark';
        } else {
            newMode = mode === 'dark' ? 'dark' : 'light';
        }

        // Apply stylesheet overrides
        if (newMode === 'dark') {
            this.pageStylesheet.textContent = `
        :root {
          color-scheme: dark !important;
        }
        
        html {
          filter: invert(90%) hue-rotate(180deg) !important;
        }
        
        img, video, canvas, [style*="background-image"] {
          filter: invert(100%) hue-rotate(180deg) !important;
        }
      `;
        } else {
            this.pageStylesheet.textContent = '';
        }

        // Save preference
        this.storage.set('websiteColorScheme', newMode);

        return newMode;
    }

    /**
     * Get all available themes
     * @returns {string[]} Array of theme names
     */
    getAvailableThemes() {
        return [...this.themes];
    }
}
