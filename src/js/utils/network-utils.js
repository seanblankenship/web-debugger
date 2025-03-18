/**
 * Network Utilities
 * Provides helper methods for network request monitoring and analysis
 */
export class NetworkUtils {
    /**
     * Create a new NetworkUtils instance
     */
    constructor() {
        this.requests = [];
        this.isMonitoring = false;
        this.originalFetch = window.fetch;
        this.originalXHR = window.XMLHttpRequest.prototype.open;
    }

    /**
     * Start monitoring network requests
     * @param {Function} callback - Function to call when a request is captured
     */
    startMonitoring(callback) {
        if (this.isMonitoring) return;
        this.isMonitoring = true;
        this.requests = [];
        this.interceptCallback = callback;

        this._monitorFetch();
        this._monitorXHR();
    }

    /**
     * Stop monitoring network requests
     */
    stopMonitoring() {
        if (!this.isMonitoring) return;

        // Restore original implementations
        window.fetch = this.originalFetch;
        window.XMLHttpRequest.prototype.open = this.originalXHR;

        this.isMonitoring = false;
        this.interceptCallback = null;
    }

    /**
     * Get a list of all captured requests
     * @returns {Array} Array of request objects
     */
    getRequests() {
        return this.requests;
    }

    /**
     * Clear the list of captured requests
     */
    clearRequests() {
        this.requests = [];
    }

    /**
     * Monitor fetch requests
     * @private
     */
    _monitorFetch() {
        const self = this;

        window.fetch = function (...args) {
            const request = {
                id: self._generateId(),
                type: 'fetch',
                url: args[0] instanceof Request ? args[0].url : args[0],
                method:
                    args[0] instanceof Request
                        ? args[0].method
                        : args[1]?.method || 'GET',
                headers:
                    args[0] instanceof Request
                        ? Object.fromEntries(args[0].headers.entries())
                        : args[1]?.headers || {},
                body: args[0] instanceof Request ? args[0].body : args[1]?.body,
                startTime: Date.now(),
                endTime: null,
                duration: null,
                status: null,
                statusText: null,
                response: null,
                responseSize: null,
                responseType: null,
                error: null,
            };

            self.requests.push(request);
            if (self.interceptCallback) self.interceptCallback(request);

            // Call the original fetch
            return self.originalFetch
                .apply(window, args)
                .then((response) => {
                    // Clone the response so we can read it
                    const clone = response.clone();

                    request.endTime = Date.now();
                    request.duration = request.endTime - request.startTime;
                    request.status = response.status;
                    request.statusText = response.statusText;
                    request.responseType = response.headers.get('content-type');

                    // Try to get the response size
                    const contentLength =
                        response.headers.get('content-length');
                    if (contentLength) {
                        request.responseSize = parseInt(contentLength, 10);
                    }

                    // Try to parse the response based on content type
                    if (
                        request.responseType &&
                        request.responseType.includes('application/json')
                    ) {
                        clone
                            .json()
                            .then((json) => {
                                request.response = json;
                                if (self.interceptCallback)
                                    self.interceptCallback(request);
                            })
                            .catch(() => {
                                // If we can't parse as JSON, get as text
                                clone.text().then((text) => {
                                    request.response = text;
                                    if (self.interceptCallback)
                                        self.interceptCallback(request);
                                });
                            });
                    } else {
                        clone.text().then((text) => {
                            request.response = text;

                            // If we don't have a size from content-length, calculate it
                            if (!request.responseSize) {
                                request.responseSize = new Blob([text]).size;
                            }

                            if (self.interceptCallback)
                                self.interceptCallback(request);
                        });
                    }

                    if (self.interceptCallback) self.interceptCallback(request);
                    return response;
                })
                .catch((error) => {
                    request.endTime = Date.now();
                    request.duration = request.endTime - request.startTime;
                    request.error = error.message;

                    if (self.interceptCallback) self.interceptCallback(request);
                    throw error;
                });
        };
    }

    /**
     * Monitor XMLHttpRequest
     * @private
     */
    _monitorXHR() {
        const self = this;

        window.XMLHttpRequest.prototype.open = function (method, url, async) {
            const xhr = this;
            const request = {
                id: self._generateId(),
                type: 'xhr',
                url: url,
                method: method,
                headers: {},
                startTime: Date.now(),
                endTime: null,
                duration: null,
                status: null,
                statusText: null,
                response: null,
                responseSize: null,
                responseType: null,
                error: null,
            };

            self.requests.push(request);

            // Store original setRequestHeader
            const originalSetRequestHeader = xhr.setRequestHeader;
            xhr.setRequestHeader = function (name, value) {
                request.headers[name] = value;
                return originalSetRequestHeader.apply(xhr, arguments);
            };

            // Listen for load event
            xhr.addEventListener('load', function () {
                request.endTime = Date.now();
                request.duration = request.endTime - request.startTime;
                request.status = xhr.status;
                request.statusText = xhr.statusText;
                request.responseType = xhr.getResponseHeader('content-type');

                // Get response
                if (xhr.responseType === 'json') {
                    request.response = xhr.response;
                } else if (
                    xhr.responseType === '' ||
                    xhr.responseType === 'text'
                ) {
                    request.response = xhr.responseText;
                } else {
                    request.response = `[${xhr.responseType} data]`;
                }

                // Get response size
                const contentLength = xhr.getResponseHeader('content-length');
                if (contentLength) {
                    request.responseSize = parseInt(contentLength, 10);
                } else if (typeof request.response === 'string') {
                    request.responseSize = new Blob([request.response]).size;
                }

                if (self.interceptCallback) self.interceptCallback(request);
            });

            // Listen for error event
            xhr.addEventListener('error', function () {
                request.endTime = Date.now();
                request.duration = request.endTime - request.startTime;
                request.error = 'Network error';

                if (self.interceptCallback) self.interceptCallback(request);
            });

            // Listen for abort event
            xhr.addEventListener('abort', function () {
                request.endTime = Date.now();
                request.duration = request.endTime - request.startTime;
                request.error = 'Request aborted';

                if (self.interceptCallback) self.interceptCallback(request);
            });

            // Listen for timeout event
            xhr.addEventListener('timeout', function () {
                request.endTime = Date.now();
                request.duration = request.endTime - request.startTime;
                request.error = 'Request timeout';

                if (self.interceptCallback) self.interceptCallback(request);
            });

            if (self.interceptCallback) self.interceptCallback(request);
            return self.originalXHR.apply(xhr, arguments);
        };
    }

    /**
     * Generate a unique ID for requests
     * @private
     * @returns {string} Unique ID
     */
    _generateId() {
        return (
            Date.now().toString(36) + Math.random().toString(36).substring(2)
        );
    }
}
