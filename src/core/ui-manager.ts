import { UIManager, Panel, PanelOptions, Theme, Position } from './types';
import { BasePanel } from '../ui/components/base-panel';

/**
 * Implementation of the UI Manager
 */
export class UIManagerImpl implements UIManager {
    private shadowRoot: ShadowRoot;
    private container: HTMLElement;
    private panels: Map<string, BasePanel> = new Map();
    private visible: boolean = false;
    private currentTheme: Theme = 'light';

    constructor() {
        // Create container element
        this.container = document.createElement('div');
        this.container.id = 'web-debugger-container';

        // Create shadow root for isolation
        this.shadowRoot = this.container.attachShadow({ mode: 'open' });

        // Add theme styles
        this.addThemeStyles();

        // Append container to body
        document.body.appendChild(this.container);
    }

    /**
     * Create a new panel
     */
    public createPanel(options: PanelOptions): Panel {
        // Create the panel element
        const panel = document.createElement('web-debugger-panel') as BasePanel;

        // Set panel properties
        panel.title = options.title;
        panel.draggable = options.draggable !== false;
        panel.resizable = options.resizable !== false;

        if (options.position) {
            panel.position = options.position;
        }

        // Add the panel to the shadow root
        this.shadowRoot.appendChild(panel);

        // Store the panel
        const id = `panel-${Date.now()}`;
        this.panels.set(id, panel);

        // Initial panel visibility based on UI manager visibility
        panel.visible = this.visible;

        // Handle panel close event
        panel.addEventListener('close', () => {
            this.visible = false;
        });

        return {
            setDraggable: (draggable: boolean) => panel.draggable = draggable,
            setResizable: (resizable: boolean) => panel.resizable = resizable,
            setOpacity: (opacity: number) => panel.setOpacity(opacity),
            setPosition: (position: Position) => panel.position = position,
            append: (element: HTMLElement) => panel.appendChild(element),
            clear: () => {
                while (panel.firstChild) {
                    panel.removeChild(panel.firstChild);
                }
            }
        };
    }

    /**
     * Set the current theme
     */
    public setTheme(theme: Theme): void {
        this.currentTheme = theme;
        this.container.dataset.theme = theme;

        // Save theme preference
        try {
            localStorage.setItem('web-debugger-theme', theme);
        } catch (error) {
            console.error('Failed to save theme preference:', error);
        }
    }

    /**
     * Set the position of all panels
     */
    public setPosition(position: Position): void {
        for (const panel of this.panels.values()) {
            panel.position = position;
        }
    }

    /**
     * Toggle visibility of all panels
     */
    public toggleVisibility(): void {
        this.visible = !this.visible;
        for (const panel of this.panels.values()) {
            panel.visible = this.visible;
        }
    }

    /**
     * Check if the UI is visible
     */
    public isVisible(): boolean {
        return this.visible;
    }

    /**
     * Add theme styles to the shadow root
     */
    private addThemeStyles(): void {
        // Create stylesheet
        const style = document.createElement('style');

        // Add theme CSS variables
        style.textContent = `
      :host, :root {
        /* Light Theme */
        --wdt-light-bg-color: #ffffff;
        --wdt-light-text-color: #333333;
        --wdt-light-border-color: #e2e8f0;
        --wdt-light-header-bg-color: #f8fafc;
        --wdt-light-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        
        /* Dark Theme */
        --wdt-dark-bg-color: #1e293b;
        --wdt-dark-text-color: #e2e8f0;
        --wdt-dark-border-color: #334155;
        --wdt-dark-header-bg-color: #0f172a;
        --wdt-dark-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1);
      }
      
      /* Apply theme based on data-theme attribute */
      :host, :root {
        --wdt-panel-bg-color: var(--wdt-light-bg-color);
        --wdt-panel-text-color: var(--wdt-light-text-color);
        --wdt-panel-border-color: var(--wdt-light-border-color);
        --wdt-panel-header-bg-color: var(--wdt-light-header-bg-color);
        --wdt-panel-shadow: var(--wdt-light-shadow);
      }
      
      :host([data-theme="dark"]), [data-theme="dark"] {
        --wdt-panel-bg-color: var(--wdt-dark-bg-color);
        --wdt-panel-text-color: var(--wdt-dark-text-color);
        --wdt-panel-border-color: var(--wdt-dark-border-color);
        --wdt-panel-header-bg-color: var(--wdt-dark-header-bg-color);
        --wdt-panel-shadow: var(--wdt-dark-shadow);
      }
    `;

        // Add the styles to the shadow root
        this.shadowRoot.appendChild(style);

        // Load saved theme preference
        try {
            const savedTheme = localStorage.getItem('web-debugger-theme') as Theme | null;
            if (savedTheme) {
                this.setTheme(savedTheme);
            }
        } catch (error) {
            console.error('Failed to load theme preference:', error);
        }
    }
} 