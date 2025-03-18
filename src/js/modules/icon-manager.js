/**
 * Icon Manager
 * Manages icons for the web debugger overlay
 */
export class IconManager {
    /**
     * Create a new IconManager
     */
    constructor() {
        // Define SVG icons
        this.icons = {
            // UI Icons
            close: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
            minimize: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
            theme: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
            expand: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`,
            collapse: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`,

            // Tool Icons
            spacing: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>`,
            network: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h16"></path><path d="M4 15h16"></path><path d="M10 3L8 21"></path><path d="M14 3l2 18"></path></svg>`,
            storage: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20h20"></path><path d="M5 20V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v13"></path><path d="M12 12h5"></path><path d="M12 16h5"></path><path d="M7 12h1"></path><path d="M7 16h1"></path></svg>`,
            js: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 17V10c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v7"></path><path d="M2 17l10 4 10-4"></path><path d="M12 8v13"></path></svg>`,
            css: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"></path><path d="m9 8l3 3-3 3"></path></svg>`,
            responsive: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M6 8h.01"></path><path d="M2 12h20"></path></svg>`,
            performance: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M5 5l2.5 2.5M19 5l-2.5 2.5M5 19l2.5-2.5M19 19l-2.5-2.5M2 12h4M18 12h4M12 18v4"></path><circle cx="12" cy="12" r="4"></circle></svg>`,
            animation: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"></rect><rect x="2" y="14" width="20" height="8" rx="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>`,
            grid: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
            error: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 12l10 10 10-10L12 2z"></path><path d="M12 10v4"></path><path d="M12 18v.01"></path></svg>`,
            dom: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,

            // Add missing icons with actual mappings for tools
            color: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="10.5" r="2.5"></circle><circle cx="8.5" cy="7.5" r="2.5"></circle><circle cx="6.5" cy="12.5" r="2.5"></circle><path d="M12 19.5A7.5 7.5 0 0 1 4.5 12a7.5 7.5 0 0 1 15 0 7.5 7.5 0 0 1-7.5 7.5z"></path></svg>`,
            font: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>`,
            speedometer: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19.778 4.222A10 10 0 1 0 4.222 19.778 10 10 0 0 0 19.778 4.222z"></path><path d="m12 12 2.5-2.5"></path><path d="M12 7V5"></path><path d="M16.95 7.05 18.1 5.9"></path><path d="M17 12h2"></path><path d="M16.95 16.95 18.1 18.1"></path><path d="M12 17v2"></path><path d="M7.05 16.95 5.9 18.1"></path><path d="M7 12H5"></path><path d="M7.05 7.05 5.9 5.9"></path></svg>`,
            accessibility: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="4" r="1"></circle><path d="m18 2-3 3-3-3"></path><path d="M12 8v5"></path><path d="M16.12 12a3 3 0 1 1-4.24 0"></path><path d="m2 16 10 4 10-4"></path><path d="m2 12 10 4 10-4"></path></svg>`,
            settings: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
        };

        // Icon name mappings for tool IDs
        this.iconMappings = {
            // Direct mappings for IDs
            'dom-explorer': 'dom',
            'color-picker': 'color',
            colorpicker: 'color', // Added lowercase version
            'font-inspector': 'font',
            'responsive-checker': 'responsive',
            'storage-inspector': 'storage',
            'network-monitor': 'network',
            networkmonitor: 'network', // Added lowercase version
            'js-validator': 'js',
            jsvalidator: 'js', // Added lowercase version
            'css-validator': 'css',
            'spacing-visualizer': 'spacing',
            spacingvisualizer: 'spacing', // Added lowercase version
            'performance-monitor': 'speedometer',
            'accessibility-checker': 'accessibility',
            'settings-panel': 'settings',
            settings: 'settings',

            // Legacy support for class names as IDs
            domexplorer: 'dom',
            fontInspector: 'font',
            colorPicker: 'color',
            responsiveChecker: 'responsive',
            storageInspector: 'storage',
            networkMonitor: 'network',
            jsValidator: 'js',
            cssValidator: 'css',
            spacingVisualizer: 'spacing',
            performanceMonitor: 'speedometer',
            accessibilityChecker: 'accessibility',
            settingsPanel: 'settings',
        };
    }

    /**
     * Create SVG DOM element from icon name
     * @param {string} name - Icon name
     * @returns {HTMLElement|null} - SVG element or null if icon not found
     */
    createIcon(name) {
        // Look up the mapped name if it exists
        const iconName = this.iconMappings[name] || name;

        if (!this.icons[iconName]) {
            console.warn(
                `IconManager: Icon "${name}" not found, using fallback`
            );
            return this.createFallbackIcon(name);
        }

        // Create wrapper div to safely use innerHTML
        const wrapper = document.createElement('div');
        wrapper.innerHTML = this.icons[iconName];

        // Get the SVG element
        const svg = wrapper.firstChild;

        // Make sure we got an SVG element
        if (svg && svg.tagName === 'svg') {
            // Add icon class
            svg.classList.add('icon');
            svg.classList.add(`icon-${name}`);

            return svg;
        }

        return this.createFallbackIcon(name);
    }

    /**
     * Create a fallback icon when the requested icon is not found
     * @param {string} name - The original icon name
     * @returns {HTMLElement} A fallback icon element
     */
    createFallbackIcon(name) {
        const fallback = document.createElement('span');
        fallback.className = 'icon icon-fallback';
        fallback.textContent = (name || '?').charAt(0).toUpperCase();
        return fallback;
    }

    /**
     * Add or update an icon definition
     * @param {string} name - Icon name
     * @param {string} svg - SVG markup
     */
    addIcon(name, svg) {
        this.icons[name] = svg;
    }

    /**
     * Add a mapping from a tool ID to an icon name
     * @param {string} toolId - The tool ID
     * @param {string} iconName - The icon name
     */
    addIconMapping(toolId, iconName) {
        this.iconMappings[toolId] = iconName;
    }

    /**
     * Check if an icon exists
     * @param {string} name - Icon name
     * @returns {boolean} - True if icon exists
     */
    hasIcon(name) {
        // Check both direct name and via mapping
        return !!(
            this.icons[name] ||
            (this.iconMappings[name] && this.icons[this.iconMappings[name]])
        );
    }

    /**
     * Get an icon by name
     * @param {string} name - Icon name
     * @returns {string} SVG icon HTML
     */
    getIcon(name) {
        // Try to get the mapped name first
        const iconName = this.iconMappings[name] || name;

        if (!iconName || !this.icons[iconName]) {
            // Provide more helpful debugging information
            if (!iconName) {
                console.warn(`IconManager: No icon name provided`);
            } else {
                console.warn(
                    `IconManager: Icon "${iconName}" not found, using fallback`
                );
            }

            // Create a simple fallback that still works visually
            return `<span class="icon icon-fallback">${(iconName || '?')
                .charAt(0)
                .toUpperCase()}</span>`;
        }

        return this.icons[iconName];
    }
}
