/**
 * JavaScript Validator Tool
 * Validates JavaScript code on the page and reports errors and warnings
 */
import BaseTool from '../tools/base-tool.js';

export class JSValidator extends BaseTool {
    /**
     * Create a new JSValidator
     * @param {Object} config - Configuration options
     * @param {Object} config.ui - UI manager instance
     * @param {Object} config.storage - Storage manager instance
     */
    constructor(config = {}) {
        super(config);

        this.name = 'JavaScript Validator';
        this.id = 'js-validator';
        this.icon = 'js';
        this.description = 'Validate JavaScript code and detect errors';

        this.scriptSources = [];
        this.inlineScripts = [];
        this.results = {
            errors: [],
            warnings: [],
        };

        // Options
        this.lintOptions = this.getSetting('lintOptions', {
            esversion: 11,
            browser: true,
            devel: true,
            jquery: true,
            strict: 'implied',
            undef: true,
            unused: true,
        });

        // Track if we've already loaded JSHint
        this.jsHintLoaded = false;

        // Initialize component references
        this.statusText = null;
        this.resultsContainer = null;
        this.scriptsContent = null;
    }

    /**
     * Activate the tool
     */
    activate() {
        if (this.isActive) return;

        super.activate();

        // Load JSHint if not already loaded
        this.loadJSHint();

        // Find scripts on page
        this.findScripts();

        return this;
    }

    /**
     * Set up the panel content
     * @returns {HTMLElement} The panel content element
     */
    setupPanel() {
        const content = document.createElement('div');
        content.className = 'js-validator-content panel-content';

        // Status section
        const statusSection = document.createElement('div');
        statusSection.className = 'status-section section';

        const statusText = document.createElement('div');
        statusText.className = 'status-text';
        statusText.textContent = 'Ready to validate JavaScript.';
        this.statusText = statusText;

        const validateButton = document.createElement('button');
        validateButton.className = 'validate-button primary-button';
        validateButton.textContent = 'Validate All Scripts';
        validateButton.addEventListener('click', () => this.validateScripts());

        statusSection.appendChild(statusText);
        statusSection.appendChild(validateButton);

        // Results section
        const resultsSection = document.createElement('div');
        resultsSection.className = 'results-section section';

        const resultsTitle = document.createElement('h3');
        resultsTitle.textContent = 'Validation Results';

        const resultsContent = document.createElement('div');
        resultsContent.className = 'results-content';
        this.resultsContainer = resultsContent;

        resultsSection.appendChild(resultsTitle);
        resultsSection.appendChild(resultsContent);

        // Scripts section
        const scriptsSection = document.createElement('div');
        scriptsSection.className = 'scripts-section section';

        const scriptsTitle = document.createElement('h3');
        scriptsTitle.textContent = 'Scripts on Page';
        scriptsTitle.addEventListener('click', () => {
            this.scriptsContent.classList.toggle('collapsed');
            const isCollapsed =
                this.scriptsContent.classList.contains('collapsed');
            // Save the state to ensure consistency between sessions
            this.saveSetting('scriptsCollapsed', isCollapsed);
        });

        const scriptsContent = document.createElement('div');
        const isCollapsed = this.getSetting('scriptsCollapsed', true);
        scriptsContent.className = `scripts-content ${
            isCollapsed ? 'collapsed' : ''
        }`;
        this.scriptsContent = scriptsContent;

        scriptsSection.appendChild(scriptsTitle);
        scriptsSection.appendChild(scriptsContent);

        content.appendChild(statusSection);
        content.appendChild(resultsSection);
        content.appendChild(scriptsSection);

        return content;
    }

    /**
     * Load JSHint library
     */
    loadJSHint() {
        if (this.jsHintLoaded || window.JSHINT) {
            this.jsHintLoaded = true;
            return Promise.resolve();
        }

        this.updateStatus('Loading JSHint...');

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src =
                'https://cdnjs.cloudflare.com/ajax/libs/jshint/2.13.6/jshint.min.js';
            // Removed integrity attribute to avoid SRI errors
            script.crossOrigin = 'anonymous';
            script.referrerPolicy = 'no-referrer';

            script.onload = () => {
                this.jsHintLoaded = true;
                this.updateStatus('JSHint loaded');
                resolve();
            };

            script.onerror = () => {
                this.updateStatus('Failed to load JSHint', 'error');
                reject(new Error('Failed to load JSHint'));
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Update status indicator
     * @param {string} message - Status message
     * @param {string} type - Status type (default, error, success, warning)
     */
    updateStatus(message, type = 'default') {
        if (!this.statusText) return;

        this.statusText.textContent = message;
        this.statusText.className = 'status-text';

        // Add appropriate status class
        if (type === 'error') {
            this.statusText.classList.add('status-error');
        } else if (type === 'success') {
            this.statusText.classList.add('status-success');
        } else if (type === 'warning') {
            this.statusText.classList.add('status-warning');
        }
    }

    /**
     * Find all scripts on the page
     */
    findScripts() {
        // Reset arrays
        this.scriptSources = [];
        this.inlineScripts = [];

        // Find script tags
        const scripts = document.querySelectorAll('script');

        scripts.forEach((script, index) => {
            if (script.src) {
                // External script
                const url = new URL(script.src);
                // Skip library scripts and CDN resources to focus on site's code
                if (!this.isLibraryScript(url.pathname)) {
                    this.scriptSources.push({
                        id: `ext-${index}`,
                        url: script.src,
                        element: script,
                    });
                }
            } else if (script.textContent.trim()) {
                // Inline script
                this.inlineScripts.push({
                    id: `inline-${index}`,
                    content: script.textContent,
                    element: script,
                });
            }
        });

        // Update the scripts list UI
        this.updateScriptsList();
    }

    /**
     * Check if a script is likely a library
     * @param {string} path - Script path
     * @returns {boolean} True if script is likely a library
     */
    isLibraryScript(path) {
        const libraryPatterns = [
            /jquery/i,
            /bootstrap/i,
            /angular/i,
            /react/i,
            /vue/i,
            /axios/i,
            /lodash/i,
            /moment/i,
            /polyfill/i,
            /modernizr/i,
            /cdn\./i,
            /min\.js$/i,
            /bundle\.js$/i,
            /vendor/i,
            /jshint/i,
        ];

        return libraryPatterns.some((pattern) => pattern.test(path));
    }

    /**
     * Update the scripts list UI
     */
    updateScriptsList() {
        if (!this.scriptsContent) return;

        // Clear previous content
        this.scriptsContent.innerHTML = '';

        if (
            this.scriptSources.length === 0 &&
            this.inlineScripts.length === 0
        ) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-message';
            emptyMessage.textContent = 'No JavaScript files found.';
            this.scriptsContent.appendChild(emptyMessage);
            return;
        }

        // Create a document fragment to minimize DOM operations
        const fragment = document.createDocumentFragment();

        // Add external scripts
        this.scriptSources.forEach((script) => {
            const scriptItem = document.createElement('div');
            scriptItem.className = 'script-item';
            scriptItem.dataset.id = script.id;

            const scriptInfo = document.createElement('div');
            scriptInfo.className = 'script-info';

            const scriptName = document.createElement('div');
            scriptName.className = 'script-name';
            scriptName.textContent = this.getScriptFilename(script.url);

            const scriptPath = document.createElement('div');
            scriptPath.className = 'script-path';
            scriptPath.textContent = script.url;

            scriptInfo.appendChild(scriptName);
            scriptInfo.appendChild(scriptPath);

            const validateBtn = document.createElement('button');
            validateBtn.className = 'validate-script-btn';
            validateBtn.textContent = 'Validate';
            validateBtn.addEventListener('click', () => {
                validateBtn.textContent = 'Validating...';
                validateBtn.disabled = true;
                this.validateExternalScript(script).finally(() => {
                    validateBtn.textContent = 'Validate';
                    validateBtn.disabled = false;
                });
            });

            scriptItem.appendChild(scriptInfo);
            scriptItem.appendChild(validateBtn);
            fragment.appendChild(scriptItem);
        });

        // Add inline scripts
        this.inlineScripts.forEach((script) => {
            const scriptItem = document.createElement('div');
            scriptItem.className = 'script-item';
            scriptItem.dataset.id = script.id;

            const scriptInfo = document.createElement('div');
            scriptInfo.className = 'script-info';

            const scriptName = document.createElement('div');
            scriptName.className = 'script-name';
            scriptName.textContent = `Inline script ${script.id}`;

            const scriptPath = document.createElement('div');
            scriptPath.className = 'script-path';
            scriptPath.textContent = `${script.content.slice(0, 50)}${
                script.content.length > 50 ? '...' : ''
            }`;

            scriptInfo.appendChild(scriptName);
            scriptInfo.appendChild(scriptPath);

            const validateBtn = document.createElement('button');
            validateBtn.className = 'validate-script-btn';
            validateBtn.textContent = 'Validate';
            validateBtn.addEventListener('click', () => {
                validateBtn.textContent = 'Validating...';
                validateBtn.disabled = true;
                this.validateInlineScript(script).finally(() => {
                    validateBtn.textContent = 'Validate';
                    validateBtn.disabled = false;
                });
            });

            scriptItem.appendChild(scriptInfo);
            scriptItem.appendChild(validateBtn);
            fragment.appendChild(scriptItem);
        });

        this.scriptsContent.appendChild(fragment);
    }

    /**
     * Validate all scripts on the page
     */
    async validateScripts() {
        if (!this.jsHintLoaded && !window.JSHINT) {
            try {
                await this.loadJSHint();
            } catch (error) {
                this.updateStatus(
                    'Cannot validate: JSHint failed to load',
                    'error'
                );
                return;
            }
        }

        this.updateStatus('Scanning for scripts...');
        this.findScripts();

        this.updateStatus(
            `Found ${this.scriptSources.length} external and ${this.inlineScripts.length} inline scripts`
        );

        // Reset results
        this.results = {
            errors: [],
            warnings: [],
        };

        // Validate inline scripts first (these are immediately available)
        this.updateStatus('Validating inline scripts...');
        this.inlineScripts.forEach((script) => {
            this.validateInlineScript(script, false); // Don't update UI for each script
        });

        // Validate external scripts
        this.updateStatus('Validating external scripts...');
        const promises = this.scriptSources.map((script) =>
            this.validateExternalScript(script, false)
        );

        try {
            await Promise.all(promises);
            this.updateStatus('Validation complete', 'success');
        } catch (error) {
            this.updateStatus('Some scripts could not be validated', 'error');
        }

        // Update results UI once all scripts are validated
        this.updateResultsUI();
    }

    /**
     * Validate an inline script
     * @param {Object} script - Script object with content
     * @param {boolean} updateUI - Whether to update the UI immediately
     */
    validateInlineScript(script, updateUI = true) {
        if (!window.JSHINT) {
            this.updateStatus('JSHint not loaded', 'error');
            return;
        }

        // Run JSHint
        window.JSHINT(script.content, this.lintOptions);
        const errors = window.JSHINT.errors || [];

        // Store results
        const scriptResults = {
            id: script.id,
            name: `Inline script #${script.id.split('-')[1]}`,
            errors: [],
            warnings: [],
        };

        // Process errors and warnings
        errors.forEach((error) => {
            if (!error) return;

            const result = {
                line: error.line,
                character: error.character,
                reason: error.reason,
                evidence: error.evidence,
                code: error.code,
            };

            if (error.code && error.code.startsWith('W')) {
                scriptResults.warnings.push(result);
                this.results.warnings.push({
                    ...result,
                    scriptId: script.id,
                    scriptName: scriptResults.name,
                });
            } else {
                scriptResults.errors.push(result);
                this.results.errors.push({
                    ...result,
                    scriptId: script.id,
                    scriptName: scriptResults.name,
                });
            }
        });

        // Add a data attribute with results count
        const listItem = this.scriptsContent?.querySelector(
            `li[data-script-id="${script.id}"]`
        );
        if (listItem) {
            listItem.dataset.errors = scriptResults.errors.length;
            listItem.dataset.warnings = scriptResults.warnings.length;

            // Update the list item with error counts
            if (
                scriptResults.errors.length > 0 ||
                scriptResults.warnings.length > 0
            ) {
                const countsSpan = document.createElement('span');
                countsSpan.className = 'script-issue-counts';

                if (scriptResults.errors.length > 0) {
                    countsSpan.innerHTML += `<span class="error-count">${scriptResults.errors.length} errors</span>`;
                }

                if (scriptResults.warnings.length > 0) {
                    countsSpan.innerHTML += `<span class="warning-count">${scriptResults.warnings.length} warnings</span>`;
                }

                // Add it after the script name/preview
                const targetElement =
                    listItem.querySelector('.script-preview') ||
                    listItem.querySelector('.script-name');
                if (
                    targetElement &&
                    !listItem.querySelector('.script-issue-counts')
                ) {
                    targetElement.insertAdjacentElement('afterend', countsSpan);
                }
            }
        }

        // Update UI if requested
        if (updateUI) {
            this.updateResultsUI();
        }

        return scriptResults;
    }

    /**
     * Validate an external script
     * @param {Object} script - Script object with URL
     * @param {boolean} updateUI - Whether to update the UI immediately
     * @returns {Promise} Promise resolving when validation is complete
     */
    validateExternalScript(script, updateUI = true) {
        return new Promise((resolve, reject) => {
            const listItem = this.scriptsContent?.querySelector(
                `li[data-script-id="${script.id}"]`
            );

            // Update the list item to show loading
            if (listItem) {
                const btn = listItem.querySelector('.validate-script-btn');
                if (btn) btn.textContent = 'Loading...';
            }

            // Fetch the script content
            fetch(script.url)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(
                            `Failed to fetch: ${response.status} ${response.statusText}`
                        );
                    }
                    return response.text();
                })
                .then((content) => {
                    // Run JSHint
                    window.JSHINT(content, this.lintOptions);
                    const errors = window.JSHINT.errors || [];

                    // Extract filename from URL
                    const url = new URL(script.url);
                    const filename = url.pathname.split('/').pop();

                    // Store results
                    const scriptResults = {
                        id: script.id,
                        name: filename,
                        errors: [],
                        warnings: [],
                    };

                    // Process errors and warnings
                    errors.forEach((error) => {
                        if (!error) return;

                        const result = {
                            line: error.line,
                            character: error.character,
                            reason: error.reason,
                            evidence: error.evidence,
                            code: error.code,
                        };

                        if (error.code && error.code.startsWith('W')) {
                            scriptResults.warnings.push(result);
                            this.results.warnings.push({
                                ...result,
                                scriptId: script.id,
                                scriptName: scriptResults.name,
                            });
                        } else {
                            scriptResults.errors.push(result);
                            this.results.errors.push({
                                ...result,
                                scriptId: script.id,
                                scriptName: scriptResults.name,
                            });
                        }
                    });

                    // Update the list item
                    if (listItem) {
                        const btn = listItem.querySelector(
                            '.validate-script-btn'
                        );
                        if (btn) btn.textContent = 'Validate';

                        listItem.dataset.errors = scriptResults.errors.length;
                        listItem.dataset.warnings =
                            scriptResults.warnings.length;

                        // Add error/warning counts
                        if (
                            scriptResults.errors.length > 0 ||
                            scriptResults.warnings.length > 0
                        ) {
                            const countsSpan = document.createElement('span');
                            countsSpan.className = 'script-issue-counts';

                            if (scriptResults.errors.length > 0) {
                                countsSpan.innerHTML += `<span class="error-count">${scriptResults.errors.length} errors</span>`;
                            }

                            if (scriptResults.warnings.length > 0) {
                                countsSpan.innerHTML += `<span class="warning-count">${scriptResults.warnings.length} warnings</span>`;
                            }

                            // Add it after the script name
                            const scriptName =
                                listItem.querySelector('.script-name');
                            if (
                                scriptName &&
                                !listItem.querySelector('.script-issue-counts')
                            ) {
                                scriptName.insertAdjacentElement(
                                    'afterend',
                                    countsSpan
                                );
                            }
                        }
                    }

                    // Update UI if requested
                    if (updateUI) {
                        this.updateResultsUI();
                    }

                    resolve(scriptResults);
                })
                .catch((error) => {
                    console.error(
                        'Error validating script:',
                        script.url,
                        error
                    );

                    // Update the list item
                    if (listItem) {
                        const btn = listItem.querySelector(
                            '.validate-script-btn'
                        );
                        if (btn) btn.textContent = 'Retry';

                        if (!listItem.querySelector('.fetch-error')) {
                            const errorSpan = document.createElement('span');
                            errorSpan.className = 'fetch-error';
                            errorSpan.textContent = 'Failed to fetch script';
                            listItem.appendChild(errorSpan);
                        }
                    }

                    reject(error);
                });
        });
    }

    /**
     * Update the results UI
     */
    updateResultsUI() {
        if (!this.resultsContainer) return;

        // Clear previous results
        this.resultsContainer.innerHTML = '';

        const totalErrors = this.results.errors.length;
        const totalWarnings = this.results.warnings.length;

        if (totalErrors === 0 && totalWarnings === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-message';
            emptyMessage.textContent = 'No JavaScript issues found.';
            this.resultsContainer.appendChild(emptyMessage);
            return;
        }

        // Update status
        this.updateStatus(
            `Found ${totalErrors} errors and ${totalWarnings} warnings`,
            totalErrors > 0
                ? 'error'
                : totalWarnings > 0
                ? 'warning'
                : 'success'
        );

        // Create results
        const fragment = document.createDocumentFragment();

        // Add errors first
        this.results.errors.forEach((error) => {
            const errorItem = document.createElement('div');
            errorItem.className = 'error-item';

            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = error.message;

            const errorSource = document.createElement('div');
            errorSource.className = 'error-source';
            errorSource.textContent = `${error.source} (line ${error.line}, col ${error.column})`;

            errorItem.appendChild(errorMessage);
            errorItem.appendChild(errorSource);

            // Add code snippet if available
            if (error.evidence) {
                const errorLine = document.createElement('code');
                errorLine.className = 'error-line';
                errorLine.textContent = error.evidence;
                errorItem.appendChild(errorLine);
            }

            fragment.appendChild(errorItem);
        });

        // Then add warnings
        this.results.warnings.forEach((warning) => {
            const warningItem = document.createElement('div');
            warningItem.className = 'warning-item';

            const warningMessage = document.createElement('div');
            warningMessage.className = 'warning-message';
            warningMessage.textContent = warning.message;

            const warningSource = document.createElement('div');
            warningSource.className = 'warning-source';
            warningSource.textContent = `${warning.source} (line ${warning.line}, col ${warning.column})`;

            warningItem.appendChild(warningMessage);
            warningItem.appendChild(warningSource);

            // Add code snippet if available
            if (warning.evidence) {
                const warningLine = document.createElement('code');
                warningLine.className = 'warning-line';
                warningLine.textContent = warning.evidence;
                warningItem.appendChild(warningLine);
            }

            fragment.appendChild(warningItem);
        });

        this.resultsContainer.appendChild(fragment);
    }

    /**
     * Get the filename from a script URL
     * @param {string} url - The script URL
     * @returns {string} The filename
     */
    getScriptFilename(url) {
        try {
            const parsedUrl = new URL(url);
            const pathSegments = parsedUrl.pathname.split('/');
            return pathSegments[pathSegments.length - 1] || url;
        } catch (e) {
            // For relative URLs or other parsing issues
            const pathSegments = url.split('/');
            return pathSegments[pathSegments.length - 1] || url;
        }
    }
}
