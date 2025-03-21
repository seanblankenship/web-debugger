/**
 * Main Content Script for Web Debugger
 * This is loaded as a web accessible resource to bypass CSP
 */

// Set up message listener right away to respond to pings
console.log('🐛 Web Debugger Content: Setting up message listener');
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('🐛 Web Debugger Content: Message received from extension:', message);

    // Handle PING message immediately
    if (message && message.type === 'PING') {
        console.log('🐛 Web Debugger Content: Received PING, responding with PONG');
        sendResponse({ status: 'PONG' });
        return true;
    }

    // For other messages, process asynchronously
    processMessage(message).then(response => {
        console.log('🐛 Web Debugger Content: Sending response:', response);
        sendResponse(response);
    }).catch(error => {
        console.error('🐛 Web Debugger Content: Error processing message:', error);
        sendResponse({ error: error.message || 'Unknown error' });
    });

    return true; // Keep the message channel open for async response
});

// Define interface for message event data
interface WebDebuggerMessageEvent {
    data?: {
        source?: string;
        response?: any;
        payload?: any;
    };
}

/**
 * Flag to track if the debugger has been initialized
 */
let isInitialized = false;
let coreAPI: any = null;
let initializationError: string | null = null;

/**
 * Send a response back to the content-loader
 */
function sendResponse(response: any) {
    window.postMessage({
        source: 'web-debugger-content-script',
        response
    }, window.location.origin);
}

// Define module URLs to preload
const MODULE_URLS = {
    CORE: 'js/index.js',
    BASE_PANEL: 'js/base-panel.js',
    WELCOME_DASHBOARD: 'js/welcome-dashboard.js',
    CUSTOM_ELEMENT: 'js/custom-element.js'
};

/**
 * Initialize the debugger with proper error handling
 */
async function initializeDebugger() {
    if (isInitialized) {
        console.log('🐛 Web Debugger Content: Already initialized, skipping');
        return true;
    }

    if (initializationError) {
        console.error('🐛 Web Debugger Content: Initialization previously failed:', initializationError);
        return false;
    }

    console.log('🐛 Web Debugger Content: Initializing...');

    try {
        // First import the custom element base class
        console.log('🐛 Web Debugger Content: Importing custom element dependencies...');
        try {
            await import(chrome.runtime.getURL(MODULE_URLS.CUSTOM_ELEMENT));
            console.log('🐛 Web Debugger Content: Custom element dependencies loaded successfully');
        } catch (error) {
            console.error('🐛 Web Debugger Content: Error loading custom element dependencies:', error);
            throw new Error(`Failed to load custom element dependencies: ${error instanceof Error ? error.message : String(error)}`);
        }

        // Import base components
        console.log('🐛 Web Debugger Content: Importing base-panel component...');
        try {
            await import(chrome.runtime.getURL(MODULE_URLS.BASE_PANEL));
            console.log('🐛 Web Debugger Content: Base panel loaded successfully');
        } catch (error) {
            console.error('🐛 Web Debugger Content: Error loading base panel:', error);
            throw new Error(`Failed to load base panel component: ${error instanceof Error ? error.message : String(error)}`);
        }

        console.log('🐛 Web Debugger Content: Importing welcome-dashboard component...');
        try {
            await import(chrome.runtime.getURL(MODULE_URLS.WELCOME_DASHBOARD));
            console.log('🐛 Web Debugger Content: Welcome dashboard loaded successfully');
        } catch (error) {
            console.error('🐛 Web Debugger Content: Error loading welcome dashboard:', error);
            throw new Error(`Failed to load welcome dashboard component: ${error instanceof Error ? error.message : String(error)}`);
        }

        // Import and initialize core module last
        console.log('🐛 Web Debugger Content: Importing core module...');
        let coreModule;
        try {
            coreModule = await import(chrome.runtime.getURL(MODULE_URLS.CORE));
            console.log('🐛 Web Debugger Content: Core module loaded successfully');
        } catch (error) {
            console.error('🐛 Web Debugger Content: Error loading core module:', error);
            throw new Error(`Failed to load core module: ${error instanceof Error ? error.message : String(error)}`);
        }

        // Initialize the core API
        console.log('🐛 Web Debugger Content: Initializing core...');
        try {
            coreAPI = coreModule.initCore();
            console.log('🐛 Web Debugger Content: Core initialized successfully:', !!coreAPI);
        } catch (error) {
            console.error('🐛 Web Debugger Content: Error initializing core:', error);
            throw new Error(`Failed to initialize core: ${error instanceof Error ? error.message : String(error)}`);
        }

        // Create welcome dashboard panel
        console.log('🐛 Web Debugger Content: Creating panel...');
        try {
            const panel = coreAPI.ui.createPanel({
                title: 'Web Debugger',
                draggable: true,
                resizable: true
            });

            // Create welcome dashboard
            console.log('🐛 Web Debugger Content: Creating welcome dashboard...');
            const welcomeDashboard = document.createElement('web-debugger-welcome');
            panel.append(welcomeDashboard);
        } catch (error) {
            console.error('🐛 Web Debugger Content: Error creating UI elements:', error);
            throw new Error(`Failed to create UI elements: ${error instanceof Error ? error.message : String(error)}`);
        }

        // Set initialization flag
        isInitialized = true;

        console.log('🐛 Web Debugger Content: Fully initialized');
        return true;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        initializationError = errorMessage;
        console.error('🐛 Web Debugger Content: Error during initialization:', error);
        return false;
    }
}

/**
 * Process messages from the content-loader
 */
async function processMessage(message: any) {
    console.log('🐛 Web Debugger Content: Processing message:', message);

    // Handle diagnostic message
    if (message.action === 'get-diagnostics') {
        return {
            isInitialized,
            hasError: !!initializationError,
            error: initializationError
        };
    }

    // Ensure we're initialized
    if (!isInitialized) {
        console.log('🐛 Web Debugger Content: Not initialized, initializing now...');
        const success = await initializeDebugger();
        if (!success) {
            return {
                error: 'Failed to initialize Web Debugger',
                details: initializationError
            };
        }
    }

    // Handle actual messages
    if (message.action === 'toggle-debugger') {
        console.log('🐛 Web Debugger Content: Toggle action received');
        if (coreAPI) {
            coreAPI.ui.toggleVisibility();
            const isVisible = coreAPI.ui.isVisible();
            console.log('🐛 Web Debugger Content: Panel visibility:', isVisible);
            return { success: true, visible: isVisible };
        } else {
            console.error('🐛 Web Debugger Content: Core API not initialized');
            return { error: 'Core API not initialized' };
        }
    } else if (message.action === 'set-theme') {
        if (message.theme && coreAPI) {
            console.log('🐛 Web Debugger Content: Setting theme to', message.theme);
            coreAPI.ui.setTheme(message.theme);
            return { success: true, theme: message.theme };
        } else {
            console.error('🐛 Web Debugger Content: Invalid theme or Core API not initialized');
            return { error: 'Invalid theme or Core API not initialized' };
        }
    } else {
        console.warn('🐛 Web Debugger Content: Unknown message action', message.action);
        return { error: 'Unknown message action' };
    }
}

// Initialize on load if we're in a compatible environment
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('🐛 Web Debugger Content: DOM loaded, initializing...');
        await initializeDebugger();
    });
} else {
    console.log('🐛 Web Debugger Content: DOM already loaded, initializing...');
    initializeDebugger().catch(error => {
        console.error('🐛 Web Debugger Content: Error during initialization:', error);
    });
} 