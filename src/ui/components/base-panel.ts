import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import type { Position } from '../../core/types';

/**
 * Base panel component that can be dragged and resized
 */
@customElement('web-debugger-panel')
export class BasePanel extends LitElement {
    @property({ type: String }) title = 'Web Debugger';
    @property({ type: Boolean }) draggable = true;
    @property({ type: Boolean }) resizable = true;
    @property({ type: String }) position: Position = 'floating';
    @property({ type: Number }) opacity = 1;
    @property({ type: Boolean }) visible = true;

    @state() private width = 400;
    @state() private height = 500;
    @state() private x = 20;
    @state() private y = 20;
    @state() private dragging = false;
    @state() private resizing = false;
    @state() private dragStartX = 0;
    @state() private dragStartY = 0;
    @state() private initialWidth = 0;
    @state() private initialHeight = 0;
    @state() private initialX = 0;
    @state() private initialY = 0;

    static styles = css`
    :host {
      --panel-bg-color: var(--wdt-panel-bg-color, #ffffff);
      --panel-text-color: var(--wdt-panel-text-color, #333333);
      --panel-border-color: var(--wdt-panel-border-color, #cccccc);
      --panel-header-bg-color: var(--wdt-panel-header-bg-color, #f5f5f5);
      --panel-shadow: var(--wdt-panel-shadow, 0 4px 8px rgba(0, 0, 0, 0.1));
      
      display: block;
      position: fixed;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      color: var(--panel-text-color);
      box-shadow: var(--panel-shadow);
      border-radius: 6px;
      overflow: hidden;
      transition: opacity 0.2s;
    }
    
    .panel {
      background-color: var(--panel-bg-color);
      border: 1px solid var(--panel-border-color);
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .panel-header {
      background-color: var(--panel-header-bg-color);
      padding: 10px 15px;
      cursor: move;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--panel-border-color);
      user-select: none;
    }
    
    .panel-header h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
    }
    
    .panel-actions {
      display: flex;
      gap: 8px;
    }
    
    .panel-action {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 16px;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    }
    
    .panel-action:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
    
    .panel-content {
      flex: 1;
      overflow: auto;
      padding: 15px;
    }
    
    .resize-handle {
      position: absolute;
      width: 15px;
      height: 15px;
      bottom: 0;
      right: 0;
      cursor: nwse-resize;
    }
    
    .resize-handle::before {
      content: '';
      position: absolute;
      right: 3px;
      bottom: 3px;
      width: 9px;
      height: 9px;
      border-right: 2px solid var(--panel-border-color);
      border-bottom: 2px solid var(--panel-border-color);
    }
  `;

    connectedCallback() {
        super.connectedCallback();

        // Restore position from localStorage if available
        this.restorePosition();

        // Add window event listeners
        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('mouseup', this.handleMouseUp);
        window.addEventListener('resize', this.handleWindowResize);
    }

    disconnectedCallback() {
        // Remove window event listeners
        window.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('mouseup', this.handleMouseUp);
        window.removeEventListener('resize', this.handleWindowResize);

        super.disconnectedCallback();
    }

    render() {
        if (!this.visible) return html``;

        const panelStyles = {
            width: `${this.width}px`,
            height: `${this.height}px`,
            left: `${this.x}px`,
            top: `${this.y}px`,
            opacity: `${this.opacity}`
        };

        return html`
      <div class="panel-container" style=${styleMap(panelStyles)}>
        <div class="panel">
          <div class="panel-header" @mousedown=${this.draggable ? this.handleDragStart : undefined}>
            <h2>${this.title}</h2>
            <div class="panel-actions">
              <button class="panel-action" @click=${this.handleClose}>✕</button>
            </div>
          </div>
          <div class="panel-content">
            <slot></slot>
          </div>
          ${this.resizable ? html`
            <div class="resize-handle" @mousedown=${this.handleResizeStart}></div>
          ` : ''}
        </div>
      </div>
    `;
    }

    // Handle starting to drag the panel
    private handleDragStart = (e: MouseEvent) => {
        // Don't start drag if a button was clicked
        if ((e.target as Element).closest('.panel-action')) return;

        this.dragging = true;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        this.initialX = this.x;
        this.initialY = this.y;

        e.preventDefault();
    }

    // Handle mouse movement while dragging
    private handleMouseMove = (e: MouseEvent) => {
        if (this.dragging) {
            const dx = e.clientX - this.dragStartX;
            const dy = e.clientY - this.dragStartY;

            this.x = this.initialX + dx;
            this.y = this.initialY + dy;

            // Ensure the panel stays within the viewport
            this.constrainToViewport();

            // Save position
            this.savePosition();
        } else if (this.resizing) {
            const newWidth = this.initialWidth + (e.clientX - this.dragStartX);
            const newHeight = this.initialHeight + (e.clientY - this.dragStartY);

            this.width = Math.max(200, newWidth);
            this.height = Math.max(150, newHeight);

            // Save position
            this.savePosition();
        }
    }

    // Handle releasing the mouse
    private handleMouseUp = () => {
        this.dragging = false;
        this.resizing = false;
    }

    // Handle starting to resize the panel
    private handleResizeStart = (e: MouseEvent) => {
        this.resizing = true;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        this.initialWidth = this.width;
        this.initialHeight = this.height;

        e.preventDefault();
    }

    // Handle window resize
    private handleWindowResize = () => {
        this.constrainToViewport();
    }

    // Handle close button click
    private handleClose = () => {
        this.visible = false;
        this.dispatchEvent(new CustomEvent('close'));
    }

    // Ensure the panel stays within the viewport
    private constrainToViewport() {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Constrain x coordinate
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > viewportWidth) {
            this.x = Math.max(0, viewportWidth - this.width);
        }

        // Constrain y coordinate
        if (this.y < 0) this.y = 0;
        if (this.y + this.height > viewportHeight) {
            this.y = Math.max(0, viewportHeight - this.height);
        }
    }

    // Save position to localStorage
    private savePosition() {
        try {
            const positionData = {
                x: this.x,
                y: this.y,
                width: this.width,
                height: this.height
            };
            localStorage.setItem('web-debugger-panel-position', JSON.stringify(positionData));
        } catch (error) {
            console.error('Failed to save panel position:', error);
        }
    }

    // Restore position from localStorage
    private restorePosition() {
        try {
            const savedPosition = localStorage.getItem('web-debugger-panel-position');
            if (savedPosition) {
                const positionData = JSON.parse(savedPosition);
                this.x = positionData.x;
                this.y = positionData.y;
                this.width = positionData.width;
                this.height = positionData.height;

                // Ensure the restored position is valid for the current viewport
                this.constrainToViewport();
            }
        } catch (error) {
            console.error('Failed to restore panel position:', error);
        }
    }

    // Public methods for controlling the panel

    /**
     * Set the panel's position
     */
    setPosition(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.constrainToViewport();
        this.savePosition();
    }

    /**
     * Set the panel's size
     */
    setSize(width: number, height: number) {
        this.width = Math.max(200, width);
        this.height = Math.max(150, height);
        this.constrainToViewport();
        this.savePosition();
    }

    /**
     * Set the panel's opacity
     */
    setOpacity(opacity: number) {
        this.opacity = Math.max(0.2, Math.min(1, opacity));
    }

    /**
     * Show the panel
     */
    show() {
        this.visible = true;
    }

    /**
     * Hide the panel
     */
    hide() {
        this.visible = false;
    }

    /**
     * Toggle panel visibility
     */
    toggle() {
        this.visible = !this.visible;
    }
} 