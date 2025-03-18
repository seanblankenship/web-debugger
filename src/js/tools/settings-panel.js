/**
 * Settings Panel Tool
 * Provides a global configuration panel for all tools
 */
import BaseTool from '../tools/base-tool.js';

export class SettingsPanel extends BaseTool {
    /**
     * Create a new SettingsPanel
     * @param {Object} config - Configuration options
     * @param {Object} config.ui - UI manager
     * @param {Object} config.storage - Storage manager
     */
    constructor(config = {}) {
        super(config);

        this.name = 'Settings';
        this.icon = 'settings';
        this.id = 'settingsPanel';
        this.description = 'Configure global settings for the debugger';

        // Default settings
        this.settings = {
            general: {
                startMinimized: this.getSetting(
                    'general.startMinimized',
                    false
                ),
                enableKeyboardShortcuts: this.getSetting(
                    'general.enableKeyboardShortcuts',
                    true
                ),
                autoHideOnInactive: this.getSetting(
                    'general.autoHideOnInactive',
                    false
                ),
                inactivityTimeout: this.getSetting(
                    'general.inactivityTimeout',
                    30
                ),
                position: this.getSetting('general.position', 'top-right'),
                showTooltips: this.getSetting('general.showTooltips', true),
            },
            appearance: {
                theme: this.getSetting('appearance.theme', 'mocha'),
                fontSize: this.getSetting('appearance.fontSize', 'medium'),
                panelWidth: this.getSetting('appearance.panelWidth', 350),
                maxPanelHeight: this.getSetting(
                    'appearance.maxPanelHeight',
                    500
                ),
            },
            tools: {
                activeByDefault: this.getSetting('tools.activeByDefault', []),
                favoriteTools: this.getSetting('tools.favoriteTools', []),
            },
        };

        this.initialized = false;
    }

    /**
     * Initialize the tool
     */
    init() {
        if (this.initialized) {
            return;
        }

        if (!this.panel) {
            this.panel = document.createElement('div');
            this.panel.className = 'settings-panel panel';
        }

        this.render();
        this.initialized = true;
    }

    /**
     * Render the UI
     */
    render() {
        if (!this.panel) {
            this.panel = document.createElement('div');
            this.panel.className = 'settings-panel panel';
        }

        this.panel.innerHTML = '';

        // Create header
        const header = document.createElement('div');
        header.className = 'panel-header';
        header.innerHTML = `<h3>${this.name}</h3>`;
        this.panel.appendChild(header);

        // Create content
        const content = document.createElement('div');
        content.className = 'panel-content';

        // Create settings tabs
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'settings-tabs';

        const tabs = ['General', 'Appearance', 'Tools', 'Keyboard', 'About'];
        const tabsNav = document.createElement('div');
        tabsNav.className = 'tabs-nav';

        tabs.forEach((tabName, index) => {
            const tabButton = document.createElement('button');
            tabButton.className = 'tab-button';
            tabButton.textContent = tabName;
            tabButton.dataset.tab = tabName.toLowerCase();

            if (index === 0) {
                tabButton.classList.add('active');
            }

            tabButton.addEventListener('click', () => {
                // Update active tab
                document.querySelectorAll('.tab-button').forEach((btn) => {
                    btn.classList.remove('active');
                });
                tabButton.classList.add('active');

                // Show corresponding tab content
                document.querySelectorAll('.tab-content').forEach((content) => {
                    content.style.display = 'none';
                });
                document.getElementById(
                    `${tabName.toLowerCase()}-tab`
                ).style.display = 'block';
            });

            tabsNav.appendChild(tabButton);
        });

        tabsContainer.appendChild(tabsNav);

        // Tab contents
        const tabContents = document.createElement('div');
        tabContents.className = 'tab-contents';

        // General settings tab
        const generalTab = document.createElement('div');
        generalTab.className = 'tab-content';
        generalTab.id = 'general-tab';
        generalTab.style.display = 'block';

        generalTab.innerHTML = `
            <div class="settings-section">
                <h4>Behavior</h4>
                <div class="settings-group">
                    <div class="setting-item">
                        <label for="start-minimized">
                            <input type="checkbox" id="start-minimized" ${
                                this.settings.general.startMinimized
                                    ? 'checked'
                                    : ''
                            }>
                            Start minimized
                        </label>
                    </div>
                    <div class="setting-item">
                        <label for="enable-shortcuts">
                            <input type="checkbox" id="enable-shortcuts" ${
                                this.settings.general.enableKeyboardShortcuts
                                    ? 'checked'
                                    : ''
                            }>
                            Enable keyboard shortcuts
                        </label>
                    </div>
                    <div class="setting-item">
                        <label for="auto-hide">
                            <input type="checkbox" id="auto-hide" ${
                                this.settings.general.autoHideOnInactive
                                    ? 'checked'
                                    : ''
                            }>
                            Auto-hide when inactive
                        </label>
                    </div>
                    <div class="setting-item">
                        <label for="inactivity-timeout">
                            Inactivity timeout (seconds):
                            <input type="number" id="inactivity-timeout" min="5" max="300" step="5" value="${
                                this.settings.general.inactivityTimeout
                            }">
                        </label>
                    </div>
                </div>
            </div>
            <div class="settings-section">
                <h4>Position</h4>
                <div class="settings-group">
                    <div class="setting-item">
                        <label for="position">Debugger Position:</label>
                        <select id="position">
                            <option value="top-right" ${
                                this.settings.general.position === 'top-right'
                                    ? 'selected'
                                    : ''
                            }>Top Right</option>
                            <option value="top-left" ${
                                this.settings.general.position === 'top-left'
                                    ? 'selected'
                                    : ''
                            }>Top Left</option>
                            <option value="bottom-right" ${
                                this.settings.general.position ===
                                'bottom-right'
                                    ? 'selected'
                                    : ''
                            }>Bottom Right</option>
                            <option value="bottom-left" ${
                                this.settings.general.position === 'bottom-left'
                                    ? 'selected'
                                    : ''
                            }>Bottom Left</option>
                        </select>
                    </div>
                </div>
            </div>
        `;

        // Appearance settings tab
        const appearanceTab = document.createElement('div');
        appearanceTab.className = 'tab-content';
        appearanceTab.id = 'appearance-tab';
        appearanceTab.style.display = 'none';

        appearanceTab.innerHTML = `
            <div class="settings-section">
                <h4>Theme</h4>
                <div class="settings-group">
                    <div class="setting-item">
                        <label for="theme">Theme:</label>
                        <select id="theme">
                            <option value="latte" ${
                                this.settings.appearance.theme === 'latte'
                                    ? 'selected'
                                    : ''
                            }>Catppuccin Latte (Light)</option>
                            <option value="frappe" ${
                                this.settings.appearance.theme === 'frappe'
                                    ? 'selected'
                                    : ''
                            }>Catppuccin Frappe</option>
                            <option value="macchiato" ${
                                this.settings.appearance.theme === 'macchiato'
                                    ? 'selected'
                                    : ''
                            }>Catppuccin Macchiato</option>
                            <option value="mocha" ${
                                this.settings.appearance.theme === 'mocha'
                                    ? 'selected'
                                    : ''
                            }>Catppuccin Mocha (Dark)</option>
                        </select>
                    </div>
                </div>
                <div class="theme-preview">
                    <div class="theme-preview-item"></div>
                </div>
            </div>
            <div class="settings-section">
                <h4>Size</h4>
                <div class="settings-group">
                    <div class="setting-item">
                        <label for="font-size">Font Size:</label>
                        <select id="font-size">
                            <option value="small" ${
                                this.settings.appearance.fontSize === 'small'
                                    ? 'selected'
                                    : ''
                            }>Small</option>
                            <option value="medium" ${
                                this.settings.appearance.fontSize === 'medium'
                                    ? 'selected'
                                    : ''
                            }>Medium</option>
                            <option value="large" ${
                                this.settings.appearance.fontSize === 'large'
                                    ? 'selected'
                                    : ''
                            }>Large</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label for="panel-width">Panel Width (px):</label>
                        <input type="range" id="panel-width" min="250" max="600" step="10" value="${
                            this.settings.appearance.panelWidth
                        }">
                        <span id="panel-width-value">${
                            this.settings.appearance.panelWidth
                        }px</span>
                    </div>
                    <div class="setting-item">
                        <label for="max-panel-height">Max Panel Height (px):</label>
                        <input type="range" id="max-panel-height" min="300" max="800" step="20" value="${
                            this.settings.appearance.maxPanelHeight
                        }">
                        <span id="max-panel-height-value">${
                            this.settings.appearance.maxPanelHeight
                        }px</span>
                    </div>
                </div>
            </div>
        `;

        // Tools settings tab
        const toolsTab = document.createElement('div');
        toolsTab.className = 'tab-content';
        toolsTab.id = 'tools-tab';
        toolsTab.style.display = 'none';

        toolsTab.innerHTML = `
            <div class="settings-section">
                <h4>Tool Settings</h4>
                <div class="settings-group">
                    <div id="active-tools-container" class="setting-item">
                        <label>Active tools by default:</label>
                        <div class="tools-checklist">
                            <!-- Will be populated dynamically -->
                        </div>
                    </div>
                </div>
            </div>
            <div class="settings-section">
                <h4>Favorites</h4>
                <div class="settings-group">
                    <div id="favorite-tools-container" class="setting-item">
                        <label>Add tools to favorites:</label>
                        <div class="tools-checklist">
                            <!-- Will be populated dynamically -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Keyboard shortcuts tab
        const keyboardTab = document.createElement('div');
        keyboardTab.className = 'tab-content';
        keyboardTab.id = 'keyboard-tab';
        keyboardTab.style.display = 'none';

        keyboardTab.innerHTML = `
            <div class="settings-section">
                <h4>Global Shortcuts</h4>
                <div class="keyboard-shortcuts">
                    <table class="shortcuts-table">
                        <tr>
                            <th>Action</th>
                            <th>Shortcut</th>
                        </tr>
                        <tr>
                            <td>Toggle Debugger Visibility</td>
                            <td><kbd>Alt</kbd> + <kbd>D</kbd></td>
                        </tr>
                        <tr>
                            <td>Minimize/Restore</td>
                            <td><kbd>Alt</kbd> + <kbd>M</kbd></td>
                        </tr>
                        <tr>
                            <td>Close Panel</td>
                            <td><kbd>Esc</kbd></td>
                        </tr>
                    </table>
                </div>
            </div>
            <div class="settings-section">
                <h4>Tool Shortcuts</h4>
                <div class="keyboard-shortcuts">
                    <table class="shortcuts-table">
                        <tr>
                            <th>Tool</th>
                            <th>Shortcut</th>
                        </tr>
                        <tr>
                            <td>DOM Explorer</td>
                            <td><kbd>Alt</kbd> + <kbd>1</kbd></td>
                        </tr>
                        <tr>
                            <td>Color Picker</td>
                            <td><kbd>Alt</kbd> + <kbd>2</kbd></td>
                        </tr>
                        <tr>
                            <td>Font Inspector</td>
                            <td><kbd>Alt</kbd> + <kbd>3</kbd></td>
                        </tr>
                        <tr>
                            <td>Responsive Checker</td>
                            <td><kbd>Alt</kbd> + <kbd>4</kbd></td>
                        </tr>
                        <tr>
                            <td>Storage Inspector</td>
                            <td><kbd>Alt</kbd> + <kbd>5</kbd></td>
                        </tr>
                        <tr>
                            <td>Network Monitor</td>
                            <td><kbd>Alt</kbd> + <kbd>6</kbd></td>
                        </tr>
                        <tr>
                            <td>JS Validator</td>
                            <td><kbd>Alt</kbd> + <kbd>7</kbd></td>
                        </tr>
                        <tr>
                            <td>CSS Validator</td>
                            <td><kbd>Alt</kbd> + <kbd>8</kbd></td>
                        </tr>
                        <tr>
                            <td>Spacing Visualizer</td>
                            <td><kbd>Alt</kbd> + <kbd>9</kbd></td>
                        </tr>
                        <tr>
                            <td>Settings</td>
                            <td><kbd>Alt</kbd> + <kbd>S</kbd></td>
                        </tr>
                    </table>
                </div>
            </div>
        `;

        // About tab
        const aboutTab = document.createElement('div');
        aboutTab.className = 'tab-content';
        aboutTab.id = 'about-tab';
        aboutTab.style.display = 'none';

        aboutTab.innerHTML = `
            <div class="settings-section about-section">
                <h4>Web Debugger</h4>
                <div class="about-content">
                    <p>Version: 1.0.0</p>
                    <p>A comprehensive development overlay tool for debugging and design assessment.</p>
                    <p>Features:</p>
                    <ul>
                        <li>Shadow DOM isolation from host page</li>
                        <li>Catpuccin themes (Latte, Frappe, Macchiato, Mocha)</li>
                        <li>Multiple development tools</li>
                        <li>Responsive design</li>
                        <li>Modern UI/UX with animations</li>
                    </ul>
                    <div class="copyright">© 2023 Web Debugger</div>
                </div>
            </div>
        `;

        // Add all tabs to container
        tabContents.appendChild(generalTab);
        tabContents.appendChild(appearanceTab);
        tabContents.appendChild(toolsTab);
        tabContents.appendChild(keyboardTab);
        tabContents.appendChild(aboutTab);

        tabsContainer.appendChild(tabContents);
        content.appendChild(tabsContainer);

        // Add save/reset buttons
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'settings-actions';

        const saveButton = document.createElement('button');
        saveButton.className = 'save-button primary-button';
        saveButton.textContent = 'Save Changes';
        saveButton.addEventListener('click', () => this.saveSettings());

        const resetButton = document.createElement('button');
        resetButton.className = 'reset-button';
        resetButton.textContent = 'Reset to Defaults';
        resetButton.addEventListener('click', () => this.resetSettings());

        actionsContainer.appendChild(saveButton);
        actionsContainer.appendChild(resetButton);

        content.appendChild(actionsContainer);
        this.panel.appendChild(content);

        return this.panel;
    }

    /**
     * Activate the tool
     */
    activate() {
        if (this.isActive) return;

        super.activate();

        if (this.ui) {
            this.ui.showToolPanel(this.panel);
        }

        // Populate dynamic fields
        this.populateToolsLists();
        this.setupEventListeners();
    }

    /**
     * Deactivate the tool
     */
    deactivate() {
        if (!this.isActive) return;

        super.deactivate();
    }

    /**
     * Populate the tools lists
     */
    populateToolsLists() {
        // Only proceed if UI manager is available
        if (!this.ui || !this.ui.getRegisteredTools) return;

        const tools = this.ui.getRegisteredTools();
        if (!tools || tools.length === 0) return;

        // Get containers
        const activeToolsContainer = this.panel.querySelector(
            '#active-tools-container .tools-checklist'
        );
        const favoriteToolsContainer = this.panel.querySelector(
            '#favorite-tools-container .tools-checklist'
        );

        if (!activeToolsContainer || !favoriteToolsContainer) return;

        // Clear existing content
        activeToolsContainer.innerHTML = '';
        favoriteToolsContainer.innerHTML = '';

        // Create checkboxes for each tool
        tools.forEach((tool) => {
            // Skip settings panel itself
            if (tool.id === this.id) return;

            // Active tools
            const activeToolItem = document.createElement('div');
            activeToolItem.className = 'tool-item';

            const activeCheckbox = document.createElement('input');
            activeCheckbox.type = 'checkbox';
            activeCheckbox.id = `active-${tool.id}`;
            activeCheckbox.dataset.toolId = tool.id;
            activeCheckbox.checked =
                this.settings.tools.activeByDefault.includes(tool.id);

            const activeLabel = document.createElement('label');
            activeLabel.htmlFor = `active-${tool.id}`;
            activeLabel.textContent = tool.name;

            activeToolItem.appendChild(activeCheckbox);
            activeToolItem.appendChild(activeLabel);
            activeToolsContainer.appendChild(activeToolItem);

            // Favorite tools
            const favoriteToolItem = document.createElement('div');
            favoriteToolItem.className = 'tool-item';

            const favoriteCheckbox = document.createElement('input');
            favoriteCheckbox.type = 'checkbox';
            favoriteCheckbox.id = `favorite-${tool.id}`;
            favoriteCheckbox.dataset.toolId = tool.id;
            favoriteCheckbox.checked =
                this.settings.tools.favoriteTools.includes(tool.id);

            const favoriteLabel = document.createElement('label');
            favoriteLabel.htmlFor = `favorite-${tool.id}`;
            favoriteLabel.textContent = tool.name;

            favoriteToolItem.appendChild(favoriteCheckbox);
            favoriteToolItem.appendChild(favoriteLabel);
            favoriteToolsContainer.appendChild(favoriteToolItem);
        });
    }

    /**
     * Set up event listeners for settings controls
     */
    setupEventListeners() {
        // Theme selector
        const themeSelect = this.panel.querySelector('#theme');
        if (themeSelect) {
            themeSelect.addEventListener('change', () => {
                // Update theme preview
                this.updateThemePreview(themeSelect.value);
            });

            // Initialize theme preview
            this.updateThemePreview(themeSelect.value);
        }

        // Panel width slider
        const panelWidthSlider = this.panel.querySelector('#panel-width');
        const panelWidthValue = this.panel.querySelector('#panel-width-value');
        if (panelWidthSlider && panelWidthValue) {
            panelWidthSlider.addEventListener('input', () => {
                panelWidthValue.textContent = `${panelWidthSlider.value}px`;
            });
        }

        // Max panel height slider
        const maxPanelHeightSlider =
            this.panel.querySelector('#max-panel-height');
        const maxPanelHeightValue = this.panel.querySelector(
            '#max-panel-height-value'
        );
        if (maxPanelHeightSlider && maxPanelHeightValue) {
            maxPanelHeightSlider.addEventListener('input', () => {
                maxPanelHeightValue.textContent = `${maxPanelHeightSlider.value}px`;
            });
        }

        // Auto-hide checkbox and timeout field
        const autoHideCheckbox = this.panel.querySelector('#auto-hide');
        const inactivityTimeoutField = this.panel.querySelector(
            '#inactivity-timeout'
        );
        if (autoHideCheckbox && inactivityTimeoutField) {
            autoHideCheckbox.addEventListener('change', () => {
                inactivityTimeoutField.disabled = !autoHideCheckbox.checked;
            });

            // Initialize state
            inactivityTimeoutField.disabled = !autoHideCheckbox.checked;
        }
    }

    /**
     * Update the theme preview
     * @param {string} theme - Theme name
     */
    updateThemePreview(theme) {
        const previewEl = this.panel.querySelector('.theme-preview-item');
        if (!previewEl) return;

        // Remove all existing theme classes
        previewEl.classList.remove(
            'theme-latte',
            'theme-frappe',
            'theme-macchiato',
            'theme-mocha'
        );

        // Add selected theme class
        previewEl.classList.add(`theme-${theme}`);

        // Update preview content
        previewEl.innerHTML = `
            <div class="preview-header">
                <h5>${theme.charAt(0).toUpperCase() + theme.slice(1)} Theme</h5>
            </div>
            <div class="preview-colors">
                <span class="color-sample rosewater"></span>
                <span class="color-sample flamingo"></span>
                <span class="color-sample pink"></span>
                <span class="color-sample mauve"></span>
                <span class="color-sample red"></span>
                <span class="color-sample maroon"></span>
                <span class="color-sample peach"></span>
                <span class="color-sample yellow"></span>
                <span class="color-sample green"></span>
                <span class="color-sample teal"></span>
                <span class="color-sample sky"></span>
                <span class="color-sample sapphire"></span>
                <span class="color-sample blue"></span>
                <span class="color-sample lavender"></span>
            </div>
            <div class="preview-text">
                <div class="text-sample">Text Sample</div>
                <button class="button-sample">Button</button>
            </div>
        `;
    }

    /**
     * Save settings
     */
    saveSettings() {
        // General settings
        this.settings.general.startMinimized =
            this.panel.querySelector('#start-minimized').checked;
        this.settings.general.enableKeyboardShortcuts =
            this.panel.querySelector('#enable-shortcuts').checked;
        this.settings.general.autoHideOnInactive =
            this.panel.querySelector('#auto-hide').checked;
        this.settings.general.inactivityTimeout = parseInt(
            this.panel.querySelector('#inactivity-timeout').value,
            10
        );
        this.settings.general.position =
            this.panel.querySelector('#position').value;

        // Appearance settings
        this.settings.appearance.theme =
            this.panel.querySelector('#theme').value;
        this.settings.appearance.fontSize =
            this.panel.querySelector('#font-size').value;
        this.settings.appearance.panelWidth = parseInt(
            this.panel.querySelector('#panel-width').value,
            10
        );
        this.settings.appearance.maxPanelHeight = parseInt(
            this.panel.querySelector('#max-panel-height').value,
            10
        );

        // Tools settings - Active by default
        const activeTools = [];
        this.panel
            .querySelectorAll('#active-tools-container input[type="checkbox"]')
            .forEach((checkbox) => {
                if (checkbox.checked) {
                    activeTools.push(checkbox.dataset.toolId);
                }
            });
        this.settings.tools.activeByDefault = activeTools;

        // Tools settings - Favorites
        const favoriteTools = [];
        this.panel
            .querySelectorAll(
                '#favorite-tools-container input[type="checkbox"]'
            )
            .forEach((checkbox) => {
                if (checkbox.checked) {
                    favoriteTools.push(checkbox.dataset.toolId);
                }
            });
        this.settings.tools.favoriteTools = favoriteTools;

        // Save all settings
        this.saveAllSettings();

        // Apply settings
        this.applySettings();

        // Show success message
        this.showMessage('Settings saved successfully!', 'success');
    }

    /**
     * Reset settings to defaults
     */
    resetSettings() {
        if (confirm('Reset all settings to default values?')) {
            // Default settings
            this.settings = {
                general: {
                    startMinimized: false,
                    enableKeyboardShortcuts: true,
                    autoHideOnInactive: false,
                    inactivityTimeout: 30,
                    position: 'top-right',
                    showTooltips: true,
                },
                appearance: {
                    theme: 'mocha',
                    fontSize: 'medium',
                    panelWidth: 350,
                    maxPanelHeight: 500,
                },
                tools: {
                    activeByDefault: [],
                    favoriteTools: [],
                },
            };

            // Save defaults
            this.saveAllSettings();

            // Re-render panel with default values
            this.render();

            // Apply settings
            this.applySettings();

            // Set up event listeners again
            this.setupEventListeners();

            // Populate tools lists again
            this.populateToolsLists();

            // Show success message
            this.showMessage('Settings have been reset to defaults', 'success');
        }
    }

    /**
     * Save all settings to storage
     */
    saveAllSettings() {
        if (!this.storage) return;

        // Save general settings
        Object.keys(this.settings.general).forEach((key) => {
            this.setSetting(`general.${key}`, this.settings.general[key]);
        });

        // Save appearance settings
        Object.keys(this.settings.appearance).forEach((key) => {
            this.setSetting(`appearance.${key}`, this.settings.appearance[key]);
        });

        // Save tools settings
        this.setSetting(
            'tools.activeByDefault',
            this.settings.tools.activeByDefault
        );
        this.setSetting(
            'tools.favoriteTools',
            this.settings.tools.favoriteTools
        );
    }

    /**
     * Apply the current settings
     */
    applySettings() {
        if (!this.ui) return;

        // Apply theme
        if (this.ui.themeManager && this.settings.appearance.theme) {
            this.ui.themeManager.setTheme(this.settings.appearance.theme);
        }

        // Apply font size
        document.documentElement.dataset.fontSize =
            this.settings.appearance.fontSize;

        // Apply panel width if panel is available
        if (this.ui.container) {
            this.ui.container.style.width = `${this.settings.appearance.panelWidth}px`;
            this.ui.container.style.maxHeight = `${this.settings.appearance.maxPanelHeight}px`;
        }

        // Apply position
        if (this.ui.container && this.settings.general.position) {
            // Remove all position classes
            this.ui.container.classList.remove(
                'position-top-right',
                'position-top-left',
                'position-bottom-right',
                'position-bottom-left'
            );

            // Add the selected position class
            this.ui.container.classList.add(
                `position-${this.settings.general.position}`
            );
        }

        // Emit settings changed event
        this.emit('settingsChanged', this.settings);
    }

    /**
     * Show a message in the settings panel
     * @param {string} message - Message to display
     * @param {string} type - Message type (success, error, info)
     */
    showMessage(message, type = 'info') {
        // Check if message container exists, create if not
        let messageContainer = this.panel.querySelector('.settings-message');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.className = 'settings-message';
            this.panel
                .querySelector('.panel-content')
                .appendChild(messageContainer);
        }

        // Set message
        messageContainer.textContent = message;
        messageContainer.className = `settings-message message-${type}`;

        // Show message
        messageContainer.style.display = 'block';

        // Hide after 3 seconds
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, 3000);
    }

    /**
     * Get all settings
     * @returns {Object} All settings
     */
    getAllSettings() {
        return this.settings;
    }

    /**
     * Clean up resources when the tool is destroyed
     */
    destroy() {
        return super.destroy();
    }
}
