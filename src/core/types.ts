/**
 * Interface for the core API that modules will interact with
 */
export interface CoreAPI {
    settings: SettingsManager;
    events: EventSystem;
    ui: UIManager;
}

/**
 * Module definition interface 
 */
export interface ModuleDefinition {
    id: string;
    name: string;
    description: string;
    version: string;
    dependencies?: string[];
    initialize: (api: CoreAPI) => void;
    destroy?: () => void;
}

/**
 * Settings manager interface
 */
export interface SettingsManager {
    get<T>(key: string, defaultValue: T): T;
    set<T>(key: string, value: T): void;
    exportSettings(): Promise<string>;
    importSettings(data: string): Promise<void>;
}

/**
 * Event system interface
 */
export interface EventSystem {
    on(event: string, callback: (...args: any[]) => void): void;
    off(event: string, callback: (...args: any[]) => void): void;
    emit(event: string, ...args: any[]): void;
}

/**
 * UI manager interface
 */
export interface UIManager {
    createPanel(options: PanelOptions): Panel;
    setTheme(theme: Theme): void;
    setPosition(position: Position): void;
    toggleVisibility(): void;
    isVisible(): boolean;
}

/**
 * Panel options interface
 */
export interface PanelOptions {
    title: string;
    width?: number;
    height?: number;
    position?: Position;
    draggable?: boolean;
    resizable?: boolean;
}

/**
 * Panel interface 
 */
export interface Panel {
    setDraggable(draggable: boolean): void;
    setResizable(resizable: boolean): void;
    setOpacity(opacity: number): void;
    setPosition(position: Position): void;
    append(element: HTMLElement): void;
    clear(): void;
}

/**
 * Position type
 */
export type Position = 'left' | 'right' | 'bottom' | 'floating';

/**
 * Theme type
 */
export type Theme = 'light' | 'dark';

/**
 * Settings schema interface
 */
export interface SettingsSchema {
    [key: string]: {
        type: 'string' | 'number' | 'boolean' | 'object' | 'array';
        default: any;
        description?: string;
    };
} 