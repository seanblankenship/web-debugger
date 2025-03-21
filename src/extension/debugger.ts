/**
 * Main script for the debugger page
 */

// Current target tab we're debugging
let targetTabId: number | null = null;

// DOM elements
const debuggerThemeSelect = document.getElementById('theme-select') as HTMLSelectElement;
const dockButton = document.getElementById('dock-button') as HTMLButtonElement;
const reloadButton = document.getElementById('reload-button') as HTMLButtonElement;
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const statusBar = document.getElementById('status-bar') as HTMLDivElement;
const tabList = document.getElementById('tab-list') as HTMLDivElement;

// Initialize
document.addEventListener('DOMContentLoaded', initialize);

/**
 * Initialize the debugger page
 */
async function initialize() {
    console.log('🐛 Web Debugger: Debugger page initializing');

    // Apply theme
    applyTheme();

    // Set up event listeners
    setupEventListeners();

    // Load tabs
    await loadBrowserTabs();

    // Load target tab
    await loadTargetTab();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Theme change
    if (debuggerThemeSelect) {
        debuggerThemeSelect.addEventListener('change', handleDebuggerThemeChange);
    }

    // Dock/undock button
    if (dockButton) {
        dockButton.addEventListener('click', handleDockToggle);
    }

    // Reload button
    if (reloadButton) {
        reloadButton.addEventListener('click', handleReloadTab);
    }

    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.getAttribute('data-tab');
            if (tab) {
                switchTab(tab);
            }
        });
    });
}

/**
 * Load target tab from storage
 */
async function loadTargetTab() {
    try {
        updateStatus('Loading target information...');

        // Tell the background script that the debugger page is loaded
        const response = await sendDebuggerMessageToBackground({
            type: 'DEBUGGER_PAGE_LOADED'
        });

        if (response.error) {
            throw new Error(response.error);
        }

        if (response.targetTab) {
            // Successfully got target tab
            targetTabId = response.targetTab.id;

            // Update UI with tab information
            updateTargetTabInfo(response.targetTab);

            updateStatus('Ready - debugging tab: ' + response.targetTab.title);
        } else {
            updateStatus('No target tab selected');
        }
    } catch (error) {
        console.error('🐛 Web Debugger: Error loading target tab:', error);
        updateStatus('Error: ' + (error instanceof Error ? error.message : String(error)));
    }
}

/**
 * Load list of all available browser tabs
 */
async function loadBrowserTabs() {
    try {
        // Get all tabs
        const tabs = await chrome.tabs.query({});

        // Filter to http/https tabs
        const browserTabs = tabs.filter(tab =>
            tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))
        );

        // Clear tab list
        if (tabList) {
            tabList.innerHTML = '';

            // Add each tab to the list
            browserTabs.forEach(tab => {
                const tabElement = document.createElement('div');
                tabElement.className = 'tab-item';
                tabElement.dataset.tabId = String(tab.id);

                // Use favicon if available
                let faviconHtml = '';
                if (tab.favIconUrl) {
                    faviconHtml = `<img src="${tab.favIconUrl}" alt="icon">`;
                }

                tabElement.innerHTML = `
                    ${faviconHtml}
                    <span class="tab-item-title">${tab.title || 'Untitled Tab'}</span>
                `;

                // Add click handler to select this tab
                tabElement.addEventListener('click', () => {
                    selectTargetTab(tab.id!);
                });

                tabList.appendChild(tabElement);
            });
        }
    } catch (error) {
        console.error('🐛 Web Debugger: Error loading browser tabs:', error);
    }
}

/**
 * Update the target tab info display
 */
function updateTargetTabInfo(tabInfo: { id: number, title?: string, url?: string, favIconUrl?: string }) {
    // Highlight the selected tab in the list
    const tabItems = document.querySelectorAll('.tab-item');
    tabItems.forEach(item => {
        const itemTabId = item.getAttribute('data-tab-id');
        if (itemTabId && parseInt(itemTabId) === tabInfo.id) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update inspector view
    // This would be implemented to show the DOM tree, etc.
}

/**
 * Select a tab as the target for debugging
 */
async function selectTargetTab(tabId: number) {
    try {
        updateStatus('Switching target tab...');

        const response = await sendDebuggerMessageToBackground({
            type: 'SELECT_TARGET_TAB',
            tabId
        });

        if (response.error) {
            throw new Error(response.error);
        }

        if (response.targetTab) {
            // Successfully switched target tab
            targetTabId = response.targetTab.id;

            // Update UI with tab information
            updateTargetTabInfo(response.targetTab);

            updateStatus('Ready - debugging tab: ' + response.targetTab.title);
        }
    } catch (error) {
        console.error('🐛 Web Debugger: Error selecting target tab:', error);
        updateStatus('Error: ' + (error instanceof Error ? error.message : String(error)));
    }
}

/**
 * Apply theme from settings
 */
function applyTheme() {
    chrome.storage.local.get('theme', (data) => {
        const theme = data.theme || 'light';

        // Update select
        if (debuggerThemeSelect) {
            debuggerThemeSelect.value = theme;
        }

        // Apply to document
        document.documentElement.setAttribute('data-theme', theme);
    });
}

/**
 * Handle theme change
 */
async function handleDebuggerThemeChange() {
    const theme = debuggerThemeSelect.value;

    // Apply theme
    document.documentElement.setAttribute('data-theme', theme);

    // Save setting
    await chrome.storage.local.set({ theme });

    // Notify background
    await sendDebuggerMessageToBackground({
        type: 'CHANGE_THEME',
        theme
    });
}

/**
 * Handle dock/undock button
 */
async function handleDockToggle() {
    // Get current window
    const currentWindow = await chrome.windows.getCurrent();

    if (currentWindow.type === 'popup') {
        // Currently in popup mode, switch to normal window
        dockButton.textContent = 'Dock to Side';

        await chrome.windows.update(currentWindow.id!, {
            state: 'normal'
        });
    } else {
        // Currently in normal mode, switch to popup
        dockButton.textContent = 'Undock';

        // Calculate position for side docking (right side of screen)
        const width = Math.min(500, window.screen.availWidth * 0.3);
        const height = window.screen.availHeight;
        const left = window.screen.availWidth - width;
        const top = 0;

        await chrome.windows.update(currentWindow.id!, {
            left,
            top,
            width,
            height
        });
    }
}

/**
 * Handle reload target tab button
 */
async function handleReloadTab() {
    if (!targetTabId) {
        updateStatus('No target tab selected');
        return;
    }

    try {
        await chrome.tabs.reload(targetTabId);
        updateStatus('Target tab reloaded');
    } catch (error) {
        console.error('🐛 Web Debugger: Error reloading tab:', error);
        updateStatus('Error reloading tab: ' + (error instanceof Error ? error.message : String(error)));
    }
}

/**
 * Switch between tabs in the UI
 */
function switchTab(tabName: string) {
    // Update tab buttons
    tabButtons.forEach(button => {
        if (button.getAttribute('data-tab') === tabName) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });

    // Update tab contents
    tabContents.forEach(content => {
        if (content.id === `${tabName}-tab`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

/**
 * Update status bar message
 */
function updateStatus(message: string) {
    if (statusBar) {
        statusBar.textContent = message;
    }
}

/**
 * Send a message to the background script and get response
 */
function sendDebuggerMessageToBackground(message: any): Promise<any> {
    return new Promise((resolve, reject) => {
        try {
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message || 'Unknown error'));
                } else if (response && response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response || {});
                }
            });
        } catch (error) {
            reject(error);
        }
    });
} 