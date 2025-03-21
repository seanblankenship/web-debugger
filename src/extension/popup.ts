/**
 * Popup script for Web Debugger extension
 */

console.log('🐛 Web Debugger Popup: Initialized');

// Get elements
const openDebuggerButton = document.getElementById('open-debugger');
console.log('🐛 Web Debugger Popup: Open debugger button found', !!openDebuggerButton);

// Theme selector
const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
console.log('🐛 Web Debugger Popup: Theme select found', !!themeSelect);

// Initialize settings
initializeSettings();

// Set up button click handlers
if (openDebuggerButton) {
    openDebuggerButton.addEventListener('click', async () => {
        console.log('🐛 Web Debugger Popup: Open debugger button clicked');

        try {
            // Get the active tab
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!activeTab || !activeTab.id) {
                throw new Error('No active tab found');
            }

            // Store this as the target tab
            await chrome.storage.local.set({ targetTabId: activeTab.id });

            // Open the debugger page in a new window
            const screenWidth = window.screen.availWidth;
            const screenHeight = window.screen.availHeight;
            const width = Math.min(1000, screenWidth * 0.8);
            const height = Math.min(800, screenHeight * 0.8);
            const left = Math.floor((screenWidth - width) / 2);
            const top = Math.floor((screenHeight - height) / 2);

            await chrome.windows.create({
                url: chrome.runtime.getURL('debugger.html'),
                type: 'popup',
                width,
                height,
                left,
                top
            });

            // Close the popup
            window.close();

        } catch (error) {
            console.error('🐛 Web Debugger Popup: Error opening debugger:', error);
            showError(`Error: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
}

/**
 * Initialize settings from storage
 */
async function initializeSettings() {
    if (themeSelect) {
        // Initial theme
        chrome.storage.local.get('theme', (data) => {
            const savedTheme = data.theme || 'light';
            console.log('🐛 Web Debugger Popup: Using stored theme:', savedTheme);
            themeSelect.value = savedTheme;

            // Apply theme to document
            document.documentElement.setAttribute('data-theme', savedTheme);
        });

        // Theme change handler
        themeSelect.addEventListener('change', async () => {
            const theme = themeSelect.value;
            console.log('🐛 Web Debugger Popup: Theme changed to:', theme);

            // Apply theme to document
            document.documentElement.setAttribute('data-theme', theme);

            // Save to storage
            chrome.storage.local.set({ theme });

            try {
                const response = await sendMessageToBackground({
                    type: 'CHANGE_THEME',
                    theme
                });

                console.log('🐛 Web Debugger Popup: Theme message sent', response);

                if (response.error) {
                    showError(`Error from background script: ${response.error}`);
                }
            } catch (error) {
                console.error('🐛 Web Debugger Popup: Error sending theme change:', error);
                showError(`Error: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
}

/**
 * Send a message to the background script
 */
function sendMessageToBackground(message: any): Promise<any> {
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

/**
 * Show an error message in the popup
 */
function showError(message: string) {
    console.log('🐛 Web Debugger Popup:', message);

    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
} 