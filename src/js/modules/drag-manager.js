/**
 * Drag Manager
 * Manages draggable functionality for elements
 */
export class DragManager {
    /**
     * Create a new DragManager
     * @param {Object} config - Configuration options
     * @param {HTMLElement} config.element - The element to make draggable
     * @param {HTMLElement} config.handle - The handle element for dragging (optional)
     * @param {ShadowRoot} config.shadow - Shadow root for finding elements (optional)
     */
    constructor(config = {}) {
        this.element = config.element || null;
        this.handle = config.handle || null;
        this.shadow = config.shadow || null;

        this.isDragging = false;
        this.startPos = { x: 0, y: 0 };
        this.currentPos = { x: 0, y: 0 };
        this.startTransform = { x: 0, y: 0 };

        // Store element's computed position for restoration after drag
        this.elementPos = { x: 0, y: 0 };

        this.rafId = null;

        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.updateElementPosition = this.updateElementPosition.bind(this);

        // Initialize if element is provided
        if (this.element) {
            this.init();
        }
    }

    /**
     * Initialize drag functionality
     * @param {HTMLElement} handle - Optional handle element for dragging
     */
    init(handle) {
        if (!this.element) {
            console.error('DragManager: No element provided for dragging');
            return;
        }

        // Set handle if provided
        if (handle) {
            this.handle = handle;
        }

        // If no handle is set, try to find a header or use the element itself
        if (!this.handle) {
            // Try to find a handle within the element
            if (this.shadow) {
                this.handle = this.shadow.querySelector(
                    '.drag-handle, .debugger-drag-handle, .header, .debugger-header'
                );
            }

            // If shadow search fails, try within the element
            if (!this.handle && this.element) {
                this.handle = this.element.querySelector(
                    '.drag-handle, .debugger-drag-handle, .header, .debugger-header'
                );
            }

            // If still no handle, use the element itself
            if (!this.handle) {
                console.warn(
                    'DragManager: No header element found, using element itself'
                );
                this.handle = this.element;
            }
        }

        // Ensure the element has hardware acceleration enabled
        this.enableHardwareAcceleration();

        // Add event listeners
        this.handle.addEventListener('mousedown', this.onMouseDown, {
            passive: false,
        });
        this.handle.addEventListener(
            'touchstart',
            this.onTouchStart.bind(this),
            { passive: false }
        );

        // Set cursor style
        this.handle.style.cursor = 'move';

        console.log('DragManager: Initialized with handle', this.handle);
    }

    /**
     * Enable hardware acceleration for the element
     */
    enableHardwareAcceleration() {
        // Store original position if needed for later
        const compStyle = window.getComputedStyle(this.element);
        this.elementPos.x = parseInt(compStyle.left, 10) || 0;
        this.elementPos.y = parseInt(compStyle.top, 10) || 0;

        // Initialize transform property if not set
        const transform = compStyle.transform;
        if (transform === 'none' || !transform) {
            this.element.style.transform = 'translate3d(0, 0, 0)';
            this.startTransform = { x: 0, y: 0 };
        } else {
            // If there's an existing transform, parse it
            const matrix = transform.match(/matrix.*\((.+)\)/);
            if (matrix) {
                const values = matrix[1].split(', ');
                this.startTransform = {
                    x: parseFloat(values[4]) || 0,
                    y: parseFloat(values[5]) || 0,
                };
            }
        }

        // Add will-change property for better performance
        this.element.style.willChange = 'transform';
    }

    /**
     * Handle mouse down event
     * @param {MouseEvent} e - Mouse event
     */
    onMouseDown(e) {
        // Only listen for left mouse button
        if (e.button !== 0) return;

        e.preventDefault();
        this.startDrag(e.clientX, e.clientY);

        document.addEventListener('mousemove', this.onMouseMove, {
            passive: false,
        });
        document.addEventListener('mouseup', this.onMouseUp);
    }

    /**
     * Handle touch start event
     * @param {TouchEvent} e - Touch event
     */
    onTouchStart(e) {
        if (e.touches.length !== 1) return;

        e.preventDefault();
        const touch = e.touches[0];
        this.startDrag(touch.clientX, touch.clientY);

        document.addEventListener('touchmove', this.onTouchMove.bind(this), {
            passive: false,
        });
        document.addEventListener('touchend', this.onTouchEnd.bind(this));
    }

    /**
     * Start drag operation
     * @param {number} x - Client X position
     * @param {number} y - Client Y position
     */
    startDrag(x, y) {
        this.isDragging = true;
        this.startPos = { x, y };
        this.currentPos = { x, y };

        // Get current transform values
        const compStyle = window.getComputedStyle(this.element);
        const transform = compStyle.transform;

        if (transform !== 'none') {
            const matrix = transform.match(/matrix.*\((.+)\)/);
            if (matrix) {
                const values = matrix[1].split(', ');
                this.startTransform = {
                    x: parseFloat(values[4]) || 0,
                    y: parseFloat(values[5]) || 0,
                };
            }
        }

        // Add dragging class - but disable transitions
        this.element.classList.add('dragging');

        // Start animation loop
        this.startAnimationLoop();
    }

    /**
     * Start requestAnimationFrame loop for smooth animation
     */
    startAnimationLoop() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
        this.rafId = requestAnimationFrame(this.updateElementPosition);
    }

    /**
     * Update element position in animation frame
     */
    updateElementPosition() {
        if (!this.isDragging) return;

        // Calculate new position
        const deltaX = this.currentPos.x - this.startPos.x;
        const deltaY = this.currentPos.y - this.startPos.y;

        const newX = this.startTransform.x + deltaX;
        const newY = this.startTransform.y + deltaY;

        // Apply new position using transform for better performance
        this.element.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;

        // Continue animation loop
        this.rafId = requestAnimationFrame(this.updateElementPosition);
    }

    /**
     * Handle mouse move event
     * @param {MouseEvent} e - Mouse event
     */
    onMouseMove(e) {
        if (!this.isDragging) return;

        e.preventDefault();
        this.currentPos = { x: e.clientX, y: e.clientY };
    }

    /**
     * Handle touch move event
     * @param {TouchEvent} e - Touch event
     */
    onTouchMove(e) {
        if (!this.isDragging || e.touches.length !== 1) return;

        e.preventDefault();
        const touch = e.touches[0];
        this.currentPos = { x: touch.clientX, y: touch.clientY };
    }

    /**
     * Handle mouse up event
     * @param {MouseEvent} e - Mouse event
     */
    onMouseUp(e) {
        this.stopDrag();

        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
    }

    /**
     * Handle touch end event
     * @param {TouchEvent} e - Touch event
     */
    onTouchEnd(e) {
        this.stopDrag();

        document.removeEventListener('touchmove', this.onTouchMove);
        document.removeEventListener('touchend', this.onTouchEnd);
    }

    /**
     * Stop drag operation
     */
    stopDrag() {
        if (!this.isDragging) return;

        this.isDragging = false;

        // Stop animation loop
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }

        // Remove dragging class
        this.element.classList.remove('dragging');

        // Save position (dispatch event for storage)
        const transform = this.element.style.transform;
        const match = transform.match(/translate3d\(([^,]+),\s*([^,]+),/);
        const x = match ? parseFloat(match[1]) : 0;
        const y = match ? parseFloat(match[2]) : 0;

        const dragEndEvent = new CustomEvent('drag:end', {
            detail: {
                transform: { x, y },
                elementPos: this.elementPos,
            },
        });
        this.element.dispatchEvent(dragEndEvent);
    }

    /**
     * Destroy drag manager and cleanup
     */
    destroy() {
        if (this.handle) {
            this.handle.removeEventListener('mousedown', this.onMouseDown);
            this.handle.removeEventListener('touchstart', this.onTouchStart);
        }

        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
        document.removeEventListener('touchmove', this.onTouchMove);
        document.removeEventListener('touchend', this.onTouchEnd);

        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }

        this.element = null;
        this.handle = null;
    }
}
