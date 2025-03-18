/**
 * Theme Manager
 * Manages Catppuccin themes for the overlay
 */
export class ThemeManager {
    /**
     * Create a new ThemeManager
     * @param {Object} config - Configuration options
     * @param {string} config.defaultTheme - Default theme name
     * @param {Object} config.storage - StorageManager instance
     */
    constructor(config = {}) {
        this.themes = {
            latte: {
                name: 'Latte',
                colors: {
                    bg: {
                        base: '#eff1f5',
                        subtle: '#e6e9ef',
                        muted: '#dce0e8',
                    },
                    fg: {
                        base: '#4c4f69',
                        muted: '#5c5f77',
                        subtle: '#6c6f85',
                    },
                    accent: '#1e66f5',
                    accentSubtle: '#8839ef',
                    success: '#40a02b',
                    error: '#d20f39',
                    warning: '#df8e1d',
                    border: '#ccd0da',
                    borderHover: '#bcc0cc',
                },
            },
            frappe: {
                name: 'Frappé',
                colors: {
                    bg: {
                        base: '#303446',
                        subtle: '#292c3c',
                        muted: '#232634',
                    },
                    fg: {
                        base: '#c6d0f5',
                        muted: '#b5bfe2',
                        subtle: '#a5adce',
                    },
                    accent: '#8caaee',
                    accentSubtle: '#ca9ee6',
                    success: '#a6d189',
                    error: '#e78284',
                    warning: '#e5c890',
                    border: '#414559',
                    borderHover: '#51576d',
                },
            },
            macchiato: {
                name: 'Macchiato',
                colors: {
                    bg: {
                        base: '#24273a',
                        subtle: '#1e2030',
                        muted: '#181926',
                    },
                    fg: {
                        base: '#cad3f5',
                        muted: '#b8c0e0',
                        subtle: '#a5adcb',
                    },
                    accent: '#8aadf4',
                    accentSubtle: '#c6a0f6',
                    success: '#a6da95',
                    error: '#ed8796',
                    warning: '#eed49f',
                    border: '#363a4f',
                    borderHover: '#494d64',
                },
            },
            mocha: {
                name: 'Mocha',
                colors: {
                    bg: {
                        base: '#1e1e2e',
                        subtle: '#181825',
                        muted: '#11111b',
                    },
                    fg: {
                        base: '#cdd6f4',
                        muted: '#bac2de',
                        subtle: '#a6adc8',
                    },
                    accent: '#89b4fa',
                    accentSubtle: '#cba6f7',
                    success: '#a6e3a1',
                    error: '#f38ba8',
                    warning: '#f9e2af',
                    border: '#313244',
                    borderHover: '#45475a',
                },
            },
        };

        this.defaultTheme = config.defaultTheme || 'latte';
        this.currentTheme = this.defaultTheme;
        this.storage = config.storage || null;

        this.init();
    }

    /**
     * Initialize the theme manager
     */
    init() {
        // Load saved theme if storage is available
        if (this.storage) {
            const savedTheme = this.storage.get('theme');
            if (savedTheme && this.themes[savedTheme]) {
                this.currentTheme = savedTheme;
            }
        }
    }

    /**
     * Get available theme names
     * @returns {string[]} Array of theme names
     */
    getThemeNames() {
        return Object.keys(this.themes);
    }

    /**
     * Get theme information by name
     * @param {string} themeName - Theme name
     * @returns {Object|null} Theme information or null if not found
     */
    getTheme(themeName) {
        return this.themes[themeName] || null;
    }

    /**
     * Get current theme
     * @returns {Object} Current theme information
     */
    getCurrentTheme() {
        return {
            name: this.currentTheme,
            ...this.themes[this.currentTheme],
        };
    }

    /**
     * Set current theme
     * @param {string} themeName - Theme name to set
     * @returns {boolean} Success status
     */
    setTheme(themeName) {
        if (!this.themes[themeName]) {
            console.error(`Theme ${themeName} not found`);
            return false;
        }

        this.currentTheme = themeName;

        // Save theme if storage is available
        if (this.storage) {
            this.storage.set('theme', themeName);
        }

        return true;
    }

    /**
     * Cycle to the next theme
     * @returns {string} New theme name
     */
    cycleTheme() {
        const themeNames = this.getThemeNames();
        const currentIndex = themeNames.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themeNames.length;
        const nextTheme = themeNames[nextIndex];

        this.setTheme(nextTheme);
        return nextTheme;
    }

    /**
     * Apply theme to a host element
     * @param {HTMLElement|ShadowRoot} host - Host element to apply theme to
     */
    applyTheme(host) {
        if (!host) return;

        const theme = this.getCurrentTheme();

        if (host instanceof HTMLElement) {
            host.setAttribute('data-theme', this.currentTheme);
        }

        // Generate CSS variables from theme
        const colors = theme.colors;

        // Apply colors as CSS variables
        host.style.setProperty('--color-bg-base', colors.bg.base);
        host.style.setProperty('--color-bg-subtle', colors.bg.subtle);
        host.style.setProperty('--color-bg-muted', colors.bg.muted);

        host.style.setProperty('--color-fg-base', colors.fg.base);
        host.style.setProperty('--color-fg-muted', colors.fg.muted);
        host.style.setProperty('--color-fg-subtle', colors.fg.subtle);

        host.style.setProperty('--color-accent', colors.accent);
        host.style.setProperty('--color-accent-subtle', colors.accentSubtle);
        host.style.setProperty('--color-success', colors.success);
        host.style.setProperty('--color-error', colors.error);
        host.style.setProperty('--color-warning', colors.warning);
        host.style.setProperty('--color-border', colors.border);
        host.style.setProperty('--color-border-hover', colors.borderHover);
    }
}
