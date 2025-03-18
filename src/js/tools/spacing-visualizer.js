/**
 * Spacing Visualizer Tool
 * Visualizes margins, paddings, and borders of elements
 */
import BaseTool from '../tools/base-tool.js';

export class SpacingVisualizer extends BaseTool {
    /**
     * Create a new SpacingVisualizer
     * @param {Object} config - Configuration options
     * @param {HTMLElement} config.container - Container element
     * @param {Object} config.theme - Theme manager
     * @param {Object} config.storage - Storage manager
     */
    constructor(config = {}) {
        super(config);

        this.name = 'Spacing Visualizer';
        this.id = 'spacing-visualizer';
        this.icon = 'spacing';
        this.description = 'Visualize padding and margins on page elements';

        this.container = config.container;

        // State
        this.isActive = false;
        this.options = {
            showMargins: this.getSetting('showMargins', true),
            showPadding: this.getSetting('showPadding', true),
            highlightBorders: this.getSetting('highlightBorders', true),
        };

        // Hover tracking
        this.hoveredElement = null;
        this.overlays = []; // Change to array instead of object with named properties

        // Elements
        this.panelContent = null;
        this.styleElement = null;
        this.mousePos = { x: 0, y: 0 };

        // Initialize references for element info
        this.elementPath = null;
        this.dimensions = null;
        this.spacing = null;

        // Bind methods
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseOver = this.handleMouseOver.bind(this);
        this.handleMouseOut = this.handleMouseOut.bind(this);
        this.handleClick = this.handleClick.bind(this);

        // Load saved options from storage
        this.loadOptions();
    }

    /**
     * Set up the panel content
     * @returns {HTMLElement} The panel content element
     */
    setupPanel() {
        // Create main container
        const content = document.createElement('div');
        content.className = 'spacing-visualizer-panel';

        // Tool description
        const description = document.createElement('p');
        description.textContent =
            'Visualize margins and padding on elements. Hover over elements to see their spacing.';
        content.appendChild(description);

        // Options panel
        const options = document.createElement('div');
        options.className = 'spacing-options';

        // Show margins option
        const marginToggle = this.createToggleSwitch(
            'toggle-margins',
            this.options.showMargins,
            (checked) => {
                this.options.showMargins = checked;
                this.saveOptions();
                if (this.isActive) {
                    this.updateVisualization();
                }
            },
            'Show Margins'
        );
        options.appendChild(marginToggle);

        // Show padding option
        const paddingToggle = this.createToggleSwitch(
            'toggle-padding',
            this.options.showPadding,
            (checked) => {
                this.options.showPadding = checked;
                this.saveOptions();
                if (this.isActive) {
                    this.updateVisualization();
                }
            },
            'Show Padding'
        );
        options.appendChild(paddingToggle);

        // Highlight borders option
        const borderToggle = this.createToggleSwitch(
            'toggle-borders',
            this.options.highlightBorders,
            (checked) => {
                this.options.highlightBorders = checked;
                this.saveOptions();
                if (this.isActive) {
                    this.updateVisualization();
                }
            },
            'Highlight Borders'
        );
        options.appendChild(borderToggle);

        content.appendChild(options);

        // Element info panel
        const infoPanel = document.createElement('div');
        infoPanel.className = 'element-info-panel';

        // Element path
        const elementPath = document.createElement('div');
        elementPath.className = 'element-path';
        elementPath.textContent = 'Hover over an element to see its spacing';
        infoPanel.appendChild(elementPath);

        // Element dimensions
        const dimensions = document.createElement('div');
        dimensions.className = 'element-dimensions';
        infoPanel.appendChild(dimensions);

        // Element spacing
        const spacing = document.createElement('div');
        spacing.className = 'element-spacing';
        infoPanel.appendChild(spacing);

        content.appendChild(infoPanel);

        // Save references
        this.elementPath = elementPath;
        this.dimensions = dimensions;
        this.spacing = spacing;
        this.panelContent = content;

        return content;
    }

    /**
     * Activate the tool
     */
    activate() {
        if (this.isActive) return;

        super.activate();
        this.isActive = true;

        // Add event listeners
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseover', this.handleMouseOver, true);
        document.addEventListener('mouseout', this.handleMouseOut, true);
        document.addEventListener('click', this.handleClick, true);

        // Add visualization styles
        this.injectStyles();

        // Log activation instead of notification
        console.log('Spacing Visualizer activated');
    }

    /**
     * Deactivate the tool
     */
    deactivate() {
        if (!this.isActive) return;

        this.isActive = false;

        // Remove event listeners
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseover', this.handleMouseOver, true);
        document.removeEventListener('mouseout', this.handleMouseOut, true);
        document.removeEventListener('click', this.handleClick, true);

        // Remove visualizations
        this.removeOverlays();
        this.removeStyles();

        // Clear UI
        this.updateElementInfo(null);

        // Log deactivation instead of notification
        console.log('Spacing Visualizer deactivated');
    }

    /**
     * Create a toggle switch element
     * Fallback implementation if ui manager's method is not available
     */
    createToggleSwitch(id, checked = false, onChange = null, label = '') {
        // Use UI manager's method if available
        if (this.ui && typeof this.ui.createToggleSwitch === 'function') {
            return this.ui.createToggleSwitch(id, checked, onChange, label);
        }

        // Fallback implementation
        const container = document.createElement('div');
        container.className = 'toggle-switch-container';

        if (label) {
            const labelEl = document.createElement('label');
            labelEl.htmlFor = id;
            labelEl.className = 'toggle-switch-label';
            labelEl.textContent = label;
            container.appendChild(labelEl);
        }

        const switchWrapper = document.createElement('div');
        switchWrapper.className = 'toggle-switch-wrapper';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = id;
        input.className = 'toggle-switch-input';
        input.checked = checked;

        const slider = document.createElement('span');
        slider.className = 'toggle-switch-slider';

        switchWrapper.appendChild(input);
        switchWrapper.appendChild(slider);
        container.appendChild(switchWrapper);

        if (typeof onChange === 'function') {
            input.addEventListener('change', (e) => onChange(e.target.checked));
        }

        return container;
    }

    /**
     * Handle mouse move event
     * @param {MouseEvent} e - Mouse event
     */
    handleMouseMove(e) {
        this.mousePos = { x: e.clientX, y: e.clientY };
    }

    /**
     * Handle mouse over event
     * @param {MouseEvent} e - Mouse event
     */
    handleMouseOver(e) {
        // Ignore events on overlay elements
        if (this.isOverlayElement(e.target)) return;

        // Update hover element
        this.hoveredElement = e.target;

        // Update visualization
        this.updateVisualization();

        // Update info panel
        this.updateElementInfo(this.hoveredElement);
    }

    /**
     * Handle mouse out event
     * @param {MouseEvent} e - Mouse event
     */
    handleMouseOut(e) {
        // Only clear if we're moving away from the current hover element
        if (e.target === this.hoveredElement) {
            this.hoveredElement = null;
            this.removeOverlays();
            this.updateElementInfo(null);
        }
    }

    /**
     * Handle click event
     * @param {MouseEvent} e - Mouse event
     */
    handleClick(e) {
        // Prevent default only if clicking on an overlay
        if (this.isOverlayElement(e.target)) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        // Lock/unlock the current element
        if (this.hoveredElement) {
            e.preventDefault();
            e.stopPropagation();

            // Toggle lock state
            if (this.lockedElement === this.hoveredElement) {
                this.lockedElement = null;
                this.ui.showNotification('Element unlocked', 'info');
            } else {
                this.lockedElement = this.hoveredElement;
                this.ui.showNotification(
                    'Element locked. Click again to unlock.',
                    'info'
                );
            }
        }
    }

    /**
     * Check if an element is part of our overlays
     * @param {HTMLElement} element - Element to check
     * @returns {boolean} True if element is part of our overlays
     */
    isOverlayElement(element) {
        if (!element) return false;

        // Check if element is one of our overlays or a child of one
        return this.overlays.some(
            (overlay) => overlay === element || overlay.contains(element)
        );
    }

    /**
     * Update the visualization for the current element
     */
    updateVisualization() {
        // Clear existing overlays
        this.removeOverlays();

        // Get target element
        const element = this.lockedElement || this.hoveredElement;
        if (!element) return;

        // Calculate visualization
        if (this.options.showMargins) {
            this.visualizeMargins(element);
        }

        if (this.options.showPadding) {
            this.visualizePadding(element);
        }

        if (this.options.highlightBorders) {
            this.highlightBorders(element);
        }
    }

    /**
     * Visualize margins of an element
     * @param {Element} element - Target element
     */
    visualizeMargins(element) {
        const computed = getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        // Get margin values
        const marginTop = parseInt(computed.marginTop, 10);
        const marginRight = parseInt(computed.marginRight, 10);
        const marginBottom = parseInt(computed.marginBottom, 10);
        const marginLeft = parseInt(computed.marginLeft, 10);

        // Only visualize non-zero margins
        if (marginTop > 0) {
            this.createOverlay({
                top: rect.top - marginTop,
                left: rect.left,
                width: rect.width,
                height: marginTop,
                color: 'rgba(246, 211, 101, 0.7)',
                label: `${marginTop}px`,
            });
        }

        if (marginRight > 0) {
            this.createOverlay({
                top: rect.top,
                left: rect.right,
                width: marginRight,
                height: rect.height,
                color: 'rgba(246, 211, 101, 0.7)',
                label: `${marginRight}px`,
            });
        }

        if (marginBottom > 0) {
            this.createOverlay({
                top: rect.bottom,
                left: rect.left,
                width: rect.width,
                height: marginBottom,
                color: 'rgba(246, 211, 101, 0.7)',
                label: `${marginBottom}px`,
            });
        }

        if (marginLeft > 0) {
            this.createOverlay({
                top: rect.top,
                left: rect.left - marginLeft,
                width: marginLeft,
                height: rect.height,
                color: 'rgba(246, 211, 101, 0.7)',
                label: `${marginLeft}px`,
            });
        }
    }

    /**
     * Visualize padding of an element
     * @param {Element} element - Target element
     */
    visualizePadding(element) {
        const computed = getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        // Get padding values
        const paddingTop = parseInt(computed.paddingTop, 10);
        const paddingRight = parseInt(computed.paddingRight, 10);
        const paddingBottom = parseInt(computed.paddingBottom, 10);
        const paddingLeft = parseInt(computed.paddingLeft, 10);

        // Border widths affect positioning
        const borderTop = parseInt(computed.borderTopWidth, 10);
        const borderRight = parseInt(computed.borderRightWidth, 10);
        const borderBottom = parseInt(computed.borderBottomWidth, 10);
        const borderLeft = parseInt(computed.borderLeftWidth, 10);

        // Only visualize non-zero padding
        if (paddingTop > 0) {
            this.createOverlay({
                top: rect.top + borderTop,
                left: rect.left + borderLeft,
                width: rect.width - borderLeft - borderRight,
                height: paddingTop,
                color: 'rgba(126, 214, 223, 0.7)',
                label: `${paddingTop}px`,
            });
        }

        if (paddingRight > 0) {
            this.createOverlay({
                top: rect.top + borderTop + paddingTop,
                left: rect.right - borderRight - paddingRight,
                width: paddingRight,
                height:
                    rect.height -
                    borderTop -
                    borderBottom -
                    paddingTop -
                    paddingBottom,
                color: 'rgba(126, 214, 223, 0.7)',
                label: `${paddingRight}px`,
            });
        }

        if (paddingBottom > 0) {
            this.createOverlay({
                top: rect.bottom - borderBottom - paddingBottom,
                left: rect.left + borderLeft,
                width: rect.width - borderLeft - borderRight,
                height: paddingBottom,
                color: 'rgba(126, 214, 223, 0.7)',
                label: `${paddingBottom}px`,
            });
        }

        if (paddingLeft > 0) {
            this.createOverlay({
                top: rect.top + borderTop + paddingTop,
                left: rect.left + borderLeft,
                width: paddingLeft,
                height:
                    rect.height -
                    borderTop -
                    borderBottom -
                    paddingTop -
                    paddingBottom,
                color: 'rgba(126, 214, 223, 0.7)',
                label: `${paddingLeft}px`,
            });
        }
    }

    /**
     * Highlight borders of an element
     * @param {Element} element - Target element
     */
    highlightBorders(element) {
        const computed = getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        // Get border values
        const borderTop = parseInt(computed.borderTopWidth, 10);
        const borderRight = parseInt(computed.borderRightWidth, 10);
        const borderBottom = parseInt(computed.borderBottomWidth, 10);
        const borderLeft = parseInt(computed.borderLeftWidth, 10);

        // Only highlight non-zero borders
        if (borderTop > 0) {
            this.createOverlay({
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: borderTop,
                color: 'rgba(233, 166, 166, 0.8)',
                label: `${borderTop}px`,
            });
        }

        if (borderRight > 0) {
            this.createOverlay({
                top: rect.top + borderTop,
                left: rect.right - borderRight,
                width: borderRight,
                height: rect.height - borderTop - borderBottom,
                color: 'rgba(233, 166, 166, 0.8)',
                label: `${borderRight}px`,
            });
        }

        if (borderBottom > 0) {
            this.createOverlay({
                top: rect.bottom - borderBottom,
                left: rect.left,
                width: rect.width,
                height: borderBottom,
                color: 'rgba(233, 166, 166, 0.8)',
                label: `${borderBottom}px`,
            });
        }

        if (borderLeft > 0) {
            this.createOverlay({
                top: rect.top + borderTop,
                left: rect.left,
                width: borderLeft,
                height: rect.height - borderTop - borderBottom,
                color: 'rgba(233, 166, 166, 0.8)',
                label: `${borderLeft}px`,
            });
        }
    }

    /**
     * Create an overlay element
     * @param {Object} config - Overlay configuration
     * @param {number} config.top - Top position
     * @param {number} config.left - Left position
     * @param {number} config.width - Width
     * @param {number} config.height - Height
     * @param {string} config.color - Background color
     * @param {string} config.label - Label text
     * @returns {HTMLElement} The created overlay
     */
    createOverlay(config) {
        const overlay = document.createElement('div');
        overlay.className = 'spacing-visualizer-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: ${config.top}px;
            left: ${config.left}px;
            width: ${config.width}px;
            height: ${config.height}px;
            background-color: ${config.color};
            z-index: 999999;
            pointer-events: none;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            color: #333;
            text-shadow: 0 0 2px #fff;
        `;

        // Add label if provided and there's enough space
        if (config.label && (config.width > 20 || config.height > 14)) {
            overlay.textContent = config.label;
        }

        document.body.appendChild(overlay);
        this.overlays.push(overlay);

        return overlay;
    }

    /**
     * Remove all overlay elements
     */
    removeOverlays() {
        this.overlays.forEach((overlay) => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        });

        this.overlays = [];
    }

    /**
     * Inject styles for visualization
     */
    injectStyles() {
        if (this.styleElement) return;

        this.styleElement = document.createElement('style');
        this.styleElement.textContent = `
            .spacing-visualizer-panel {
                padding: 10px;
                font-size: 13px;
            }
            
            .spacing-options {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin: 12px 0;
            }
            
            .element-info-panel {
                margin-top: 16px;
                border-top: 1px solid var(--border-color, #ddd);
                padding-top: 12px;
            }
            
            .element-path {
                font-size: 12px;
                margin-bottom: 8px;
                word-break: break-all;
                font-family: monospace;
            }
            
            .element-dimensions, .element-spacing {
                font-size: 12px;
                margin-top: 4px;
                font-family: monospace;
            }
        `;

        document.head.appendChild(this.styleElement);
    }

    /**
     * Remove visualization styles
     */
    removeStyles() {
        if (this.styleElement && this.styleElement.parentNode) {
            this.styleElement.parentNode.removeChild(this.styleElement);
            this.styleElement = null;
        }
    }

    /**
     * Update element info panel with element details
     * @param {Element} element - The element to show info for
     */
    updateElementInfo(element) {
        // Check if elements exist
        if (!this.elementPath || !this.dimensions || !this.spacing) {
            return; // Exit if elements aren't initialized
        }

        if (!element) {
            this.elementPath.textContent =
                'Hover over an element to see its spacing';
            this.dimensions.textContent = '';
            this.spacing.textContent = '';
            return;
        }

        // Get element path
        const path = this.getElementPath(element);
        this.elementPath.textContent = path;

        // Get element dimensions
        const rect = element.getBoundingClientRect();
        this.dimensions.textContent = `Width: ${Math.round(
            rect.width
        )}px, Height: ${Math.round(rect.height)}px`;

        // Get element spacing
        const computed = getComputedStyle(element);
        const marginTop = parseInt(computed.marginTop, 10);
        const marginRight = parseInt(computed.marginRight, 10);
        const marginBottom = parseInt(computed.marginBottom, 10);
        const marginLeft = parseInt(computed.marginLeft, 10);

        const paddingTop = parseInt(computed.paddingTop, 10);
        const paddingRight = parseInt(computed.paddingRight, 10);
        const paddingBottom = parseInt(computed.paddingBottom, 10);
        const paddingLeft = parseInt(computed.paddingLeft, 10);

        this.spacing.textContent = `Margin: ${marginTop}px ${marginRight}px ${marginBottom}px ${marginLeft}px
Padding: ${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`;
    }

    /**
     * Get CSS selector path for an element
     * @param {Element} element - The element
     * @returns {string} The element selector path
     */
    getElementPath(element) {
        if (!element || element === document.body) {
            return 'body';
        }

        let path = [];
        let currentElement = element;

        while (currentElement !== document.body) {
            let selector = currentElement.tagName.toLowerCase();

            if (currentElement.id) {
                selector += `#${currentElement.id}`;
                path.unshift(selector);
                break;
            } else if (currentElement.className) {
                const classes = Array.from(currentElement.classList).join('.');
                if (classes) {
                    selector += `.${classes}`;
                }
            }

            const siblings = Array.from(
                currentElement.parentNode.children
            ).filter((child) => child.tagName === currentElement.tagName);

            if (siblings.length > 1) {
                const index = siblings.indexOf(currentElement) + 1;
                selector += `:nth-of-type(${index})`;
            }

            path.unshift(selector);

            currentElement = currentElement.parentNode;
            if (!currentElement || currentElement.nodeType !== 1) {
                break;
            }
        }

        return path.join(' > ');
    }

    /**
     * Load options from storage
     */
    loadOptions() {
        const savedOptions = this.storage?.get('spacing-visualizer-options');

        if (savedOptions) {
            this.options = { ...this.options, ...savedOptions };
        }
    }

    /**
     * Save options to storage
     */
    saveOptions() {
        if (this.storage) {
            this.storage.set('spacing-visualizer-options', this.options);
        }
    }
}
