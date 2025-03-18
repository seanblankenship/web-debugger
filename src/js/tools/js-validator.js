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

        // Initialize the tool
        this.initialized = false;

        // Initialize component references
        this.statusText = null;
        this.resultsContainer = null;
        this.scriptsContent = null;
    }

    /**
     * Initialize the tool
     */
    init() {
        if (this.initialized) return;

        super.init();
        this.loadJSHint();
        this.initialized = true;
        return this;
    }

    /**
     * Set up the panel content
     * @returns {HTMLElement} The panel content element
     */
    setupPanel() {
        const content = document.createElement('div');
        content.className = 'js-validator-content';

        // Status section
        const statusSection = document.createElement('div');
        statusSection.className = 'status-section';

        const statusText = document.createElement('div');
        statusText.className = 'status-text';
        statusText.textContent = 'Ready to validate JavaScript.';
        this.statusText = statusText;

        const validateButton = document.createElement('button');
        validateButton.className = 'validate-button';
        validateButton.textContent = 'Validate All Scripts';
        validateButton.addEventListener('click', () => this.validateScripts());

        statusSection.appendChild(statusText);
        statusSection.appendChild(validateButton);

        // Results section
        const resultsSection = document.createElement('div');
        resultsSection.className = 'results-section';

        const resultsTitle = document.createElement('h3');
        resultsTitle.textContent = 'Validation Results';

        const resultsContent = document.createElement('div');
        resultsContent.className = 'results-content';
        this.resultsContainer = resultsContent;

        resultsSection.appendChild(resultsTitle);
        resultsSection.appendChild(resultsContent);

        // Scripts section
        const scriptsSection = document.createElement('div');
        scriptsSection.className = 'scripts-section';

        const scriptsTitle = document.createElement('h3');
        scriptsTitle.textContent = 'Scripts on Page';
        scriptsTitle.addEventListener('click', () => {
            this.scriptsContent.classList.toggle('collapsed');
        });

        const scriptsContent = document.createElement('div');
        scriptsContent.className = 'scripts-content collapsed';
        this.scriptsContent = scriptsContent;

        scriptsSection.appendChild(scriptsTitle);
        scriptsSection.appendChild(scriptsContent);

        content.appendChild(statusSection);
        content.appendChild(resultsSection);
        content.appendChild(scriptsSection);

        return content;
    }

    /**
     * Activate the tool
     */
    activate() {
        super.activate();
        this.findScripts();
        return this;
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
     * @param {string} type - Status type (default, error, success)
     */
    updateStatus(message, type = 'default') {
        if (!this.statusText) return;

        this.statusText.textContent = message;
        this.statusText.className = `status-text status-${type}`;
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
     * Update the scripts list in the UI
     */
    updateScriptsList() {
        if (!this.scriptsContent) return;

        // Clear content
        this.scriptsContent.innerHTML = '';

        // No scripts found
        if (
            this.scriptSources.length === 0 &&
            this.inlineScripts.length === 0
        ) {
            this.scriptsContent.innerHTML =
                '<p>No scripts found on this page.</p>';
            return;
        }

        // Create external scripts list
        if (this.scriptSources.length > 0) {
            const externalTitle = document.createElement('h5');
            externalTitle.textContent = `External Scripts (${this.scriptSources.length})`;
            this.scriptsContent.appendChild(externalTitle);

            const externalList = document.createElement('ul');
            externalList.className = 'scripts-list external-scripts';

            this.scriptSources.forEach((script) => {
                const item = document.createElement('li');
                item.dataset.scriptId = script.id;

                // Extract filename from URL
                const url = new URL(script.url);
                const filename = url.pathname.split('/').pop();

                item.innerHTML = `
                    <span class="script-name">${filename}</span>
                    <span class="script-url">${script.url}</span>
                    <button class="validate-script-btn">Validate</button>
                `;

                // Add validate button click handler
                const validateBtn = item.querySelector('.validate-script-btn');
                validateBtn.addEventListener('click', () =>
                    this.validateExternalScript(script)
                );

                externalList.appendChild(item);
            });

            this.scriptsContent.appendChild(externalList);
        }

        // Create inline scripts list
        if (this.inlineScripts.length > 0) {
            const inlineTitle = document.createElement('h5');
            inlineTitle.textContent = `Inline Scripts (${this.inlineScripts.length})`;
            this.scriptsContent.appendChild(inlineTitle);

            const inlineList = document.createElement('ul');
            inlineList.className = 'scripts-list inline-scripts';

            this.inlineScripts.forEach((script) => {
                const item = document.createElement('li');
                item.dataset.scriptId = script.id;

                // Show a preview of the script content
                const contentPreview = script.content
                    .slice(0, 100)
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');

                item.innerHTML = `
                    <span class="script-preview">${contentPreview}${
                    script.content.length > 100 ? '...' : ''
                }</span>
                    <button class="validate-script-btn">Validate</button>
                `;

                // Add validate button click handler
                const validateBtn = item.querySelector('.validate-script-btn');
                validateBtn.addEventListener('click', () =>
                    this.validateInlineScript(script)
                );

                inlineList.appendChild(item);
            });

            this.scriptsContent.appendChild(inlineList);
        }
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

        const { errors, warnings } = this.results;

        // Update stats
        this.resultsContainer.innerHTML = `
            <div class="stats">
                <span class="error-count">${errors.length} errors</span>
                <span class="warning-count">${warnings.length} warnings</span>
            </div>
        `;

        // Clear previous results
        this.resultsContainer.innerHTML = '';

        // No issues
        if (errors.length === 0 && warnings.length === 0) {
            this.resultsContainer.innerHTML =
                '<p class="no-issues">No issues found! 🎉</p>';
            return;
        }

        // Create errors section if there are errors
        if (errors.length > 0) {
            const errorsSection = document.createElement('div');
            errorsSection.className = 'errors-section';

            const errorsTitle = document.createElement('h5');
            errorsTitle.textContent = `Errors (${errors.length})`;
            errorsSection.appendChild(errorsTitle);

            const errorsList = document.createElement('ul');
            errorsList.className = 'issues-list errors-list';

            // Group errors by script
            const errorsByScript = {};
            errors.forEach((error) => {
                if (!errorsByScript[error.scriptId]) {
                    errorsByScript[error.scriptId] = [];
                }
                errorsByScript[error.scriptId].push(error);
            });

            // Create list items for each script's errors
            Object.keys(errorsByScript).forEach((scriptId) => {
                const scriptErrors = errorsByScript[scriptId];
                const scriptName = scriptErrors[0].scriptName;

                const scriptItem = document.createElement('li');
                scriptItem.className = 'script-issues';

                const scriptHeader = document.createElement('div');
                scriptHeader.className = 'script-header';
                scriptHeader.textContent = `${scriptName} (${scriptErrors.length} errors)`;
                scriptItem.appendChild(scriptHeader);

                const issuesList = document.createElement('ul');
                issuesList.className = 'script-issues-list';

                scriptErrors.forEach((error) => {
                    const issueItem = document.createElement('li');
                    issueItem.className = 'issue-item';

                    issueItem.innerHTML = `
                        <div class="issue-location">Line ${error.line}, Col ${
                        error.character
                    }</div>
                        <div class="issue-reason">${error.reason}</div>
                        ${
                            error.evidence
                                ? `<code class="issue-evidence">${error.evidence
                                      .replace(/</g, '&lt;')
                                      .replace(/>/g, '&gt;')}</code>`
                                : ''
                        }
                    `;

                    issuesList.appendChild(issueItem);
                });

                scriptItem.appendChild(issuesList);
                errorsList.appendChild(scriptItem);
            });

            errorsSection.appendChild(errorsList);
            this.resultsContainer.appendChild(errorsSection);
        }

        // Create warnings section if there are warnings
        if (warnings.length > 0) {
            const warningsSection = document.createElement('div');
            warningsSection.className = 'warnings-section';

            const warningsTitle = document.createElement('h5');
            warningsTitle.textContent = `Warnings (${warnings.length})`;
            warningsSection.appendChild(warningsTitle);

            const warningsList = document.createElement('ul');
            warningsList.className = 'issues-list warnings-list';

            // Group warnings by script
            const warningsByScript = {};
            warnings.forEach((warning) => {
                if (!warningsByScript[warning.scriptId]) {
                    warningsByScript[warning.scriptId] = [];
                }
                warningsByScript[warning.scriptId].push(warning);
            });

            // Create list items for each script's warnings
            Object.keys(warningsByScript).forEach((scriptId) => {
                const scriptWarnings = warningsByScript[scriptId];
                const scriptName = scriptWarnings[0].scriptName;

                const scriptItem = document.createElement('li');
                scriptItem.className = 'script-issues';

                const scriptHeader = document.createElement('div');
                scriptHeader.className = 'script-header';
                scriptHeader.textContent = `${scriptName} (${scriptWarnings.length} warnings)`;
                scriptItem.appendChild(scriptHeader);

                const issuesList = document.createElement('ul');
                issuesList.className = 'script-issues-list';

                scriptWarnings.forEach((warning) => {
                    const issueItem = document.createElement('li');
                    issueItem.className = 'issue-item';

                    issueItem.innerHTML = `
                        <div class="issue-location">Line ${warning.line}, Col ${
                        warning.character
                    }</div>
                        <div class="issue-reason">${warning.reason}</div>
                        ${
                            warning.evidence
                                ? `<code class="issue-evidence">${warning.evidence
                                      .replace(/</g, '&lt;')
                                      .replace(/>/g, '&gt;')}</code>`
                                : ''
                        }
                    `;

                    issuesList.appendChild(issueItem);
                });

                scriptItem.appendChild(issuesList);
                warningsList.appendChild(scriptItem);
            });

            warningsSection.appendChild(warningsList);
            this.resultsContainer.appendChild(warningsSection);
        }
    }
}
