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
        this.startElemPos = { x: 0, y: 0 };

        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);

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

        // Add event listeners
        this.handle.addEventListener('mousedown', this.onMouseDown);
        this.handle.addEventListener(
            'touchstart',
            this.onTouchStart.bind(this)
        );

        // Set cursor style
        this.handle.style.cursor = 'move';

        console.log('DragManager: Initialized with handle', this.handle);
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

        document.addEventListener('mousemove', this.onMouseMove);
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

        document.addEventListener('touchmove', this.onTouchMove.bind(this));
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

        // Get current element position
        const rect = this.element.getBoundingClientRect();
        this.startElemPos = {
            x: rect.left,
            y: rect.top,
        };

        // Add dragging class
        this.element.classList.add('dragging');
    }

    /**
     * Handle mouse move event
     * @param {MouseEvent} e - Mouse event
     */
    onMouseMove(e) {
        if (!this.isDragging) return;

        e.preventDefault();
        this.doDrag(e.clientX, e.clientY);
    }

    /**
     * Handle touch move event
     * @param {TouchEvent} e - Touch event
     */
    onTouchMove(e) {
        if (!this.isDragging || e.touches.length !== 1) return;

        e.preventDefault();
        const touch = e.touches[0];
        this.doDrag(touch.clientX, touch.clientY);
    }

    /**
     * Perform drag operation
     * @param {number} x - Client X position
     * @param {number} y - Client Y position
     */
    doDrag(x, y) {
        // Calculate new position
        const deltaX = x - this.startPos.x;
        const deltaY = y - this.startPos.y;

        const newX = this.startElemPos.x + deltaX;
        const newY = this.startElemPos.y + deltaY;

        // Apply new position
        this.element.style.left = `${newX}px`;
        this.element.style.top = `${newY}px`;

        // If element has right/bottom positioning, clear them
        this.element.style.right = 'auto';
        this.element.style.bottom = 'auto';
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

        // Remove dragging class
        this.element.classList.remove('dragging');

        // Save position (dispatch event for storage)
        const rect = this.element.getBoundingClientRect();
        const dragEndEvent = new CustomEvent('drag:end', {
            detail: {
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height,
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

        this.element = null;
        this.handle = null;
    }
}
