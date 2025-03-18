/**
 * Layout Visualizer Tool
 * Visualizes CSS grid and flexbox layouts on the page
 */
import { BaseTool } from './base-tool.js';
import { DOMUtils } from '../utils/dom-utils.js';

export class LayoutVisualizer extends BaseTool {
    constructor(container, themeManager, storageManager) {
        super(container, themeManager, storageManager);

        this.name = 'Layout Visualizer';
        this.icon = 'layoutVisualizer';
        this.description = 'Visualize CSS grid and flexbox layouts';

        this.gridElements = [];
        this.flexElements = [];
        this.activeOverlays = [];
        this.currentElement = null;
        this.isPicking = false;
    }

    init() {
        super.init();
        this.render();
        return this;
    }

    render() {
        const panel = document.createElement('div');
        panel.className = 'dev-overlay-tool layout-visualizer-tool';

        // Header
        const header = document.createElement('div');
        header.className = 'tool-header';

        const title = document.createElement('h3');
        title.textContent = this.name;
        header.appendChild(title);

        panel.appendChild(header);

        // Main content
        const content = document.createElement('div');
        content.className = 'tool-content';

        // Controls
        const controls = document.createElement('div');
        controls.className = 'layout-controls';

        // Scan button
        const scanButton = document.createElement('button');
        scanButton.textContent = 'Scan Page Layouts';
        scanButton.addEventListener('click', () => this.scanPageLayouts());
        controls.appendChild(scanButton);

        // Element picker button
        const pickerButton = document.createElement('button');
        pickerButton.textContent = 'Pick Element';
        pickerButton.addEventListener('click', () =>
            this.toggleElementPicker()
        );
        controls.appendChild(pickerButton);
        this.pickerButton = pickerButton;

        content.appendChild(controls);

        // Layout display tabs
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'layout-tabs';

        const gridTab = document.createElement('button');
        gridTab.className = 'tab-button active';
        gridTab.textContent = 'Grid Layouts';
        gridTab.addEventListener('click', () => this.showTab('grid', gridTab));

        const flexTab = document.createElement('button');
        flexTab.className = 'tab-button';
        flexTab.textContent = 'Flex Layouts';
        flexTab.addEventListener('click', () => this.showTab('flex', flexTab));

        tabsContainer.appendChild(gridTab);
        tabsContainer.appendChild(flexTab);
        content.appendChild(tabsContainer);

        // Layout lists container
        const layoutsContainer = document.createElement('div');
        layoutsContainer.className = 'layouts-container';

        // Grid layouts list
        const gridList = document.createElement('div');
        gridList.className = 'layout-list grid-layout-list active';
        gridList.innerHTML =
            '<div class="empty-state">Scan the page to find grid layouts</div>';
        layoutsContainer.appendChild(gridList);
        this.gridList = gridList;

        // Flex layouts list
        const flexList = document.createElement('div');
        flexList.className = 'layout-list flex-layout-list';
        flexList.innerHTML =
            '<div class="empty-state">Scan the page to find flex layouts</div>';
        layoutsContainer.appendChild(flexList);
        this.flexList = flexList;

        content.appendChild(layoutsContainer);

        // Details pane
        const detailsPane = document.createElement('div');
        detailsPane.className = 'layout-details';
        detailsPane.innerHTML =
            '<div class="empty-state">Select a layout to see details</div>';
        content.appendChild(detailsPane);
        this.detailsPane = detailsPane;

        panel.appendChild(content);
        this.container.appendChild(panel);
        this.panel = panel;

        return this;
    }

    /**
     * Show the specified tab and hide others
     * @param {string} tabName - Name of the tab to show ('grid' or 'flex')
     * @param {HTMLElement} activeTab - The active tab button
     */
    showTab(tabName, activeTab) {
        // Update tab buttons
        const tabButtons = this.panel.querySelectorAll('.tab-button');
        tabButtons.forEach((button) => button.classList.remove('active'));
        activeTab.classList.add('active');

        // Update content visibility
        this.gridList.classList.toggle('active', tabName === 'grid');
        this.flexList.classList.toggle('active', tabName === 'flex');
    }

    /**
     * Scan the page for grid and flex layouts
     */
    scanPageLayouts() {
        // Clear previous results
        this.gridElements = [];
        this.flexElements = [];

        // Get all elements
        const elements = document.querySelectorAll('body *');

        // Process each element
        elements.forEach((element) => {
            if (!DOMUtils.isVisible(element)) return;

            const style = window.getComputedStyle(element);

            // Check for grid
            if (DOMUtils.hasGrid(element)) {
                this.gridElements.push({
                    element,
                    info: DOMUtils.getGridInfo(element),
                });
            }

            // Check for flex
            if (DOMUtils.hasFlex(element)) {
                this.flexElements.push({
                    element,
                    info: DOMUtils.getFlexInfo(element),
                });
            }
        });

        // Update the UI
        this.updateLayoutLists();
    }

    /**
     * Update the layout lists with the found elements
     */
    updateLayoutLists() {
        // Update grid list
        this.gridList.innerHTML = '';

        if (this.gridElements.length === 0) {
            this.gridList.innerHTML =
                '<div class="empty-state">No grid layouts found</div>';
        } else {
            this.gridElements.forEach((item, index) => {
                const listItem = this.createLayoutListItem(
                    item.element,
                    'grid',
                    index
                );
                this.gridList.appendChild(listItem);
            });
        }

        // Update flex list
        this.flexList.innerHTML = '';

        if (this.flexElements.length === 0) {
            this.flexList.innerHTML =
                '<div class="empty-state">No flex layouts found</div>';
        } else {
            this.flexElements.forEach((item, index) => {
                const listItem = this.createLayoutListItem(
                    item.element,
                    'flex',
                    index
                );
                this.flexList.appendChild(listItem);
            });
        }
    }

    /**
     * Create a list item for a layout element
     * @param {HTMLElement} element - The element
     * @param {string} type - Type of layout ('grid' or 'flex')
     * @param {number} index - Index in the respective array
     * @returns {HTMLElement} The list item element
     */
    createLayoutListItem(element, type, index) {
        const listItem = document.createElement('div');
        listItem.className = 'layout-list-item';

        // Try to get a description of the element
        let description = this.getElementDescription(element);

        // Create content
        listItem.innerHTML = `
            <div class="layout-item-tag">${element.tagName.toLowerCase()}</div>
            <div class="layout-item-desc">${description}</div>
        `;

        // Add hover handlers
        listItem.addEventListener('mouseenter', () => {
            this.highlightElement(element);
        });

        listItem.addEventListener('mouseleave', () => {
            this.removeHighlights();
        });

        // Add click handler
        listItem.addEventListener('click', () => {
            this.selectLayout(type, index);

            // Update selected state in UI
            this.panel.querySelectorAll('.layout-list-item').forEach((item) => {
                item.classList.remove('selected');
            });
            listItem.classList.add('selected');
        });

        return listItem;
    }

    /**
     * Get a description of an element
     * @param {HTMLElement} element - The element to describe
     * @returns {string} A description of the element
     */
    getElementDescription(element) {
        // Try to get an ID
        if (element.id) {
            return `#${element.id}`;
        }

        // Try to get a class
        if (element.className && typeof element.className === 'string') {
            const classes = element.className
                .split(' ')
                .filter((c) => c.trim() !== '');
            if (classes.length > 0) {
                return `.${classes[0]}${classes.length > 1 ? ' ...' : ''}`;
            }
        }

        // Get text content as a last resort
        const text = element.textContent?.trim() || '';
        if (text.length > 0) {
            return text.length > 30 ? text.substring(0, 30) + '...' : text;
        }

        // No good description available
        return '<element>';
    }

    /**
     * Highlight an element on the page
     * @param {HTMLElement} element - The element to highlight
     */
    highlightElement(element) {
        this.removeHighlights();

        if (!element || !document.body.contains(element)) return;

        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const overlay = document.createElement('div');
        overlay.className = 'layout-highlight-overlay';
        overlay.style.top = `${rect.top + window.scrollY}px`;
        overlay.style.left = `${rect.left + window.scrollX}px`;
        overlay.style.width = `${rect.width}px`;
        overlay.style.height = `${rect.height}px`;

        document.body.appendChild(overlay);
        this.activeOverlays.push(overlay);
    }

    /**
     * Remove all highlights
     */
    removeHighlights() {
        this.activeOverlays.forEach((overlay) => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        });

        this.activeOverlays = [];
    }

    /**
     * Select a layout and show its details
     * @param {string} type - Type of layout ('grid' or 'flex')
     * @param {number} index - Index in the respective array
     */
    selectLayout(type, index) {
        this.currentElement =
            type === 'grid'
                ? this.gridElements[index]
                : this.flexElements[index];

        if (!this.currentElement) return;

        this.showLayoutDetails(type);
    }

    /**
     * Show details for the selected layout
     * @param {string} type - Type of layout ('grid' or 'flex')
     */
    showLayoutDetails(type) {
        if (!this.currentElement) {
            this.detailsPane.innerHTML =
                '<div class="empty-state">Select a layout to see details</div>';
            return;
        }

        const element = this.currentElement.element;
        const info = this.currentElement.info;

        this.detailsPane.innerHTML = '';

        // Create details header
        const header = document.createElement('div');
        header.className = 'details-header';
        header.innerHTML = `
            <h4>${element.tagName.toLowerCase()} ${type.toUpperCase()} Layout</h4>
            <div class="element-path">${this.getElementPath(element)}</div>
        `;
        this.detailsPane.appendChild(header);

        // Create visualizer button
        const visualizeButton = document.createElement('button');
        visualizeButton.className = 'visualize-button';
        visualizeButton.textContent = `Visualize ${type.toUpperCase()}`;
        visualizeButton.addEventListener('click', () => {
            if (type === 'grid') {
                this.visualizeGrid(element, info);
            } else {
                this.visualizeFlex(element, info);
            }
        });
        this.detailsPane.appendChild(visualizeButton);

        // Create properties list
        const propsList = document.createElement('div');
        propsList.className = 'layout-properties';

        if (type === 'grid') {
            // Grid properties
            propsList.innerHTML = `
                <div class="property">
                    <div class="property-name">Display</div>
                    <div class="property-value">${info.display}</div>
                </div>
                <div class="property">
                    <div class="property-name">Grid Template Columns</div>
                    <div class="property-value">${
                        info.gridTemplateColumns || 'none'
                    }</div>
                </div>
                <div class="property">
                    <div class="property-name">Grid Template Rows</div>
                    <div class="property-value">${
                        info.gridTemplateRows || 'none'
                    }</div>
                </div>
                <div class="property">
                    <div class="property-name">Grid Gap</div>
                    <div class="property-value">${info.gridGap || 'none'}</div>
                </div>
                <div class="property">
                    <div class="property-name">Grid Items</div>
                    <div class="property-value">${info.gridItems} items</div>
                </div>
            `;
        } else {
            // Flex properties
            propsList.innerHTML = `
                <div class="property">
                    <div class="property-name">Display</div>
                    <div class="property-value">${info.display}</div>
                </div>
                <div class="property">
                    <div class="property-name">Flex Direction</div>
                    <div class="property-value">${info.flexDirection}</div>
                </div>
                <div class="property">
                    <div class="property-name">Justify Content</div>
                    <div class="property-value">${info.justifyContent}</div>
                </div>
                <div class="property">
                    <div class="property-name">Align Items</div>
                    <div class="property-value">${info.alignItems}</div>
                </div>
                <div class="property">
                    <div class="property-name">Flex Wrap</div>
                    <div class="property-value">${info.flexWrap}</div>
                </div>
                <div class="property">
                    <div class="property-name">Flex Items</div>
                    <div class="property-value">${info.children} items</div>
                </div>
            `;
        }

        this.detailsPane.appendChild(propsList);
    }

    /**
     * Get a CSS selector path for an element
     * @param {HTMLElement} element - The element
     * @returns {string} The element path
     */
    getElementPath(element) {
        let path = '';
        let current = element;

        while (current && current !== document.body) {
            let selector = current.tagName.toLowerCase();

            if (current.id) {
                selector += `#${current.id}`;
            } else if (
                current.className &&
                typeof current.className === 'string'
            ) {
                const classes = current.className
                    .split(' ')
                    .filter((c) => c.trim() !== '')
                    .map((c) => `.${c}`)
                    .join('');

                if (classes) {
                    selector += classes;
                }
            }

            path = path ? `${selector} > ${path}` : selector;
            current = current.parentElement;
        }

        return path;
    }

    /**
     * Visualize a grid layout
     * @param {HTMLElement} element - The grid element
     * @param {Object} info - Grid information
     */
    visualizeGrid(element, info) {
        this.removeVisualizations();

        if (!element || !document.body.contains(element)) return;

        // Create grid overlay
        const rect = element.getBoundingClientRect();
        const overlay = document.createElement('div');
        overlay.className = 'grid-visualization-overlay';
        overlay.style.top = `${rect.top + window.scrollY}px`;
        overlay.style.left = `${rect.left + window.scrollX}px`;
        overlay.style.width = `${rect.width}px`;
        overlay.style.height = `${rect.height}px`;

        // Add close button
        const closeButton = document.createElement('button');
        closeButton.className = 'close-visualization-button';
        closeButton.textContent = '✕';
        closeButton.addEventListener('click', () =>
            this.removeVisualizations()
        );
        overlay.appendChild(closeButton);

        // Create grid lines
        if (info.gridTemplateColumns) {
            this.createGridColumnLines(overlay, info);
        }

        if (info.gridTemplateRows) {
            this.createGridRowLines(overlay, info);
        }

        // Add grid areas for each item
        const children = element.children;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const childRect = child.getBoundingClientRect();

            // Skip items that are not visible
            if (childRect.width === 0 || childRect.height === 0) continue;

            const itemOverlay = document.createElement('div');
            itemOverlay.className = 'grid-item-overlay';
            itemOverlay.style.top = `${childRect.top - rect.top}px`;
            itemOverlay.style.left = `${childRect.left - rect.left}px`;
            itemOverlay.style.width = `${childRect.width}px`;
            itemOverlay.style.height = `${childRect.height}px`;

            // Add item info
            const style = window.getComputedStyle(child);
            const gridColumn = style.gridColumn;
            const gridRow = style.gridRow;

            const itemInfo = document.createElement('div');
            itemInfo.className = 'grid-item-info';
            itemInfo.innerHTML = `
                <div>Column: ${gridColumn || 'auto'}</div>
                <div>Row: ${gridRow || 'auto'}</div>
            `;

            itemOverlay.appendChild(itemInfo);
            overlay.appendChild(itemOverlay);
        }

        document.body.appendChild(overlay);
        this.activeVisualizations = [overlay];
    }

    /**
     * Create grid column lines visualization
     * @param {HTMLElement} overlay - The grid overlay element
     * @param {Object} info - Grid information
     */
    createGridColumnLines(overlay, info) {
        const columns = info.gridTemplateColumns.split(' ');
        let position = 0;

        columns.forEach((column, index) => {
            // Create column line
            const line = document.createElement('div');
            line.className = 'grid-line grid-column-line';
            line.style.left = `${position}px`;
            line.style.height = '100%';

            // Add column number
            const label = document.createElement('div');
            label.className = 'grid-line-label';
            label.textContent = index + 1;
            line.appendChild(label);

            overlay.appendChild(line);

            // Calculate next position
            // Note: This is a simplification; actual sizing would need to parse and calculate values
            position += parseFloat(column) || 0;
        });

        // Add final line
        const finalLine = document.createElement('div');
        finalLine.className = 'grid-line grid-column-line';
        finalLine.style.left = `100%`;
        finalLine.style.height = '100%';

        const finalLabel = document.createElement('div');
        finalLabel.className = 'grid-line-label';
        finalLabel.textContent = columns.length + 1;
        finalLine.appendChild(finalLabel);

        overlay.appendChild(finalLine);
    }

    /**
     * Create grid row lines visualization
     * @param {HTMLElement} overlay - The grid overlay element
     * @param {Object} info - Grid information
     */
    createGridRowLines(overlay, info) {
        const rows = info.gridTemplateRows.split(' ');
        let position = 0;

        rows.forEach((row, index) => {
            // Create row line
            const line = document.createElement('div');
            line.className = 'grid-line grid-row-line';
            line.style.top = `${position}px`;
            line.style.width = '100%';

            // Add row number
            const label = document.createElement('div');
            label.className = 'grid-line-label';
            label.textContent = index + 1;
            line.appendChild(label);

            overlay.appendChild(line);

            // Calculate next position
            // Note: This is a simplification; actual sizing would need to parse and calculate values
            position += parseFloat(row) || 0;
        });

        // Add final line
        const finalLine = document.createElement('div');
        finalLine.className = 'grid-line grid-row-line';
        finalLine.style.top = `100%`;
        finalLine.style.width = '100%';

        const finalLabel = document.createElement('div');
        finalLabel.className = 'grid-line-label';
        finalLabel.textContent = rows.length + 1;
        finalLine.appendChild(finalLabel);

        overlay.appendChild(finalLine);
    }

    /**
     * Visualize a flex layout
     * @param {HTMLElement} element - The flex element
     * @param {Object} info - Flex information
     */
    visualizeFlex(element, info) {
        this.removeVisualizations();

        if (!element || !document.body.contains(element)) return;

        // Create flex overlay
        const rect = element.getBoundingClientRect();
        const overlay = document.createElement('div');
        overlay.className = 'flex-visualization-overlay';
        overlay.style.top = `${rect.top + window.scrollY}px`;
        overlay.style.left = `${rect.left + window.scrollX}px`;
        overlay.style.width = `${rect.width}px`;
        overlay.style.height = `${rect.height}px`;

        // Add close button
        const closeButton = document.createElement('button');
        closeButton.className = 'close-visualization-button';
        closeButton.textContent = '✕';
        closeButton.addEventListener('click', () =>
            this.removeVisualizations()
        );
        overlay.appendChild(closeButton);

        // Add flex direction arrow
        const directionArrow = document.createElement('div');
        directionArrow.className = `flex-direction-arrow ${info.flexDirection}`;
        overlay.appendChild(directionArrow);

        // Add flex info
        const flexInfo = document.createElement('div');
        flexInfo.className = 'flex-info';
        flexInfo.innerHTML = `
            <div>Direction: ${info.flexDirection}</div>
            <div>Justify: ${info.justifyContent}</div>
            <div>Align: ${info.alignItems}</div>
        `;
        overlay.appendChild(flexInfo);

        // Add flex items
        const children = element.children;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const childRect = child.getBoundingClientRect();

            // Skip items that are not visible
            if (childRect.width === 0 || childRect.height === 0) continue;

            const itemOverlay = document.createElement('div');
            itemOverlay.className = 'flex-item-overlay';
            itemOverlay.style.top = `${childRect.top - rect.top}px`;
            itemOverlay.style.left = `${childRect.left - rect.left}px`;
            itemOverlay.style.width = `${childRect.width}px`;
            itemOverlay.style.height = `${childRect.height}px`;

            // Add item info
            const style = window.getComputedStyle(child);

            const itemInfo = document.createElement('div');
            itemInfo.className = 'flex-item-info';
            itemInfo.innerHTML = `
                <div>Order: ${style.order || '0'}</div>
                <div>Flex: ${style.flex || 'none'}</div>
                <div>Align: ${style.alignSelf || 'auto'}</div>
            `;

            itemOverlay.appendChild(itemInfo);
            overlay.appendChild(itemOverlay);
        }

        document.body.appendChild(overlay);
        this.activeVisualizations = [overlay];
    }

    /**
     * Remove all visualizations
     */
    removeVisualizations() {
        if (this.activeVisualizations) {
            this.activeVisualizations.forEach((overlay) => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            });

            this.activeVisualizations = [];
        }
    }

    /**
     * Toggle the element picker on/off
     */
    toggleElementPicker() {
        if (this.isPicking) {
            this.stopPicker();
        } else {
            this.startPicker();
        }
    }

    /**
     * Start the element picker
     */
    startPicker() {
        this.isPicking = true;
        document.body.classList.add('dev-element-picking');
        this.pickerButton.textContent = 'Cancel Picking';

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'element-picker-overlay';
        document.body.appendChild(overlay);
        this.pickerOverlay = overlay;

        // Add event listeners
        this.mouseMoveHandler = this.handlePickerMouseMove.bind(this);
        this.mouseClickHandler = this.handlePickerMouseClick.bind(this);
        this.keyDownHandler = this.handlePickerKeyDown.bind(this);

        document.addEventListener('mousemove', this.mouseMoveHandler);
        document.addEventListener('click', this.mouseClickHandler);
        document.addEventListener('keydown', this.keyDownHandler);
    }

    /**
     * Stop the element picker
     */
    stopPicker() {
        this.isPicking = false;
        document.body.classList.remove('dev-element-picking');
        this.pickerButton.textContent = 'Pick Element';

        // Remove overlay
        if (this.pickerOverlay && this.pickerOverlay.parentNode) {
            this.pickerOverlay.parentNode.removeChild(this.pickerOverlay);
        }
        this.pickerOverlay = null;

        // Remove event listeners
        document.removeEventListener('mousemove', this.mouseMoveHandler);
        document.removeEventListener('click', this.mouseClickHandler);
        document.removeEventListener('keydown', this.keyDownHandler);

        this.mouseMoveHandler = null;
        this.mouseClickHandler = null;
        this.keyDownHandler = null;
    }

    /**
     * Handle mouse move during element picking
     * @param {MouseEvent} e - Mouse event
     */
    handlePickerMouseMove(e) {
        if (!this.isPicking) return;

        const x = e.clientX;
        const y = e.clientY;

        // Get element under cursor
        const element = document.elementFromPoint(x, y);
        if (!element) return;

        // Skip dev overlay elements
        if (element.closest('.dev-overlay') || element === this.pickerOverlay)
            return;

        // Check if element has grid or flex
        const hasGrid = DOMUtils.hasGrid(element);
        const hasFlex = DOMUtils.hasFlex(element);

        // Only highlight grid/flex elements
        if (hasGrid || hasFlex) {
            // Update overlay
            const rect = element.getBoundingClientRect();
            this.pickerOverlay.style.top = `${rect.top}px`;
            this.pickerOverlay.style.left = `${rect.left}px`;
            this.pickerOverlay.style.width = `${rect.width}px`;
            this.pickerOverlay.style.height = `${rect.height}px`;

            // Add indicator of layout type
            this.pickerOverlay.setAttribute(
                'data-layout',
                hasGrid ? 'grid' : 'flex'
            );
        } else {
            // Hide overlay
            this.pickerOverlay.style.top = '-9999px';
            this.pickerOverlay.style.left = '-9999px';
            this.pickerOverlay.removeAttribute('data-layout');
        }
    }

    /**
     * Handle mouse click during element picking
     * @param {MouseEvent} e - Mouse event
     */
    handlePickerMouseClick(e) {
        if (!this.isPicking) return;

        e.preventDefault();
        e.stopPropagation();

        const element = document.elementFromPoint(e.clientX, e.clientY);
        if (!element) return;

        // Skip dev overlay elements
        if (element.closest('.dev-overlay') || element === this.pickerOverlay)
            return;

        // Check if element has grid or flex
        const hasGrid = DOMUtils.hasGrid(element);
        const hasFlex = DOMUtils.hasFlex(element);

        if (hasGrid || hasFlex) {
            // Analyze the element
            this.analyzePickedElement(element, hasGrid ? 'grid' : 'flex');
        }

        // Stop picker
        this.stopPicker();
    }

    /**
     * Handle key down during element picking
     * @param {KeyboardEvent} e - Keyboard event
     */
    handlePickerKeyDown(e) {
        if (!this.isPicking) return;

        if (e.key === 'Escape') {
            e.preventDefault();
            this.stopPicker();
        }
    }

    /**
     * Analyze a picked element
     * @param {HTMLElement} element - The element to analyze
     * @param {string} type - Layout type ('grid' or 'flex')
     */
    analyzePickedElement(element, type) {
        if (type === 'grid') {
            const info = DOMUtils.getGridInfo(element);
            this.gridElements.push({ element, info });
            this.updateLayoutLists();

            // Select the new element
            this.selectLayout('grid', this.gridElements.length - 1);

            // Show the grid tab
            const gridTab = this.panel.querySelector('.tab-button:first-child');
            this.showTab('grid', gridTab);
        } else {
            const info = DOMUtils.getFlexInfo(element);
            this.flexElements.push({ element, info });
            this.updateLayoutLists();

            // Select the new element
            this.selectLayout('flex', this.flexElements.length - 1);

            // Show the flex tab
            const flexTab = this.panel.querySelector('.tab-button:last-child');
            this.showTab('flex', flexTab);
        }
    }

    /**
     * Clean up when tool is destroyed
     */
    destroy() {
        this.removeHighlights();
        this.removeVisualizations();

        if (this.isPicking) {
            this.stopPicker();
        }

        return super.destroy();
    }
}
