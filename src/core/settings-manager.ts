import { SettingsManager, SettingsSchema } from './types';

/**
 * Storage key for settings
 */
const STORAGE_KEY = 'web-debugger-settings';

/**
 * Implementation of the Settings Manager
 */
export class SettingsManagerImpl implements SettingsManager {
    private settings: Record<string, any> = {};
    private moduleSettings: Record<string, SettingsSchema> = {};

    constructor() {
        this.loadSettings();
    }

    /**
     * Get a setting value
     */
    public get<T>(key: string, defaultValue: T): T {
        return this.settings[key] !== undefined ? this.settings[key] : defaultValue;
    }

    /**
     * Set a setting value
     */
    public set<T>(key: string, value: T): void {
        this.settings[key] = value;
        this.saveSettings();
    }

    /**
     * Export settings as a JSON string
     */
    public async exportSettings(): Promise<string> {
        return JSON.stringify(this.settings);
    }

    /**
     * Import settings from a JSON string
     */
    public async importSettings(data: string): Promise<void> {
        try {
            const importedSettings = JSON.parse(data);
            this.settings = { ...this.settings, ...importedSettings };
            this.saveSettings();
        } catch (error) {
            console.error('Failed to import settings:', error);
            throw new Error('Invalid settings data');
        }
    }

    /**
     * Register settings schema for a module
     */
    public registerModuleSettings(moduleId: string, schema: SettingsSchema): void {
        this.moduleSettings[moduleId] = schema;

        // Initialize default settings if not already set
        Object.entries(schema).forEach(([key, definition]) => {
            const fullKey = `${moduleId}.${key}`;
            if (this.settings[fullKey] === undefined) {
                this.settings[fullKey] = definition.default;
            }
        });

        this.saveSettings();
    }

    /**
     * Load settings from storage
     */
    private loadSettings(): void {
        try {
            const storedSettings = localStorage.getItem(STORAGE_KEY);
            if (storedSettings) {
                this.settings = JSON.parse(storedSettings);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            this.settings = {};
        }
    }

    /**
     * Save settings to storage
     */
    private saveSettings(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }
} 