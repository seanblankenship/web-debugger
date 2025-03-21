/**
 * Web Debugger Content Bundle
 * 
 * This is a single bundled file that contains all the functionality needed
 * for the debugger to work without dynamic imports.
 */

// Import all dependencies upfront
import '../ui/custom-element';
import '../ui/components/base-panel';
import '../ui/components/welcome-dashboard';
import { initCore } from '../core/direct-core';

console.log('🐛 Web Debugger: Content bundle initializing');

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
        // Initialize core API directly - no dynamic imports needed
        console.log('🐛 Web Debugger: Initializing core...');
        debuggerApi = initCore();
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