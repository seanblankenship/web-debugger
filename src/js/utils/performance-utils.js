/**
 * Performance Utilities
 * Utility functions for performance monitoring and analysis
 */
export class PerformanceUtils {
    /**
     * Get current frames per second
     * @param {number} sampleSize - Number of frames to average
     * @returns {number} Current FPS
     */
    static #frameTimeHistory = [];
    static #lastTimestamp = 0;
    static #fpsUpdateCallbacks = [];
    static #isMonitoring = false;
    static #rafId = null;

    /**
     * Start FPS monitoring
     * @param {Function} callback - Optional callback function to receive FPS updates
     * @param {number} updateInterval - Interval in ms to report FPS (default: 1000)
     * @returns {boolean} Success status
     */
    static startFPSMonitoring(callback = null, updateInterval = 1000) {
        if (this.#isMonitoring) return false;

        if (callback && typeof callback === 'function') {
            this.#fpsUpdateCallbacks.push({
                callback,
                interval: updateInterval,
                lastUpdate: performance.now(),
            });
        }

        this.#isMonitoring = true;
        this.#lastTimestamp = performance.now();

        const monitorFrame = (timestamp) => {
            if (!this.#isMonitoring) return;

            const currentTime = performance.now();
            const deltaTime = currentTime - this.#lastTimestamp;
            this.#lastTimestamp = currentTime;

            // Only add frame time if we've drawn a new frame (avoid counting idle time)
            if (deltaTime > 0) {
                this.#frameTimeHistory.push(deltaTime);
            }

            // Keep a reasonable history size
            while (this.#frameTimeHistory.length > 60) {
                this.#frameTimeHistory.shift();
            }

            // Check if we need to call any callbacks
            this.#fpsUpdateCallbacks.forEach((item) => {
                if (currentTime - item.lastUpdate >= item.interval) {
                    item.callback(this.getCurrentFPS());
                    item.lastUpdate = currentTime;
                }
            });

            this.#rafId = requestAnimationFrame(monitorFrame);
        };

        this.#rafId = requestAnimationFrame(monitorFrame);
        return true;
    }

    /**
     * Stop FPS monitoring
     */
    static stopFPSMonitoring() {
        this.#isMonitoring = false;
        this.#frameTimeHistory = [];
        this.#fpsUpdateCallbacks = [];

        if (this.#rafId) {
            cancelAnimationFrame(this.#rafId);
            this.#rafId = null;
        }
    }

    /**
     * Get current FPS based on frame time history
     * @returns {number} Current FPS
     */
    static getCurrentFPS() {
        if (this.#frameTimeHistory.length === 0) return 0;

        // Calculate average frame time
        const avgFrameTime =
            this.#frameTimeHistory.reduce((sum, time) => sum + time, 0) /
            this.#frameTimeHistory.length;

        // Convert frame time to FPS
        const fps = 1000 / avgFrameTime;

        // Return rounded FPS
        return Math.round(fps);
    }

    /**
     * Creates a performance mark
     * @param {string} name - Mark name
     * @returns {void}
     */
    static mark(name) {
        if (window.performance && window.performance.mark) {
            try {
                performance.mark(name);
            } catch (e) {
                console.error(`Error creating mark "${name}":`, e);
            }
        }
    }

    /**
     * Measures time between two marks
     * @param {string} name - Measure name
     * @param {string} startMark - Start mark name
     * @param {string} endMark - End mark name
     * @returns {PerformanceMeasure|null} The measure or null if not supported
     */
    static measure(name, startMark, endMark) {
        if (window.performance && window.performance.measure) {
            try {
                return performance.measure(name, startMark, endMark);
            } catch (e) {
                console.error(`Error creating measure "${name}":`, e);
                return null;
            }
        }
        return null;
    }

    /**
     * Gets all performance entries
     * @param {string} type - Entry type (mark, measure, etc.)
     * @returns {PerformanceEntry[]} Array of performance entries
     */
    static getEntries(type = null) {
        if (window.performance && window.performance.getEntries) {
            if (type) {
                try {
                    return performance.getEntriesByType(type);
                } catch (e) {
                    return [];
                }
            } else {
                try {
                    return performance.getEntries();
                } catch (e) {
                    return [];
                }
            }
        }
        return [];
    }

    /**
     * Get page load timing metrics
     * @returns {Object} Page load timing metrics
     */
    static getPageLoadMetrics() {
        const metrics = {};

        if (window.performance && window.performance.timing) {
            const timing = performance.timing;

            // Basic timing metrics
            metrics.loadTime = timing.loadEventEnd - timing.navigationStart;
            metrics.domContentLoaded =
                timing.domContentLoadedEventEnd - timing.navigationStart;
            metrics.firstPaint = this.getFirstPaint();
            metrics.domainLookup =
                timing.domainLookupEnd - timing.domainLookupStart;
            metrics.tcpConnection = timing.connectEnd - timing.connectStart;
            metrics.serverResponse = timing.responseStart - timing.requestStart;
            metrics.pageDownload = timing.responseEnd - timing.responseStart;
            metrics.domParsing = timing.domComplete - timing.domLoading;
        } else if (window.performance && window.performance.getEntriesByType) {
            // Navigation Timing API v2
            const navEntry = performance.getEntriesByType('navigation')[0];
            if (navEntry) {
                metrics.loadTime = navEntry.loadEventEnd;
                metrics.domContentLoaded = navEntry.domContentLoadedEventEnd;
                metrics.firstPaint = this.getFirstPaint();
                metrics.domainLookup =
                    navEntry.domainLookupEnd - navEntry.domainLookupStart;
                metrics.tcpConnection =
                    navEntry.connectEnd - navEntry.connectStart;
                metrics.serverResponse =
                    navEntry.responseStart - navEntry.requestStart;
                metrics.pageDownload =
                    navEntry.responseEnd - navEntry.responseStart;
                metrics.domParsing =
                    navEntry.domComplete - navEntry.domInteractive;
            }
        }

        return metrics;
    }

    /**
     * Get first paint time
     * @returns {number} First paint time in ms
     */
    static getFirstPaint() {
        // Try to get first paint time from Performance API
        if (window.performance) {
            // Chrome/Edge: Get first paint from paint timing API
            const paintEntries = performance.getEntriesByType('paint');
            const firstPaint = paintEntries.find(
                (entry) => entry.name === 'first-paint'
            );
            if (firstPaint) {
                return firstPaint.startTime;
            }

            // Firefox/Safari fallback to navigation timing
            if (performance.timing && performance.timing.timeToFirstPaint) {
                return performance.timing.timeToFirstPaint;
            }
        }

        return 0;
    }

    /**
     * Get all resource timing data
     * @returns {Object} Object with resource timing info
     */
    static getResourceTimings() {
        if (!window.performance || !performance.getEntriesByType) {
            return [];
        }

        const resources = performance.getEntriesByType('resource');
        return resources.map((resource) => {
            return {
                name: resource.name,
                type: resource.initiatorType,
                duration: resource.duration,
                size: this.getResourceSize(resource),
                startTime: resource.startTime,
                fetchStart: resource.fetchStart,
                domainLookupStart: resource.domainLookupStart,
                domainLookupEnd: resource.domainLookupEnd,
                connectStart: resource.connectStart,
                connectEnd: resource.connectEnd,
                requestStart: resource.requestStart,
                responseStart: resource.responseStart,
                responseEnd: resource.responseEnd,
            };
        });
    }

    /**
     * Get resource size
     * @param {PerformanceResourceTiming} resource - Resource timing entry
     * @returns {number} Size in bytes
     */
    static getResourceSize(resource) {
        // Try to get size from newer properties
        if (resource.decodedBodySize) {
            return resource.decodedBodySize;
        } else if (resource.transferSize) {
            return resource.transferSize;
        } else if (resource.encodedBodySize) {
            return resource.encodedBodySize;
        }

        // Size unknown
        return 0;
    }

    /**
     * Get memory usage information
     * @returns {Object|null} Memory info or null if not available
     */
    static getMemoryInfo() {
        if (window.performance && performance.memory) {
            return {
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
            };
        }

        return null;
    }

    /**
     * Get long tasks information
     * @returns {Array} Long tasks info
     */
    static getLongTasks() {
        if (!window.PerformanceObserver || !window.PerformanceLongTaskTiming) {
            return [];
        }

        // This is just to check existing long tasks, use observer for real-time
        return performance.getEntriesByType('longtask') || [];
    }

    /**
     * Observe long tasks
     * @param {Function} callback - Callback function
     * @returns {PerformanceObserver|null} Observer instance or null if not supported
     */
    static observeLongTasks(callback) {
        if (!window.PerformanceObserver || !window.PerformanceLongTaskTiming) {
            return null;
        }

        try {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    callback(entry);
                });
            });

            observer.observe({ entryTypes: ['longtask'] });
            return observer;
        } catch (e) {
            console.error('Error observing long tasks:', e);
            return null;
        }
    }

    /**
     * Format time in milliseconds to a readable format
     * @param {number} ms - Time in milliseconds
     * @returns {string} Formatted time string
     */
    static formatTime(ms) {
        if (ms < 1) {
            return `${(ms * 1000).toFixed(2)}µs`;
        } else if (ms < 1000) {
            return `${ms.toFixed(2)}ms`;
        } else {
            return `${(ms / 1000).toFixed(2)}s`;
        }
    }

    /**
     * Format size in bytes to a readable format
     * @param {number} bytes - Size in bytes
     * @returns {string} Formatted size string
     */
    static formatSize(bytes) {
        if (bytes < 1024) {
            return `${bytes}B`;
        } else if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(2)}KB`;
        } else if (bytes < 1024 * 1024 * 1024) {
            return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
        } else {
            return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
        }
    }

    /**
     * Time a function execution
     * @param {Function} fn - Function to time
     * @param {Array} args - Arguments to pass to the function
     * @returns {Object} Object with result and timing information
     */
    static timeFunction(fn, ...args) {
        const start = performance.now();
        let result;
        let error;

        try {
            result = fn(...args);
        } catch (e) {
            error = e;
        }

        const end = performance.now();
        const duration = end - start;

        return {
            result,
            error,
            duration,
            formattedDuration: this.formatTime(duration),
        };
    }

    /**
     * Detect JavaScript errors
     * @param {Function} callback - Callback function
     * @returns {Function} Function to remove the error listener
     */
    static detectErrors(callback) {
        const errorHandler = (event) => {
            const errorInfo = {
                message: event.message || 'Unknown error',
                source: event.filename || 'Unknown source',
                lineno: event.lineno || 0,
                colno: event.colno || 0,
                error: event.error || null,
                timestamp: new Date().toISOString(),
            };

            callback(errorInfo);
        };

        window.addEventListener('error', errorHandler);

        // Return function to remove the listener
        return () => {
            window.removeEventListener('error', errorHandler);
        };
    }
}
