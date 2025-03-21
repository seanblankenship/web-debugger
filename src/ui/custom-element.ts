/**
 * Re-export Lit functionality for custom elements
 * This serves as a central point for custom element functionality
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { classMap } from 'lit/directives/class-map.js';

// Re-export all necessary Lit functionality
export {
    LitElement,
    html,
    css,
    customElement,
    property,
    state,
    styleMap,
    classMap
}; 