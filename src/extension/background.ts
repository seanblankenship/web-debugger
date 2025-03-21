/**
 * Background script for the Web Debugger extension
 */

// Listen for extension installation or update
chrome.runtime.onInstalled.addListener(() => {
    console.log('🐛 Web Debugger: Extension installed or updated');
});

// Keep track of tabs where we've successfully injected the content script
const injectedTabs = new Set<number>();

// Listen for message from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('🐛 Web Debugger Background: Message received', request);

    // Forward messages to the active tab
    if (request.action === 'toggle-debugger' || request.action === 'set-theme') {
        findEligibleTab().then(tabId => {
            if (!tabId) {
                sendResponse({
                    error: 'No eligible tabs found. Please open a regular webpage.'
                });
                return;
            }

            ensureContentScriptLoaded(tabId)
                .then(() => {
                    return sendMessageToTab(tabId, request);
                })
                .then(response => {
                    console.log('🐛 Web Debugger Background: Message sent successfully, response:', response);
                    sendResponse(response);
                })
                .catch(error => {
                    console.error('🐛 Web Debugger Background: Error:', error);
                    sendResponse({ error: error.message || 'Connection failed. Try reloading the page.' });
                });
        });

        // Return true to indicate we'll send an async response
        return true;
    }

    // Return false for synchronous response
    return false;
});

/**
 * Find a tab that's eligible for content script injection
 */
async function findEligibleTab(): Promise<number | null> {
    return new Promise(resolve => {
        chrome.tabs.query({}, (allTabs) => {
            console.log(`🐛 Web Debugger Background: Found ${allTabs.length} total tabs`);

            // Filter to tabs that can have content scripts injected
            const eligibleTabs = allTabs.filter(tab =>
                tab.url &&
                !tab.url.startsWith('chrome://') &&
                !tab.url.startsWith('chrome-extension://') &&
                !tab.url.startsWith('about:') &&
                !tab.url.startsWith('edge:')
            );

            console.log(`🐛 Web Debugger Background: Found ${eligibleTabs.length} eligible tabs:`,
                eligibleTabs.map(t => ({ id: t.id, url: t.url?.substring(0, 30) + '...' }))
            );

            if (eligibleTabs.length === 0) {
                resolve(null);
                return;
            }

            // First try to find the active tab in the current window
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs.length > 0 && isEligibleTab(tabs[0]) && tabs[0].id) {
                    console.log(`🐛 Web Debugger Background: Using active tab ${tabs[0].id}`);
                    resolve(tabs[0].id);
                } else {
                    // Fall back to first eligible tab
                    const firstEligible = eligibleTabs[0];
                    if (firstEligible && firstEligible.id) {
                        console.log(`🐛 Web Debugger Background: Using eligible tab ${firstEligible.id}`);
                        // Activate the tab so the user can see it
                        chrome.tabs.update(firstEligible.id, { active: true });
                        resolve(firstEligible.id);
                    } else {
                        resolve(null);
                    }
                }
            });
        });
    });
}

/**
 * Check if a tab is eligible for content script injection
 */
function isEligibleTab(tab: chrome.tabs.Tab): boolean {
    if (!tab.url) return false;

    return !(
        tab.url.startsWith('chrome://') ||
        tab.url.startsWith('chrome-extension://') ||
        tab.url.startsWith('about:') ||
        tab.url.startsWith('edge:') ||
        tab.url.startsWith('file:')
    );
}

/**
 * Check if content script is already loaded and initialize it if needed
 */
async function ensureContentScriptLoaded(tabId: number): Promise<void> {
    // If we've already injected, just return
    if (injectedTabs.has(tabId)) {
        console.log(`🐛 Web Debugger Background: Content script already injected in tab ${tabId}`);
        return Promise.resolve();
    }

    try {
        // First check if content script already exists by sending a ping
        const exists = await pingContentScript(tabId);
        if (exists) {
            console.log(`🐛 Web Debugger Background: Content script already loaded in tab ${tabId}`);
            injectedTabs.add(tabId);
            return Promise.resolve();
        }

        // Don't try to inject the content-loader as it's already declared in the manifest
        // and should be auto-injected. Instead, we'll try to directly inject our content script
        console.log(`🐛 Web Debugger Background: Content script not loaded, trying direct injection in tab ${tabId}`);

        try {
            // First, try injecting directly with the content.js script
            await chrome.scripting.executeScript({
                target: { tabId },
                files: ['js/content.js']
                // Don't specify world, use default
            });

            console.log('🐛 Web Debugger Background: Direct content script injection attempted');

            // Wait for script to initialize
            await new Promise(resolve => setTimeout(resolve, 500));

            // Verify injection worked
            const pingResult = await pingContentScript(tabId);
            if (pingResult) {
                console.log(`🐛 Web Debugger Background: Content script successfully initialized`);
                injectedTabs.add(tabId);
                return Promise.resolve();
            }

            // If direct injection didn't work, try with a custom injection approach
            console.log(`🐛 Web Debugger Background: Direct injection failed, trying alternative approach...`);

            // Create a function to be injected into the page to load our script
            await chrome.scripting.executeScript({
                target: { tabId },
                func: function () {
                    // This runs in the page context and logs to the page's console
                    console.log('🐛 Web Debugger Page: Manual content script loader executing');

                    // Create element to load our script
                    const script = document.createElement('script');
                    script.src = chrome.runtime.getURL('js/content.js');
                    script.type = 'module';
                    document.head.appendChild(script);

                    // Create element that will respond to pings from the extension
                    const pingResponder = document.createElement('div');
                    pingResponder.id = 'web-debugger-ping-responder';
                    pingResponder.style.display = 'none';
                    document.body.appendChild(pingResponder);

                    console.log('🐛 Web Debugger Page: Manual injection completed');
                },
                world: 'MAIN'  // This must run in the main world to access the page DOM
            });

            console.log('🐛 Web Debugger Background: Alternative injection approach executed');

            // Wait for script to initialize
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Final check - sometimes it takes a moment for listeners to be registered
            const finalCheck = await pingContentScript(tabId);
            if (finalCheck) {
                console.log(`🐛 Web Debugger Background: Content script successfully initialized after alternative approach`);
                injectedTabs.add(tabId);
                return Promise.resolve();
            }
        } catch (error) {
            console.error(`🐛 Web Debugger Background: Error during script injection:`, error);
            throw new Error(`Script injection failed: ${error instanceof Error ? error.message : String(error)}`);
        }

        throw new Error('Content script could not be initialized after multiple attempts');
    } catch (error) {
        console.error(`🐛 Web Debugger Background: Error injecting content script:`, error);
        throw error;
    }
}

/**
 * Ping the content script to see if it's loaded
 */
async function pingContentScript(tabId: number): Promise<boolean> {
    console.log(`🐛 Web Debugger Background: Pinging content script in tab ${tabId}...`);

    return new Promise<boolean>(resolve => {
        try {
            const timeoutId = setTimeout(() => {
                console.log(`🐛 Web Debugger Background: Ping timed out after 1000ms`);
                resolve(false);
            }, 1000);

            chrome.tabs.sendMessage(tabId, { type: 'PING', timestamp: Date.now() }, response => {
                clearTimeout(timeoutId);

                if (chrome.runtime.lastError) {
                    // Ignore error, this just means the content script isn't loaded yet
                    console.log(`🐛 Web Debugger Background: Ping failed (expected): ${chrome.runtime.lastError.message}`);
                    resolve(false);
                } else if (response && response.status === 'PONG') {
                    console.log(`🐛 Web Debugger Background: Ping successful, content script is loaded`);
                    resolve(true);
                } else {
                    console.log(`🐛 Web Debugger Background: Ping received unknown response:`, response);
                    resolve(false);
                }
            });
        } catch (error) {
            console.error(`🐛 Web Debugger Background: Error during ping:`, error);
            resolve(false);
        }
    });
}

/**
 * Send a message to a tab with retry
 */
async function sendMessageToTab(tabId: number, message: any): Promise<any> {
    const MAX_RETRIES = 2;
    let lastError = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`🐛 Web Debugger Background: Sending message to tab ${tabId} (attempt ${attempt + 1}):`, message);

            return await new Promise((resolve, reject) => {
                chrome.tabs.sendMessage(tabId, message, response => {
                    if (chrome.runtime.lastError) {
                        const errorMsg = chrome.runtime.lastError.message || 'Connection failed';
                        console.error(`🐛 Web Debugger Background: Chrome runtime error:`, errorMsg);
                        reject(new Error(errorMsg));
                    } else if (response && response.error) {
                        console.error(`🐛 Web Debugger Background: Error response from content script:`, response.error);
                        reject(new Error(response.error));
                    } else {
                        console.log(`🐛 Web Debugger Background: Message sent successfully, response:`, response);
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