/**
 * Resize Manager
 * Manages resizable functionality for elements
 */
export class ResizeManager {
    /**
     * Create a new ResizeManager
     * @param {Object} config - Configuration options
     * @param {HTMLElement} config.element - The element to make resizable
     * @param {HTMLElement} config.handle - The handle element for resizing (optional)
     * @param {ShadowRoot} config.shadow - Shadow root for finding elements (optional)
     * @param {Object} config.minSize - Minimum size {width, height}
     */
    constructor(config = {}) {
        this.element = config.element || null;
        this.handle = config.handle || null;
        this.shadow = config.shadow || null;
        this.minSize = config.minSize || { width: 200, height: 150 };

        this.isResizing = false;
        this.startPos = { x: 0, y: 0 };
        this.currentPos = { x: 0, y: 0 };
        this.startSize = { width: 0, height: 0 };
        this.currentSize = { width: 0, height: 0 };

        this.rafId = null;

        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.updateElementSize = this.updateElementSize.bind(this);

        // Initialize if element is provided
        if (this.element) {
            this.init();
        }
    }

    /**
     * Initialize resize functionality
     * @param {HTMLElement} handle - Optional handle element for resizing
     */
    init(handle) {
        if (!this.element) {
            console.error('ResizeManager: No element provided for resizing');
            return;
        }

        // Set handle if provided
        if (handle) {
            this.handle = handle;
        }

        // If no handle is set, try to find one or create one
        if (!this.handle) {
            // Try to find a handle within the element
            if (this.shadow) {
                this.handle = this.shadow.querySelector('.resize-handle');
            }

            // If shadow search fails, try within the element
            if (!this.handle && this.element) {
                this.handle = this.element.querySelector('.resize-handle');
            }

            // If still no handle, create one
            if (!this.handle) {
                this.handle = this.createResizeHandle();
                console.log('ResizeManager: Created resize handle');
            }
        }

        // Enable hardware acceleration
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

        console.log(
            'ResizeManager: Initialized with element',
            this.element.className
        );
    }

    /**
     * Enable hardware acceleration for the element
     */
    enableHardwareAcceleration() {
        // Use will-change for better performance during resize operations
        this.element.style.willChange = 'width, height';

        // Ensure the element has a transform for hardware acceleration
        const compStyle = window.getComputedStyle(this.element);
        const transform = compStyle.transform;

        if (transform === 'none' || !transform) {
            // Apply a minimal transform to trigger hardware acceleration
            this.element.style.transform = 'translateZ(0)';
        }
    }

    /**
     * Create a resize handle element
     * @returns {HTMLElement} The created handle
     */
    createResizeHandle() {
        const handle = document.createElement('div');
        handle.className = 'resize-handle';
        handle.innerHTML = `
            <svg width="10" height="10" viewBox="0 0 10 10">
                <path d="M0 10L10 10L10 0Z" fill="currentColor" fill-opacity="0.5"/>
            </svg>
        `;

        Object.assign(handle.style, {
            position: 'absolute',
            right: '0',
            bottom: '0',
            width: '16px',
            height: '16px',
            cursor: 'nwse-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '10',
            touchAction: 'none', // Disable browser handling of touch gestures
        });

        this.element.appendChild(handle);
        return handle;
    }

    /**
     * Handle mouse down event
     * @param {MouseEvent} e - Mouse event
     */
    onMouseDown(e) {
        // Only listen for left mouse button
        if (e.button !== 0) return;

        e.preventDefault();
        e.stopPropagation();
        this.startResize(e.clientX, e.clientY);

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
        e.stopPropagation();

        const touch = e.touches[0];
        this.startResize(touch.clientX, touch.clientY);

        document.addEventListener('touchmove', this.onTouchMove.bind(this), {
            passive: false,
        });
        document.addEventListener('touchend', this.onTouchEnd.bind(this));
    }

    /**
     * Start resize operation
     * @param {number} x - Client X position
     * @param {number} y - Client Y position
     */
    startResize(x, y) {
        this.isResizing = true;
        this.startPos = { x, y };
        this.currentPos = { x, y };

        // Get current element size
        const rect = this.element.getBoundingClientRect();
        this.startSize = {
            width: rect.width,
            height: rect.height,
        };
        this.currentSize = { ...this.startSize };

        // Add resizing class
        this.element.classList.add('resizing');

        // Start animation loop for smooth updates
        this.startAnimationLoop();
    }

    /**
     * Start requestAnimationFrame loop for smooth animation
     */
    startAnimationLoop() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
        this.rafId = requestAnimationFrame(this.updateElementSize);
    }

    /**
     * Update element size in animation frame
     */
    updateElementSize() {
        if (!this.isResizing) return;

        // Apply new size
        this.element.style.width = `${this.currentSize.width}px`;
        this.element.style.height = `${this.currentSize.height}px`;

        // Continue animation loop
        this.rafId = requestAnimationFrame(this.updateElementSize);
    }

    /**
     * Handle mouse move event
     * @param {MouseEvent} e - Mouse event
     */
    onMouseMove(e) {
        if (!this.isResizing) return;

        e.preventDefault();

        // Just update current position - actual size update happens in rAF
        this.currentPos = { x: e.clientX, y: e.clientY };

        // Calculate new size
        this.calculateNewSize();
    }

    /**
     * Handle touch move event
     * @param {TouchEvent} e - Touch event
     */
    onTouchMove(e) {
        if (!this.isResizing || e.touches.length !== 1) return;

        e.preventDefault();
        const touch = e.touches[0];

        // Just update current position - actual size update happens in rAF
        this.currentPos = { x: touch.clientX, y: touch.clientY };

        // Calculate new size
        this.calculateNewSize();
    }

    /**
     * Calculate new size based on current mouse/touch position
     */
    calculateNewSize() {
        // Calculate new size
        const deltaX = this.currentPos.x - this.startPos.x;
        const deltaY = this.currentPos.y - this.startPos.y;

        let newWidth = this.startSize.width + deltaX;
        let newHeight = this.startSize.height + deltaY;

        // Apply minimum size constraints
        newWidth = Math.max(newWidth, this.minSize.width);
        newHeight = Math.max(newHeight, this.minSize.height);

        // Apply maximum size constraints (viewport limits)
        const maxWidth = window.innerWidth - this.element.offsetLeft;
        const maxHeight = window.innerHeight - this.element.offsetTop;

        newWidth = Math.min(newWidth, maxWidth);
        newHeight = Math.min(newHeight, maxHeight);

        // Update current size
        this.currentSize = {
            width: newWidth,
            height: newHeight,
        };
    }

    /**
     * Handle mouse up event
     */
    onMouseUp() {
        this.stopResize();

        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
    }

    /**
     * Handle touch end event
     */
    onTouchEnd() {
        this.stopResize();

        document.removeEventListener('touchmove', this.onTouchMove);
        document.removeEventListener('touchend', this.onTouchEnd);
    }

    /**
     * Stop resize operation
     */
    stopResize() {
        if (!this.isResizing) return;

        this.isResizing = false;

        // Stop animation loop
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }

        this.element.classList.remove('resizing');

        // Reset will-change to avoid unnecessary GPU memory consumption
        this.element.style.willChange = 'auto';

        // Save size (dispatch event for storage)
        const rect = this.element.getBoundingClientRect();
        const resizeEndEvent = new CustomEvent('resize:end', {
            detail: {
                width: rect.width,
                height: rect.height,
            },
        });
        this.element.dispatchEvent(resizeEndEvent);
    }

    /**
     * Destroy resize manager and cleanup
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
            this.rafId = null;
        }

        this.element = null;
        this.handle = null;
    }
}
