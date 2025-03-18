/**
 * DOM Explorer Tool
 * Interactive DOM tree visualization and inspection tool
 */
import BaseTool from '../tools/base-tool.js';
import { DOMUtils } from '../utils/dom-utils.js';

export class DOMExplorer extends BaseTool {
    /**
     * @param {Object} config - Configuration object
     * @param {HTMLElement} config.container - The container element
     * @param {Object} config.theme - Theme manager instance
     * @param {Object} config.storage - Storage manager instance
     */
    constructor(config = {}) {
        super(config);

        this.name = 'DOM Explorer';
        this.id = 'domExplorer';
        this.icon = 'dom';
        this.description =
            'Interactive DOM tree visualization and element inspector';

        this.container = config.container || document.createElement('div');

        this.treeContainer = null;
        this.detailsContainer = null;
        this.searchInput = null;
        this.pickButton = null;

        this.selectedElement = null;
        this.highlightedElement = null;
        this.highlightOverlay = null;
        this.isPickingElement = false;

        this.observingChanges = false;
        this.mutationObserver = null;

        this.expandedNodes = new Set();
        this.collapsedByDefault = this.getSetting('collapsedByDefault', true);
        this.showTextNodes = this.getSetting('showTextNodes', false);
        this.showComments = this.getSetting('showComments', false);
        this.maxDepth = this.getSetting('maxDepth', 25);
        this.highlightColor = this.getSetting('highlightColor', '#4285f4');
        this.highlightOpacity = this.getSetting('highlightOpacity', 0.3);

        this.eventListeners = [];

        // Define handlers first before binding
        this.onMouseOver = (e) => {
            if (!this.isActive) return;

            // Skip if inside the overlay
            if (this.isInsideOverlay(e.target)) return;

            this.highlightElement(e.target);
            this.highlightedElement = e.target;

            // Update tooltip
            if (this.tooltip) {
                this.updateTooltip(e.target, e.clientX, e.clientY);
                this.tooltip.style.display = 'block';
            }
        };

        this.onMouseOut = (e) => {
            if (!this.isActive) return;

            // Skip if inside the overlay
            if (this.isInsideOverlay(e.target)) return;

            this.clearHighlight();
            if (this.tooltip) {
                this.tooltip.style.display = 'none';
            }
        };

        this.onClick = (e) => {
            if (!this.isActive) return;

            // Skip if inside the overlay
            if (this.isInsideOverlay(e.target)) return;

            // Prevent default action
            e.preventDefault();
            e.stopPropagation();

            // Select element
            this.selectElement(e.target);
        };

        this.onSearch = (e) => {
            const query = e.target.value.trim().toLowerCase();

            // If empty, show all elements
            if (!query) {
                this.refreshTree();
                return;
            }

            // Search for elements matching the query
            this.searchElements(query);
        };

        // Now bind methods safely
        this._handleMouseOver = this.onMouseOver.bind(this);
        this._handleMouseOut = this.onMouseOut.bind(this);
        this._handleClick = this.onClick.bind(this);
        this._handleSearch = this.onSearch.bind(this);
    }

    /**
     * Initialize the tool
     */
    init() {
        if (this.initialized) return;

        // Call parent init
        super.init();

        // Populate the DOM tree
        this.refreshDOMTree();

        console.log('DOMExplorer: Initialized');
    }

    /**
     * Set up the panel content
     * @returns {HTMLElement} The panel content element
     */
    setupPanel() {
        // Create panel content
        const content = document.createElement('div');
        content.className = 'dom-explorer-panel';

        // Create controls section
        const controls = document.createElement('div');
        controls.className = 'dom-explorer-controls';

        // Search input
        this.searchInput = document.createElement('input');
        this.searchInput.type = 'text';
        this.searchInput.placeholder = 'Search elements (CSS selector)';
        this.searchInput.className = 'dom-search-input';
        controls.appendChild(this.searchInput);

        // Element picker button
        this.pickButton = document.createElement('button');
        this.pickButton.className = 'element-picker-button';
        this.pickButton.textContent = 'Pick Element';
        controls.appendChild(this.pickButton);

        // Options
        const options = document.createElement('div');
        options.className = 'dom-explorer-options';

        // Show text nodes
        const textNodesLabel = document.createElement('label');
        textNodesLabel.className = 'option-label';
        const textNodesCheckbox = document.createElement('input');
        textNodesCheckbox.type = 'checkbox';
        textNodesCheckbox.checked = this.showTextNodes;
        textNodesLabel.appendChild(textNodesCheckbox);
        textNodesLabel.appendChild(document.createTextNode('Show text nodes'));
        options.appendChild(textNodesLabel);

        // Show comments
        const commentsLabel = document.createElement('label');
        commentsLabel.className = 'option-label';
        const commentsCheckbox = document.createElement('input');
        commentsCheckbox.type = 'checkbox';
        commentsCheckbox.checked = this.showComments;
        commentsLabel.appendChild(commentsCheckbox);
        commentsLabel.appendChild(document.createTextNode('Show comments'));
        options.appendChild(commentsLabel);

        // Observe changes
        const observeLabel = document.createElement('label');
        observeLabel.className = 'option-label';
        const observeCheckbox = document.createElement('input');
        observeCheckbox.type = 'checkbox';
        observeCheckbox.checked = this.observingChanges;
        observeLabel.appendChild(observeCheckbox);
        observeLabel.appendChild(document.createTextNode('Observe changes'));
        options.appendChild(observeLabel);

        controls.appendChild(options);
        content.appendChild(controls);

        // Create main content area with two panes
        const mainContent = document.createElement('div');
        mainContent.className = 'dom-explorer-content';

        // Tree view pane
        this.treeContainer = document.createElement('div');
        this.treeContainer.className = 'dom-tree-container';
        mainContent.appendChild(this.treeContainer);

        // Details pane
        this.detailsContainer = document.createElement('div');
        this.detailsContainer.className = 'element-details-container';
        this.detailsContainer.innerHTML =
            '<div class="empty-state">Select an element to view details</div>';
        mainContent.appendChild(this.detailsContainer);

        content.appendChild(mainContent);

        // Add event listeners
        this.addEventListeners(content);

        return content;
    }

    /**
     * Activate the tool
     */
    activate() {
        super.activate();

        // Add event listeners for element highlighting/selection
        document.addEventListener('mouseover', this._handleMouseOver);
        document.addEventListener('mouseout', this._handleMouseOut);
        document.addEventListener('click', this._handleClick);

        // Refresh the DOM tree
        this.refreshDOMTree();
    }

    /**
     * Deactivate the tool
     */
    deactivate() {
        super.deactivate();

        // Remove event listeners
        document.removeEventListener('mouseover', this._handleMouseOver);
        document.removeEventListener('mouseout', this._handleMouseOut);
        document.removeEventListener('click', this._handleClick);

        // Clear any highlights
        this.clearHighlight();
    }

    /**
     * Refresh the DOM tree display
     */
    refreshDOMTree() {
        if (!this.treeContainer) {
            console.warn('DOM Explorer: No tree container found');
            return;
        }

        try {
            // Clear current tree
            this.treeContainer.innerHTML = '';

            // Start with document.documentElement (html)
            const rootNode = this.createNodeElement(document.documentElement);
            if (rootNode) {
                this.treeContainer.appendChild(rootNode);
            }
        } catch (error) {
            console.error('Error refreshing DOM tree:', error);
        }
    }

    /**
     * Create a DOM node element for the tree
     * @param {Node} node - The DOM node to create an element for
     * @param {number} depth - The current depth in the tree
     * @returns {HTMLElement} The created element
     */
    createNodeElement(node, depth = 0) {
        if (!node) return null;

        // Skip if we've reached max depth
        if (depth > this.maxDepth) return null;

        try {
            const container = document.createElement('div');
            container.className = 'tree-node';

            // Add indentation based on depth
            container.style.paddingLeft = `${depth * 16}px`;

            if (node.nodeType === Node.ELEMENT_NODE) {
                // Create element node representation
                const nodeName = document.createElement('span');
                nodeName.className = 'node-name';
                nodeName.textContent = node.nodeName.toLowerCase();

                // Add classes if any
                if (
                    node.className &&
                    typeof node.className === 'string' &&
                    node.className.trim()
                ) {
                    const classNames = document.createElement('span');
                    classNames.className = 'node-classes';
                    classNames.textContent =
                        '.' + node.className.trim().replace(/\s+/g, '.');
                    nodeName.appendChild(classNames);
                }

                // Add id if any
                if (node.id) {
                    const idSpan = document.createElement('span');
                    idSpan.className = 'node-id';
                    idSpan.textContent = `#${node.id}`;
                    nodeName.appendChild(idSpan);
                }

                container.appendChild(nodeName);

                // Mark if it's the selected element
                if (this.selectedElement === node) {
                    container.classList.add('selected');
                }

                // Add click handler to select this element
                container.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectNode(node);
                });

                // Create child nodes recursively if it has children and isn't collapsed
                if (node.hasChildNodes() && !this.isNodeCollapsed(node)) {
                    const childrenContainer = document.createElement('div');
                    childrenContainer.className = 'node-children';

                    Array.from(node.childNodes).forEach((childNode) => {
                        // Skip text nodes if showTextNodes is false
                        if (
                            childNode.nodeType === Node.TEXT_NODE &&
                            !this.showTextNodes
                        ) {
                            return;
                        }

                        // Skip comment nodes if showComments is false
                        if (
                            childNode.nodeType === Node.COMMENT_NODE &&
                            !this.showComments
                        ) {
                            return;
                        }

                        const childElement = this.createNodeElement(
                            childNode,
                            depth + 1
                        );
                        if (childElement) {
                            childrenContainer.appendChild(childElement);
                        }
                    });

                    if (childrenContainer.childNodes.length > 0) {
                        container.appendChild(childrenContainer);
                    }
                }
            } else if (node.nodeType === Node.TEXT_NODE) {
                // Text node
                if (node.nodeValue.trim()) {
                    const nodeValue = document.createElement('span');
                    nodeValue.className = 'node-text';
                    nodeValue.textContent = node.nodeValue.trim();
                    container.appendChild(nodeValue);
                } else {
                    return null; // Skip empty text nodes
                }
            } else if (node.nodeType === Node.COMMENT_NODE) {
                // Comment node
                const nodeValue = document.createElement('span');
                nodeValue.className = 'node-comment';
                nodeValue.textContent = `<!-- ${node.nodeValue.trim()} -->`;
                container.appendChild(nodeValue);
            }

            return container;
        } catch (error) {
            console.error('Error creating node element:', error);
            return null;
        }
    }

    /**
     * Check if a node is collapsed in the tree
     * @param {Node} node - The node to check
     * @returns {boolean} Whether the node is collapsed
     */
    isNodeCollapsed(node) {
        // Check if node has a unique identifier
        let nodeId = '';

        if (node.id) {
            nodeId = `#${node.id}`;
        } else if (node.className && typeof node.className === 'string') {
            nodeId = `.${node.className.trim().replace(/\s+/g, '.')}`;
        } else {
            // Create a path-based ID
            nodeId = this.getNodePath(node);
        }

        return this.collapsedByDefault
            ? !this.expandedNodes.has(nodeId)
            : this.expandedNodes.has(nodeId);
    }

    /**
     * Get a unique path for a node
     * @param {Node} node - The node to get a path for
     * @returns {string} A path representation of the node
     */
    getNodePath(node) {
        if (!node || !node.parentNode) return '';

        let path = '';
        let current = node;

        while (current && current.parentNode) {
            let index = 0;
            let sibling = current;

            while ((sibling = sibling.previousSibling)) {
                if (sibling.nodeType === Node.ELEMENT_NODE) {
                    index++;
                }
            }

            path = `/${current.nodeName.toLowerCase()}[${index}]${path}`;
            current = current.parentNode;
        }

        return path;
    }

    /**
     * Add event listeners
     * @param {HTMLElement} panel - Panel element
     */
    addEventListeners(panel) {
        if (!panel) {
            console.warn(
                'DOMExplorer: Cannot add event listeners to null panel'
            );
            return;
        }

        // Clear existing event listeners
        this.eventListeners.forEach(({ element, type, listener }) => {
            if (element) {
                element.removeEventListener(type, listener);
            }
        });
        this.eventListeners = [];

        // Find required elements
        const showTextNodesCheckbox = panel.querySelector(
            'input[type="checkbox"]'
        );
        const showCommentsCheckbox = panel.querySelector(
            '.option-label:nth-child(2) input'
        );
        const observeChangesCheckbox = panel.querySelector(
            '.option-label:nth-child(3) input'
        );

        // Only add listeners if elements exist
        if (this.treeContainer) {
            // Tree node click
            const treeClickListener = (e) => {
                const nodeContent = e.target.closest('.node-content');
                if (!nodeContent) return;

                const nodeElement = nodeContent.closest('.dom-tree-node');
                if (!nodeElement) return;

                // Handle expand/collapse icon click
                if (e.target.classList.contains('expand-icon')) {
                    const childrenContainer =
                        nodeElement.querySelector('.node-children');
                    if (childrenContainer) {
                        const isExpanded =
                            childrenContainer.style.display !== 'none';
                        childrenContainer.style.display = isExpanded
                            ? 'none'
                            : 'block';
                        e.target.textContent = isExpanded ? '►' : '▼';

                        // Update expanded nodes set
                        const domNode = nodeElement._domNode;
                        const nodePath = this.getNodePath(domNode);

                        if (isExpanded) {
                            this.expandedNodes.delete(nodePath);
                        } else {
                            this.expandedNodes.add(nodePath);
                        }
                    }
                    return;
                }

                // Handle node selection
                this.selectNode(nodeElement._domNode);
            };
            this.treeContainer.addEventListener('click', treeClickListener);
            this.eventListeners.push({
                element: this.treeContainer,
                type: 'click',
                listener: treeClickListener,
            });
        }

        // Search input
        if (this.searchInput) {
            const searchInputListener = (e) => {
                this.searchDOM(e.target.value);
            };
            this.searchInput.addEventListener('input', searchInputListener);
            this.eventListeners.push({
                element: this.searchInput,
                type: 'input',
                listener: searchInputListener,
            });
        }

        // Pick element button
        if (this.pickButton) {
            const pickButtonListener = (e) => {
                this.toggleElementPicker();
            };
            this.pickButton.addEventListener('click', pickButtonListener);
            this.eventListeners.push({
                element: this.pickButton,
                type: 'click',
                listener: pickButtonListener,
            });
        }

        // Toggle options
        if (showTextNodesCheckbox) {
            const showTextNodesListener = (e) => {
                this.showTextNodes = e.target.checked;
                this.saveSetting('showTextNodes', this.showTextNodes);
                this.refreshDOMTree();
            };
            showTextNodesCheckbox.addEventListener(
                'change',
                showTextNodesListener
            );
            this.eventListeners.push({
                element: showTextNodesCheckbox,
                type: 'change',
                listener: showTextNodesListener,
            });
        }

        if (showCommentsCheckbox) {
            const showCommentsListener = (e) => {
                this.showComments = e.target.checked;
                this.saveSetting('showComments', this.showComments);
                this.refreshDOMTree();
            };
            showCommentsCheckbox.addEventListener(
                'change',
                showCommentsListener
            );
            this.eventListeners.push({
                element: showCommentsCheckbox,
                type: 'change',
                listener: showCommentsListener,
            });
        }

        if (observeChangesCheckbox) {
            const observeChangesListener = (e) => {
                this.toggleMutationObserver(e.target.checked);
            };
            observeChangesCheckbox.addEventListener(
                'change',
                observeChangesListener
            );
            this.eventListeners.push({
                element: observeChangesCheckbox,
                type: 'change',
                listener: observeChangesListener,
            });
        }
    }

    /**
     * Initialize DOM mutation observer
     */
    initDOMObserver() {
        if (!window.MutationObserver) return;

        this.mutationObserver = new MutationObserver((mutations) => {
            // Debounce updates
            clearTimeout(this.refreshTimeout);
            this.refreshTimeout = setTimeout(() => {
                this.refreshDOMTree();

                // If we have a selected element, refresh its details
                if (this.selectedElement) {
                    this.selectNode(this.selectedElement);
                }
            }, 300);
        });
    }

    /**
     * Toggle DOM mutation observer
     * @param {boolean} enable - Whether to enable the observer
     */
    toggleMutationObserver(enable) {
        if (!this.mutationObserver) return;

        if (enable && !this.observingChanges) {
            this.mutationObserver.observe(document, {
                childList: true,
                attributes: true,
                characterData: true,
                subtree: true,
            });
            this.observingChanges = true;
        } else if (!enable && this.observingChanges) {
            this.mutationObserver.disconnect();
            this.observingChanges = false;
        }

        this.setSetting('observingChanges', this.observingChanges);
    }

    /**
     * Search DOM for elements matching a selector
     * @param {string} selector - CSS selector
     */
    searchDOM(selector) {
        if (!selector) {
            // Reset search
            this.treeContainer
                .querySelectorAll('.dom-tree-node')
                .forEach((node) => {
                    node.classList.remove('search-match');
                });
            return;
        }

        try {
            // Get matching elements
            const matchingElements = Array.from(
                document.querySelectorAll(selector)
            );

            // Reset previous matches
            this.treeContainer
                .querySelectorAll('.dom-tree-node')
                .forEach((node) => {
                    node.classList.remove('search-match');
                });

            // Highlight matching nodes
            this.treeContainer
                .querySelectorAll('.dom-tree-node')
                .forEach((node) => {
                    if (
                        node._domNode &&
                        matchingElements.includes(node._domNode)
                    ) {
                        node.classList.add('search-match');

                        // Ensure parent nodes are expanded
                        this.expandParents(node);
                    }
                });

            // Scroll to first match
            const firstMatch =
                this.treeContainer.querySelector('.search-match');
            if (firstMatch) {
                firstMatch.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
            }
        } catch (e) {
            console.error('Invalid selector:', e);
        }
    }

    /**
     * Expand parent nodes recursively
     * @param {HTMLElement} node - Tree node element
     */
    expandParents(node) {
        let current = node.parentNode;

        while (current) {
            if (
                current.classList &&
                current.classList.contains('node-children')
            ) {
                current.style.display = 'block';

                const parentNode = current.parentNode;
                if (parentNode && parentNode.querySelector('.expand-icon')) {
                    parentNode.querySelector('.expand-icon').textContent = '▼';

                    // Update expanded nodes set
                    if (parentNode._domNode) {
                        const nodePath = this.getNodePath(parentNode._domNode);
                        this.expandedNodes.add(nodePath);
                    }
                }
            }

            current = current.parentNode;
        }
    }

    /**
     * Toggle element picker mode
     */
    toggleElementPicker() {
        if (this.isPickingElement) {
            this.stopElementPicker();
        } else {
            this.startElementPicker();
        }
    }

    /**
     * Start element picker mode
     */
    startElementPicker() {
        if (this.isPickingElement) return;

        this.isPickingElement = true;
        this.pickButton.classList.add('active');
        this.pickButton.textContent = 'Cancel Picking';

        // Add hover listener to highlight elements
        const hoverListener = (e) => {
            e.stopPropagation();

            if (this.highlightedElement === e.target) return;

            this.removeHighlight();
            this.highlightElement(e.target);
        };

        // Add click listener to select elements
        const clickListener = (e) => {
            e.preventDefault();
            e.stopPropagation();

            this.selectNode(e.target);
            this.stopElementPicker();
        };

        document.body.addEventListener('mouseover', hoverListener, true);
        document.body.addEventListener('click', clickListener, true);

        this.pickerHoverListener = hoverListener;
        this.pickerClickListener = clickListener;
    }

    /**
     * Stop element picker mode
     */
    stopElementPicker() {
        if (!this.isPickingElement) return;

        this.isPickingElement = false;
        this.pickButton.classList.remove('active');
        this.pickButton.textContent = 'Pick Element';

        document.body.removeEventListener(
            'mouseover',
            this.pickerHoverListener,
            true
        );
        document.body.removeEventListener(
            'click',
            this.pickerClickListener,
            true
        );

        this.removeHighlight();
    }

    /**
     * Highlight an element on the page
     * @param {HTMLElement} element - The element to highlight
     */
    highlightElement(element) {
        if (
            !element ||
            element === document.body ||
            element === document.documentElement
        ) {
            return;
        }

        this.highlightedElement = element;
        this.removeHighlight();

        // Use the static DOMUtils class method correctly
        this.highlightOverlay = DOMUtils.createElementOverlay(
            element,
            this.highlightColor || 'rgba(111, 168, 220, 0.66)',
            this.highlightOpacity || 0.5
        );
    }

    /**
     * Remove highlight from an element
     */
    clearHighlight() {
        if (this.highlightedElement) {
            // Remove highlight overlay if it exists
            const overlay = document.querySelector('.dom-explorer-highlight');
            if (overlay) {
                overlay.remove();
            }

            this.highlightedElement = null;
        }
    }

    /**
     * Alias for clearHighlight for backward compatibility
     */
    removeHighlight() {
        return this.clearHighlight();
    }

    /**
     * Select a DOM node
     * @param {Node} node - DOM node to select
     */
    selectNode(node) {
        if (!node) return;

        this.selectedElement = node;
        this.displayNodeDetails(node);

        // Highlight the node in the tree
        this.treeContainer
            .querySelectorAll('.dom-tree-node')
            .forEach((treeNode) => {
                treeNode.classList.remove('selected');

                if (treeNode._domNode === node) {
                    treeNode.classList.add('selected');
                    treeNode.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                    });

                    // Ensure parent nodes are expanded
                    this.expandParents(treeNode);
                }
            });
    }

    /**
     * Display node details in the details panel
     * @param {Node} node - DOM node to display details for
     */
    displayNodeDetails(node) {
        if (!this.detailsContainer || !node) return;

        if (node.nodeType === Node.ELEMENT_NODE) {
            this.displayElementDetails(node);
        } else if (node.nodeType === Node.TEXT_NODE) {
            this.displayTextNodeDetails(node);
        } else if (node.nodeType === Node.COMMENT_NODE) {
            this.displayCommentNodeDetails(node);
        }
    }

    /**
     * Display element details
     * @param {Element} element - DOM element
     */
    displayElementDetails(element) {
        const computedStyle = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        this.detailsContainer.innerHTML = `
      <div class="details-section">
        <h3>Element Information</h3>
        <div class="detail-group">
          <div class="detail-item">
            <span class="detail-label">Tag:</span>
            <span class="detail-value">${element.tagName.toLowerCase()}</span>
          </div>
          ${
              element.id
                  ? `
            <div class="detail-item">
              <span class="detail-label">ID:</span>
              <span class="detail-value">${element.id}</span>
            </div>
          `
                  : ''
          }
          ${
              element.className
                  ? `
            <div class="detail-item">
              <span class="detail-label">Class:</span>
              <span class="detail-value">${element.className}</span>
            </div>
          `
                  : ''
          }
        </div>
      </div>
      
      <div class="details-section">
        <h3>Box Model</h3>
        <div class="box-model">
          <div class="box-margin" title="Margin">
            <div class="margin-top">${computedStyle.marginTop}</div>
            <div class="margin-right">${computedStyle.marginRight}</div>
            <div class="margin-bottom">${computedStyle.marginBottom}</div>
            <div class="margin-left">${computedStyle.marginLeft}</div>
            
            <div class="box-border" title="Border">
              <div class="border-top">${computedStyle.borderTopWidth}</div>
              <div class="border-right">${computedStyle.borderRightWidth}</div>
              <div class="border-bottom">${
                  computedStyle.borderBottomWidth
              }</div>
              <div class="border-left">${computedStyle.borderLeftWidth}</div>
              
              <div class="box-padding" title="Padding">
                <div class="padding-top">${computedStyle.paddingTop}</div>
                <div class="padding-right">${computedStyle.paddingRight}</div>
                <div class="padding-bottom">${computedStyle.paddingBottom}</div>
                <div class="padding-left">${computedStyle.paddingLeft}</div>
                
                <div class="box-content" title="Content">
                  <div class="content-info">
                    ${Math.round(rect.width)} × ${Math.round(rect.height)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="details-section">
        <h3>Attributes</h3>
        <div class="attributes-list">
          ${this.generateAttributesList(element)}
        </div>
      </div>
      
      <div class="details-section">
        <h3>Computed Style</h3>
        <div class="style-search">
          <input type="text" placeholder="Filter properties" class="style-filter">
        </div>
        <div class="computed-styles">
          ${this.generateComputedStylesList(computedStyle)}
        </div>
      </div>
      
      <div class="details-section">
        <h3>Actions</h3>
        <div class="action-buttons">
          <button class="copy-selector-btn">Copy Selector</button>
          <button class="copy-xpath-btn">Copy XPath</button>
          <button class="copy-html-btn">Copy HTML</button>
        </div>
      </div>
    `;

        // Add event listeners
        const styleFilter =
            this.detailsContainer.querySelector('.style-filter');
        styleFilter.addEventListener('input', (e) => {
            const filterText = e.target.value.toLowerCase();
            const styleItems =
                this.detailsContainer.querySelectorAll('.style-item');

            styleItems.forEach((item) => {
                const propertyName =
                    item.querySelector('.property-name').textContent;
                if (
                    filterText === '' ||
                    propertyName.toLowerCase().includes(filterText)
                ) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });

        // Add action button listeners
        this.detailsContainer
            .querySelector('.copy-selector-btn')
            .addEventListener('click', () => {
                const selector = this.generateSelector(element);
                this.copyToClipboard(selector);
            });

        this.detailsContainer
            .querySelector('.copy-xpath-btn')
            .addEventListener('click', () => {
                const xpath = this.generateXPath(element);
                this.copyToClipboard(xpath);
            });

        this.detailsContainer
            .querySelector('.copy-html-btn')
            .addEventListener('click', () => {
                const html = element.outerHTML;
                this.copyToClipboard(html);
            });
    }

    /**
     * Display text node details
     * @param {Text} textNode - DOM text node
     */
    displayTextNodeDetails(textNode) {
        const content = textNode.textContent;
        const trimmedContent = content.trim();

        this.detailsContainer.innerHTML = `
      <div class="details-section">
        <h3>Text Node</h3>
        <div class="detail-group">
          <div class="detail-item">
            <span class="detail-label">Length:</span>
            <span class="detail-value">${content.length} characters</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Whitespace only:</span>
            <span class="detail-value">${
                trimmedContent.length === 0 ? 'Yes' : 'No'
            }</span>
          </div>
        </div>
      </div>
      
      <div class="details-section">
        <h3>Content</h3>
        <div class="text-content">${escapeHTML(content)}</div>
      </div>
      
      <div class="details-section">
        <h3>Actions</h3>
        <div class="action-buttons">
          <button class="copy-text-btn">Copy Text</button>
        </div>
      </div>
    `;

        // Add action button listeners
        this.detailsContainer
            .querySelector('.copy-text-btn')
            .addEventListener('click', () => {
                this.copyToClipboard(content);
            });
    }

    /**
     * Display comment node details
     * @param {Comment} commentNode - DOM comment node
     */
    displayCommentNodeDetails(commentNode) {
        const content = commentNode.textContent;

        this.detailsContainer.innerHTML = `
      <div class="details-section">
        <h3>Comment Node</h3>
        <div class="detail-group">
          <div class="detail-item">
            <span class="detail-label">Length:</span>
            <span class="detail-value">${content.length} characters</span>
          </div>
        </div>
      </div>
      
      <div class="details-section">
        <h3>Content</h3>
        <div class="comment-content">${escapeHTML(content)}</div>
      </div>
      
      <div class="details-section">
        <h3>Actions</h3>
        <div class="action-buttons">
          <button class="copy-comment-btn">Copy Comment</button>
        </div>
      </div>
    `;

        // Add action button listeners
        this.detailsContainer
            .querySelector('.copy-comment-btn')
            .addEventListener('click', () => {
                this.copyToClipboard(`<!--${content}-->`);
            });
    }

    /**
     * Generate attributes list HTML
     * @param {Element} element - DOM element
     * @returns {string} Attributes list HTML
     */
    generateAttributesList(element) {
        if (!element.hasAttributes()) {
            return '<div class="no-attributes">No attributes</div>';
        }

        let html = '';
        for (let i = 0; i < element.attributes.length; i++) {
            const attr = element.attributes[i];
            html += `
        <div class="attribute-item">
          <span class="attribute-name">${attr.name}</span>
          <span class="attribute-value">${escapeHTML(attr.value)}</span>
        </div>
      `;
        }

        return html;
    }

    /**
     * Generate computed styles list HTML
     * @param {CSSStyleDeclaration} computedStyle - Computed style object
     * @returns {string} Computed styles list HTML
     */
    generateComputedStylesList(computedStyle) {
        let html = '';

        for (let i = 0; i < computedStyle.length; i++) {
            const property = computedStyle[i];
            const value = computedStyle.getPropertyValue(property);

            html += `
        <div class="style-item">
          <span class="property-name">${property}</span>
          <span class="property-value">${value}</span>
        </div>
      `;
        }

        return html;
    }

    /**
     * Generate a CSS selector for an element
     * @param {Element} element - DOM element
     * @returns {string} CSS selector
     */
    generateSelector(element) {
        if (!element) return '';

        // Try to create a unique selector
        let selector = element.tagName.toLowerCase();

        // Add ID if available
        if (element.id) {
            return `${selector}#${element.id}`;
        }

        // Add classes if available
        if (element.className) {
            const classes = element.className.trim().split(/\s+/);
            if (classes.length > 0 && classes[0]) {
                selector += `.${classes.join('.')}`;
            }
        }

        // If the selector is not unique, add nth-child
        const matches = document.querySelectorAll(selector);
        if (matches.length > 1) {
            const parent = element.parentNode;
            const children = parent.children;

            for (let i = 0; i < children.length; i++) {
                if (children[i] === element) {
                    selector += `:nth-child(${i + 1})`;
                    break;
                }
            }
        }

        return selector;
    }

    /**
     * Generate an XPath for an element
     * @param {Element} element - DOM element
     * @returns {string} XPath
     */
    generateXPath(element) {
        if (!element) return '';

        // Try to create a unique XPath
        let xpath = '';
        let currentElement = element;

        while (
            currentElement &&
            currentElement.nodeType === Node.ELEMENT_NODE
        ) {
            let currentPath = currentElement.tagName.toLowerCase();

            // Add ID if available
            if (currentElement.id) {
                xpath = `//${currentElement.tagName.toLowerCase()}[@id="${
                    currentElement.id
                }"]${xpath ? `/${xpath}` : ''}`;
                return xpath;
            }

            // Add position index for more specific selection
            const siblings = currentElement.parentNode
                ? Array.from(currentElement.parentNode.children).filter(
                      (node) => node.tagName === currentElement.tagName
                  )
                : [currentElement];

            if (siblings.length > 1) {
                const index = siblings.indexOf(currentElement) + 1;
                currentPath += `[${index}]`;
            }

            xpath = xpath ? `${currentPath}/${xpath}` : currentPath;

            if (currentElement === document.documentElement) {
                break;
            }

            currentElement = currentElement.parentNode;
        }

        return `/${xpath}`;
    }

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     */
    copyToClipboard(text) {
        // Temporary element for copying
        const el = document.createElement('textarea');
        el.value = text;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);

        const selection = document.getSelection();
        const selected =
            selection.rangeCount > 0 ? selection.getRangeAt(0) : false;

        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);

        if (selected) {
            selection.removeAllRanges();
            selection.addRange(selected);
        }

        // Show a success message
        this.showCopySuccessMessage();
    }

    /**
     * Show a success message after copying
     */
    showCopySuccessMessage() {
        const message = document.createElement('div');
        message.classList.add('copy-success-message');
        message.textContent = 'Copied to clipboard!';

        this.detailsContainer.appendChild(message);

        // Remove the message after animation
        setTimeout(() => {
            message.classList.add('fade-out');
            setTimeout(() => {
                message.remove();
            }, 300);
        }, 1500);
    }

    /**
     * Clean up when tool is destroyed
     */
    destroy() {
        // Remove event listeners
        this.eventListeners.forEach(({ element, type, listener }) => {
            element.removeEventListener(type, listener);
        });
        this.eventListeners = [];

        // Stop element picker if active
        if (this.isPickingElement) {
            this.stopElementPicker();
        }

        // Disconnect mutation observer
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.observingChanges = false;
        }

        // Remove highlight
        this.removeHighlight();

        // Clear references
        this.selectedElement = null;
        this.treeContainer = null;
        this.detailsContainer = null;

        super.destroy();
    }

    /**
     * Select an element for inspection
     * @param {HTMLElement} element - The element to select
     */
    selectElement(element) {
        if (!element || this.isInsideOverlay(element)) return;

        // Clear current selection
        if (this.selectedElement) {
            this.selectedElement.classList.remove('dom-explorer-selected');
        }

        // Set new selection
        this.selectedElement = element;

        // Update UI
        this.refreshDOMTree();
        this.showElementDetails(element);

        // Emit event
        this.emit('elementSelected', element);
    }

    /**
     * Show details about the selected element
     * @param {HTMLElement} element - The element to show details for
     */
    showElementDetails(element) {
        if (!this.detailsContainer || !element) return;

        // Clear existing content
        this.detailsContainer.innerHTML = '';

        try {
            // Create element details
            const tagName = document.createElement('div');
            tagName.className = 'element-tag-name';
            tagName.textContent = element.tagName.toLowerCase();
            this.detailsContainer.appendChild(tagName);

            // Add attributes
            if (element.attributes && element.attributes.length) {
                const attrContainer = document.createElement('div');
                attrContainer.className = 'element-attributes';

                for (let i = 0; i < element.attributes.length; i++) {
                    const attr = element.attributes[i];
                    const attrEl = document.createElement('div');
                    attrEl.className = 'element-attribute';
                    attrEl.innerHTML = `<span class="attr-name">${attr.name}</span>="<span class="attr-value">${attr.value}</span>"`;
                    attrContainer.appendChild(attrEl);
                }

                this.detailsContainer.appendChild(attrContainer);
            }
        } catch (error) {
            console.error('Error showing element details:', error);
        }
    }
}

/**
 * Escape HTML special characters
 * @param {string} html - HTML string
 * @returns {string} Escaped HTML
 */
function escapeHTML(html) {
    return String(html)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
