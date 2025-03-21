/**
 * Popup script for the Web Debugger extension
 */

// Wait for DOM content to load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🐛 Web Debugger Popup: Initialized');

    // Get toggle button element
    const toggleButton = document.getElementById('toggle-debugger');

    // Add click event listener to toggle button
    if (toggleButton) {
        console.log('🐛 Web Debugger Popup: Toggle button found');

        toggleButton.addEventListener('click', () => {
            console.log('🐛 Web Debugger Popup: Toggle button clicked');

            // Show loading state
            toggleButton.textContent = 'Loading...';
            toggleButton.setAttribute('disabled', 'true');

            // Clear previous error message
            const errorElement = document.getElementById('error-message');
            if (errorElement) {
                errorElement.style.display = 'none';
                errorElement.textContent = '';
            }

            // Send toggle message to background script
            chrome.runtime.sendMessage({ action: 'toggle-debugger' }, (response) => {
                console.log('🐛 Web Debugger Popup: Toggle message response:', response);

                // Reset button state
                toggleButton.textContent = 'Toggle Debugger';
                toggleButton.removeAttribute('disabled');

                // Check for error in response
                if (response && response.error) {
                    console.error('�� Web Debugger Popup: Error from background script:', response.error);
                    showError(response.error);
                    return;
                }

                // Close popup after a brief delay to ensure message is processed
                setTimeout(() => {
                    window.close();
                }, 200);
            });

            console.log('🐛 Web Debugger Popup: Toggle message sent');
        });
    } else {
        console.error('🐛 Web Debugger Popup: Toggle button not found');
    }

    // Check for theme preference in storage
    chrome.storage.local.get(['theme'], (result) => {
        const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;

        if (themeSelect) {
            console.log('🐛 Web Debugger Popup: Theme select found');

            // Set select value based on stored theme
            if (result.theme) {
                console.log('🐛 Web Debugger Popup: Using stored theme:', result.theme);
                themeSelect.value = result.theme;
            }

            // Listen for theme changes
            themeSelect.addEventListener('change', () => {
                const theme = themeSelect.value as 'light' | 'dark';
                console.log('🐛 Web Debugger Popup: Theme changed to:', theme);

                // Save theme preference
                chrome.storage.local.set({ theme });

                // Send theme change message
                chrome.runtime.sendMessage({
                    action: 'set-theme',
                    theme
                }, (response) => {
                    // Check for error in response
                    if (response && response.error) {
                        console.error('🐛 Web Debugger Popup: Error from background script:', response.error);
                        showError(response.error);
                    }
                });

                console.log('🐛 Web Debugger Popup: Theme message sent');
            });
        } else {
            console.error('🐛 Web Debugger Popup: Theme select not found');
        }
    });

    // Create error message element if it doesn't exist
    if (!document.getElementById('error-message')) {
        const errorElement = document.createElement('div');
        errorElement.id = 'error-message';
        errorElement.style.display = 'none';
        errorElement.style.color = '#e74c3c';
        errorElement.style.marginTop = '10px';
        errorElement.style.padding = '10px';
        errorElement.style.border = '1px solid #e74c3c';
        errorElement.style.borderRadius = '4px';
        errorElement.style.fontSize = '12px';

        const container = document.querySelector('.popup-container');
        if (container) {
            container.appendChild(errorElement);
        }
    }
});

// Helper function to show error message
function showError(message: string) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
} 