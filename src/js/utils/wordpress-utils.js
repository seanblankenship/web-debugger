/**
 * WordPress Utilities
 * Utility functions for WordPress detection and hook inspection
 */
export class WordPressUtils {
    /**
     * Check if we're in a WordPress environment
     * @returns {boolean} True if WordPress is detected
     */
    static isWordPress() {
        return (
            typeof window.wp !== 'undefined' ||
            document.body.classList.contains('wp-admin') ||
            document.getElementById('wpadminbar') !== null ||
            typeof window.wpApiSettings !== 'undefined' ||
            typeof window.wpData !== 'undefined' ||
            document.querySelector(
                'meta[name="generator"][content^="WordPress"]'
            ) !== null
        );
    }

    /**
     * Get WordPress version
     * @returns {string|null} WordPress version or null if not found
     */
    static getWordPressVersion() {
        // Try to get version from generator meta tag
        const metaGenerator = document.querySelector(
            'meta[name="generator"][content^="WordPress"]'
        );
        if (metaGenerator) {
            const content = metaGenerator.getAttribute('content');
            const versionMatch = content.match(/WordPress\s+([0-9.]+)/i);
            if (versionMatch && versionMatch[1]) {
                return versionMatch[1];
            }
        }

        // Try to get version from global wp object
        if (window.wp && window.wp.version) {
            return window.wp.version;
        }

        // Try to extract from script URL
        const wpIncludesScript = document.querySelector(
            'script[src*="/wp-includes/js/"]'
        );
        if (wpIncludesScript) {
            const src = wpIncludesScript.getAttribute('src');
            const versionMatch = src.match(/[?&]ver=([0-9.]+)/);
            if (versionMatch && versionMatch[1]) {
                return versionMatch[1];
            }
        }

        return null;
    }

    /**
     * Get all registered hooks (filters and actions)
     * @returns {Object} Object with filter and action hooks
     */
    static getHooks() {
        const hooks = {
            filters: {},
            actions: {},
        };

        // Check if we have hooks via wp.hooks (WordPress 5.0+)
        if (window.wp && window.wp.hooks) {
            try {
                // Access internal hook storage (this might break in future WP versions)
                const wpHooks = window.wp.hooks;

                // Try to access the private hooks property
                // Using various techniques to avoid breaking when WP updates
                let hooksCollection = null;

                // Method 1: Direct access if not well-hidden
                if (wpHooks.hooks) {
                    hooksCollection = wpHooks.hooks;
                }
                // Method 2: Extract from the createHooks function
                else if (wpHooks.createHooks) {
                    // Create a new hook instance to inspect its structure
                    const tempHooks = wpHooks.createHooks();

                    // Look for hooks property or _hooks
                    if (tempHooks.hooks) {
                        hooksCollection = tempHooks.hooks;
                    } else if (tempHooks._hooks) {
                        hooksCollection = tempHooks._hooks;
                    }
                    // Try to find the hooks through function inspection if it exists
                    else {
                        const hookMethods = [
                            'addFilter',
                            'addAction',
                            'removeFilter',
                            'removeAction',
                            'hasFilter',
                            'hasAction',
                            'applyFilters',
                            'doAction',
                        ];

                        for (const method of hookMethods) {
                            if (tempHooks[method]) {
                                // Extract function source
                                const fnString = tempHooks[method].toString();
                                const propMatch =
                                    fnString.match(/this\.([\w_]+)\[/);
                                if (
                                    propMatch &&
                                    propMatch[1] &&
                                    tempHooks[propMatch[1]]
                                ) {
                                    hooksCollection = tempHooks[propMatch[1]];
                                    break;
                                }
                            }
                        }
                    }
                }

                // Process hooks if we found them
                if (hooksCollection) {
                    // Process filters
                    if (hooksCollection.filters) {
                        Object.keys(hooksCollection.filters).forEach(
                            (hookName) => {
                                const hookHandlers =
                                    hooksCollection.filters[hookName];
                                hooks.filters[hookName] = hookHandlers.map(
                                    (handler) => ({
                                        priority: handler.priority,
                                        callback: handler.callback.toString(),
                                        namespace:
                                            handler.namespace || 'default',
                                    })
                                );
                            }
                        );
                    }

                    // Process actions
                    if (hooksCollection.actions) {
                        Object.keys(hooksCollection.actions).forEach(
                            (hookName) => {
                                const hookHandlers =
                                    hooksCollection.actions[hookName];
                                hooks.actions[hookName] = hookHandlers.map(
                                    (handler) => ({
                                        priority: handler.priority,
                                        callback: handler.callback.toString(),
                                        namespace:
                                            handler.namespace || 'default',
                                    })
                                );
                            }
                        );
                    }
                }
            } catch (e) {
                console.error('Error inspecting WP hooks:', e);
            }
        }

        // Legacy hooks (wp-hooks might not be used by all plugins)
        this.#scanForLegacyHooks(hooks);

        return hooks;
    }

    /**
     * Detect active plugins
     * @returns {Array} Active plugins list
     */
    static getActivePlugins() {
        const plugins = [];

        // Check for plugin-specific global objects
        const globalObjects = Object.keys(window);

        // Common plugin global object patterns
        const pluginPatterns = [
            /^woo.*/i, // WooCommerce
            /^yoast.*/i, // Yoast SEO
            /^elementor.*/i, // Elementor
            /^wpforms.*/i, // WPForms
            /^jetpack.*/i, // Jetpack
            /^acf.*/i, // Advanced Custom Fields
            /^gravity.*/i, // Gravity Forms
            /^redux.*/i, // Redux Framework
            /.*Plugin$/i, // Common plugin object naming convention
            /.*Settings$/i, // Common plugin settings object
        ];

        // Check for known global objects
        globalObjects.forEach((obj) => {
            for (const pattern of pluginPatterns) {
                if (pattern.test(obj)) {
                    plugins.push({
                        name: obj,
                        type: 'global-object',
                    });
                    break;
                }
            }
        });

        // Check for plugin stylesheets
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
        stylesheets.forEach((stylesheet) => {
            const href = stylesheet.getAttribute('href');
            if (href && href.includes('/plugins/')) {
                const pluginMatch = href.match(/\/plugins\/([^/]+)\//);
                if (pluginMatch && pluginMatch[1]) {
                    const pluginName = pluginMatch[1].replace(/-/g, ' ');
                    plugins.push({
                        name: this.#capitalizeWords(pluginName),
                        type: 'stylesheet',
                        path: href,
                    });
                }
            }
        });

        // Check for plugin scripts
        const scripts = document.querySelectorAll('script[src]');
        scripts.forEach((script) => {
            const src = script.getAttribute('src');
            if (src && src.includes('/plugins/')) {
                const pluginMatch = src.match(/\/plugins\/([^/]+)\//);
                if (pluginMatch && pluginMatch[1]) {
                    const pluginName = pluginMatch[1].replace(/-/g, ' ');
                    plugins.push({
                        name: this.#capitalizeWords(pluginName),
                        type: 'script',
                        path: src,
                    });
                }
            }
        });

        // Remove duplicates
        const uniquePlugins = [];
        const pluginNames = new Set();

        plugins.forEach((plugin) => {
            if (!pluginNames.has(plugin.name)) {
                pluginNames.add(plugin.name);
                uniquePlugins.push(plugin);
            }
        });

        return uniquePlugins;
    }

    /**
     * Get active theme information
     * @returns {Object|null} Theme info or null if not found
     */
    static getThemeInfo() {
        // Check for theme stylesheets
        const themeStylesheet = document.querySelector(
            'link[rel="stylesheet"][href*="/themes/"]'
        );
        if (themeStylesheet) {
            const href = themeStylesheet.getAttribute('href');
            const themeMatch = href.match(/\/themes\/([^/]+)\//);

            if (themeMatch && themeMatch[1]) {
                const themeName = themeMatch[1].replace(/-/g, ' ');
                return {
                    name: this.#capitalizeWords(themeName),
                    path: href,
                };
            }
        }

        // Try to get theme from body class
        const bodyClasses = document.body.className.split(' ');
        const themeClass = bodyClasses.find((cls) => cls.startsWith('theme-'));

        if (themeClass) {
            const themeName = themeClass
                .replace('theme-', '')
                .replace(/-/g, ' ');
            return {
                name: this.#capitalizeWords(themeName),
                path: null,
            };
        }

        return null;
    }

    /**
     * Monitor WordPress hook executions in real-time
     * @param {Function} callback - Callback function to be called when a hook is executed
     * @returns {Function|null} Function to remove monitors or null if not supported
     */
    static monitorHooks(callback) {
        if (!window.wp || !window.wp.hooks) {
            return null;
        }

        const originalApplyFilters = window.wp.hooks.applyFilters;
        const originalDoAction = window.wp.hooks.doAction;

        const monitoredHooks = new Set();

        // Override applyFilters
        window.wp.hooks.applyFilters = function (hookName, ...args) {
            const startTime = performance.now();
            const result = originalApplyFilters.apply(this, [
                hookName,
                ...args,
            ]);
            const endTime = performance.now();

            try {
                if (typeof callback === 'function') {
                    callback({
                        type: 'filter',
                        name: hookName,
                        args: args.slice(1), // Remove the first arg which is the hookName
                        result: result,
                        duration: endTime - startTime,
                    });
                }
            } catch (e) {
                console.error('Error in hook monitor callback:', e);
            }

            return result;
        };

        // Override doAction
        window.wp.hooks.doAction = function (hookName, ...args) {
            const startTime = performance.now();
            const result = originalDoAction.apply(this, [hookName, ...args]);
            const endTime = performance.now();

            try {
                if (typeof callback === 'function') {
                    callback({
                        type: 'action',
                        name: hookName,
                        args: args,
                        result: null, // Actions don't return values
                        duration: endTime - startTime,
                    });
                }
            } catch (e) {
                console.error('Error in hook monitor callback:', e);
            }

            return result;
        };

        // Return function to remove monitors
        return function removeMonitors() {
            if (window.wp && window.wp.hooks) {
                window.wp.hooks.applyFilters = originalApplyFilters;
                window.wp.hooks.doAction = originalDoAction;
            }
        };
    }

    /**
     * Get info about custom post types
     * @returns {Array|null} Array of custom post types or null if not available
     */
    static getCustomPostTypes() {
        // This is harder to detect from the frontend
        // but we can check for some common indicators

        if (!this.isWordPress()) {
            return null;
        }

        // Check for known global variables
        if (window.wp && window.wp.api && window.wp.api.collections) {
            const collections = [];

            // WP REST API may have collections for custom post types
            for (const key in window.wp.api.collections) {
                if (
                    key.endsWith('Collection') &&
                    ![
                        'PostsCollection',
                        'PagesCollection',
                        'AttachmentCollection',
                        'CategoriesCollection',
                        'TagsCollection',
                        'UsersCollection',
                    ].includes(key)
                ) {
                    const postTypeName = key.replace('Collection', '');
                    collections.push(postTypeName);
                }
            }

            if (collections.length > 0) {
                return collections;
            }
        }

        // Check for post type body classes
        const bodyClasses = document.body.className.split(' ');
        const postTypeClasses = bodyClasses.filter((cls) =>
            cls.startsWith('post-type-')
        );

        if (postTypeClasses.length > 0) {
            return postTypeClasses
                .map((cls) => {
                    const typeName = cls.replace('post-type-', '');
                    return typeName !== 'post' && typeName !== 'page'
                        ? typeName
                        : null;
                })
                .filter(Boolean);
        }

        return null;
    }

    /**
     * Find Block Editor (Gutenberg) information
     * @returns {Object|null} Gutenberg data or null if not using Gutenberg
     */
    static getGutenbergInfo() {
        if (!window.wp || !window.wp.blocks) {
            return null;
        }

        const info = {
            isActive: true,
            registeredBlocks: [],
            blockCategories: [],
        };

        // Get registered blocks
        if (window.wp.blocks && window.wp.blocks.getBlockTypes) {
            const blocks = window.wp.blocks.getBlockTypes();

            info.registeredBlocks = blocks.map((block) => ({
                name: block.name,
                title: block.title,
                category: block.category,
                icon: typeof block.icon === 'string' ? block.icon : 'object',
                isCore: block.name.startsWith('core/'),
            }));
        }

        // Get block categories
        if (window.wp.blocks && window.wp.blocks.getCategories) {
            info.blockCategories = window.wp.blocks.getCategories();
        }

        return info;
    }

    /**
     * Scan the page for legacy hooks using function detection
     * @param {Object} hooks - Hooks object to populate
     * @private
     */
    static #scanForLegacyHooks(hooks) {
        // This is a less reliable method but can find old-style hooks

        // Check for jQuery hooks
        if (window.jQuery) {
            const $ = window.jQuery;

            // Look for direct jQuery event handlers
            if ($.fn && $.fn.on && $._data) {
                try {
                    // Scan body and common wrapper elements
                    const targets = [
                        'body',
                        '#page',
                        '#main',
                        '#content',
                        '.site',
                        '.site-content',
                        '#wpcontent',
                    ];

                    targets.forEach((selector) => {
                        const $el = $(selector);
                        if ($el.length) {
                            const events = $._data($el[0], 'events');
                            if (events) {
                                Object.keys(events).forEach((eventType) => {
                                    const handlers = events[eventType];
                                    handlers.forEach((handler) => {
                                        // Treat these as quasi-actions
                                        const hookName = `jquery.${selector}.${eventType}`;

                                        if (!hooks.actions[hookName]) {
                                            hooks.actions[hookName] = [];
                                        }

                                        hooks.actions[hookName].push({
                                            priority: 10,
                                            callback:
                                                handler.handler.toString(),
                                            namespace:
                                                handler.namespace ||
                                                'jquery-event',
                                        });
                                    });
                                });
                            }
                        }
                    });
                } catch (e) {
                    console.error('Error scanning jQuery events:', e);
                }
            }
        }
    }

    /**
     * Capitalize words in a string
     * @param {string} str - Input string
     * @returns {string} Capitalized string
     * @private
     */
    static #capitalizeWords(str) {
        return str.replace(/\b\w/g, (char) => char.toUpperCase());
    }
}
