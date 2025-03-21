/**
 * Background script for Web Debugger extension
 */

// Track tabs that have the debugger active
const activeTabs = new Set<number>();

// On install or update
chrome.runtime.onInstalled.addListener(() => {
    console.log('🐛 Web Debugger: Extension installed or updated');
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('🐛 Web Debugger Background: Message received', message);

    try {
        if (message.type === 'TOGGLE_DEBUGGER') {
            handleToggleDebugger(sendResponse);
            return true;  // Keep the message channel open for async response
        }

        if (message.type === 'CHANGE_THEME') {
            handleThemeChange(message.theme, sendResponse);
            return true;  // Keep the message channel open for async response
        }

        // Unhandled message
        console.warn('🐛 Web Debugger Background: Unhandled message type:', message.type);
        sendResponse({ error: 'Unhandled message type' });
    } catch (error) {
        console.error('🐛 Web Debugger Background: Error:', error);
        sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
    }

    return false;  // No async response expected
});

/**
 * Handle debugger toggle request from popup
 */
async function handleToggleDebugger(sendResponse: (response: any) => void) {
    try {
        // Get the currently active tab
        const tab = await getActiveTab();
        if (!tab || !tab.id) {
            throw new Error('No active tab found');
        }

        console.log(`🐛 Web Debugger Background: Using active tab ${tab.id}`);

        // Check if content script is responding
        const contentScriptReady = await isContentScriptReady(tab.id);
        if (!contentScriptReady) {
            throw new Error('Content script not available on this page');
        }

        // Send toggle message to content script
        const response = await sendMessageToTab(tab.id, { type: 'TOGGLE_DEBUGGER' });

        // Update active tabs tracking
        if (response.active) {
            activeTabs.add(tab.id);
        } else {
            activeTabs.delete(tab.id);
        }

        sendResponse(response);
    } catch (error) {
        console.error('🐛 Web Debugger Background: Toggle error:', error);
        sendResponse({ error: error instanceof Error ? error.message : String(error) });
    }
}

/**
 * Handle theme change request from popup
 */
async function handleThemeChange(theme: string, sendResponse: (response: any) => void) {
    try {
        // Get all tabs with the debugger active
        const eligibleTabs = await getEligibleTabs();
        console.log(`🐛 Web Debugger Background: Found ${eligibleTabs.length} eligible tabs:`, eligibleTabs);

        // Send the theme change to all active tabs
        const results = await Promise.all(
            eligibleTabs.map(async (tabId) => {
                try {
                    const contentScriptReady = await isContentScriptReady(tabId);
                    if (contentScriptReady) {
                        return sendMessageToTab(tabId, { type: 'CHANGE_THEME', theme });
                    }
                    return { tabId, error: 'Content script not ready' };
                } catch (error) {
                    return {
                        tabId,
                        error: error instanceof Error ? error.message : String(error)
                    };
                }
            })
        );

        // Send combined results
        sendResponse({
            success: true,
            theme,
            results
        });
    } catch (error) {
        console.error('🐛 Web Debugger Background: Theme change error:', error);
        sendResponse({ error: error instanceof Error ? error.message : String(error) });
    }
}

/**
 * Get the active tab if it's eligible for the debugger
 */
async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
    // Get active tab in current window
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) {
        console.log('🐛 Web Debugger Background: No active tab found');
        return null;
    }

    const tab = tabs[0];

    // Check if tab is eligible (http/https)
    if (!tab.url || !(tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
        console.log(`🐛 Web Debugger Background: Active tab not eligible - ${tab.url}`);
        return null;
    }

    return tab;
}

/**
 * Get all tabs that are eligible for the debugger
 */
async function getEligibleTabs(): Promise<number[]> {
    // Get all tabs (we'll filter to HTTP/HTTPS)
    const tabs = await chrome.tabs.query({});

    console.log(`🐛 Web Debugger Background: Found ${tabs.length} total tabs`);

    // Filter to only HTTP/HTTPS tabs with IDs
    const eligibleTabs = tabs
        .filter(tab => tab.id && tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://')))
        .map(tab => tab.id as number);

    console.log(`🐛 Web Debugger Background: Found ${eligibleTabs.length} eligible tabs:`, eligibleTabs);

    return eligibleTabs;
}

/**
 * Check if content script is ready in a tab
 */
async function isContentScriptReady(tabId: number): Promise<boolean> {
    console.log(`🐛 Web Debugger Background: Checking if content script is ready in tab ${tabId}`);

    return new Promise<boolean>((resolve) => {
        const timeoutId = setTimeout(() => {
            console.log(`🐛 Web Debugger Background: Ping timed out after 1000ms`);
            resolve(false);
        }, 1000);

        chrome.tabs.sendMessage(tabId, { type: 'PING' }, (response) => {
            clearTimeout(timeoutId);

            if (chrome.runtime.lastError) {
                console.log(`🐛 Web Debugger Background: Content script not ready: ${chrome.runtime.lastError.message}`);
                resolve(false);
                return;
            }

            if (response && response.status === 'PONG') {
                console.log(`🐛 Web Debugger Background: Content script is ready`);
                resolve(true);
                return;
            }

            console.log(`🐛 Web Debugger Background: Unexpected response:`, response);
            resolve(false);
        });
    });
}

/**
 * Send a message to a tab with retry
 */
async function sendMessageToTab(tabId: number, message: any): Promise<any> {
    console.log(`🐛 Web Debugger Background: Sending message to tab ${tabId}:`, message);

    const MAX_RETRIES = 2;
    let lastError = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            return await new Promise((resolve, reject) => {
                chrome.tabs.sendMessage(tabId, message, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message || 'Connection failed'));
                    } else if (response && response.error) {
                        reject(new Error(response.error));
                    } else {
                        resolve(response || { success: true });
                    }
                });
            });
        } catch (error) {
            console.log(`🐛 Web Debugger Background: Send message attempt ${attempt + 1} failed:`, error);
            lastError = error;

            // If not the last attempt, wait before retrying
            if (attempt < MAX_RETRIES) {
                const delay = 200 * Math.pow(2, attempt);
                console.log(`🐛 Web Debugger Background: Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError || new Error('Failed to send message after retries');
} 