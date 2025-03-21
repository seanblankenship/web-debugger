/**
 * Web Debugger Content Script
 * 
 * This script is directly injected by the browser into web pages.
 * It serves as the entry point for the debugger's functionality.
 */

console.log('🐛 Web Debugger: Content script initializing');

// Core state management
let isInitialized = false;
let isActive = false;
let debuggerApi: any = null;
let debuggerPanel: HTMLElement | null = null;
let currentTheme = 'dark';

// Set up extension message listener immediately
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('🐛 Web Debugger: Message received:', message);

    // Always respond to ping messages, even before full initialization
    if (message.type === 'PING') {
        console.log('🐛 Web Debugger: Received PING, responding with PONG');
        sendResponse({ status: 'PONG' });
        return true;
    }

    // Handle theme changes
    if (message.type === 'CHANGE_THEME') {
        console.log('🐛 Web Debugger: Theme change requested:', message.theme);
        currentTheme = message.theme;

        if (debuggerApi) {
            debuggerApi.settings.set('theme', currentTheme);
            sendResponse({ success: true });
        } else {
            sendResponse({ success: false, error: 'Debugger not initialized yet' });
        }

        return true;
    }

    // Handle toggle requests
    if (message.type === 'TOGGLE_DEBUGGER') {
        console.log('🐛 Web Debugger: Toggle requested, current state:', isActive);

        if (!isInitialized) {
            // Initialize on first toggle
            initializeDebugger()
                .then(() => {
                    toggleDebuggerVisibility();
                    sendResponse({ success: true, active: isActive });
                })
                .catch(error => {
                    console.error('🐛 Web Debugger: Initialization failed:', error);
                    sendResponse({
                        success: false,
                        error: error instanceof Error ? error.message : String(error)
                    });
                });
        } else {
            // Just toggle visibility if already initialized
            toggleDebuggerVisibility();
            sendResponse({ success: true, active: isActive });
        }

        return true;
    }

    // For any other message, return an error if not initialized
    if (!isInitialized) {
        sendResponse({ success: false, error: 'Debugger not initialized yet' });
        return true;
    }

    // Default response for unknown messages
    sendResponse({ success: false, error: 'Unknown message type' });
    return true;
});

/**
 * Initialize the debugger interface
 */
async function initializeDebugger(): Promise<void> {
    if (isInitialized) {
        console.log('🐛 Web Debugger: Already initialized');
        return Promise.resolve();
    }

    console.log('🐛 Web Debugger: Initializing...');

    try {
        // Import required modules
        console.log('🐛 Web Debugger: Loading dependencies...');

        // First load custom element support
        console.log('🐛 Web Debugger: Loading custom element support...');
        await import(chrome.runtime.getURL('js/custom-element.js'));

        // Then load UI components
        console.log('🐛 Web Debugger: Loading UI components...');
        await import(chrome.runtime.getURL('js/base-panel.js'));
        await import(chrome.runtime.getURL('js/welcome-dashboard.js'));

        // Finally load and initialize core
        console.log('🐛 Web Debugger: Loading core...');
        const coreModule = await import(chrome.runtime.getURL('js/core.js'));

        // Initialize the core API
        debuggerApi = coreModule.initCore();
        console.log('🐛 Web Debugger: Core initialized:', !!debuggerApi);

        // Set up theme
        debuggerApi.settings.set('theme', currentTheme);

        // Create the debugger panel (but initially hidden)
        createDebuggerPanel();

        // Mark as initialized
        isInitialized = true;
        console.log('🐛 Web Debugger: Initialization complete');

        return Promise.resolve();
    } catch (error) {
        console.error('🐛 Web Debugger: Error during initialization:', error);
        return Promise.reject(new Error(`Initialization failed: ${error instanceof Error ? error.message : String(error)}`));
    }
}

/**
 * Create the main debugger panel
 */
function createDebuggerPanel() {
    try {
        console.log('🐛 Web Debugger: Creating panel...');

        // Create panel using the API
        debuggerPanel = debuggerApi.ui.createPanel({
            title: 'Web Debugger',
            draggable: true,
            resizable: true,
            visible: false  // Start hidden
        });

        if (!debuggerPanel) {
            throw new Error('Failed to create debugger panel - API returned null');
        }

        // Add welcome dashboard
        console.log('🐛 Web Debugger: Creating welcome dashboard...');
        const welcomeDashboard = document.createElement('web-debugger-welcome');
        debuggerPanel.append(welcomeDashboard);

        console.log('🐛 Web Debugger: Panel created and ready');
    } catch (error) {
        console.error('🐛 Web Debugger: Error creating panel:', error);
        throw new Error(`Failed to create panel: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Toggle the visibility of the debugger UI
 */
function toggleDebuggerVisibility() {
    if (!isInitialized || !debuggerApi || !debuggerPanel) {
        console.error('🐛 Web Debugger: Cannot toggle, not initialized');
        return;
    }

    try {
        isActive = !isActive;
        console.log('🐛 Web Debugger: Toggling visibility to:', isActive);

        // Show/hide the panel
        if (debuggerPanel) {
            if (isActive) {
                debuggerPanel.style.display = 'block';
            } else {
                debuggerPanel.style.display = 'none';
            }
        }

        console.log('🐛 Web Debugger: Visibility toggled successfully');
    } catch (error) {
        console.error('🐛 Web Debugger: Error toggling visibility:', error);
    }
} 