/**
 * Background script for Web Debugger extension
 */

// Track the active debugger window
let debuggerWindowId: number | null = null;

// On install or update
chrome.runtime.onInstalled.addListener(() => {
    console.log('🐛 Web Debugger: Extension installed or updated');
});

// Listen for action button clicks
chrome.action.onClicked.addListener((tab) => {
    handleActionClick(tab);
});

// Listen for messages from popup or debugger page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('🐛 Web Debugger Background: Message received', message);

    // Handle debugger page opening/updating
    if (message.type === 'DEBUGGER_PAGE_LOADED') {
        handleDebuggerPageLoaded(message, sender, sendResponse);
        return true;
    }

    // Handle theme changes
    if (message.type === 'CHANGE_THEME') {
        handleThemeChangeMessage(message.theme, sendResponse);
        return true;
    }

    // Handle tab selection
    if (message.type === 'SELECT_TARGET_TAB') {
        handleSelectTargetTab(message.tabId, sendResponse);
        return true;
    }

    // Unhandled message
    sendResponse({ error: 'Unknown message type' });
    return false;
});

// When a window is closed, check if it was our debugger window
chrome.windows.onRemoved.addListener((windowId) => {
    if (windowId === debuggerWindowId) {
        console.log('🐛 Web Debugger Background: Debugger window closed');
        debuggerWindowId = null;
    }
});

/**
 * Handle action button click
 */
async function handleActionClick(tab: chrome.tabs.Tab) {
    console.log('🐛 Web Debugger Background: Action button clicked for tab', tab.id);

    try {
        // Check if we already have a debugger window open
        if (debuggerWindowId !== null) {
            try {
                // Focus the existing window
                await chrome.windows.update(debuggerWindowId, { focused: true });
                return;
            } catch (error) {
                // Window might no longer exist
                console.log('🐛 Web Debugger Background: Could not focus existing window, creating new one');
                debuggerWindowId = null;
            }
        }

        // Store the active tab ID - this is the tab we want to debug
        const targetTabId = tab.id;
        if (!targetTabId) {
            throw new Error('No active tab ID found');
        }

        // Store the target tab ID in local storage
        await chrome.storage.local.set({ targetTabId });

        // Create a new popup window with our debugger page
        const screenWidth = window.screen.availWidth;
        const screenHeight = window.screen.availHeight;
        const width = Math.min(1000, screenWidth * 0.8);
        const height = Math.min(800, screenHeight * 0.8);
        const left = Math.floor((screenWidth - width) / 2);
        const top = Math.floor((screenHeight - height) / 2);

        const newWindow = await chrome.windows.create({
            url: chrome.runtime.getURL('debugger.html'),
            type: 'popup',
            width,
            height,
            left,
            top
        });

        // Store the window ID for later
        debuggerWindowId = newWindow.id || null;
        console.log('🐛 Web Debugger Background: Created new debugger window with ID', debuggerWindowId);

    } catch (error) {
        console.error('🐛 Web Debugger Background: Error opening debugger window:', error);
    }
}

/**
 * Handle debugger page loaded message
 */
async function handleDebuggerPageLoaded(message: any, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) {
    try {
        // Get the target tab we want to debug (stored when action button was clicked)
        const data = await chrome.storage.local.get('targetTabId');
        const targetTabId = data.targetTabId;

        if (!targetTabId) {
            throw new Error('No target tab ID found in storage');
        }

        // Get information about the tab
        const tab = await chrome.tabs.get(targetTabId);

        // Check if the tab still exists and is valid
        if (!tab || chrome.runtime.lastError) {
            throw new Error('Target tab no longer exists');
        }

        // Send back information about the target tab
        sendResponse({
            success: true,
            targetTab: {
                id: tab.id,
                title: tab.title,
                url: tab.url,
                favIconUrl: tab.favIconUrl
            }
        });
    } catch (error) {
        console.error('🐛 Web Debugger Background: Error handling debugger page loaded:', error);
        sendResponse({ error: error instanceof Error ? error.message : String(error) });
    }
}

/**
 * Handle theme change request
 */
async function handleThemeChangeMessage(theme: string, sendResponse: (response: any) => void) {
    try {
        // Save the theme setting
        await chrome.storage.local.set({ theme });
        sendResponse({ success: true, theme });
    } catch (error) {
        console.error('🐛 Web Debugger Background: Error saving theme:', error);
        sendResponse({ error: error instanceof Error ? error.message : String(error) });
    }
}

/**
 * Handle selecting a target tab for debugging
 */
async function handleSelectTargetTab(tabId: number, sendResponse: (response: any) => void) {
    try {
        // Get the tab info
        const tab = await chrome.tabs.get(tabId);

        // Store this as the new target tab
        await chrome.storage.local.set({ targetTabId: tabId });

        // Send back the tab info
        sendResponse({
            success: true,
            targetTab: {
                id: tab.id,
                title: tab.title,
                url: tab.url,
                favIconUrl: tab.favIconUrl
            }
        });
    } catch (error) {
        console.error('🐛 Web Debugger Background: Error selecting tab:', error);
        sendResponse({ error: error instanceof Error ? error.message : String(error) });
    }
} 