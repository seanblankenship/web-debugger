/**
 * Direct core implementation for Web Debugger
 * 
 * This is a simplified version of the core API that reduces dependencies
 * and provides the essential functionality needed for the debugger.
 */

// Simple interfaces
export interface CoreAPI {
    settings: SettingsManager;
    ui: UIManager;
}

export interface SettingsManager {
    get(key: string): any;
    set(key: string, value: any): void;
}

export interface UIManager {
    createPanel(options: PanelOptions): HTMLElement;
}

export interface PanelOptions {
    title: string;
    draggable?: boolean;
    resizable?: boolean;
    visible?: boolean;
}

/**
 * Settings manager implementation
 */
class SettingsManagerImpl implements SettingsManager {
    private settings: Record<string, any> = {};

    constructor() {
        // Initialize with default settings
        this.settings = {
            theme: 'dark'
        };

        // Try to load from storage
        this.loadFromStorage();
    }

    private async loadFromStorage() {
        try {
            const data = await new Promise<Record<string, any>>((resolve) => {
                chrome.storage.local.get(null, (items) => {
                    resolve(items || {});
                });
            });

            // Merge with defaults
            this.settings = { ...this.settings, ...data };
        } catch (error) {
            console.error('Failed to load settings from storage:', error);
        }
    }

    get(key: string): any {
        return this.settings[key];
    }

    set(key: string, value: any): void {
        this.settings[key] = value;

        // Save to storage
        chrome.storage.local.set({ [key]: value });

        // Dispatch event
        const event = new CustomEvent('settings-changed', {
            detail: { key, value }
        });
        document.dispatchEvent(event);
    }
}

/**
 * UI manager implementation
 */
class UIManagerImpl implements UIManager {
    createPanel(options: PanelOptions): HTMLElement {
        // Create the panel using web components
        const panel = document.createElement('web-debugger-panel') as HTMLElement;

        // Set attributes based on options
        if (options.title) {
            panel.setAttribute('title', options.title);
        }

        if (options.draggable !== undefined) {
            panel.setAttribute('draggable', options.draggable.toString());
        }

        if (options.resizable !== undefined) {
            panel.setAttribute('resizable', options.resizable.toString());
        }

        if (options.visible === false) {
            panel.style.display = 'none';
        }

        // Add to document
        document.body.appendChild(panel);

        return panel;
    }
}

/**
 * Initialize the core API
 */
export function initCore(): CoreAPI {
    // Create core components
    const settings = new SettingsManagerImpl();
    const ui = new UIManagerImpl();

    // Return simple API
    return {
        settings,
        ui
    };
} 