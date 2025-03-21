import { ModuleRegistry } from './module-registry';
import { SettingsManagerImpl } from './settings-manager';
import { EventSystemImpl } from './event-system';
import { UIManagerImpl } from './ui-manager';
import { CoreAPI } from './types';

/**
 * Initialize the core API
 */
export function initCore(): CoreAPI {
    // Initialize core components
    const settings = new SettingsManagerImpl();
    const events = new EventSystemImpl();
    const ui = new UIManagerImpl();

    // Create core API
    const coreAPI: CoreAPI = {
        settings,
        events,
        ui
    };

    // Create module registry
    const moduleRegistry = new ModuleRegistry(coreAPI);

    // Return the core API
    return coreAPI;
}

// Export core components and types
export * from './types';
export { ModuleRegistry } from './module-registry';
export { SettingsManagerImpl } from './settings-manager';
export { EventSystemImpl } from './event-system';
export { UIManagerImpl } from './ui-manager'; 