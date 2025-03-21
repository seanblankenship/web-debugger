import { CoreAPI, ModuleDefinition } from './types';

/**
 * Module Registry for managing modules
 */
export class ModuleRegistry {
    private modules: Record<string, ModuleDefinition> = {};
    private enabledModules: Set<string> = new Set();
    private initializedModules: Set<string> = new Set();
    private api: CoreAPI;

    /**
     * Create a new module registry
     */
    constructor(api: CoreAPI) {
        this.api = api;
    }

    /**
     * Register a module with the registry
     */
    public registerModule(module: ModuleDefinition): void {
        // Validate module
        if (!module.id || !module.name || !module.version || !module.initialize) {
            throw new Error(`Invalid module: ${module.id || 'unknown'}`);
        }

        // Check for existing module with same ID
        if (this.modules[module.id]) {
            throw new Error(`Module with ID ${module.id} already registered`);
        }

        // Save module
        this.modules[module.id] = module;
    }

    /**
     * Enable a module
     */
    public enableModule(id: string): void {
        const module = this.getModule(id);
        if (!module) {
            throw new Error(`Module with ID ${id} not found`);
        }

        // First enable dependencies if any
        const dependencies = this.getDependencies(id);
        for (const depId of dependencies) {
            if (!this.isModuleEnabled(depId)) {
                this.enableModule(depId);
            }
        }

        // Add to enabled modules
        this.enabledModules.add(id);

        // Initialize if not already initialized
        if (!this.initializedModules.has(id)) {
            try {
                module.initialize(this.api);
                this.initializedModules.add(id);
            } catch (error) {
                this.enabledModules.delete(id);
                console.error(`Failed to initialize module ${id}:`, error);
                throw error;
            }
        }
    }

    /**
     * Disable a module
     */
    public disableModule(id: string): void {
        const module = this.getModule(id);
        if (!module) {
            throw new Error(`Module with ID ${id} not found`);
        }

        // Check if any enabled modules depend on this one
        const dependents = this.getDependentModules(id);
        if (dependents.length > 0) {
            throw new Error(`Cannot disable module ${id} because it is required by: ${dependents.join(', ')}`);
        }

        // Remove from enabled modules
        this.enabledModules.delete(id);

        // Call destroy if the module is initialized and has a destroy method
        if (this.initializedModules.has(id) && module.destroy) {
            try {
                module.destroy();
            } catch (error) {
                console.error(`Error while destroying module ${id}:`, error);
            }
        }
    }

    /**
     * Get a module by ID
     */
    public getModule(id: string): ModuleDefinition | null {
        return this.modules[id] || null;
    }

    /**
     * Get all registered modules
     */
    public getAllModules(): ModuleDefinition[] {
        return Object.values(this.modules);
    }

    /**
     * Get enabled modules
     */
    public getEnabledModules(): ModuleDefinition[] {
        return Array.from(this.enabledModules)
            .map(id => this.getModule(id))
            .filter((module): module is ModuleDefinition => module !== null);
    }

    /**
     * Check if a module is enabled
     */
    public isModuleEnabled(id: string): boolean {
        return this.enabledModules.has(id);
    }

    /**
     * Get dependencies for a module
     */
    public getDependencies(id: string): string[] {
        const module = this.getModule(id);
        if (!module) {
            return [];
        }
        return module.dependencies || [];
    }

    /**
     * Get modules that depend on the specified module
     */
    private getDependentModules(id: string): string[] {
        return Object.values(this.modules)
            .filter(module => (module.dependencies || []).includes(id))
            .map(module => module.id);
    }
} 