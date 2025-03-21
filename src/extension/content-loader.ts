/**
 * Lightweight content script loader
 * This runs at document_start and ensures our main content script loads properly
 * bypassing potential CSP issues
 */

console.log('🐛 Web Debugger Loader: Script loaded');

// Define interface for message event data
interface WebDebuggerMessageEvent {
    data?: {
        source?: string;
        response?: any;
        payload?: any;
    };
}

// Flag to track if we've initiated communication already
let hasInitiatedCommunication = false;
let contentScriptLoaded = false;

// Set up message listener right away
console.log('🐛 Web Debugger Loader: Setting up message listener');
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('🐛 Web Debugger Loader: Received message:', message);

    // Immediately respond to PING messages
    if (message && message.type === 'PING') {
        console.log('🐛 Web Debugger Loader: Received PING, responding with PONG');
        sendResponse({ status: 'PONG', source: 'loader' });
        return true;
    }

    // Forward other messages to content script if loaded
    if (contentScriptLoaded) {
        forwardMessageToContentScript(message, sendResponse);
        return true; // Keep the message channel open for async response
    } else {
        console.warn('🐛 Web Debugger Loader: Content script not loaded, cannot process message');
        sendResponse({ error: 'Content script not loaded yet' });
        return false;
    }
});

// Function to inject our main content script directly
function injectContentScript() {
    console.log('🐛 Web Debugger Loader: Injecting main content script...');

    try {
        // Create a script element to load our main content script
        const script = document.createElement('script');

        // Get the URL of our content script
        const scriptURL = chrome.runtime.getURL('js/content.js');
        console.log('🐛 Web Debugger Loader: Content script URL:', scriptURL);

        script.src = scriptURL;
        script.type = 'module';

        // Listen for load event to know when script is ready
        script.onload = () => {
            console.log('🐛 Web Debugger Loader: Content script loaded successfully');
            contentScriptLoaded = true;
        };

        script.onerror = (error) => {
            console.error('🐛 Web Debugger Loader: Failed to load content script:', error);
        };

        // Append to document to start loading
        (document.head || document.documentElement).appendChild(script);

        // Some browsers will remove the script tag after it loads
        // so we don't need to clean it up ourselves

        console.log('🐛 Web Debugger Loader: Content script injection initiated');
    } catch (error) {
        console.error('🐛 Web Debugger Loader: Error injecting content script:', error);
    }
}

// Forward messages from extension to content script
function forwardMessageToContentScript(message: any, sendResponse: (response?: any) => void) {
    // Only forward if content script should be loaded
    if (!contentScriptLoaded) {
        console.warn('🐛 Web Debugger Loader: Content script not loaded yet, cannot forward message');
        sendResponse({ error: 'Content script not loaded yet' });
        return;
    }

    console.log('🐛 Web Debugger Loader: Forwarding message to content script:', message);

    // Create a unique ID for this request to match responses
    const requestId = Date.now().toString() + Math.random().toString().slice(2);

    // Set up listener for response from content script
    const messageListener = (event: WebDebuggerMessageEvent) => {
        // Ensure the message is from our content script
        if (
            event?.data?.source === 'web-debugger-content-script' &&
            event?.data?.response
        ) {
            console.log('🐛 Web Debugger Loader: Received response from content script:', event.data.response);

            // Remove the listener after processing
            window.removeEventListener('message', messageListener);

            // Send response back to extension
            sendResponse(event.data.response);
        }
    };

    // Add listener for content script response
    window.addEventListener('message', messageListener);

    // Send the message to the content script
    window.postMessage(
        {
            source: 'web-debugger-loader',
            payload: message,
            requestId
        },
        window.location.origin
    );
}

// Initialize on document_start
(function () {
    console.log('🐛 Web Debugger Loader: Initializing...');

    // Initialize content script when document is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectContentScript);
    } else {
        injectContentScript();
    }
})(); 