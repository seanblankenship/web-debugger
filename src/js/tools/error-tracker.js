/**
 * Error Tracker Tool
 * Tracks and displays JavaScript errors and exceptions
 */
import { BaseTool } from './base-tool.js';

export class ErrorTracker extends BaseTool {
    constructor(container, themeManager, storageManager) {
        super(container, themeManager, storageManager);

        this.name = 'Error Tracker';
        this.icon = 'errorTracker';
        this.description = 'Track and analyze JavaScript errors';

        this.errors = [];
        this.isTracking = false;
        this.originalErrorHandler = null;
        this.originalRejectionHandler = null;
        this.autoScroll = this.getSetting('autoScroll', true);
        this.pauseOnError = this.getSetting('pauseOnError', false);
        this.filterTypes = this.getSetting('filterTypes', {
            error: true,
            unhandledrejection: true,
            warning: true,
            info: true,
        });
    }

    init() {
        super.init();
        this.render();
        this.startTracking();
        return this;
    }

    render() {
        const panel = document.createElement('div');
        panel.className = 'dev-overlay-tool error-tracker-tool';

        // Create the header
        const header = document.createElement('div');
        header.className = 'tool-header';

        const title = document.createElement('h3');
        title.textContent = this.name;
        header.appendChild(title);

        panel.appendChild(header);

        // Create the main content
        const content = document.createElement('div');
        content.className = 'tool-content';

        // Controls section
        const controlsSection = document.createElement('div');
        controlsSection.className = 'controls-section';

        // Create tracking toggle
        const trackingToggle = document.createElement('div');
        trackingToggle.className = 'tracking-toggle';

        const trackingCheckbox = document.createElement('input');
        trackingCheckbox.type = 'checkbox';
        trackingCheckbox.id = 'tracking-toggle';
        trackingCheckbox.checked = this.isTracking;
        trackingCheckbox.addEventListener('change', () => {
            if (trackingCheckbox.checked) {
                this.startTracking();
            } else {
                this.stopTracking();
            }
        });
        trackingToggle.appendChild(trackingCheckbox);

        const trackingLabel = document.createElement('label');
        trackingLabel.htmlFor = 'tracking-toggle';
        trackingLabel.textContent = 'Enable Error Tracking';
        trackingToggle.appendChild(trackingLabel);

        controlsSection.appendChild(trackingToggle);

        // Create auto-scroll toggle
        const autoScrollToggle = document.createElement('div');
        autoScrollToggle.className = 'auto-scroll-toggle';

        const autoScrollCheckbox = document.createElement('input');
        autoScrollCheckbox.type = 'checkbox';
        autoScrollCheckbox.id = 'auto-scroll-toggle';
        autoScrollCheckbox.checked = this.autoScroll;
        autoScrollCheckbox.addEventListener('change', () => {
            this.autoScroll = autoScrollCheckbox.checked;
            this.setSetting('autoScroll', this.autoScroll);
        });
        autoScrollToggle.appendChild(autoScrollCheckbox);

        const autoScrollLabel = document.createElement('label');
        autoScrollLabel.htmlFor = 'auto-scroll-toggle';
        autoScrollLabel.textContent = 'Auto-scroll to New Errors';
        autoScrollToggle.appendChild(autoScrollLabel);

        controlsSection.appendChild(autoScrollToggle);

        // Create pause on error toggle
        const pauseToggle = document.createElement('div');
        pauseToggle.className = 'pause-toggle';

        const pauseCheckbox = document.createElement('input');
        pauseCheckbox.type = 'checkbox';
        pauseCheckbox.id = 'pause-toggle';
        pauseCheckbox.checked = this.pauseOnError;
        pauseCheckbox.addEventListener('change', () => {
            this.pauseOnError = pauseCheckbox.checked;
            this.setSetting('pauseOnError', this.pauseOnError);
        });
        pauseToggle.appendChild(pauseCheckbox);

        const pauseLabel = document.createElement('label');
        pauseLabel.htmlFor = 'pause-toggle';
        pauseLabel.textContent = 'Pause Execution on Error';
        pauseToggle.appendChild(pauseLabel);

        controlsSection.appendChild(pauseToggle);

        // Create filter buttons
        const filterSection = document.createElement('div');
        filterSection.className = 'filter-section';

        const filterLabel = document.createElement('div');
        filterLabel.className = 'filter-label';
        filterLabel.textContent = 'Filter:';
        filterSection.appendChild(filterLabel);

        const filterTypes = [
            { id: 'error', label: 'Errors' },
            { id: 'unhandledrejection', label: 'Promises' },
            { id: 'warning', label: 'Warnings' },
            { id: 'info', label: 'Info' },
        ];

        filterTypes.forEach((type) => {
            const filterToggle = document.createElement('div');
            filterToggle.className = 'filter-toggle';

            const filterCheckbox = document.createElement('input');
            filterCheckbox.type = 'checkbox';
            filterCheckbox.id = `filter-${type.id}`;
            filterCheckbox.checked = this.filterTypes[type.id];
            filterCheckbox.addEventListener('change', () => {
                this.filterTypes[type.id] = filterCheckbox.checked;
                this.setSetting('filterTypes', this.filterTypes);
                this.renderErrorList();
            });
            filterToggle.appendChild(filterCheckbox);

            const filterTypeLabel = document.createElement('label');
            filterTypeLabel.htmlFor = `filter-${type.id}`;
            filterTypeLabel.textContent = type.label;
            filterToggle.appendChild(filterTypeLabel);

            filterSection.appendChild(filterToggle);
        });

        // Add clear button
        const clearButton = document.createElement('button');
        clearButton.className = 'clear-button';
        clearButton.textContent = 'Clear All';
        clearButton.addEventListener('click', () => this.clearErrors());
        filterSection.appendChild(clearButton);

        controlsSection.appendChild(filterSection);
        content.appendChild(controlsSection);

        // Create error list container
        const errorListContainer = document.createElement('div');
        errorListContainer.className = 'error-list-container';

        const errorList = document.createElement('div');
        errorList.className = 'error-list';
        errorListContainer.appendChild(errorList);
        this.errorList = errorList;

        content.appendChild(errorListContainer);

        // Create error details container
        const errorDetails = document.createElement('div');
        errorDetails.className = 'error-details';
        errorDetails.innerHTML =
            '<div class="empty-state">Select an error to view details</div>';
        this.errorDetails = errorDetails;

        content.appendChild(errorDetails);

        panel.appendChild(content);
        this.container.appendChild(panel);
        this.panel = panel;

        // Initialize error list
        this.renderErrorList();

        return this;
    }

    /**
     * Start tracking JavaScript errors
     */
    startTracking() {
        if (this.isTracking) return;

        // Store original handlers
        this.originalErrorHandler = window.onerror;
        this.originalRejectionHandler = window.onunhandledrejection;

        // Set up error handler
        window.onerror = (message, source, lineno, colno, error) => {
            this.trackError({
                type: 'error',
                message: message,
                source: source,
                lineno: lineno,
                colno: colno,
                error: error,
                timestamp: Date.now(),
                stack: error?.stack || '',
            });

            // Optionally pause execution
            if (this.pauseOnError && error) {
                console.error('Error tracking paused execution:', error);
                debugger;
            }

            // Call original handler if exists
            if (typeof this.originalErrorHandler === 'function') {
                return this.originalErrorHandler(
                    message,
                    source,
                    lineno,
                    colno,
                    error
                );
            }

            return false;
        };

        // Set up unhandled promise rejection handler
        window.onunhandledrejection = (event) => {
            const error = event.reason;
            let message = 'Unhandled Promise Rejection';

            if (error) {
                if (typeof error === 'string') {
                    message = error;
                } else if (error.message) {
                    message = error.message;
                }
            }

            this.trackError({
                type: 'unhandledrejection',
                message: message,
                source: '',
                lineno: 0,
                colno: 0,
                error: error,
                timestamp: Date.now(),
                stack: error?.stack || '',
            });

            // Optionally pause execution
            if (this.pauseOnError) {
                console.error(
                    'Unhandled rejection tracking paused execution:',
                    error
                );
                debugger;
            }

            // Call original handler if exists
            if (typeof this.originalRejectionHandler === 'function') {
                return this.originalRejectionHandler(event);
            }

            return false;
        };

        // Set up console overrides for warnings and info
        this.setupConsoleOverrides();

        this.isTracking = true;

        // Update checkbox if it exists
        const trackingCheckbox = this.panel.querySelector('#tracking-toggle');
        if (trackingCheckbox) {
            trackingCheckbox.checked = true;
        }
    }

    /**
     * Stop tracking JavaScript errors
     */
    stopTracking() {
        if (!this.isTracking) return;

        // Restore original handlers
        window.onerror = this.originalErrorHandler;
        window.onunhandledrejection = this.originalRejectionHandler;

        // Restore console methods
        this.restoreConsoleOverrides();

        this.isTracking = false;

        // Update checkbox if it exists
        const trackingCheckbox = this.panel.querySelector('#tracking-toggle');
        if (trackingCheckbox) {
            trackingCheckbox.checked = false;
        }
    }

    /**
     * Set up console method overrides to track warnings and info
     */
    setupConsoleOverrides() {
        // Store original methods
        this.originalConsoleWarn = console.warn;
        this.originalConsoleInfo = console.info;

        // Override console.warn
        console.warn = (...args) => {
            const message = args.map((arg) => this.stringifyArg(arg)).join(' ');

            this.trackError({
                type: 'warning',
                message: message,
                source: '',
                lineno: 0,
                colno: 0,
                error: new Error(message),
                timestamp: Date.now(),
                args: args,
            });

            // Call original method
            this.originalConsoleWarn.apply(console, args);
        };

        // Override console.info
        console.info = (...args) => {
            const message = args.map((arg) => this.stringifyArg(arg)).join(' ');

            this.trackError({
                type: 'info',
                message: message,
                source: '',
                lineno: 0,
                colno: 0,
                error: null,
                timestamp: Date.now(),
                args: args,
            });

            // Call original method
            this.originalConsoleInfo.apply(console, args);
        };
    }

    /**
     * Restore original console methods
     */
    restoreConsoleOverrides() {
        if (this.originalConsoleWarn) {
            console.warn = this.originalConsoleWarn;
        }

        if (this.originalConsoleInfo) {
            console.info = this.originalConsoleInfo;
        }
    }

    /**
     * Convert argument to string representation
     * @param {any} arg - The argument to stringify
     * @returns {string} String representation
     */
    stringifyArg(arg) {
        if (arg === null) return 'null';
        if (arg === undefined) return 'undefined';
        if (typeof arg === 'string') return arg;

        try {
            if (
                typeof arg === 'object' &&
                arg.toString !== Object.prototype.toString
            ) {
                return arg.toString();
            }
            return JSON.stringify(arg);
        } catch (e) {
            return Object.prototype.toString.call(arg);
        }
    }

    /**
     * Track an error
     * @param {Object} errorInfo - Error information
     */
    trackError(errorInfo) {
        // Add to list
        this.errors.unshift(errorInfo);

        // Update UI
        this.renderErrorList();

        // Auto-scroll to new error
        if (
            this.autoScroll &&
            this.errorList &&
            this.filterTypes[errorInfo.type]
        ) {
            const firstItem = this.errorList.querySelector('.error-item');
            if (firstItem) {
                firstItem.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });

                // Select the first error
                this.selectError(0);
            }
        }
    }

    /**
     * Render the list of errors
     */
    renderErrorList() {
        this.errorList.innerHTML = '';

        const filteredErrors = this.errors.filter(
            (error) => this.filterTypes[error.type]
        );

        if (filteredErrors.length === 0) {
            this.errorList.innerHTML =
                '<div class="empty-state">No errors tracked yet</div>';
            return;
        }

        // Create error items
        filteredErrors.forEach((error, index) => {
            const errorItem = document.createElement('div');
            errorItem.className = `error-item error-type-${error.type}`;
            errorItem.setAttribute('data-index', index);

            // Create timestamp
            const timestamp = document.createElement('div');
            timestamp.className = 'error-timestamp';
            const time = new Date(error.timestamp);
            timestamp.textContent = time.toLocaleTimeString();
            errorItem.appendChild(timestamp);

            // Create error type badge
            const typeBadge = document.createElement('div');
            typeBadge.className = 'error-type-badge';
            typeBadge.textContent = this.getErrorTypeLabel(error.type);
            errorItem.appendChild(typeBadge);

            // Create error message
            const message = document.createElement('div');
            message.className = 'error-message';
            message.textContent = this.truncateText(error.message, 80);
            errorItem.appendChild(message);

            // Add click handler
            errorItem.addEventListener('click', () => {
                // Remove selected class from all items
                this.errorList
                    .querySelectorAll('.error-item')
                    .forEach((item) => {
                        item.classList.remove('selected');
                    });

                // Add selected class to this item
                errorItem.classList.add('selected');

                // Show error details
                this.selectError(index);
            });

            this.errorList.appendChild(errorItem);
        });
    }

    /**
     * Select an error and show its details
     * @param {number} index - Index of the error in the errors array
     */
    selectError(index) {
        const error = this.errors[index];
        if (!error) return;

        // Create error details content
        this.errorDetails.innerHTML = '';

        // Create error header
        const header = document.createElement('div');
        header.className = 'error-details-header';

        const title = document.createElement('h4');
        title.textContent = this.getErrorTypeLabel(error.type);
        header.appendChild(title);

        const timestamp = document.createElement('div');
        timestamp.className = 'error-details-timestamp';
        timestamp.textContent = new Date(error.timestamp).toLocaleString();
        header.appendChild(timestamp);

        this.errorDetails.appendChild(header);

        // Create error message
        const message = document.createElement('div');
        message.className = 'error-details-message';
        message.textContent = error.message;
        this.errorDetails.appendChild(message);

        // Create source information
        if (error.source) {
            const source = document.createElement('div');
            source.className = 'error-details-source';
            source.innerHTML = `<strong>Source:</strong> ${error.source}${
                error.lineno ? `:${error.lineno}` : ''
            }${error.colno ? `:${error.colno}` : ''}`;
            this.errorDetails.appendChild(source);
        }

        // Create stack trace
        if (error.stack) {
            const stackContainer = document.createElement('div');
            stackContainer.className = 'error-details-stack-container';

            const stackHeader = document.createElement('h5');
            stackHeader.textContent = 'Stack Trace';
            stackContainer.appendChild(stackHeader);

            const stack = document.createElement('pre');
            stack.className = 'error-details-stack';
            stack.textContent = error.stack;
            stackContainer.appendChild(stack);

            this.errorDetails.appendChild(stackContainer);
        }

        // Create error object dump if available
        if (error.error && typeof error.error === 'object') {
            try {
                const errorObjectContainer = document.createElement('div');
                errorObjectContainer.className =
                    'error-details-object-container';

                const errorObjectHeader = document.createElement('h5');
                errorObjectHeader.textContent = 'Error Object';
                errorObjectContainer.appendChild(errorObjectHeader);

                const errorObject = document.createElement('pre');
                errorObject.className = 'error-details-object';

                // Get all properties including non-enumerables
                const props = Object.getOwnPropertyNames(error.error);
                const errorObj = {};

                props.forEach((prop) => {
                    try {
                        if (prop !== 'stack') {
                            // Stack is already shown
                            errorObj[prop] = error.error[prop];
                        }
                    } catch (e) {
                        errorObj[prop] = '(Cannot access property)';
                    }
                });

                errorObject.textContent = JSON.stringify(errorObj, null, 2);
                errorObjectContainer.appendChild(errorObject);

                this.errorDetails.appendChild(errorObjectContainer);
            } catch (e) {
                // Ignore if can't stringify
            }
        }

        // Create console arguments if available
        if (error.args && error.args.length > 0) {
            const argsContainer = document.createElement('div');
            argsContainer.className = 'error-details-args-container';

            const argsHeader = document.createElement('h5');
            argsHeader.textContent = 'Console Arguments';
            argsContainer.appendChild(argsHeader);

            const argsList = document.createElement('div');
            argsList.className = 'error-details-args-list';

            error.args.forEach((arg, i) => {
                const argItem = document.createElement('div');
                argItem.className = 'error-details-arg-item';

                try {
                    if (typeof arg === 'object' && arg !== null) {
                        argItem.innerHTML = `<strong>Arg ${
                            i + 1
                        }:</strong> <pre>${JSON.stringify(arg, null, 2)}</pre>`;
                    } else {
                        argItem.innerHTML = `<strong>Arg ${
                            i + 1
                        }:</strong> ${this.stringifyArg(arg)}`;
                    }
                } catch (e) {
                    argItem.innerHTML = `<strong>Arg ${
                        i + 1
                    }:</strong> (cannot display)`;
                }

                argsList.appendChild(argItem);
            });

            argsContainer.appendChild(argsList);
            this.errorDetails.appendChild(argsContainer);
        }

        // Add buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'error-details-buttons';

        // Add copy button
        const copyButton = document.createElement('button');
        copyButton.textContent = 'Copy Details';
        copyButton.addEventListener('click', () =>
            this.copyErrorDetails(error)
        );
        buttonContainer.appendChild(copyButton);

        // Add remove button
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', () => {
            this.removeError(index);

            // Clear details
            this.errorDetails.innerHTML =
                '<div class="empty-state">Select an error to view details</div>';
        });
        buttonContainer.appendChild(removeButton);

        this.errorDetails.appendChild(buttonContainer);
    }

    /**
     * Get a label for an error type
     * @param {string} type - Error type
     * @returns {string} Type label
     */
    getErrorTypeLabel(type) {
        switch (type) {
            case 'error':
                return 'Error';
            case 'unhandledrejection':
                return 'Promise';
            case 'warning':
                return 'Warning';
            case 'info':
                return 'Info';
            default:
                return 'Other';
        }
    }

    /**
     * Truncate text to a maximum length
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated text
     */
    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    /**
     * Copy error details to clipboard
     * @param {Object} error - Error object
     */
    copyErrorDetails(error) {
        try {
            const details = {
                type: this.getErrorTypeLabel(error.type),
                timestamp: new Date(error.timestamp).toLocaleString(),
                message: error.message,
                source: error.source,
                location: error.lineno ? `${error.lineno}:${error.colno}` : '',
                stack: error.stack,
            };

            const text = Object.entries(details)
                .filter(([_, value]) => value)
                .map(
                    ([key, value]) =>
                        `${
                            key.charAt(0).toUpperCase() + key.slice(1)
                        }: ${value}`
                )
                .join('\n');

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
        } catch (e) {
            console.error('Failed to copy error details:', e);
        }
    }

    /**
     * Show copy success message
     */
    showCopySuccessMessage() {
        const message = document.createElement('div');
        message.className = 'copy-success-message';
        message.textContent = 'Copied to clipboard!';

        this.errorDetails.appendChild(message);

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
     * Remove an error from the list
     * @param {number} index - Index of the error to remove
     */
    removeError(index) {
        this.errors.splice(index, 1);
        this.renderErrorList();
    }

    /**
     * Clear all errors
     */
    clearErrors() {
        this.errors = [];
        this.renderErrorList();
        this.errorDetails.innerHTML =
            '<div class="empty-state">Select an error to view details</div>';
    }

    /**
     * Clean up before tool is destroyed
     */
    destroy() {
        this.stopTracking();
        return super.destroy();
    }
}
