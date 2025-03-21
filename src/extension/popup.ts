/**
 * Popup script for Web Debugger extension
 */

console.log('🐛 Web Debugger Popup: Initialized');

// Get elements
const toggleButton = document.getElementById('toggle-debugger');
console.log('🐛 Web Debugger Popup: Toggle button found', !!toggleButton);

// Set up click handler for the toggle button
if (toggleButton) {
    toggleButton.addEventListener('click', async () => {
        console.log('🐛 Web Debugger Popup: Toggle button clicked');

        try {
            const response = await sendMessageToBackground({
                type: 'TOGGLE_DEBUGGER'
            });

            console.log('🐛 Web Debugger Popup: Toggle message response:', response);

            if (response.error) {
                showError(`Error from background script: ${response.error}`);
            }
        } catch (error) {
            console.error('🐛 Web Debugger Popup: Error sending toggle message:', error);
            showError(`Error: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
}

// Theme selector
const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
console.log('🐛 Web Debugger Popup: Theme select found', !!themeSelect);

if (themeSelect) {
    // Initial theme
    chrome.storage.local.get('theme', (data) => {
        const savedTheme = data.theme || 'light';
        console.log('🐛 Web Debugger Popup: Using stored theme:', savedTheme);
        themeSelect.value = savedTheme;
    });

    // Theme change handler
    themeSelect.addEventListener('change', async () => {
        const theme = themeSelect.value;
        console.log('🐛 Web Debugger Popup: Theme changed to:', theme);

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