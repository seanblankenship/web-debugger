/**
 * Drag Manager
 * Handles dragging functionality for the overlay.
 */
export class DragManager {
    /**
     * Create a new DragManager
     * @param {HTMLElement} element - The element to make draggable
     */
    constructor(element) {
        this.element = element;
        this.isDragging = false;
        this.offset = { x: 0, y: 0 };

        // Initialize drag functionality
        this.init();
    }

    /**
     * Initialize drag functionality
     * @private
     */
    init() {
        // Find the header element to use as the drag handle
        const header = this.element.querySelector('.dev-overlay-header');

        if (!header) {
            console.error('DragManager: No header element found');
            return;
        }

        // Mouse events
        header.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));

        // Touch events for mobile
        header.addEventListener('touchstart', this.handleTouchStart.bind(this));
        document.addEventListener('touchmove', this.handleTouchMove.bind(this));
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    /**
     * Handle mouse down event
     * @param {MouseEvent} e - The mouse event
     * @private
     */
    handleMouseDown(e) {
        // Prevent default to avoid text selection
        e.preventDefault();

        // Start dragging
        this.startDragging(e.clientX, e.clientY);
    }

    /**
     * Handle mouse move event
     * @param {MouseEvent} e - The mouse event
     * @private
     */
    handleMouseMove(e) {
        if (!this.isDragging) return;

        // Move the element
        this.moveElement(e.clientX, e.clientY);
    }

    /**
     * Handle mouse up event
     * @private
     */
    handleMouseUp() {
        if (!this.isDragging) return;

        // Stop dragging
        this.stopDragging();
    }

    /**
     * Handle touch start event
     * @param {TouchEvent} e - The touch event
     * @private
     */
    handleTouchStart(e) {
        // Prevent default to avoid scrolling
        e.preventDefault();

        if (e.touches.length !== 1) return;

        const touch = e.touches[0];
        this.startDragging(touch.clientX, touch.clientY);
    }

    /**
     * Handle touch move event
     * @param {TouchEvent} e - The touch event
     * @private
     */
    handleTouchMove(e) {
        if (!this.isDragging || e.touches.length !== 1) return;

        const touch = e.touches[0];
        this.moveElement(touch.clientX, touch.clientY);
    }

    /**
     * Handle touch end event
     * @private
     */
    handleTouchEnd() {
        if (!this.isDragging) return;

        this.stopDragging();
    }

    /**
     * Start dragging the element
     * @param {number} clientX - The client X position
     * @param {number} clientY - The client Y position
     * @private
     */
    startDragging(clientX, clientY) {
        this.isDragging = true;

        // Add dragging class for visual feedback
        this.element.classList.add('dragging');

        // Calculate offset from the cursor to the element's top-left corner
        const rect = this.element.getBoundingClientRect();
        this.offset = {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };
    }

    /**
     * Move the element based on cursor position
     * @param {number} clientX - The client X position
     * @param {number} clientY - The client Y position
     * @private
     */
    moveElement(clientX, clientY) {
        if (!this.isDragging) return;

        // Calculate new position
        const x = clientX - this.offset.x;
        const y = clientY - this.offset.y;

        // Apply constraints to keep the element in the viewport
        const { width, height } = this.element.getBoundingClientRect();
        const maxX = window.innerWidth - width;
        const maxY = window.innerHeight - height;

        // Set position with constraints
        this.element.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
        this.element.style.top = `${Math.max(0, Math.min(y, maxY))}px`;

        // Remove default position
        this.element.style.right = 'auto';
    }

    /**
     * Stop dragging the element
     * @private
     */
    stopDragging() {
        this.isDragging = false;
        this.element.classList.remove('dragging');
    }

    /**
     * Reset the position to default (top-right)
     */
    resetPosition() {
        this.element.style.left = 'auto';
        this.element.style.top = '20px';
        this.element.style.right = '20px';
    }
}
