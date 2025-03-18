/**
 * Accessibility Checker Tool
 * Analyzes the page for accessibility issues
 */
import BaseTool from '../tools/base-tool.js';

export class AccessibilityChecker extends BaseTool {
    /**
     * Create a new AccessibilityChecker
     * @param {Object} config - Configuration options
     * @param {Object} config.ui - UI manager
     * @param {Object} config.storage - Storage manager
     */
    constructor(config = {}) {
        super(config);

        this.name = 'Accessibility Checker';
        this.icon = 'accessibility';
        this.id = 'accessibilityChecker';
        this.description = 'Check page for accessibility issues';

        this.isScanning = false;
        this.issues = [];
        this.filters = {
            critical: true,
            serious: true,
            moderate: true,
            minor: true,
        };
        this.currentHighlightedElement = null;
        this.initialized = false;
    }

    /**
     * Set up the panel content
     * @returns {HTMLElement} The panel content element
     */
    setupPanel() {
        // Create panel content
        const content = document.createElement('div');
        content.className = 'accessibility-checker-panel';

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

        const scanButton = document.createElement('button');
        scanButton.className = 'scan-button primary-button';
        scanButton.textContent = 'Scan Page';
        scanButton.addEventListener('click', () => this.startScan());
        controlsSection.appendChild(scanButton);
        this.scanButton = scanButton;

        const filtersContainer = document.createElement('div');
        filtersContainer.className = 'filters-container';
        filtersContainer.innerHTML =
            '<span class="filters-label">Show issues:</span>';

        // Create filter checkboxes
        const createFilter = (id, label, checked) => {
            const filterItem = document.createElement('div');
            filterItem.className = 'filter-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = id;
            checkbox.checked = checked;
            checkbox.addEventListener('change', () => {
                this.filters[id] = checkbox.checked;
                this.setSetting(`filter.${id}`, checkbox.checked);
                this.updateIssuesList();
            });

            const filterLabel = document.createElement('label');
            filterLabel.htmlFor = id;
            filterLabel.textContent = label;
            filterLabel.className = `severity-${id}`;

            filterItem.appendChild(checkbox);
            filterItem.appendChild(filterLabel);

            return filterItem;
        };

        // Add filter options
        filtersContainer.appendChild(
            createFilter('critical', 'Critical', this.filters.critical)
        );
        filtersContainer.appendChild(
            createFilter('serious', 'Serious', this.filters.serious)
        );
        filtersContainer.appendChild(
            createFilter('moderate', 'Moderate', this.filters.moderate)
        );
        filtersContainer.appendChild(
            createFilter('minor', 'Minor', this.filters.minor)
        );

        controlsSection.appendChild(filtersContainer);
        panelContent.appendChild(controlsSection);

        // Results section
        const resultsSection = document.createElement('div');
        resultsSection.className = 'results-section';

        const issuesContainer = document.createElement('div');
        issuesContainer.className = 'issues-container';
        issuesContainer.innerHTML =
            '<p class="empty-message">Scan the page to find accessibility issues</p>';
        resultsSection.appendChild(issuesContainer);
        this.issuesContainer = issuesContainer;

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

        // Load saved filters
        this.loadFilters();
    }

    /**
     * Deactivate the tool
     */
    deactivate() {
        if (!this.isActive) return;

        // Remove any highlights
        this.clearHighlights();

        super.deactivate();
    }

    /**
     * Load saved filter settings
     */
    loadFilters() {
        Object.keys(this.filters).forEach((filterId) => {
            const savedValue = this.getSetting(`filter.${filterId}`, true);
            this.filters[filterId] = savedValue;

            // Update checkbox if it exists
            const checkbox = this.panel.querySelector(`#${filterId}`);
            if (checkbox) {
                checkbox.checked = savedValue;
            }
        });
    }

    /**
     * Start accessibility scan
     */
    startScan() {
        if (this.isScanning) return;

        this.isScanning = true;
        this.scanButton.textContent = 'Scanning...';
        this.scanButton.disabled = true;
        this.issues = [];

        // Show scanning message
        this.issuesContainer.innerHTML =
            '<p class="loading-message">Scanning page for accessibility issues...</p>';

        // Use setTimeout to prevent UI blocking
        setTimeout(() => {
            try {
                // Run the scan
                this.runAccessibilityScan();

                // Update UI with results
                this.updateIssuesList();
            } catch (error) {
                console.error('Error running accessibility scan:', error);
                this.issuesContainer.innerHTML = `<p class="error-message">Error during scan: ${error.message}</p>`;
            } finally {
                // Reset state
                this.isScanning = false;
                this.scanButton.textContent = 'Scan Page';
                this.scanButton.disabled = false;
            }
        }, 100);
    }

    /**
     * Run the accessibility scan on the page
     */
    runAccessibilityScan() {
        // Clear previous issues
        this.issues = [];

        // Check for common accessibility issues
        this.checkImagesWithoutAlt();
        this.checkEmptyLinks();
        this.checkEmptyButtons();
        this.checkColorContrast();
        this.checkHeadingOrder();
        this.checkFormLabels();
        this.checkAriaAttributes();
        this.checkKeyboardAccessibility();
        this.checkDocumentLanguage();
        this.checkPageTitle();
    }

    /**
     * Check for images without alt text
     */
    checkImagesWithoutAlt() {
        const images = document.querySelectorAll(
            'img:not([aria-hidden="true"])'
        );

        images.forEach((img) => {
            if (!img.hasAttribute('alt')) {
                this.addIssue({
                    element: img,
                    message: 'Image is missing alt text',
                    severity: 'serious',
                    code: 'img-alt',
                    impact: 'Images without alt text are not accessible to screen reader users',
                    suggestion:
                        'Add descriptive alt text to the image. Use alt="" for decorative images.',
                    wcag: '1.1.1 Non-text Content (Level A)',
                });
            } else if (img.alt.trim() === '' && !this.isDecorativeImage(img)) {
                this.addIssue({
                    element: img,
                    message: 'Image may need descriptive alt text',
                    severity: 'moderate',
                    code: 'img-alt-empty',
                    impact: 'Meaningful images with empty alt text will be skipped by screen readers',
                    suggestion:
                        'Add descriptive alt text unless the image is purely decorative',
                    wcag: '1.1.1 Non-text Content (Level A)',
                });
            }
        });
    }

    /**
     * Check if an image appears to be decorative
     * @param {HTMLImageElement} img - The image element
     * @returns {boolean} True if the image appears to be decorative
     */
    isDecorativeImage(img) {
        // Small images are often decorative
        if (img.width < 16 || img.height < 16) return true;

        // Check if the image has role="presentation"
        if (img.getAttribute('role') === 'presentation') return true;

        // Check common classes or patterns that suggest decorative images
        const classes = img.className.toLowerCase();
        if (
            classes.includes('decoration') ||
            classes.includes('background') ||
            classes.includes('icon') ||
            classes.includes('separator')
        ) {
            return true;
        }

        return false;
    }

    /**
     * Check for empty links
     */
    checkEmptyLinks() {
        const links = document.querySelectorAll('a[href]');

        links.forEach((link) => {
            const hasText = link.textContent.trim().length > 0;
            const hasImgWithAlt = link.querySelector('img[alt]:not([alt=""])');
            const hasAriaLabel =
                link.hasAttribute('aria-label') &&
                link.getAttribute('aria-label').trim().length > 0;
            const hasAriaLabelledBy = link.hasAttribute('aria-labelledby');

            if (
                !hasText &&
                !hasImgWithAlt &&
                !hasAriaLabel &&
                !hasAriaLabelledBy
            ) {
                this.addIssue({
                    element: link,
                    message: 'Link has no accessible text',
                    severity: 'serious',
                    code: 'link-name',
                    impact: 'Links without accessible text cannot be used by screen reader users',
                    suggestion:
                        'Add text content to the link, or use aria-label or aria-labelledby',
                    wcag: '2.4.4 Link Purpose (In Context) (Level A)',
                });
            }
        });
    }

    /**
     * Check for empty buttons
     */
    checkEmptyButtons() {
        const buttons = document.querySelectorAll('button, [role="button"]');

        buttons.forEach((button) => {
            const hasText = button.textContent.trim().length > 0;
            const hasAriaLabel =
                button.hasAttribute('aria-label') &&
                button.getAttribute('aria-label').trim().length > 0;
            const hasAriaLabelledBy = button.hasAttribute('aria-labelledby');
            const hasTitle =
                button.hasAttribute('title') &&
                button.getAttribute('title').trim().length > 0;

            if (!hasText && !hasAriaLabel && !hasAriaLabelledBy && !hasTitle) {
                this.addIssue({
                    element: button,
                    message: 'Button has no accessible name',
                    severity: 'serious',
                    code: 'button-name',
                    impact: 'Buttons without accessible names cannot be used by screen reader users',
                    suggestion:
                        'Add text content to the button, or use aria-label or aria-labelledby',
                    wcag: '4.1.2 Name, Role, Value (Level A)',
                });
            }
        });
    }

    /**
     * Basic color contrast check
     * Note: This is a simplified check and may not catch all contrast issues
     */
    checkColorContrast() {
        // Get all elements with text content
        const elements = Array.from(document.querySelectorAll('*')).filter(
            (el) => {
                const style = window.getComputedStyle(el);
                return (
                    el.textContent.trim().length > 0 &&
                    style.display !== 'none' &&
                    style.visibility !== 'hidden' &&
                    parseFloat(style.opacity) > 0
                );
            }
        );

        elements.forEach((element) => {
            try {
                const style = window.getComputedStyle(element);
                const foregroundColor = style.color;
                const backgroundColor =
                    this.getEffectiveBackgroundColor(element);

                if (foregroundColor && backgroundColor) {
                    const contrast = this.calculateColorContrast(
                        foregroundColor,
                        backgroundColor
                    );

                    // WCAG 2.0 level AA requires contrast ratio of 4.5:1 for normal text
                    // and 3:1 for large text (18pt+, or 14pt+ bold)
                    const fontSize = parseFloat(style.fontSize);
                    const fontWeight = parseInt(style.fontWeight, 10);
                    const isLargeText =
                        fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700);
                    const requiredContrast = isLargeText ? 3 : 4.5;

                    if (contrast < requiredContrast) {
                        const severity =
                            contrast < requiredContrast * 0.8
                                ? 'serious'
                                : 'moderate';

                        this.addIssue({
                            element,
                            message: `Insufficient color contrast: ${contrast.toFixed(
                                2
                            )}:1 (should be at least ${requiredContrast}:1)`,
                            severity,
                            code: 'color-contrast',
                            impact: 'Text with poor contrast is difficult to read for users with low vision',
                            suggestion:
                                'Increase the contrast between the text and background colors',
                            wcag: '1.4.3 Contrast (Minimum) (Level AA)',
                        });
                    }
                }
            } catch (error) {
                // Skip elements with errors in contrast calculation
                console.error('Error calculating contrast for element:', error);
            }
        });
    }

    /**
     * Get the effective background color for an element
     * @param {HTMLElement} element - The element to check
     * @returns {string|null} The background color or null if transparent
     */
    getEffectiveBackgroundColor(element) {
        let current = element;
        let bgColor = '';

        // Walk up the DOM tree until we find a non-transparent background
        while (current && current !== document.body) {
            const style = window.getComputedStyle(current);
            bgColor = style.backgroundColor;

            // If we found a non-transparent background, return it
            if (
                bgColor &&
                bgColor !== 'transparent' &&
                !bgColor.includes('rgba(0, 0, 0, 0)')
            ) {
                return bgColor;
            }

            current = current.parentElement;
        }

        // If we reach the body, use its background
        return window.getComputedStyle(document.body).backgroundColor;
    }

    /**
     * Calculate the contrast ratio between two colors
     * @param {string} foreground - The foreground color (CSS color value)
     * @param {string} background - The background color (CSS color value)
     * @returns {number} The contrast ratio
     */
    calculateColorContrast(foreground, background) {
        // Convert colors to RGB
        const fgRGB = this.parseColor(foreground);
        const bgRGB = this.parseColor(background);

        if (!fgRGB || !bgRGB) return 21; // Max contrast if cannot calculate

        // Calculate relative luminance
        const fgLuminance = this.calculateRelativeLuminance(fgRGB);
        const bgLuminance = this.calculateRelativeLuminance(bgRGB);

        // Calculate contrast ratio
        const l1 = Math.max(fgLuminance, bgLuminance);
        const l2 = Math.min(fgLuminance, bgLuminance);

        return (l1 + 0.05) / (l2 + 0.05);
    }

    /**
     * Parse a CSS color value to RGB
     * @param {string} color - The CSS color value
     * @returns {Object|null} Object with r, g, b properties or null if parsing failed
     */
    parseColor(color) {
        // Handle simple rgb(r, g, b) format
        const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (rgbMatch) {
            return {
                r: parseInt(rgbMatch[1], 10),
                g: parseInt(rgbMatch[2], 10),
                b: parseInt(rgbMatch[3], 10),
            };
        }

        // Handle rgba(r, g, b, a) format
        const rgbaMatch = color.match(
            /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/
        );
        if (rgbaMatch) {
            return {
                r: parseInt(rgbaMatch[1], 10),
                g: parseInt(rgbaMatch[2], 10),
                b: parseInt(rgbaMatch[3], 10),
            };
        }

        return null;
    }

    /**
     * Calculate relative luminance from RGB values
     * @param {Object} rgb - Object with r, g, b properties
     * @returns {number} The relative luminance
     */
    calculateRelativeLuminance(rgb) {
        // Normalize RGB values to 0-1
        const r = rgb.r / 255;
        const g = rgb.g / 255;
        const b = rgb.b / 255;

        // Calculate sRGB
        const R = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
        const G = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
        const B = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

        // Calculate luminance
        return 0.2126 * R + 0.7152 * G + 0.0722 * B;
    }

    /**
     * Check for proper heading order
     */
    checkHeadingOrder() {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let previousLevel = 0;

        headings.forEach((heading) => {
            const level = parseInt(heading.tagName.substring(1), 10);

            // Check for skipped heading levels (e.g., h1 to h3)
            if (previousLevel > 0 && level > previousLevel + 1) {
                this.addIssue({
                    element: heading,
                    message: `Heading level skipped from h${previousLevel} to h${level}`,
                    severity: 'moderate',
                    code: 'heading-order',
                    impact: 'Skipped heading levels can confuse screen reader users about the content hierarchy',
                    suggestion: `Use h${
                        previousLevel + 1
                    } instead, or restructure the headings`,
                    wcag: '1.3.1 Info and Relationships (Level A)',
                });
            }

            // If this is the first heading and it's not h1
            if (previousLevel === 0 && level !== 1) {
                this.addIssue({
                    element: heading,
                    message: `First heading is not an h1 element`,
                    severity: 'moderate',
                    code: 'heading-first-h1',
                    impact: 'Pages without a primary h1 heading may confuse screen reader users',
                    suggestion: 'Make the first heading an h1 element',
                    wcag: '1.3.1 Info and Relationships (Level A)',
                });
            }

            previousLevel = level;
        });

        // Check if page has any headings
        if (headings.length === 0) {
            this.addIssue({
                element: document.body,
                message: 'Page has no headings',
                severity: 'moderate',
                code: 'heading-missing',
                impact: 'Pages without headings are difficult to navigate for screen reader users',
                suggestion: 'Add headings to structure the content',
                wcag: '1.3.1 Info and Relationships (Level A)',
            });
        }
    }

    /**
     * Check for form controls without associated labels
     */
    checkFormLabels() {
        const formControls = document.querySelectorAll(
            'input:not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="reset"]), select, textarea'
        );

        formControls.forEach((control) => {
            const hasLabel = !!control.labels && control.labels.length > 0;
            const hasAriaLabel =
                control.hasAttribute('aria-label') &&
                control.getAttribute('aria-label').trim().length > 0;
            const hasAriaLabelledBy = control.hasAttribute('aria-labelledby');
            const hasTitle =
                control.hasAttribute('title') &&
                control.getAttribute('title').trim().length > 0;

            if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy && !hasTitle) {
                this.addIssue({
                    element: control,
                    message: 'Form control has no accessible label',
                    severity: 'serious',
                    code: 'label',
                    impact: 'Form controls without labels are not accessible to screen reader users',
                    suggestion:
                        "Add a label element with a for attribute matching the input's id, or use aria-label or aria-labelledby",
                    wcag: '3.3.2 Labels or Instructions (Level A)',
                });
            }
        });
    }

    /**
     * Check for common ARIA attribute errors
     */
    checkAriaAttributes() {
        // Check for invalid ARIA roles
        const elementsWithRole = document.querySelectorAll('[role]');
        const validRoles = [
            'alert',
            'alertdialog',
            'application',
            'article',
            'banner',
            'button',
            'cell',
            'checkbox',
            'columnheader',
            'combobox',
            'complementary',
            'contentinfo',
            'definition',
            'dialog',
            'directory',
            'document',
            'feed',
            'figure',
            'form',
            'grid',
            'gridcell',
            'group',
            'heading',
            'img',
            'link',
            'list',
            'listbox',
            'listitem',
            'log',
            'main',
            'marquee',
            'math',
            'menu',
            'menubar',
            'menuitem',
            'menuitemcheckbox',
            'menuitemradio',
            'navigation',
            'none',
            'note',
            'option',
            'presentation',
            'progressbar',
            'radio',
            'radiogroup',
            'region',
            'row',
            'rowgroup',
            'rowheader',
            'scrollbar',
            'search',
            'searchbox',
            'separator',
            'slider',
            'spinbutton',
            'status',
            'switch',
            'tab',
            'table',
            'tablist',
            'tabpanel',
            'term',
            'textbox',
            'timer',
            'toolbar',
            'tooltip',
            'tree',
            'treegrid',
            'treeitem',
        ];

        elementsWithRole.forEach((element) => {
            const role = element.getAttribute('role');
            if (!validRoles.includes(role)) {
                this.addIssue({
                    element,
                    message: `Invalid ARIA role: "${role}"`,
                    severity: 'moderate',
                    code: 'aria-role',
                    impact: 'Invalid ARIA roles can cause confusion for screen reader users',
                    suggestion: `Remove the role attribute or use a valid ARIA role`,
                    wcag: '4.1.2 Name, Role, Value (Level A)',
                });
            }
        });

        // Check for aria-hidden on focusable elements
        const hiddenFocusable = document.querySelectorAll(
            '[aria-hidden="true"] a[href], [aria-hidden="true"] button, [aria-hidden="true"] input, [aria-hidden="true"] select, [aria-hidden="true"] textarea, [aria-hidden="true"] [tabindex]:not([tabindex="-1"])'
        );

        hiddenFocusable.forEach((element) => {
            this.addIssue({
                element,
                message:
                    'Focusable element inside aria-hidden="true" container',
                severity: 'serious',
                code: 'aria-hidden-focus',
                impact: 'Elements with aria-hidden="true" are hidden from screen readers but still focusable by keyboard',
                suggestion:
                    'Remove the focusable element from the aria-hidden container or make it non-focusable',
                wcag: '4.1.2 Name, Role, Value (Level A)',
            });
        });
    }

    /**
     * Check for keyboard accessibility issues
     */
    checkKeyboardAccessibility() {
        // Check for positive tabindex values
        const elementsWithPositiveTabindex =
            document.querySelectorAll('[tabindex]');

        elementsWithPositiveTabindex.forEach((element) => {
            const tabindex = parseInt(element.getAttribute('tabindex'), 10);
            if (tabindex > 0) {
                this.addIssue({
                    element,
                    message: `Element has a positive tabindex value (${tabindex})`,
                    severity: 'moderate',
                    code: 'tabindex',
                    impact: 'Positive tabindex values change the natural tab order and can be confusing',
                    suggestion:
                        'Use tabindex="0" to make an element focusable in the natural tab order',
                    wcag: '2.4.3 Focus Order (Level A)',
                });
            }
        });

        // Check for click handlers without keyboard handlers
        const elementsWithHandlers = document.querySelectorAll(
            '[onclick], [role="button"], [role="link"], [role="checkbox"], [role="tab"]'
        );

        elementsWithHandlers.forEach((element) => {
            // Skip native interactive elements
            if (
                ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(
                    element.tagName
                )
            ) {
                return;
            }

            const hasKeyboardHandler =
                element.hasAttribute('onkeydown') ||
                element.hasAttribute('onkeyup') ||
                element.hasAttribute('onkeypress');

            // If it has click but no keyboard handler and no tabindex
            if (!hasKeyboardHandler && !element.hasAttribute('tabindex')) {
                this.addIssue({
                    element,
                    message: 'Interactive element not keyboard accessible',
                    severity: 'serious',
                    code: 'keyboard',
                    impact: 'Elements that can be clicked but not accessed via keyboard are not accessible',
                    suggestion: 'Add tabindex="0" and keyboard event handlers',
                    wcag: '2.1.1 Keyboard (Level A)',
                });
            }
        });
    }

    /**
     * Check for document language
     */
    checkDocumentLanguage() {
        const html = document.querySelector('html');

        if (!html.hasAttribute('lang')) {
            this.addIssue({
                element: html,
                message: 'Document language not specified',
                severity: 'serious',
                code: 'html-lang',
                impact: 'Screen readers may use the wrong pronunciation rules for the content',
                suggestion:
                    'Add a lang attribute to the html element (e.g., lang="en")',
                wcag: '3.1.1 Language of Page (Level A)',
            });
        } else if (html.getAttribute('lang').trim() === '') {
            this.addIssue({
                element: html,
                message: 'Document language attribute is empty',
                severity: 'serious',
                code: 'html-lang-empty',
                impact: 'Empty lang attribute does not specify the language',
                suggestion: 'Add a valid language code to the lang attribute',
                wcag: '3.1.1 Language of Page (Level A)',
            });
        }
    }

    /**
     * Check for page title
     */
    checkPageTitle() {
        const titleElement = document.querySelector('title');

        if (!titleElement) {
            this.addIssue({
                element: document.head || document.documentElement,
                message: 'Page has no title element',
                severity: 'serious',
                code: 'document-title',
                impact: 'Pages without titles are difficult to identify in browser tabs and history',
                suggestion:
                    'Add a descriptive title element to the document head',
                wcag: '2.4.2 Page Titled (Level A)',
            });
        } else if (titleElement.textContent.trim() === '') {
            this.addIssue({
                element: titleElement,
                message: 'Page title is empty',
                severity: 'serious',
                code: 'document-title-empty',
                impact: 'Empty titles do not identify the page',
                suggestion: 'Add descriptive content to the title element',
                wcag: '2.4.2 Page Titled (Level A)',
            });
        }
    }

    /**
     * Add an issue to the issues list
     * @param {Object} issue - The issue object
     */
    addIssue(issue) {
        // Generate a unique ID for the issue
        issue.id = `issue-${this.issues.length + 1}`;

        // Add issue to the list
        this.issues.push(issue);
    }

    /**
     * Update the issues list in the UI
     */
    updateIssuesList() {
        if (!this.issuesContainer) return;

        // Filter issues based on current filters
        const filteredIssues = this.issues.filter(
            (issue) => this.filters[issue.severity]
        );

        if (filteredIssues.length === 0) {
            if (this.issues.length === 0) {
                this.issuesContainer.innerHTML =
                    '<p class="success-message">No accessibility issues found!</p>';
            } else {
                this.issuesContainer.innerHTML =
                    '<p class="filtered-message">No issues match the current filters</p>';
            }
            return;
        }

        // Create summary
        const severityCounts = {
            critical: 0,
            serious: 0,
            moderate: 0,
            minor: 0,
        };

        this.issues.forEach((issue) => {
            if (issue.severity in severityCounts) {
                severityCounts[issue.severity]++;
            }
        });

        let html = `
        <div class="issues-summary">
            <h4>Issues Found: ${this.issues.length}</h4>
            <div class="severity-counts">
                <span class="severity-critical">Critical: ${severityCounts.critical}</span>
                <span class="severity-serious">Serious: ${severityCounts.serious}</span>
                <span class="severity-moderate">Moderate: ${severityCounts.moderate}</span>
                <span class="severity-minor">Minor: ${severityCounts.minor}</span>
            </div>
        </div>`;

        // Create issues list
        html += '<ul class="issues-list">';

        filteredIssues.forEach((issue) => {
            html += `
            <li class="issue-item severity-${issue.severity}" data-issue-id="${
                issue.id
            }">
                <div class="issue-header">
                    <span class="issue-severity">${issue.severity}</span>
                    <span class="issue-message">${issue.message}</span>
                </div>
                <div class="issue-details">
                    <div class="issue-impact">
                        <strong>Impact:</strong> ${issue.impact}
                    </div>
                    <div class="issue-element">
                        <strong>Element:</strong> 
                        <code>${this.getElementPreview(issue.element)}</code>
                        <button class="highlight-button" data-issue-id="${
                            issue.id
                        }">Highlight</button>
                    </div>
                    <div class="issue-suggestion">
                        <strong>How to fix:</strong> ${issue.suggestion}
                    </div>
                    <div class="issue-wcag">
                        <strong>WCAG:</strong> ${issue.wcag}
                    </div>
                </div>
            </li>`;
        });

        html += '</ul>';

        this.issuesContainer.innerHTML = html;

        // Add event listeners to highlight buttons
        const highlightButtons =
            this.issuesContainer.querySelectorAll('.highlight-button');
        highlightButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const issueId = button.getAttribute('data-issue-id');
                const issue = this.issues.find((i) => i.id === issueId);

                if (issue && issue.element) {
                    this.highlightElement(issue.element);
                }
            });
        });
    }

    /**
     * Get a preview of an element for display
     * @param {HTMLElement} element - The element to preview
     * @returns {string} HTML string representing the element
     */
    getElementPreview(element) {
        if (!element) return 'Unknown element';

        let preview = element.tagName.toLowerCase();

        // Add id if present
        if (element.id) {
            preview += `#${element.id}`;
        }

        // Add classes if present
        if (element.className && typeof element.className === 'string') {
            const classes = element.className
                .split(' ')
                .filter((c) => c.trim());
            if (classes.length > 0) {
                preview += `.${classes.join('.')}`;
            }
        }

        // Add relevant attributes
        const relevantAttrs = ['role', 'aria-label', 'alt', 'title'];
        relevantAttrs.forEach((attr) => {
            if (element.hasAttribute(attr)) {
                const value = element.getAttribute(attr);
                preview += ` ${attr}="${this.escapeHtml(value)}"`;
            }
        });

        // Add text preview if it has text
        if (element.textContent) {
            const text = element.textContent.trim();
            if (text) {
                const shortText =
                    text.length > 20 ? text.substring(0, 17) + '...' : text;
                preview += ` "${this.escapeHtml(shortText)}"`;
            }
        }

        return preview;
    }

    /**
     * Highlight an element on the page
     * @param {HTMLElement} element - The element to highlight
     */
    highlightElement(element) {
        // Clear any existing highlight
        this.clearHighlights();

        if (!element || !element.getBoundingClientRect) return;

        // Create highlight element
        const highlight = document.createElement('div');
        highlight.className = 'a11y-highlight';

        // Position highlight over the element
        const rect = element.getBoundingClientRect();
        const scrollTop =
            window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft =
            window.pageXOffset || document.documentElement.scrollLeft;

        Object.assign(highlight.style, {
            position: 'absolute',
            top: `${rect.top + scrollTop}px`,
            left: `${rect.left + scrollLeft}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
            border: '2px solid red',
            zIndex: '9999',
            pointerEvents: 'none',
            boxSizing: 'border-box',
        });

        // Add to document
        document.body.appendChild(highlight);
        this.currentHighlightedElement = highlight;

        // Scroll element into view if needed
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
        });

        // Auto-remove highlight after 3 seconds
        setTimeout(() => this.clearHighlights(), 3000);
    }

    /**
     * Clear any existing highlights
     */
    clearHighlights() {
        if (this.currentHighlightedElement) {
            if (this.currentHighlightedElement.parentNode) {
                this.currentHighlightedElement.parentNode.removeChild(
                    this.currentHighlightedElement
                );
            }
            this.currentHighlightedElement = null;
        }

        // Also remove any other highlights that might exist
        const highlights = document.querySelectorAll('.a11y-highlight');
        highlights.forEach((highlight) => {
            if (highlight.parentNode) {
                highlight.parentNode.removeChild(highlight);
            }
        });
    }

    /**
     * Escape HTML special characters
     * @param {string} str - The string to escape
     * @returns {string} The escaped string
     */
    escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Clean up resources when the tool is destroyed
     */
    destroy() {
        this.clearHighlights();
        return super.destroy();
    }
}
