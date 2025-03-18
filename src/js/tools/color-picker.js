/**
 * Color Picker Tool
 * Allows users to pick colors from the page and analyze them
 */
import BaseTool from '../tools/base-tool.js';
import { ColorUtils } from '../utils/color-utils.js';
import { DOMUtils } from '../utils/dom-utils.js';

export class ColorPicker extends BaseTool {
    /**
     * Create a new ColorPicker tool
     * @param {Object} config - Configuration options
     * @param {Object} config.ui - UI manager instance
     * @param {Object} config.storage - Storage manager instance
     */
    constructor(config = {}) {
        super(config);

        this.name = 'Color Picker';
        this.icon = 'colorPicker';
        this.description = 'Pick colors from the page and analyze them';

        this.colors = [];
        this.selectedColor = null;
        this.isPicking = false;
        this.colorHistory = this.getSetting('colorHistory', []);

        // Max number of colors in history
        this.maxHistoryLength = 20;

        // DOM elements
        this.colorDisplay = null;
        this.formatSelect = null;
        this.valueDisplay = null;
        this.contrastDisplay = null;
        this.eyeDropper = null;
        this.hasNativeEyeDropper = 'EyeDropper' in window;
    }

    /**
     * Set up the panel content
     * @returns {HTMLElement} The panel content element
     */
    setupPanel() {
        // Create panel content
        const content = document.createElement('div');
        content.className = 'color-picker-panel';

        // Check if native eye dropper is available
        this.hasNativeEyeDropper = window.EyeDropper !== undefined;

        // Create header
        const header = document.createElement('div');
        header.className = 'panel-header';
        header.innerHTML = `<h3>${this.name}</h3>`;
        content.appendChild(header);

        // Create content
        const panelContent = document.createElement('div');
        panelContent.className = 'panel-content';

        // Color history section
        const historySection = document.createElement('div');
        historySection.className = 'color-history-section';

        const historyTitle = document.createElement('h4');
        historyTitle.textContent = 'Color History';
        historySection.appendChild(historyTitle);

        const historyContainer = document.createElement('div');
        historyContainer.className = 'color-history-container';
        this.historyContainer = historyContainer;
        historySection.appendChild(historyContainer);

        panelContent.appendChild(historySection);

        // Color palettes from CSS section
        const paletteSection = document.createElement('div');
        paletteSection.className = 'color-palettes-section';

        const paletteTitle = document.createElement('h4');
        paletteTitle.textContent = 'Page Color Variables';
        paletteSection.appendChild(paletteTitle);

        const extractButton = document.createElement('button');
        extractButton.textContent = 'Extract CSS Colors';
        extractButton.addEventListener('click', () => this.extractCSSColors());
        paletteSection.appendChild(extractButton);

        const cssColorsContainer = document.createElement('div');
        cssColorsContainer.className = 'css-colors-container';
        this.cssColorsContainer = cssColorsContainer;
        paletteSection.appendChild(cssColorsContainer);

        panelContent.appendChild(paletteSection);

        // Add content to panel
        content.appendChild(panelContent);

        // Update color history display
        this.updateColorHistory();

        this.initialized = true;
        return content;
    }

    /**
     * Activate the tool
     */
    activate() {
        if (this.isActive) return;

        super.activate();
        this.updateColorHistory();
    }

    /**
     * Start the color picker
     */
    startColorPicker() {
        if (this.isPicking) return;
        this.isPicking = true;

        if (this.hasNativeEyeDropper) {
            this.useNativeEyeDropper();
        } else {
            this.useCustomColorPicker();
        }
    }

    /**
     * Use the native EyeDropper API if available
     */
    useNativeEyeDropper() {
        const eyeDropper = new EyeDropper();

        eyeDropper
            .open()
            .then((result) => {
                this.selectColor(result.sRGBHex);
                this.isPicking = false;
            })
            .catch((error) => {
                console.error('EyeDropper error:', error);
                this.isPicking = false;
            });
    }

    /**
     * Use custom color picker implementation
     */
    useCustomColorPicker() {
        // Add picking class to body for cursor change
        document.body.classList.add('dev-color-picking');

        // Create preview element
        const preview = document.createElement('div');
        preview.className = 'color-picker-preview';
        document.body.appendChild(preview);
        this.previewElement = preview;

        // Add event listeners
        this.mouseMoveHandler = this.handleMouseMove.bind(this);
        this.mouseClickHandler = this.handleMouseClick.bind(this);
        this.keyDownHandler = this.handleKeyDown.bind(this);

        document.addEventListener('mousemove', this.mouseMoveHandler);
        document.addEventListener('click', this.mouseClickHandler);
        document.addEventListener('keydown', this.keyDownHandler);
    }

    /**
     * Handle mouse move during custom color picking
     * @param {MouseEvent} e - Mouse event
     */
    handleMouseMove(e) {
        if (!this.isPicking) return;

        const x = e.clientX;
        const y = e.clientY;

        // Get element under cursor
        const element = document.elementFromPoint(x, y);
        if (!element) return;

        // Get color at position
        const color = this.getElementColor(element);

        // Update preview
        this.previewElement.style.backgroundColor = color;
        this.previewElement.style.left = `${x + 10}px`;
        this.previewElement.style.top = `${y + 10}px`;

        // Show color value in preview
        this.previewElement.textContent = color;
        this.previewElement.style.color = ColorUtils.isDark(color)
            ? 'white'
            : 'black';
    }

    /**
     * Handle mouse click during custom color picking
     * @param {MouseEvent} e - Mouse event
     */
    handleMouseClick(e) {
        if (!this.isPicking) return;

        e.preventDefault();
        e.stopPropagation();

        const element = document.elementFromPoint(e.clientX, e.clientY);
        if (!element) return;

        const color = this.getElementColor(element);
        this.selectColor(color);
        this.stopCustomColorPicker();
    }

    /**
     * Handle key down during custom color picking
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyDown(e) {
        if (!this.isPicking) return;

        if (e.key === 'Escape') {
            e.preventDefault();
            this.stopCustomColorPicker();
        }
    }

    /**
     * Stop the custom color picker
     */
    stopCustomColorPicker() {
        this.isPicking = false;
        document.body.classList.remove('dev-color-picking');

        // Remove preview element
        if (this.previewElement && this.previewElement.parentNode) {
            this.previewElement.parentNode.removeChild(this.previewElement);
        }
        this.previewElement = null;

        // Remove event listeners
        document.removeEventListener('mousemove', this.mouseMoveHandler);
        document.removeEventListener('click', this.mouseClickHandler);
        document.removeEventListener('keydown', this.keyDownHandler);

        this.mouseMoveHandler = null;
        this.mouseClickHandler = null;
        this.keyDownHandler = null;
    }

    /**
     * Get computed color of an element
     * @param {HTMLElement} element - The element to get color from
     * @returns {string} The color in hex format
     */
    getElementColor(element) {
        const computedStyle = window.getComputedStyle(element);
        return computedStyle.backgroundColor;
    }

    /**
     * Select a color and update the selected color display
     * @param {string} color - The color value
     */
    selectColor(color) {
        this.selectedColor = color;

        // Update history
        if (color && !this.colorHistory.includes(color)) {
            this.colorHistory.unshift(color);

            // Limit history to 20 colors
            if (this.colorHistory.length > 20) {
                this.colorHistory.pop();
            }

            // Save to storage
            if (this.storage) {
                this.storage.set('colorPicker.history', this.colorHistory);
            }

            // Update the history display
            this.updateColorHistory();
        }

        // Trigger event
        this.emit('color-selected', color);
    }

    /**
     * Update the color display with selected color
     */
    updateColorDisplay() {
        if (!this.selectedColor) {
            this.colorDisplay.style.backgroundColor = 'transparent';
            this.valueDisplay.textContent = 'No color selected';
            this.contrastDisplay.textContent = '';
            return;
        }

        // Update color swatch
        this.colorDisplay.style.backgroundColor = ColorUtils.toRgbaString(
            this.selectedColor
        );

        // Update text color for readability
        this.valueDisplay.style.color = ColorUtils.isDark(this.selectedColor)
            ? 'white'
            : 'black';

        // Update value display
        this.valueDisplay.textContent = this.getFormattedColor();

        // Update contrast information
        const contrast = ColorUtils.getContrastRatio(this.selectedColor);
        this.contrastDisplay.innerHTML = `
            <div>White: ${contrast.withWhite.toFixed(2)} 
                <span class="${this.getContrastClass(contrast.withWhite)}">
                    ${this.getContrastText(contrast.withWhite)}
                </span>
            </div>
            <div>Black: ${contrast.withBlack.toFixed(2)}
                <span class="${this.getContrastClass(contrast.withBlack)}">
                    ${this.getContrastText(contrast.withBlack)}
                </span>
            </div>
        `;
    }

    /**
     * Get color value in selected format
     * @returns {string} Formatted color string
     */
    getFormattedColor() {
        if (!this.selectedColor) return '';

        const format = this.formatSelect.value;

        switch (format) {
            case 'hex':
                return ColorUtils.toHexString(this.selectedColor);
            case 'rgb':
                return ColorUtils.toRgbaString(this.selectedColor);
            case 'hsl':
                return ColorUtils.toHslaString(this.selectedColor);
            default:
                return ColorUtils.toHexString(this.selectedColor);
        }
    }

    /**
     * Get contrast ratio class based on WCAG guidelines
     * @param {number} ratio - Contrast ratio
     * @returns {string} CSS class name
     */
    getContrastClass(ratio) {
        if (ratio >= 7) return 'contrast-aaa';
        if (ratio >= 4.5) return 'contrast-aa';
        if (ratio >= 3) return 'contrast-aa-large';
        return 'contrast-fail';
    }

    /**
     * Get contrast text based on WCAG guidelines
     * @param {number} ratio - Contrast ratio
     * @returns {string} Status text
     */
    getContrastText(ratio) {
        if (ratio >= 7) return 'AAA';
        if (ratio >= 4.5) return 'AA';
        if (ratio >= 3) return 'AA (Large)';
        return 'Fail';
    }

    /**
     * Add a color to history
     * @param {Object} color - The color object to add
     */
    addToHistory(color) {
        if (!color) return;

        // Convert to hex for storage consistency
        const hexColor = ColorUtils.toHexString(color);

        // Check if color already exists
        const existingIndex = this.colorHistory.findIndex(
            (c) => ColorUtils.toHexString(c) === hexColor
        );

        // Remove if exists
        if (existingIndex !== -1) {
            this.colorHistory.splice(existingIndex, 1);
        }

        // Add to beginning
        this.colorHistory.unshift(color);

        // Trim history to max length
        if (this.colorHistory.length > this.maxHistoryLength) {
            this.colorHistory = this.colorHistory.slice(
                0,
                this.maxHistoryLength
            );
        }

        // Save to storage
        this.setSetting('colorHistory', this.colorHistory);

        // Update UI
        this.renderColorHistory();
    }

    /**
     * Render color history in the UI
     */
    renderColorHistory() {
        this.historyContainer.innerHTML = '';

        if (this.colorHistory.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-history';
            emptyMessage.textContent = 'No colors in history';
            this.historyContainer.appendChild(emptyMessage);
            return;
        }

        // Create swatches for each color
        this.colorHistory.forEach((color) => {
            const swatch = document.createElement('div');
            swatch.className = 'history-swatch';
            swatch.style.backgroundColor = ColorUtils.toRgbaString(color);

            swatch.setAttribute('title', ColorUtils.toHexString(color));

            swatch.addEventListener('click', () => {
                this.selectColor(color);
            });

            this.historyContainer.appendChild(swatch);
        });
    }

    /**
     * Clear color history
     */
    clearHistory() {
        this.colorHistory = [];
        this.setSetting('colorHistory', []);
        this.renderColorHistory();
    }

    /**
     * Extract CSS colors from the page
     */
    extractCSSColors() {
        if (!this.cssColorsContainer) {
            console.warn('CSS Colors container not found');
            return;
        }

        this.cssColorsContainer.innerHTML = '';

        const colorVars = this.getColorVariables();

        if (colorVars.length === 0) {
            const noColors = document.createElement('p');
            noColors.className = 'no-colors-message';
            noColors.textContent = 'No CSS color variables found on this page.';
            this.cssColorsContainer.appendChild(noColors);
            return;
        }

        const colorGrid = document.createElement('div');
        colorGrid.className = 'color-grid';

        colorVars.forEach((colorVar) => {
            const colorSwatch = document.createElement('div');
            colorSwatch.className = 'color-swatch';
            colorSwatch.title = `${colorVar.name}: ${colorVar.value}`;
            colorSwatch.style.backgroundColor = colorVar.value;
            colorSwatch.addEventListener('click', () => {
                this.selectColor(colorVar.value);
            });

            const colorName = document.createElement('div');
            colorName.className = 'color-name';
            colorName.textContent = colorVar.name;

            const colorValue = document.createElement('div');
            colorValue.className = 'color-value';
            colorValue.textContent = colorVar.value;

            colorSwatch.appendChild(colorName);
            colorSwatch.appendChild(colorValue);
            colorGrid.appendChild(colorSwatch);
        });

        this.cssColorsContainer.appendChild(colorGrid);
    }

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     */
    copyToClipboard(text) {
        // Create a temporary textarea
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);

        // Select and copy
        textarea.select();
        document.execCommand('copy');

        // Clean up
        document.body.removeChild(textarea);

        // Show success message
        this.showCopySuccessMessage();
    }

    /**
     * Show copy success message
     */
    showCopySuccessMessage() {
        const message = document.createElement('div');
        message.className = 'copy-success-message';
        message.textContent = 'Copied to clipboard!';

        this.panel.appendChild(message);

        // Remove after animation
        setTimeout(() => {
            message.classList.add('fade-out');
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 300);
        }, 1500);
    }

    /**
     * Clean up when tool is destroyed
     */
    destroy() {
        // Make sure to stop picking if active
        if (this.isPicking) {
            this.stopCustomColorPicker();
        }

        return super.destroy();
    }

    /**
     * Get color variables from the page
     * @returns {Array} Array of color variable objects
     */
    getColorVariables() {
        const colorVars = [];
        const sheets = document.styleSheets;

        try {
            for (let i = 0; i < sheets.length; i++) {
                try {
                    const sheet = sheets[i];
                    // Skip if cannot access rules due to CORS
                    const rules = sheet.cssRules || sheet.rules;

                    for (let j = 0; j < rules.length; j++) {
                        const rule = rules[j];

                        // Check if it's a CSSStyleRule
                        if (rule.style) {
                            for (let k = 0; k < rule.style.length; k++) {
                                const prop = rule.style[k];
                                const value = rule.style.getPropertyValue(prop);

                                // Check if property is a color or contains a color value
                                if (
                                    prop.includes('color') ||
                                    value.match(/#[0-9a-f]{3,8}\b/i) ||
                                    value.match(/rgba?\(/i) ||
                                    value.match(/hsla?\(/i)
                                ) {
                                    colorVars.push({
                                        name: prop,
                                        value: value,
                                        selector: rule.selectorText,
                                    });
                                }
                            }
                        }

                        // Check if it's a CSSVariableRule or contains variables
                        if (rule.cssText && rule.cssText.includes('--')) {
                            const varMatches =
                                rule.cssText.match(/--[^:]+:\s*([^;]+)/g);
                            if (varMatches) {
                                varMatches.forEach((match) => {
                                    const [name, value] = match
                                        .split(':')
                                        .map((s) => s.trim());

                                    // Check if value is a color
                                    if (
                                        value.match(/#[0-9a-f]{3,8}\b/i) ||
                                        value.match(/rgba?\(/i) ||
                                        value.match(/hsla?\(/i) ||
                                        name.includes('color')
                                    ) {
                                        colorVars.push({
                                            name: name,
                                            value: value,
                                            selector: rule.selectorText,
                                        });
                                    }
                                });
                            }
                        }
                    }
                } catch (e) {
                    // Skip inaccessible stylesheets
                    console.debug('Could not access stylesheet:', e);
                }
            }
        } catch (e) {
            console.error('Error getting color variables:', e);
        }

        return colorVars;
    }

    /**
     * Update the color history display
     */
    updateColorHistory() {
        if (!this.historyContainer) {
            return;
        }

        this.historyContainer.innerHTML = '';

        if (this.colorHistory.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'empty-history';
            emptyMessage.textContent = 'No colors in history';
            this.historyContainer.appendChild(emptyMessage);
            return;
        }

        const historyGrid = document.createElement('div');
        historyGrid.className = 'history-grid';

        this.colorHistory.forEach((color) => {
            const swatch = document.createElement('div');
            swatch.className = 'history-swatch';
            swatch.style.backgroundColor = color;
            swatch.title = color;
            swatch.addEventListener('click', () => this.selectColor(color));
            historyGrid.appendChild(swatch);
        });

        this.historyContainer.appendChild(historyGrid);
    }
}
