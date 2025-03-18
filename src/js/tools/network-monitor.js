/**
 * Network Monitor Tool
 * Monitors and displays network requests made by the page
 */
import BaseTool from '../tools/base-tool.js';

export class NetworkMonitor extends BaseTool {
    /**
     * Create a new NetworkMonitor
     * @param {Object} config - Configuration options
     * @param {HTMLElement} config.container - Container element
     * @param {Object} config.theme - Theme manager
     * @param {Object} config.storage - Storage manager
     */
    constructor(config = {}) {
        super({
            name: 'Network Monitor',
            icon: 'network',
            description: 'Monitor and analyze network requests',
            storage: config.storage,
            theme: config.theme,
            overlay: config.container ? config.container.parentNode : null,
        });

        // Explicit ID setting
        this.name = 'Network Monitor';
        this.id = 'network-monitor';
        this.icon = 'network';
        this.description = 'Monitor and analyze network requests';

        this.container = config.container;

        // State
        this.isActive = false;
        this.isMonitoring = false;
        this.requests = [];
        this.selectedRequestId = null;
        this.filters = {
            url: '',
            method: '',
            status: '',
            type: '',
        };

        // Original methods to restore when deactivated
        this.originalFetch = null;
        this.originalXHROpen = null;
        this.originalXHRSend = null;

        // Initialize panel
        this.panel = document.createElement('div');
        this.panel.className = 'network-monitor-panel panel';

        // Elements - initialize these but don't create DOM elements yet
        this.panelContent = null;
        this.requestList = null;
        this.requestDetails = null;
        this.toolbar = null;
        this.filtersSection = null;
        this.statisticsSection = null;

        // Load saved filters from storage
        this.loadFilters();
    }

    /**
     * Set up the tool UI
     */
    setup() {
        if (this.panelContent) return; // Already set up
        this.createPanel();
    }

    /**
     * Create the tool panel
     */
    createPanel() {
        // Create main container if it doesn't exist yet
        if (!this.panelContent) {
            this.panelContent = document.createElement('div');
            this.panelContent.className = 'network-monitor-content';
        } else {
            // Clear existing content if recreating
            this.panelContent.innerHTML = '';
        }

        // Create toolbar
        this.toolbar = document.createElement('div');
        this.toolbar.className = 'network-toolbar';

        // Record button
        const recordToggle = document.createElement('div');
        recordToggle.className = 'toggle-switch-container';

        if (this.ui && typeof this.ui.createToggleSwitch === 'function') {
            const toggle = this.ui.createToggleSwitch(
                'toggle-recording',
                true,
                (checked) => {
                    if (checked) {
                        this.startMonitoring();
                    } else {
                        this.stopMonitoring();
                    }
                },
                'Record Network'
            );
            recordToggle.appendChild(toggle);
        } else {
            // Fallback
            const label = document.createElement('label');
            label.textContent = 'Record Network';
            label.htmlFor = 'toggle-recording';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.id = 'toggle-recording';
            input.checked = true;

            input.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.startMonitoring();
                } else {
                    this.stopMonitoring();
                }
            });

            recordToggle.appendChild(label);
            recordToggle.appendChild(input);
        }

        this.toolbar.appendChild(recordToggle);

        // Clear button
        const clearButton = document.createElement('button');
        clearButton.className = 'clear-button';
        clearButton.textContent = 'Clear';
        clearButton.addEventListener('click', () => this.handleClearClick());
        this.toolbar.appendChild(clearButton);

        this.panelContent.appendChild(this.toolbar);

        // Now append the panelContent to the panel
        if (this.panel) {
            // Remove old content if it exists
            while (this.panel.firstChild) {
                this.panel.removeChild(this.panel.firstChild);
            }
            // Add the new content
            this.panel.appendChild(this.panelContent);
        }
    }

    /**
     * Activate the tool
     */
    activate() {
        if (this.isActive) return;

        this.isActive = true;

        // Create panel if it doesn't exist
        if (!this.panelContent) {
            this.setup();
        }

        // Show panel in UI - use the panel directly here
        if (this.ui && typeof this.ui.showToolPanel === 'function') {
            this.ui.showToolPanel(this.id);
        }

        // Start monitoring network
        this.startMonitoring();

        // Render initial state
        this.renderRequestList();

        // Log activation rather than using notifications
        console.log('Network Monitor activated');
    }

    /**
     * Deactivate the tool
     */
    deactivate() {
        if (!this.isActive) return;

        this.isActive = false;

        // Stop monitoring network
        this.stopMonitoring();

        // Log deactivation rather than using notifications
        console.log('Network Monitor deactivated');
    }

    /**
     * Start monitoring network requests
     */
    startMonitoring() {
        if (this.isMonitoring) return;

        this.isMonitoring = true;

        // Intercept fetch requests
        this.originalFetch = window.fetch;
        window.fetch = (...args) => {
            const request = {
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                method: args[1]?.method || 'GET',
                url: args[0].toString(),
                startTime: performance.now(),
                type: 'fetch',
                status: 'pending',
                statusText: '',
                size: 0,
                requestHeaders: args[1]?.headers
                    ? this.headersToObject(args[1].headers)
                    : {},
                responseHeaders: {},
                responseBody: null,
                endTime: null,
                duration: null,
            };

            this.requests.unshift(request);
            this.renderRequestList();

            return this.originalFetch
                .apply(window, args)
                .then((response) => {
                    request.endTime = performance.now();
                    request.duration = request.endTime - request.startTime;
                    request.status = response.status;
                    request.statusText = response.statusText;

                    // Clone response to get headers and body
                    const clonedResponse = response.clone();

                    // Get response headers
                    clonedResponse.headers.forEach((value, name) => {
                        request.responseHeaders[name] = value;
                    });

                    // Get response body based on content type
                    const contentType =
                        clonedResponse.headers.get('content-type') || '';

                    if (contentType.includes('application/json')) {
                        return clonedResponse
                            .json()
                            .then((json) => {
                                request.responseBody = json;
                                request.size = JSON.stringify(json).length;
                                this.renderRequestList();
                                return response;
                            })
                            .catch(() => {
                                // If JSON parsing fails, try text
                                return clonedResponse.text().then((text) => {
                                    request.responseBody = text;
                                    request.size = text.length;
                                    this.renderRequestList();
                                    return response;
                                });
                            });
                    } else if (contentType.includes('text/')) {
                        return clonedResponse.text().then((text) => {
                            request.responseBody = text;
                            request.size = text.length;
                            this.renderRequestList();
                            return response;
                        });
                    } else {
                        // For binary data, just get size
                        clonedResponse
                            .arrayBuffer()
                            .then((buffer) => {
                                request.size = buffer.byteLength;
                                request.responseBody = `Binary data (${this.formatSize(
                                    buffer.byteLength
                                )})`;
                                this.renderRequestList();
                            })
                            .catch(() => {
                                // Ignore errors in getting binary data
                            });
                        return response;
                    }
                })
                .catch((error) => {
                    request.endTime = performance.now();
                    request.duration = request.endTime - request.startTime;
                    request.status = 0;
                    request.statusText = error.message;
                    request.error = error;
                    this.renderRequestList();
                    throw error;
                });
        };

        // Intercept XMLHttpRequest
        this.originalXHROpen = XMLHttpRequest.prototype.open;
        this.originalXHRSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function (method, url) {
            this._networkMonitorData = {
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                method: method,
                url: url.toString(),
                startTime: performance.now(),
                type: 'xhr',
                status: 'pending',
                statusText: '',
                size: 0,
                requestHeaders: {},
                responseHeaders: {},
                responseBody: null,
                endTime: null,
                duration: null,
            };

            return this.originalXHROpen.apply(this, arguments);
        };

        XMLHttpRequest.prototype.send = function (data) {
            if (!this._networkMonitorData) {
                return this.originalXHRSend.apply(this, arguments);
            }

            const request = this._networkMonitorData;

            // Add to request list
            this._networkMonitorInstance = this;

            // Store original event handlers
            const originalOnReadyStateChange = this.onreadystatechange;

            // Override onreadystatechange to capture response
            this.onreadystatechange = function () {
                const xhr = this;

                // Call original handler if exists
                if (originalOnReadyStateChange) {
                    originalOnReadyStateChange.apply(xhr, arguments);
                }

                if (xhr.readyState === XMLHttpRequest.DONE) {
                    request.endTime = performance.now();
                    request.duration = request.endTime - request.startTime;
                    request.status = xhr.status;
                    request.statusText = xhr.statusText;

                    // Get response headers
                    const allHeaders = xhr.getAllResponseHeaders();
                    const headerLines = allHeaders.split('\r\n');
                    headerLines.forEach((line) => {
                        if (line) {
                            const parts = line.split(': ');
                            const name = parts[0];
                            const value = parts.slice(1).join(': ');
                            request.responseHeaders[name] = value;
                        }
                    });

                    // Get response body based on content type
                    const contentType =
                        xhr.getResponseHeader('content-type') || '';

                    if (contentType.includes('application/json')) {
                        try {
                            request.responseBody = JSON.parse(xhr.responseText);
                        } catch (e) {
                            request.responseBody = xhr.responseText;
                        }
                    } else if (contentType.includes('text/')) {
                        request.responseBody = xhr.responseText;
                    } else {
                        request.responseBody = `Binary data (${
                            xhr.response ? xhr.response.byteLength : 0
                        } bytes)`;
                    }

                    // Update size
                    if (xhr.responseText) {
                        request.size = xhr.responseText.length;
                    } else if (xhr.response) {
                        request.size = xhr.response.byteLength;
                    }
                }
            };

            // Add request to list before sending
            this._networkMonitorData.instance = this;

            return this.originalXHRSend.apply(this, arguments);
        };
    }

    /**
     * Stop monitoring network requests
     */
    stopMonitoring() {
        if (!this.isMonitoring) return;

        this.isMonitoring = false;

        // Restore original fetch and XHR methods
        if (this.originalFetch) {
            window.fetch = this.originalFetch;
            this.originalFetch = null;
        }

        if (this.originalXHROpen && this.originalXHRSend) {
            XMLHttpRequest.prototype.open = this.originalXHROpen;
            XMLHttpRequest.prototype.send = this.originalXHRSend;
            this.originalXHROpen = null;
            this.originalXHRSend = null;
        }
    }

    /**
     * Convert Headers object to plain object
     * @param {Headers} headers - Headers object
     * @returns {Object} Plain object with headers
     */
    headersToObject(headers) {
        const result = {};
        if (headers instanceof Headers) {
            headers.forEach((value, name) => {
                result[name] = value;
            });
        } else if (typeof headers === 'object') {
            Object.keys(headers).forEach((key) => {
                result[key] = headers[key];
            });
        }
        return result;
    }

    /**
     * Handle clear button click
     */
    handleClearClick() {
        this.requests = [];
        this.selectedRequestId = null;
        this.renderRequestList();
        this.renderRequestDetails(null);
    }

    /**
     * Handle filter change
     * @param {string} filterName - Name of the filter
     * @param {string} value - New filter value
     */
    handleFilterChange(filterName, value) {
        this.filters[filterName] = value;
        this.saveFilters();
        this.renderRequestList();
    }

    /**
     * Handle request selection
     * @param {string} requestId - ID of the selected request
     */
    handleRequestSelect(requestId) {
        this.selectedRequestId = requestId;

        // Find the request
        const request = this.requests.find((req) => req.id === requestId);

        // Render details
        this.renderRequestDetails(request);

        // Update selection in list
        const items = this.requestList.querySelectorAll('.request-item');
        items.forEach((item) => {
            if (item.dataset.id === requestId) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }

    /**
     * Get filtered requests based on current filters
     * @returns {Array} Filtered requests
     */
    getFilteredRequests() {
        return this.requests.filter((request) => {
            // Filter by URL
            if (
                this.filters.url &&
                !request.url
                    .toLowerCase()
                    .includes(this.filters.url.toLowerCase())
            ) {
                return false;
            }

            // Filter by method
            if (this.filters.method && request.method !== this.filters.method) {
                return false;
            }

            // Filter by status
            if (this.filters.status) {
                const statusCategory = this.getStatusCategory(request.status);
                if (this.filters.status !== statusCategory) {
                    return false;
                }
            }

            // Filter by type
            if (this.filters.type && request.type !== this.filters.type) {
                return false;
            }

            return true;
        });
    }

    /**
     * Get status category (2xx, 3xx, etc.)
     * @param {number} status - HTTP status code
     * @returns {string} Status category
     */
    getStatusCategory(status) {
        if (status >= 200 && status < 300) {
            return '2xx';
        } else if (status >= 300 && status < 400) {
            return '3xx';
        } else if (status >= 400 && status < 500) {
            return '4xx';
        } else if (status >= 500 && status < 600) {
            return '5xx';
        } else {
            return '';
        }
    }

    /**
     * Get status class for CSS
     * @param {number} status - HTTP status code
     * @returns {string} CSS class
     */
    getStatusClass(status) {
        if (status >= 200 && status < 300) {
            return 'success';
        } else if (status >= 300 && status < 400) {
            return 'redirect';
        } else if (status >= 400 && status < 500) {
            return 'client-error';
        } else if (status >= 500 && status < 600) {
            return 'server-error';
        } else {
            return '';
        }
    }

    /**
     * Format bytes to human-readable size
     * @param {number} bytes - Size in bytes
     * @returns {string} Formatted size
     */
    formatSize(bytes) {
        if (bytes === 0) return '0 B';

        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));

        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
    }

    /**
     * Format milliseconds to human-readable duration
     * @param {number} ms - Duration in milliseconds
     * @returns {string} Formatted duration
     */
    formatDuration(ms) {
        if (ms < 1000) {
            return `${ms.toFixed(0)} ms`;
        } else {
            return `${(ms / 1000).toFixed(2)} s`;
        }
    }

    /**
     * Render the request list
     */
    renderRequestList() {
        if (!this.requestList) return;

        const filteredRequests = this.getFilteredRequests();

        if (filteredRequests.length === 0) {
            this.requestList.innerHTML =
                '<div class="empty-state">No requests captured</div>';
            return;
        }

        // Clear list
        this.requestList.innerHTML = '';

        // Add items
        filteredRequests.forEach((request) => {
            const item = document.createElement('div');
            item.className = 'request-item';
            item.dataset.id = request.id;

            if (this.selectedRequestId === request.id) {
                item.classList.add('selected');
            }

            // URL
            const url = document.createElement('div');
            url.className = 'request-url';
            url.textContent = request.url;
            item.appendChild(url);

            // Info row (method, status, size, time)
            const info = document.createElement('div');
            info.className = 'request-info';

            // Method and status
            const leftInfo = document.createElement('div');

            const method = document.createElement('span');
            method.className = `request-method ${request.method.toLowerCase()}`;
            method.textContent = request.method;
            leftInfo.appendChild(method);

            const status = document.createElement('span');
            status.className = `request-status ${this.getStatusClass(
                request.status
            )}`;
            status.textContent = request.status || '-';
            leftInfo.appendChild(status);

            info.appendChild(leftInfo);

            // Size and duration
            const rightInfo = document.createElement('div');

            if (request.size) {
                const size = document.createElement('span');
                size.className = 'request-size';
                size.textContent = this.formatSize(request.size);
                rightInfo.appendChild(size);
            }

            if (request.duration) {
                const duration = document.createElement('span');
                duration.className = 'request-duration';
                duration.textContent = ` (${this.formatDuration(
                    request.duration
                )})`;
                rightInfo.appendChild(duration);
            } else if (request.status === 'pending') {
                const pending = document.createElement('span');
                pending.className = 'request-pending';
                pending.textContent = ' (pending)';
                rightInfo.appendChild(pending);
            }

            info.appendChild(rightInfo);
            item.appendChild(info);

            // Add click handler
            item.addEventListener('click', () => {
                this.handleRequestSelect(request.id);
            });

            this.requestList.appendChild(item);
        });

        // If selected request is no longer visible, clear details
        if (
            this.selectedRequestId &&
            !filteredRequests.find((r) => r.id === this.selectedRequestId)
        ) {
            this.selectedRequestId = null;
            this.renderRequestDetails(null);
        }
    }

    /**
     * Render request details
     * @param {Object} request - Request object
     */
    renderRequestDetails(request) {
        if (!this.requestDetails) return;

        if (!request) {
            this.requestDetails.innerHTML =
                '<div class="empty-state">Select a request to view details</div>';
            return;
        }

        // Clear details
        this.requestDetails.innerHTML = '';

        // General section
        const generalSection = document.createElement('div');
        generalSection.className = 'details-section';

        const generalHeading = document.createElement('div');
        generalHeading.className = 'details-heading';
        generalHeading.textContent = 'General';
        generalSection.appendChild(generalHeading);

        const addRow = (key, value, parent) => {
            const row = document.createElement('div');
            row.className = 'details-row';

            const keyEl = document.createElement('div');
            keyEl.className = 'details-key';
            keyEl.textContent = key;
            row.appendChild(keyEl);

            const valueEl = document.createElement('div');
            valueEl.className = 'details-value';
            valueEl.textContent = value;
            row.appendChild(valueEl);

            parent.appendChild(row);
        };

        addRow('URL', request.url, generalSection);
        addRow('Method', request.method, generalSection);
        addRow(
            'Status',
            `${request.status} ${request.statusText}`,
            generalSection
        );

        if (request.duration) {
            addRow(
                'Duration',
                this.formatDuration(request.duration),
                generalSection
            );
        }

        if (request.size) {
            addRow('Size', this.formatSize(request.size), generalSection);
        }

        this.requestDetails.appendChild(generalSection);

        // Request Headers section
        if (Object.keys(request.requestHeaders).length > 0) {
            const requestHeadersSection = document.createElement('div');
            requestHeadersSection.className = 'details-section';

            const requestHeadersHeading = document.createElement('div');
            requestHeadersHeading.className = 'details-heading';
            requestHeadersHeading.textContent = 'Request Headers';
            requestHeadersSection.appendChild(requestHeadersHeading);

            const table = document.createElement('table');
            table.className = 'headers-table';

            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');

            const nameHeader = document.createElement('th');
            nameHeader.textContent = 'Name';
            headerRow.appendChild(nameHeader);

            const valueHeader = document.createElement('th');
            valueHeader.textContent = 'Value';
            headerRow.appendChild(valueHeader);

            thead.appendChild(headerRow);
            table.appendChild(thead);

            const tbody = document.createElement('tbody');

            Object.entries(request.requestHeaders).forEach(([name, value]) => {
                const row = document.createElement('tr');

                const nameCell = document.createElement('td');
                nameCell.textContent = name;
                row.appendChild(nameCell);

                const valueCell = document.createElement('td');
                valueCell.textContent = value;
                row.appendChild(valueCell);

                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            requestHeadersSection.appendChild(table);

            this.requestDetails.appendChild(requestHeadersSection);
        }

        // Response Headers section
        if (Object.keys(request.responseHeaders).length > 0) {
            const responseHeadersSection = document.createElement('div');
            responseHeadersSection.className = 'details-section';

            const responseHeadersHeading = document.createElement('div');
            responseHeadersHeading.className = 'details-heading';
            responseHeadersHeading.textContent = 'Response Headers';
            responseHeadersSection.appendChild(responseHeadersHeading);

            const table = document.createElement('table');
            table.className = 'headers-table';

            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');

            const nameHeader = document.createElement('th');
            nameHeader.textContent = 'Name';
            headerRow.appendChild(nameHeader);

            const valueHeader = document.createElement('th');
            valueHeader.textContent = 'Value';
            headerRow.appendChild(valueHeader);

            thead.appendChild(headerRow);
            table.appendChild(thead);

            const tbody = document.createElement('tbody');

            Object.entries(request.responseHeaders).forEach(([name, value]) => {
                const row = document.createElement('tr');

                const nameCell = document.createElement('td');
                nameCell.textContent = name;
                row.appendChild(nameCell);

                const valueCell = document.createElement('td');
                valueCell.textContent = value;
                row.appendChild(valueCell);

                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            responseHeadersSection.appendChild(table);

            this.requestDetails.appendChild(responseHeadersSection);
        }

        // Response Body section
        if (request.responseBody) {
            const responseBodySection = document.createElement('div');
            responseBodySection.className = 'details-section';

            const responseBodyHeading = document.createElement('div');
            responseBodyHeading.className = 'details-heading';
            responseBodyHeading.textContent = 'Response Body';
            responseBodySection.appendChild(responseBodyHeading);

            const body = document.createElement('pre');
            body.className = 'response-body';

            // Format body based on content type
            if (typeof request.responseBody === 'object') {
                body.textContent = JSON.stringify(
                    request.responseBody,
                    null,
                    2
                );
            } else {
                body.textContent = request.responseBody;
            }

            responseBodySection.appendChild(body);

            this.requestDetails.appendChild(responseBodySection);
        }

        // Error section
        if (request.error) {
            const errorSection = document.createElement('div');
            errorSection.className = 'details-section';

            const errorHeading = document.createElement('div');
            errorHeading.className = 'details-heading';
            errorHeading.textContent = 'Error';
            errorSection.appendChild(errorHeading);

            const error = document.createElement('div');
            error.className = 'error-message';
            error.textContent = request.error.message || 'Unknown error';
            errorSection.appendChild(error);

            this.requestDetails.appendChild(errorSection);
        }
    }

    /**
     * Load filters from storage
     */
    loadFilters() {
        const savedFilters = this.storage?.get('network-monitor-filters');

        if (savedFilters) {
            this.filters = { ...this.filters, ...savedFilters };
        }
    }

    /**
     * Save filters to storage
     */
    saveFilters() {
        if (this.storage) {
            this.storage.set('network-monitor-filters', this.filters);
        }
    }

    /**
     * Escape HTML entities in a string
     * @param {string} html - HTML string to escape
     * @returns {string} Escaped HTML
     */
    escapeHtml(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }
}
