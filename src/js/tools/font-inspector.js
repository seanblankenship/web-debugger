/**
 * Font Inspector Tool
 * Inspects and displays information about fonts used on the page
 */
import BaseTool from '../tools/base-tool.js';
import { DOMUtils } from '../utils/dom-utils.js';

export class FontInspector extends BaseTool {
    /**
     * Constructor
     * @param {Object} config - Configuration object
     * @param {Object} config.ui - UI manager
     * @param {Object} config.storage - Storage manager
     */
    constructor(config = {}) {
        super(config);

        this.name = 'Font Inspector';
        this.icon = 'font';
        this.id = 'fontInspector';
        this.description = 'Analyze and inspect fonts on the page';

        this.isInspecting = false;
        this.selectedElement = null;
        this.fonts = [];
        this.initialized = false;
    }

    /**
     * Initialize the tool
     */
    init() {
        if (this.initialized) {
            return;
        }

        // Create panel if not already created
        if (!this.panel) {
            this.panel = document.createElement('div');
            this.panel.className = 'font-inspector-panel panel';
        }

        this.render();
        this.initialized = true;
    }

    /**
     * Render the tool UI
     */
    render() {
        if (!this.panel) {
            this.panel = document.createElement('div');
            this.panel.className = 'font-inspector-panel panel';
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

        // Font inspection options
        const optionsSection = document.createElement('div');
        optionsSection.className = 'font-options-section';

        const inspectButton = document.createElement('button');
        inspectButton.className = 'inspect-button';
        inspectButton.textContent = 'Select Element';
        inspectButton.addEventListener('click', () => this.toggleInspection());
        optionsSection.appendChild(inspectButton);
        this.inspectButton = inspectButton;

        const fontInfoContainer = document.createElement('div');
        fontInfoContainer.className = 'font-info-container';
        fontInfoContainer.innerHTML =
            '<p>Select an element to analyze its font properties</p>';
        optionsSection.appendChild(fontInfoContainer);
        this.fontInfoContainer = fontInfoContainer;

        content.appendChild(optionsSection);

        // Page fonts section
        const fontsSection = document.createElement('div');
        fontsSection.className = 'page-fonts-section';

        const fontsTitle = document.createElement('h4');
        fontsTitle.textContent = 'Page Fonts';
        fontsSection.appendChild(fontsTitle);

        const refreshButton = document.createElement('button');
        refreshButton.textContent = 'Refresh Fonts';
        refreshButton.addEventListener('click', () => this.analyzeFonts());
        fontsSection.appendChild(refreshButton);

        const fontsContainer = document.createElement('div');
        fontsContainer.className = 'fonts-container';
        fontsSection.appendChild(fontsContainer);
        this.fontsContainer = fontsContainer;

        content.appendChild(fontsSection);

        // Add content to panel
        this.panel.appendChild(content);

        // Analyze fonts on the page
        this.analyzeFonts();

        return this.panel;
    }

    /**
     * Activate the tool
     */
    activate() {
        if (this.isActive) return;

        super.activate();

        // Show the panel
        if (this.ui) {
            this.ui.showToolPanel(this.panel);
        }
    }

    /**
     * Deactivate the tool
     */
    deactivate() {
        if (!this.isActive) return;

        // Stop inspection if active
        if (this.isInspecting) {
            this.stopInspection();
        }

        super.deactivate();
    }

    /**
     * Toggle font inspection mode
     */
    toggleInspection() {
        if (this.isInspecting) {
            this.stopInspection();
        } else {
            this.startInspection();
        }
    }

    /**
     * Start the font inspection mode
     */
    startInspection() {
        this.isInspecting = true;
        this.inspectButton.textContent = 'Cancel Selection';

        // Add inspection class to body
        document.body.classList.add('font-inspection-active');

        // Add mouse move event to highlight elements
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('click', this.handleClick);
    }

    /**
     * Stop the font inspection mode
     */
    stopInspection() {
        this.isInspecting = false;
        this.inspectButton.textContent = 'Select Element';

        // Remove inspection class from body
        document.body.classList.remove('font-inspection-active');

        // Remove hover class from all elements
        const hoveredElements = document.querySelectorAll(
            '.font-inspector-hover'
        );
        hoveredElements.forEach((el) =>
            el.classList.remove('font-inspector-hover')
        );

        // Remove event listeners
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('click', this.handleClick);
    }

    /**
     * Handle mouse move for hover effect
     * @param {MouseEvent} e - Mouse event
     */
    handleMouseMove = (e) => {
        // Remove hover class from all elements
        const hoveredElements = document.querySelectorAll(
            '.font-inspector-hover'
        );
        hoveredElements.forEach((el) =>
            el.classList.remove('font-inspector-hover')
        );

        // Get element under cursor (exclude our own elements)
        const element = this.getElementUnderCursor(e);
        if (element) {
            element.classList.add('font-inspector-hover');
        }
    };

    /**
     * Handle click for element selection
     * @param {MouseEvent} e - Mouse event
     */
    handleClick = (e) => {
        if (!this.isInspecting) return;

        // Prevent default and stop propagation
        e.preventDefault();
        e.stopPropagation();

        // Get element under cursor (exclude our own elements)
        const element = this.getElementUnderCursor(e);
        if (element) {
            // Select this element
            this.selectElement(element);
            this.stopInspection();
        }
    };

    /**
     * Get the element under cursor, excluding our UI elements
     * @param {MouseEvent} e - Mouse event
     * @returns {Element|null} - The element under cursor or null
     */
    getElementUnderCursor(e) {
        // Get all elements at the position
        const elements = document.elementsFromPoint(e.clientX, e.clientY);

        // Filter out our own UI elements
        for (const el of elements) {
            // Skip our own UI elements
            if (
                el.closest('.web-debugger') ||
                el.closest('.dev-overlay') ||
                el === document.documentElement ||
                el === document.body
            ) {
                continue;
            }

            return el;
        }

        return null;
    }

    /**
     * Select an element and analyze its font properties
     * @param {Element} element - The element to analyze
     */
    selectElement(element) {
        this.selectedElement = element;

        // Analyze font properties
        const computedStyle = window.getComputedStyle(element);
        const fontInfo = {
            fontFamily: computedStyle.fontFamily,
            fontSize: computedStyle.fontSize,
            fontWeight: computedStyle.fontWeight,
            fontStyle: computedStyle.fontStyle,
            lineHeight: computedStyle.lineHeight,
            letterSpacing: computedStyle.letterSpacing,
            textAlign: computedStyle.textAlign,
            color: computedStyle.color,
        };

        // Display font information
        this.displayFontInfo(fontInfo);
    }

    /**
     * Display font information in the UI
     * @param {Object} fontInfo - Font information object
     */
    displayFontInfo(fontInfo) {
        if (!this.fontInfoContainer) return;

        // Create font info html
        let html = '<div class="font-info">';
        html += `<div class="font-preview" style="font-family: ${fontInfo.fontFamily}; font-size: ${fontInfo.fontSize}; font-weight: ${fontInfo.fontWeight}; font-style: ${fontInfo.fontStyle}; color: ${fontInfo.color};">The quick brown fox jumps over the lazy dog</div>`;
        html += '<table class="font-properties">';

        for (const [property, value] of Object.entries(fontInfo)) {
            html += `<tr><td>${this.formatPropertyName(
                property
            )}</td><td>${value}</td></tr>`;
        }

        html += '</table></div>';

        this.fontInfoContainer.innerHTML = html;
    }

    /**
     * Format property name for display
     * @param {string} name - Property name
     * @returns {string} - Formatted property name
     */
    formatPropertyName(name) {
        return name
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase());
    }

    /**
     * Analyze fonts used on the page
     */
    analyzeFonts() {
        this.fonts = [];
        const fontFamilies = new Set();

        // Get all elements
        const elements = document.querySelectorAll('*');

        // Analyze each element
        elements.forEach((el) => {
            // Skip our own UI elements
            if (el.closest('.web-debugger') || el.closest('.dev-overlay')) {
                return;
            }

            const style = window.getComputedStyle(el);
            const fontFamily = style.fontFamily;

            if (fontFamily && !fontFamilies.has(fontFamily)) {
                fontFamilies.add(fontFamily);

                this.fonts.push({
                    family: fontFamily,
                    weight: style.fontWeight,
                    style: style.fontStyle,
                    example: el,
                });
            }
        });

        // Display the fonts
        this.displayFonts();
    }

    /**
     * Display fonts in the UI
     */
    displayFonts() {
        if (!this.fontsContainer) return;

        if (this.fonts.length === 0) {
            this.fontsContainer.innerHTML =
                '<p>No fonts found on this page</p>';
            return;
        }

        let html = '<div class="font-list">';

        this.fonts.forEach((font) => {
            const cleanFamily = font.family.replace(/['"]/g, '');

            html += `<div class="font-item">
                <div class="font-sample" style="font-family: ${font.family};">Aa</div>
                <div class="font-details">
                    <div class="font-name">${cleanFamily}</div>
                    <div class="font-meta">${font.weight} ${font.style}</div>
                </div>
            </div>`;
        });

        html += '</div>';

        this.fontsContainer.innerHTML = html;
    }

    /**
     * Destroy the tool
     */
    destroy() {
        // Stop inspection if active
        if (this.isInspecting) {
            this.stopInspection();
        }

        return super.destroy();
    }
}
