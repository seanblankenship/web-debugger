/**
 * DOM Utilities
 * Provides helper methods for DOM manipulation and traversal
 */
export class DOMUtils {
    /**
     * Get computed style for an element
     * @param {HTMLElement} element - Target element
     * @param {string} property - CSS property name
     * @returns {string} Computed style value
     */
    static getComputedStyle(element, property) {
        return window.getComputedStyle(element).getPropertyValue(property);
    }

    /**
     * Get all CSS properties for an element
     * @param {HTMLElement} element - Target element
     * @returns {Object} Object with all CSS properties
     */
    static getAllStyles(element) {
        const styles = window.getComputedStyle(element);
        const result = {};

        for (let i = 0; i < styles.length; i++) {
            const prop = styles[i];
            result[prop] = styles.getPropertyValue(prop);
        }

        return result;
    }

    /**
     * Generates a unique selector for an element
     * @param {HTMLElement} element - Target element
     * @returns {string} Unique CSS selector
     */
    static getUniqueSelector(element) {
        if (!element) return '';
        if (element.id) return `#${element.id}`;

        let path = [];
        while (element) {
            let selector = element.tagName.toLowerCase();

            if (element.id) {
                selector += `#${element.id}`;
                path.unshift(selector);
                break;
            } else {
                let sibling = element;
                let nth = 1;

                while ((sibling = sibling.previousElementSibling)) {
                    if (sibling.tagName === element.tagName) nth++;
                }

                if (nth > 1) selector += `:nth-of-type(${nth})`;
            }

            path.unshift(selector);
            element = element.parentElement;
        }

        return path.join(' > ');
    }

    /**
     * Converts a CSS style object to inline style string
     * @param {Object} styles - CSS properties object
     * @returns {string} Inline style string
     */
    static stylesToString(styles) {
        return Object.entries(styles)
            .map(([prop, value]) => `${prop}: ${value}`)
            .join('; ');
    }

    /**
     * Get element dimensions and position
     * @param {HTMLElement} element - Target element
     * @returns {Object} Element dimensions and position
     */
    static getElementRect(element) {
        const rect = element.getBoundingClientRect();
        return {
            x: rect.left + window.scrollX,
            y: rect.top + window.scrollY,
            width: rect.width,
            height: rect.height,
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            right: rect.right + window.scrollX,
            bottom: rect.bottom + window.scrollY,
        };
    }

    /**
     * Convert kebab-case to camelCase
     * @param {string} str - String in kebab-case
     * @returns {string} String in camelCase
     */
    static kebabToCamelCase(str) {
        return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    }

    /**
     * Convert camelCase to kebab-case
     * @param {string} str - String in camelCase
     * @returns {string} String in kebab-case
     */
    static camelToKebabCase(str) {
        return str
            .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
            .toLowerCase();
    }

    /**
     * Highlight an element on the page
     * @param {HTMLElement} element - Element to highlight
     * @param {Object} options - Highlight options
     * @returns {HTMLElement} Created overlay element
     */
    static highlightElement(element, options = {}) {
        const defaults = {
            color: 'rgba(111, 168, 220, 0.66)',
            outlineColor: 'rgba(77, 144, 254, 0.8)',
            outlineWidth: '2px',
            duration: 0, // 0 means persistent until removed
        };

        const settings = { ...defaults, ...options };
        const rect = this.getElementRect(element);

        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: absolute;
            z-index: 10000;
            pointer-events: none;
            top: ${rect.y}px;
            left: ${rect.x}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            background-color: ${settings.color};
            outline: ${settings.outlineWidth} solid ${settings.outlineColor};
            box-sizing: border-box;
        `;

        document.body.appendChild(overlay);

        if (settings.duration > 0) {
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, settings.duration);
        }

        return overlay;
    }

    /**
     * Create an overlay for an element
     * @param {HTMLElement} element - Target element
     * @param {string} color - Highlight color
     * @param {number} opacity - Highlight opacity (0-1)
     * @returns {HTMLElement} The created overlay element
     */
    static createElementOverlay(
        element,
        color = 'rgba(111, 168, 220, 0.66)',
        opacity = 0.5
    ) {
        if (!element || !(element instanceof HTMLElement)) {
            console.warn(
                'DOMUtils: Invalid element provided to createElementOverlay'
            );
            return null;
        }

        const rect = element.getBoundingClientRect();
        const overlay = document.createElement('div');

        overlay.className = 'dom-explorer-highlight';
        overlay.style.cssText = `
            position: absolute;
            z-index: 999999;
            pointer-events: none;
            top: ${window.scrollY + rect.top}px;
            left: ${window.scrollX + rect.left}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            background-color: ${color};
            opacity: ${opacity};
            border: 2px solid rgba(77, 144, 254, 0.8);
            box-sizing: border-box;
        `;

        document.body.appendChild(overlay);
        return overlay;
    }
}
