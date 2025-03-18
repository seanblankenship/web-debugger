/**
 * CSS Validator Tool
 * Validates CSS code on the page and reports errors and warnings
 */
import BaseTool from '../tools/base-tool.js';

export class CSSValidator extends BaseTool {
    /**
     * Constructor
     * @param {Object} config - Configuration object
     * @param {Object} config.ui - UI manager
     * @param {Object} config.storage - Storage manager
     */
    constructor(config = {}) {
        super(config);

        this.name = 'CSS Validator';
        this.icon = 'css';
        this.id = 'cssValidator';
        this.description = 'Validate CSS and find issues with stylesheets';

        this.issues = [];
        this.analyzing = false;
        this.initialized = false;
    }

    /**
     * Set up the panel content
     * @returns {HTMLElement} The panel content element
     */
    setupPanel() {
        // Create panel content
        const content = document.createElement('div');
        content.className = 'css-validator-panel';

        // Create header
        const header = document.createElement('div');
        header.className = 'panel-header';
        header.innerHTML = `<h3>${this.name}</h3>`;
        content.appendChild(header);

        // Create content
        const panelContent = document.createElement('div');
        panelContent.className = 'panel-content';

        // Controls section
        const controlsSection = document.createElement('div');
        controlsSection.className = 'controls-section';

        const analyzeButton = document.createElement('button');
        analyzeButton.className = 'analyze-button';
        analyzeButton.textContent = 'Analyze Stylesheets';
        analyzeButton.addEventListener('click', () =>
            this.analyzeStylesheets()
        );
        controlsSection.appendChild(analyzeButton);
        this.analyzeButton = analyzeButton;

        const statusContainer = document.createElement('div');
        statusContainer.className = 'status-container';
        statusContainer.innerHTML =
            '<span class="status-text">Ready to analyze</span>';
        controlsSection.appendChild(statusContainer);
        this.statusContainer = statusContainer;

        panelContent.appendChild(controlsSection);

        // Results section
        const resultsSection = document.createElement('div');
        resultsSection.className = 'results-section';

        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'results-container';
        resultsContainer.innerHTML =
            '<p>Click "Analyze Stylesheets" to check for CSS issues.</p>';
        resultsSection.appendChild(resultsContainer);
        this.resultsContainer = resultsContainer;

        panelContent.appendChild(resultsSection);

        content.appendChild(panelContent);
        this.initialized = true;

        return content;
    }

    /**
     * Activate the tool
     */
    activate() {
        if (this.isActive) return;

        super.activate();
    }

    /**
     * Deactivate the tool
     */
    deactivate() {
        if (!this.isActive) return;

        super.deactivate();
    }

    /**
     * Analyze all stylesheets on the page
     */
    analyzeStylesheets() {
        if (this.analyzing) return;

        this.analyzing = true;
        this.issues = [];

        // Update status
        this.updateStatus('Analyzing stylesheets...', 'analyzing');

        // Update button
        this.analyzeButton.textContent = 'Analyzing...';
        this.analyzeButton.disabled = true;

        // Use setTimeout to prevent blocking the UI
        setTimeout(() => {
            try {
                // Get all stylesheets
                const sheets = document.styleSheets;
                let totalRules = 0;

                // Process each stylesheet
                for (let i = 0; i < sheets.length; i++) {
                    try {
                        const sheet = sheets[i];
                        const sheetHref = sheet.href || 'Inline Stylesheet';

                        // Skip if cannot access rules due to CORS
                        let rules;
                        try {
                            rules = sheet.cssRules || sheet.rules;
                            if (rules) {
                                totalRules += rules.length;
                            }
                        } catch (e) {
                            this.issues.push({
                                type: 'error',
                                message: `Cannot access stylesheet due to CORS: ${sheetHref}`,
                                source: sheetHref,
                                rule: null,
                            });
                            continue;
                        }

                        // Analyze rules
                        if (rules) {
                            this.analyzeRules(rules, sheetHref);
                        }
                    } catch (e) {
                        console.error('Error processing stylesheet:', e);
                    }
                }

                // Display results
                this.displayResults(totalRules);
            } catch (e) {
                console.error('Error analyzing stylesheets:', e);
                this.updateStatus('Error analyzing stylesheets', 'error');
            }

            // Reset state
            this.analyzing = false;
            this.analyzeButton.textContent = 'Analyze Stylesheets';
            this.analyzeButton.disabled = false;
        }, 100);
    }

    /**
     * Analyze CSS rules for issues
     * @param {CSSRuleList} rules - List of CSS rules
     * @param {string} source - Source URL or name of stylesheet
     */
    analyzeRules(rules, source) {
        for (let i = 0; i < rules.length; i++) {
            const rule = rules[i];

            // Handle different rule types
            switch (rule.type) {
                case CSSRule.STYLE_RULE:
                    this.analyzeStyleRule(rule, source);
                    break;

                case CSSRule.MEDIA_RULE:
                    // Recursively analyze media query rules
                    this.analyzeRules(rule.cssRules, source);
                    break;

                case CSSRule.IMPORT_RULE:
                    // Note import rules
                    this.issues.push({
                        type: 'info',
                        message: `@import rule found: ${rule.href}`,
                        source: source,
                        rule: rule.cssText,
                    });
                    break;

                case CSSRule.KEYFRAMES_RULE:
                    // Check keyframes rules
                    this.analyzeKeyframesRule(rule, source);
                    break;

                // Add more rule types as needed
            }
        }
    }

    /**
     * Analyze a CSS style rule for issues
     * @param {CSSStyleRule} rule - CSS rule to analyze
     * @param {string} source - Source URL or name of stylesheet
     */
    analyzeStyleRule(rule, source) {
        const style = rule.style;
        const selector = rule.selectorText;

        // Check for browser prefixes
        for (let i = 0; i < style.length; i++) {
            const prop = style[i];

            // Check for vendor prefixes
            if (
                prop.startsWith('-webkit-') ||
                prop.startsWith('-moz-') ||
                prop.startsWith('-ms-') ||
                prop.startsWith('-o-')
            ) {
                this.issues.push({
                    type: 'warning',
                    message: `Vendor prefix found: ${prop}`,
                    source: source,
                    rule: `${selector} { ${prop}: ${style.getPropertyValue(
                        prop
                    )}; }`,
                });
            }

            // Check for !important
            if (style.getPropertyPriority(prop) === 'important') {
                this.issues.push({
                    type: 'warning',
                    message: `!important found: ${prop}`,
                    source: source,
                    rule: `${selector} { ${prop}: ${style.getPropertyValue(
                        prop
                    )} !important; }`,
                });
            }

            // Check for potentially deprecated or problematic properties
            if (['filter', 'behavior', 'zoom', 'expression'].includes(prop)) {
                this.issues.push({
                    type: 'warning',
                    message: `Potentially problematic property: ${prop}`,
                    source: source,
                    rule: `${selector} { ${prop}: ${style.getPropertyValue(
                        prop
                    )}; }`,
                });
            }
        }

        // Check for potentially problematic selectors
        if (selector.includes('*')) {
            this.issues.push({
                type: 'warning',
                message: 'Universal selector (*) may impact performance',
                source: source,
                rule: selector,
            });
        }

        // Check for duplicate properties (not always errors, but worth flagging)
        const seenProps = new Set();
        const duplicateProps = [];

        for (let i = 0; i < style.length; i++) {
            const prop = style[i];
            if (seenProps.has(prop)) {
                duplicateProps.push(prop);
            } else {
                seenProps.add(prop);
            }
        }

        if (duplicateProps.length > 0) {
            this.issues.push({
                type: 'warning',
                message: `Duplicate properties found: ${duplicateProps.join(
                    ', '
                )}`,
                source: source,
                rule: selector,
            });
        }
    }

    /**
     * Analyze keyframes rules
     * @param {CSSKeyframesRule} rule - Keyframes rule to analyze
     * @param {string} source - Source URL or name of stylesheet
     */
    analyzeKeyframesRule(rule, source) {
        // Check if the keyframe animation uses browser prefixes
        if (
            rule.name.startsWith('-webkit-') ||
            rule.name.startsWith('-moz-') ||
            rule.name.startsWith('-ms-') ||
            rule.name.startsWith('-o-')
        ) {
            this.issues.push({
                type: 'info',
                message: `Vendor prefixed keyframes found: ${rule.name}`,
                source: source,
                rule: `@keyframes ${rule.name}`,
            });
        }
    }

    /**
     * Update the status display
     * @param {string} message - Status message to display
     * @param {string} state - Status state (analyzing, error, success)
     */
    updateStatus(message, state) {
        if (!this.statusContainer) return;

        // Map the state to the appropriate CSS class
        const stateClass =
            state === 'error'
                ? 'status-error'
                : state === 'success'
                ? 'status-success'
                : state === 'warning'
                ? 'status-warning'
                : '';

        this.statusContainer.innerHTML = `<span class="status-text ${stateClass}">${message}</span>`;
    }

    /**
     * Display analysis results
     * @param {number} totalRules - Total number of rules analyzed
     */
    displayResults(totalRules) {
        if (!this.resultsContainer) return;

        if (this.issues.length === 0) {
            this.updateStatus(
                `No issues found in ${totalRules} CSS rules`,
                'success'
            );
            this.resultsContainer.innerHTML =
                '<p class="success-message">No issues found!</p>';
            return;
        }

        // Group issues by type
        const errors = this.issues.filter((issue) => issue.type === 'error');
        const warnings = this.issues.filter(
            (issue) => issue.type === 'warning'
        );
        const infos = this.issues.filter((issue) => issue.type === 'info');

        // Update status
        this.updateStatus(
            `Found ${errors.length} errors, ${warnings.length} warnings, and ${infos.length} info items`,
            errors.length > 0
                ? 'error'
                : warnings.length > 0
                ? 'warning'
                : 'success'
        );

        // Create the results HTML
        let html = `<div class="summary">
            <div class="issue-count error-count">${errors.length} Errors</div>
            <div class="issue-count warning-count">${warnings.length} Warnings</div>
            <div class="issue-count info-count">${infos.length} Info</div>
        </div>`;

        // Function to display a group of issues
        const displayIssueGroup = (issues, title, className) => {
            if (issues.length === 0) return '';

            let groupHtml = `<div class="issue-group ${className}">
                <h4>${title} (${issues.length})</h4>
                <ul class="issue-list">`;

            issues.forEach((issue) => {
                groupHtml += `<li class="issue-item">
                    <div class="issue-message">${issue.message}</div>
                    <div class="issue-source">Source: ${issue.source}</div>
                    ${
                        issue.rule
                            ? `<code class="issue-rule">${this.escapeHtml(
                                  issue.rule
                              )}</code>`
                            : ''
                    }
                </li>`;
            });

            groupHtml += '</ul></div>';
            return groupHtml;
        };

        // Add each group of issues
        html += displayIssueGroup(errors, 'Errors', 'error-group');
        html += displayIssueGroup(warnings, 'Warnings', 'warning-group');
        html += displayIssueGroup(infos, 'Information', 'info-group');

        this.resultsContainer.innerHTML = html;
    }

    /**
     * Escape HTML special characters to prevent XSS
     * @param {string} html - HTML string to escape
     * @returns {string} - Escaped HTML string
     */
    escapeHtml(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }

    /**
     * Destroy the tool
     */
    destroy() {
        return super.destroy();
    }
}
