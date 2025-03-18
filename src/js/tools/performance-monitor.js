/**
 * Performance Monitor Tool
 * Tracks and displays page performance metrics
 */
import BaseTool from '../tools/base-tool.js';

export class PerformanceMonitor extends BaseTool {
    /**
     * Create a new PerformanceMonitor
     * @param {Object} config - Configuration options
     * @param {Object} config.ui - UI manager
     * @param {Object} config.storage - Storage manager
     */
    constructor(config = {}) {
        super(config);

        this.name = 'Performance Monitor';
        this.icon = 'speedometer';
        this.id = 'performanceMonitor';
        this.description = 'Monitor page performance metrics';

        this.isMonitoring = false;
        this.metrics = {
            fps: {
                current: 0,
                min: Infinity,
                max: 0,
                avg: 0,
                samples: [],
            },
            memory: {
                current: 0,
                min: Infinity,
                max: 0,
                avg: 0,
                samples: [],
            },
            cpu: {
                current: 0,
                min: Infinity,
                max: 0,
                avg: 0,
                samples: [],
            },
            networkRequests: 0,
            domNodes: 0,
            resources: {
                total: 0,
                js: 0,
                css: 0,
                img: 0,
                other: 0,
            },
            timings: {},
        };

        this.animationFrameId = null;
        this.lastFrameTime = 0;
        this.frameCounter = 0;
        this.lastFpsUpdateTime = 0;
        this.memoryUpdateInterval = null;
        this.maxSamples = 100;
        this.gauges = {};
        this.charts = {};
        this.perfObserver = null;

        this.initialized = false;
    }

    /**
     * Initialize the tool
     */
    init() {
        if (this.initialized) {
            return;
        }

        if (!this.panel) {
            this.panel = document.createElement('div');
            this.panel.className = 'performance-monitor-panel panel';
        }

        this.render();
        this.initialized = true;
    }

    /**
     * Render the UI
     */
    render() {
        if (!this.panel) {
            this.panel = document.createElement('div');
            this.panel.className = 'performance-monitor-panel panel';
        }

        this.panel.innerHTML = '';

        // Create header
        const header = document.createElement('div');
        header.className = 'panel-header';
        header.innerHTML = `<h3>${this.name}</h3>`;
        this.panel.appendChild(header);

        // Create content
        const content = document.createElement('div');
        content.className = 'panel-content';

        // Controls
        const controls = document.createElement('div');
        controls.className = 'monitor-controls';

        const startButton = document.createElement('button');
        startButton.className = 'start-button';
        startButton.textContent = 'Start Monitoring';
        startButton.addEventListener('click', () => this.toggleMonitoring());
        controls.appendChild(startButton);
        this.startButton = startButton;

        const clearButton = document.createElement('button');
        clearButton.className = 'clear-button';
        clearButton.textContent = 'Clear Data';
        clearButton.addEventListener('click', () => this.clearMetrics());
        controls.appendChild(clearButton);

        content.appendChild(controls);

        // Metrics sections
        const metricsContainer = document.createElement('div');
        metricsContainer.className = 'metrics-container';

        // Real-time metrics
        const realTimeSection = document.createElement('div');
        realTimeSection.className = 'metrics-section real-time-section';
        realTimeSection.innerHTML = `
            <h4>Real-time Metrics</h4>
            <div class="metrics-grid">
                <div class="metric-gauge" id="fps-gauge">
                    <div class="gauge-label">FPS</div>
                    <div class="gauge-value">0</div>
                </div>
                <div class="metric-gauge" id="memory-gauge">
                    <div class="gauge-label">Memory</div>
                    <div class="gauge-value">0 MB</div>
                </div>
                <div class="metric-gauge" id="dom-nodes-gauge">
                    <div class="gauge-label">DOM Nodes</div>
                    <div class="gauge-value">0</div>
                </div>
                <div class="metric-gauge" id="network-gauge">
                    <div class="gauge-label">Requests</div>
                    <div class="gauge-value">0</div>
                </div>
            </div>
        `;
        metricsContainer.appendChild(realTimeSection);

        // Charts section
        const chartsSection = document.createElement('div');
        chartsSection.className = 'metrics-section charts-section';
        chartsSection.innerHTML = `
            <h4>Performance History</h4>
            <div class="chart-container">
                <canvas id="fps-chart" height="100"></canvas>
            </div>
            <div class="chart-container">
                <canvas id="memory-chart" height="100"></canvas>
            </div>
        `;
        metricsContainer.appendChild(chartsSection);

        // Page load metrics
        const pageLoadSection = document.createElement('div');
        pageLoadSection.className = 'metrics-section page-load-section';
        pageLoadSection.innerHTML = `
            <h4>Page Load Performance</h4>
            <div class="timing-metrics" id="timing-metrics">
                <div class="loading-message">Start monitoring to collect data...</div>
            </div>
        `;
        metricsContainer.appendChild(pageLoadSection);

        // Resource metrics
        const resourcesSection = document.createElement('div');
        resourcesSection.className = 'metrics-section resources-section';
        resourcesSection.innerHTML = `
            <h4>Resource Breakdown</h4>
            <div class="resources-metrics" id="resources-metrics">
                <div class="loading-message">Start monitoring to collect data...</div>
            </div>
        `;
        metricsContainer.appendChild(resourcesSection);

        content.appendChild(metricsContainer);
        this.panel.appendChild(content);

        // Store references to elements we'll update
        this.gauges = {
            fps: realTimeSection.querySelector('#fps-gauge .gauge-value'),
            memory: realTimeSection.querySelector('#memory-gauge .gauge-value'),
            domNodes: realTimeSection.querySelector(
                '#dom-nodes-gauge .gauge-value'
            ),
            network: realTimeSection.querySelector(
                '#network-gauge .gauge-value'
            ),
        };

        this.chartCanvases = {
            fps: chartsSection.querySelector('#fps-chart'),
            memory: chartsSection.querySelector('#memory-chart'),
        };

        this.timingMetricsContainer =
            pageLoadSection.querySelector('#timing-metrics');
        this.resourcesMetricsContainer =
            resourcesSection.querySelector('#resources-metrics');

        return this.panel;
    }

    /**
     * Activate the tool
     */
    activate() {
        if (this.isActive) return;

        super.activate();

        if (this.ui) {
            this.ui.showToolPanel(this.panel);
        }

        // Only start monitoring if it was previously monitoring
        if (this.getSetting('autoStart', false)) {
            this.startMonitoring();
        }
    }

    /**
     * Deactivate the tool
     */
    deactivate() {
        if (!this.isActive) return;

        // Store monitoring state to restore on reactivation
        this.setSetting('autoStart', this.isMonitoring);

        // Stop monitoring
        this.stopMonitoring();

        super.deactivate();
    }

    /**
     * Toggle monitoring state
     */
    toggleMonitoring() {
        if (this.isMonitoring) {
            this.stopMonitoring();
        } else {
            this.startMonitoring();
        }
    }

    /**
     * Start performance monitoring
     */
    startMonitoring() {
        if (this.isMonitoring) return;

        this.isMonitoring = true;
        this.startButton.textContent = 'Stop Monitoring';

        // Start FPS monitoring
        this.lastFrameTime = performance.now();
        this.frameCounter = 0;
        this.lastFpsUpdateTime = this.lastFrameTime;
        this.animationFrameId = requestAnimationFrame(
            this.updateFPS.bind(this)
        );

        // Start memory monitoring if available
        if (performance.memory) {
            this.memoryUpdateInterval = setInterval(() => {
                this.updateMemoryUsage();
            }, 1000);
        } else {
            this.gauges.memory.textContent = 'Not available';
        }

        // Start DOM node counting
        this.updateDOMNodeCount();

        // Set up Performance Observer for resource timing
        if (window.PerformanceObserver) {
            this.setupPerformanceObserver();
        }

        // Collect page timing metrics
        this.collectPageTimingMetrics();

        // Count existing resources
        this.collectResourceMetrics();

        // Update network request counter
        this.setupNetworkMonitoring();
    }

    /**
     * Stop performance monitoring
     */
    stopMonitoring() {
        if (!this.isMonitoring) return;

        this.isMonitoring = false;
        this.startButton.textContent = 'Start Monitoring';

        // Stop FPS monitoring
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // Stop memory monitoring
        if (this.memoryUpdateInterval) {
            clearInterval(this.memoryUpdateInterval);
            this.memoryUpdateInterval = null;
        }

        // Disconnect performance observer
        if (this.perfObserver) {
            this.perfObserver.disconnect();
            this.perfObserver = null;
        }
    }

    /**
     * Update FPS counter
     * @param {number} timestamp - Current timestamp
     */
    updateFPS(timestamp) {
        if (!this.isMonitoring) return;

        // Count this frame
        this.frameCounter++;

        // Calculate time since last update
        const elapsed = timestamp - this.lastFpsUpdateTime;

        // Update FPS every half second
        if (elapsed >= 500) {
            // Calculate FPS: frames / seconds
            const fps = Math.round((this.frameCounter * 1000) / elapsed);

            // Update metrics
            this.metrics.fps.current = fps;
            this.metrics.fps.min = Math.min(this.metrics.fps.min, fps);
            this.metrics.fps.max = Math.max(this.metrics.fps.max, fps);

            // Add to samples, keep only maxSamples
            this.metrics.fps.samples.push(fps);
            if (this.metrics.fps.samples.length > this.maxSamples) {
                this.metrics.fps.samples.shift();
            }

            // Calculate average
            const sum = this.metrics.fps.samples.reduce((a, b) => a + b, 0);
            this.metrics.fps.avg = Math.round(
                sum / this.metrics.fps.samples.length
            );

            // Update UI
            this.updateFPSDisplay();

            // Reset counters
            this.frameCounter = 0;
            this.lastFpsUpdateTime = timestamp;
        }

        // Request next frame
        this.animationFrameId = requestAnimationFrame(
            this.updateFPS.bind(this)
        );
    }

    /**
     * Update the FPS display
     */
    updateFPSDisplay() {
        const fps = this.metrics.fps.current;

        // Update gauge
        if (this.gauges.fps) {
            this.gauges.fps.textContent = fps;

            // Add color coding
            this.gauges.fps.classList.remove('good', 'warning', 'critical');
            if (fps >= 50) {
                this.gauges.fps.classList.add('good');
            } else if (fps >= 30) {
                this.gauges.fps.classList.add('warning');
            } else {
                this.gauges.fps.classList.add('critical');
            }
        }

        // Update chart if we've implemented it
        // This would typically use a charting library
    }

    /**
     * Update memory usage metrics
     */
    updateMemoryUsage() {
        if (!this.isMonitoring || !performance.memory) return;

        // Get current memory usage in MB
        const memoryUsageMB = Math.round(
            performance.memory.usedJSHeapSize / (1024 * 1024)
        );

        // Update metrics
        this.metrics.memory.current = memoryUsageMB;
        this.metrics.memory.min = Math.min(
            this.metrics.memory.min,
            memoryUsageMB
        );
        this.metrics.memory.max = Math.max(
            this.metrics.memory.max,
            memoryUsageMB
        );

        // Add to samples, keep only maxSamples
        this.metrics.memory.samples.push(memoryUsageMB);
        if (this.metrics.memory.samples.length > this.maxSamples) {
            this.metrics.memory.samples.shift();
        }

        // Calculate average
        const sum = this.metrics.memory.samples.reduce((a, b) => a + b, 0);
        this.metrics.memory.avg = Math.round(
            sum / this.metrics.memory.samples.length
        );

        // Update UI
        if (this.gauges.memory) {
            this.gauges.memory.textContent = `${memoryUsageMB} MB`;
        }

        // Update chart if we've implemented it
    }

    /**
     * Update DOM node count
     */
    updateDOMNodeCount() {
        if (!this.isMonitoring) return;

        // Count DOM nodes
        const nodeCount = document.querySelectorAll('*').length;
        this.metrics.domNodes = nodeCount;

        // Update UI
        if (this.gauges.domNodes) {
            this.gauges.domNodes.textContent = nodeCount;

            // Add color coding based on count
            this.gauges.domNodes.classList.remove(
                'good',
                'warning',
                'critical'
            );
            if (nodeCount < 1000) {
                this.gauges.domNodes.classList.add('good');
            } else if (nodeCount < 2500) {
                this.gauges.domNodes.classList.add('warning');
            } else {
                this.gauges.domNodes.classList.add('critical');
            }
        }

        // Schedule next update
        setTimeout(() => {
            if (this.isMonitoring) {
                this.updateDOMNodeCount();
            }
        }, 2000);
    }

    /**
     * Set up Performance Observer for resource timing
     */
    setupPerformanceObserver() {
        try {
            // Create a performance observer
            this.perfObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.entryType === 'resource') {
                        this.handleResourceTiming(entry);
                    } else if (entry.entryType === 'navigation') {
                        this.handleNavigationTiming(entry);
                    }
                });
            });

            // Observe resource and navigation timing
            this.perfObserver.observe({
                entryTypes: ['resource', 'navigation'],
            });
        } catch (err) {
            console.error('Performance Observer error:', err);
        }
    }

    /**
     * Handle resource timing entry
     * @param {PerformanceResourceTiming} entry - Resource timing entry
     */
    handleResourceTiming(entry) {
        // Increment overall resource count
        this.metrics.resources.total++;

        // Determine resource type
        const url = entry.name;
        if (url.match(/\.js(\?.*)?$/)) {
            this.metrics.resources.js++;
        } else if (url.match(/\.css(\?.*)?$/)) {
            this.metrics.resources.css++;
        } else if (url.match(/\.(jpe?g|png|gif|svg|webp)(\?.*)?$/)) {
            this.metrics.resources.img++;
        } else {
            this.metrics.resources.other++;
        }

        // Update network requests counter
        this.metrics.networkRequests++;
        if (this.gauges.network) {
            this.gauges.network.textContent = this.metrics.networkRequests;
        }

        // Update resource metrics display
        this.updateResourceMetricsDisplay();
    }

    /**
     * Handle navigation timing entry
     * @param {PerformanceNavigationTiming} entry - Navigation timing entry
     */
    handleNavigationTiming(entry) {
        // Save important page load metrics
        this.metrics.timings = {
            dnsLookup: Math.round(
                entry.domainLookupEnd - entry.domainLookupStart
            ),
            tcpConnect: Math.round(entry.connectEnd - entry.connectStart),
            request: Math.round(entry.responseStart - entry.requestStart),
            response: Math.round(entry.responseEnd - entry.responseStart),
            domProcessing: Math.round(entry.domComplete - entry.responseEnd),
            domInteractive: Math.round(entry.domInteractive - entry.fetchStart),
            domContentLoaded: Math.round(
                entry.domContentLoadedEventEnd - entry.fetchStart
            ),
            loadEvent: Math.round(entry.loadEventEnd - entry.fetchStart),
        };

        // Update timing metrics display
        this.updateTimingMetricsDisplay();
    }

    /**
     * Collect page timing metrics from existing performance data
     */
    collectPageTimingMetrics() {
        // Get navigation timing if available
        const navEntry = performance.getEntriesByType('navigation')[0];
        if (navEntry) {
            this.handleNavigationTiming(navEntry);
        } else {
            // Try with older Navigation Timing API
            const timing = performance.timing;
            if (timing) {
                // Convert to relative times
                this.metrics.timings = {
                    dnsLookup:
                        timing.domainLookupEnd - timing.domainLookupStart,
                    tcpConnect: timing.connectEnd - timing.connectStart,
                    request: timing.responseStart - timing.requestStart,
                    response: timing.responseEnd - timing.responseStart,
                    domProcessing: timing.domComplete - timing.responseEnd,
                    domInteractive:
                        timing.domInteractive - timing.navigationStart,
                    domContentLoaded:
                        timing.domContentLoadedEventEnd -
                        timing.navigationStart,
                    loadEvent: timing.loadEventEnd - timing.navigationStart,
                };

                this.updateTimingMetricsDisplay();
            }
        }
    }

    /**
     * Collect metrics about existing resources on the page
     */
    collectResourceMetrics() {
        // Get all resource entries
        const resources = performance.getEntriesByType('resource');

        // Reset resource metrics
        this.metrics.resources = {
            total: 0,
            js: 0,
            css: 0,
            img: 0,
            other: 0,
        };

        // Count resources by type
        resources.forEach((entry) => {
            this.metrics.resources.total++;

            const url = entry.name;
            if (url.match(/\.js(\?.*)?$/)) {
                this.metrics.resources.js++;
            } else if (url.match(/\.css(\?.*)?$/)) {
                this.metrics.resources.css++;
            } else if (url.match(/\.(jpe?g|png|gif|svg|webp)(\?.*)?$/)) {
                this.metrics.resources.img++;
            } else {
                this.metrics.resources.other++;
            }
        });

        // Set initial network request count
        this.metrics.networkRequests = this.metrics.resources.total;
        if (this.gauges.network) {
            this.gauges.network.textContent = this.metrics.networkRequests;
        }

        this.updateResourceMetricsDisplay();
    }

    /**
     * Set up monitoring for network requests
     */
    setupNetworkMonitoring() {
        // Already done with PerformanceObserver
        // This is just a stub in case we want to add more monitoring
    }

    /**
     * Update the timing metrics display
     */
    updateTimingMetricsDisplay() {
        if (!this.timingMetricsContainer) return;

        const timings = this.metrics.timings;

        // Create HTML for timing metrics
        let html = '<table class="timing-table">';
        html += '<tr><th>Phase</th><th>Time (ms)</th></tr>';

        if (timings.dnsLookup !== undefined) {
            html += `<tr><td>DNS Lookup</td><td>${timings.dnsLookup}</td></tr>`;
            html += `<tr><td>TCP Connection</td><td>${timings.tcpConnect}</td></tr>`;
            html += `<tr><td>Request</td><td>${timings.request}</td></tr>`;
            html += `<tr><td>Response</td><td>${timings.response}</td></tr>`;
            html += `<tr><td>DOM Processing</td><td>${timings.domProcessing}</td></tr>`;
            html += `<tr><td>DOM Interactive</td><td>${timings.domInteractive}</td></tr>`;
            html += `<tr><td>DOM Content Loaded</td><td>${timings.domContentLoaded}</td></tr>`;
            html += `<tr><td>Load Complete</td><td>${timings.loadEvent}</td></tr>`;
        } else {
            html += '<tr><td colspan="2">No timing data available</td></tr>';
        }

        html += '</table>';
        this.timingMetricsContainer.innerHTML = html;
    }

    /**
     * Update the resource metrics display
     */
    updateResourceMetricsDisplay() {
        if (!this.resourcesMetricsContainer) return;

        const resources = this.metrics.resources;

        // Create HTML for resource metrics
        let html = '<table class="resources-table">';
        html += '<tr><th>Resource Type</th><th>Count</th></tr>';
        html += `<tr><td>JavaScript Files</td><td>${resources.js}</td></tr>`;
        html += `<tr><td>CSS Files</td><td>${resources.css}</td></tr>`;
        html += `<tr><td>Images</td><td>${resources.img}</td></tr>`;
        html += `<tr><td>Other</td><td>${resources.other}</td></tr>`;
        html += `<tr class="total-row"><td>Total</td><td>${resources.total}</td></tr>`;
        html += '</table>';

        this.resourcesMetricsContainer.innerHTML = html;
    }

    /**
     * Clear all metrics data
     */
    clearMetrics() {
        // Reset metrics
        this.metrics = {
            fps: {
                current: 0,
                min: Infinity,
                max: 0,
                avg: 0,
                samples: [],
            },
            memory: {
                current: 0,
                min: Infinity,
                max: 0,
                avg: 0,
                samples: [],
            },
            cpu: {
                current: 0,
                min: Infinity,
                max: 0,
                avg: 0,
                samples: [],
            },
            networkRequests: 0,
            domNodes: 0,
            resources: {
                total: 0,
                js: 0,
                css: 0,
                img: 0,
                other: 0,
            },
            timings: {},
        };

        // Update UI
        this.updateFPSDisplay();
        if (this.gauges.memory) {
            this.gauges.memory.textContent = performance.memory
                ? '0 MB'
                : 'Not available';
        }
        if (this.gauges.domNodes) {
            this.gauges.domNodes.textContent = '0';
        }
        if (this.gauges.network) {
            this.gauges.network.textContent = '0';
        }

        this.timingMetricsContainer.innerHTML =
            '<div class="loading-message">Start monitoring to collect data...</div>';
        this.resourcesMetricsContainer.innerHTML =
            '<div class="loading-message">Start monitoring to collect data...</div>';
    }

    /**
     * Cleanup resources on tool destruction
     */
    destroy() {
        this.stopMonitoring();
        return super.destroy();
    }
}
