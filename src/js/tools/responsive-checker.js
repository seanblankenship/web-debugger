/**
 * Responsive Checker Tool
 * Tests responsive design by simulating different viewport sizes
 */
import BaseTool from '../tools/base-tool.js';

export class ResponsiveChecker extends BaseTool {
    /**
     * Constructor
     * @param {Object} config - Configuration object
     * @param {Object} config.ui - UI manager
     * @param {Object} config.storage - Storage manager
     */
    constructor(config = {}) {
        super(config);

        this.name = 'Responsive Checker';
        this.icon = 'responsive';
        this.id = 'responsiveChecker';
        this.description = 'Test page at different screen sizes';

        this.devices = [
            { name: 'Mobile S', width: 320, height: 568 },
            { name: 'Mobile M', width: 375, height: 667 },
            { name: 'Mobile L', width: 425, height: 812 },
            { name: 'Tablet', width: 768, height: 1024 },
            { name: 'Laptop', width: 1024, height: 768 },
            { name: 'Laptop L', width: 1440, height: 900 },
            { name: 'Desktop', width: 1920, height: 1080 },
        ];

        this.selectedDevice = null;
        this.previewActive = false;
        this.initialized = false;
    }

    /**
     * Initialize the tool
     */
    init() {
        if (this.initialized) {
            return;
        }

        // Create panel if not already created
        if (!this.panel) {
            this.panel = document.createElement('div');
            this.panel.className = 'responsive-checker-panel panel';
        }

        this.render();
        this.initialized = true;
    }

    /**
     * Render the tool UI
     */
    render() {
        if (!this.panel) {
            this.panel = document.createElement('div');
            this.panel.className = 'responsive-checker-panel panel';
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

        // Device selection section
        const deviceSection = document.createElement('div');
        deviceSection.className = 'device-selection-section';

        const deviceTitle = document.createElement('h4');
        deviceTitle.textContent = 'Select Device';
        deviceSection.appendChild(deviceTitle);

        // Create device grid
        const deviceGrid = document.createElement('div');
        deviceGrid.className = 'device-grid';

        this.devices.forEach((device) => {
            const deviceItem = document.createElement('div');
            deviceItem.className = 'device-item';
            deviceItem.innerHTML = `
                <div class="device-name">${device.name}</div>
                <div class="device-size">${device.width} × ${device.height}</div>
            `;

            deviceItem.addEventListener('click', () => {
                this.selectDevice(device);

                // Remove selected class from all items
                const items = deviceGrid.querySelectorAll('.device-item');
                items.forEach((item) => item.classList.remove('selected'));

                // Add selected class to this item
                deviceItem.classList.add('selected');
            });

            deviceGrid.appendChild(deviceItem);
        });

        deviceSection.appendChild(deviceGrid);

        // Custom size inputs
        const customSection = document.createElement('div');
        customSection.className = 'custom-size-section';

        const customTitle = document.createElement('h4');
        customTitle.textContent = 'Custom Size';
        customSection.appendChild(customTitle);

        const customInputs = document.createElement('div');
        customInputs.className = 'custom-inputs';

        const widthInput = document.createElement('input');
        widthInput.type = 'number';
        widthInput.min = '320';
        widthInput.max = '3840';
        widthInput.placeholder = 'Width';
        widthInput.className = 'width-input';

        const heightInput = document.createElement('input');
        heightInput.type = 'number';
        heightInput.min = '240';
        heightInput.max = '2160';
        heightInput.placeholder = 'Height';
        heightInput.className = 'height-input';

        const applyButton = document.createElement('button');
        applyButton.textContent = 'Apply';
        applyButton.addEventListener('click', () => {
            const width = parseInt(widthInput.value, 10);
            const height = parseInt(heightInput.value, 10);

            if (width && height) {
                this.selectDevice({
                    name: 'Custom',
                    width,
                    height,
                });
            }
        });

        customInputs.appendChild(widthInput);
        customInputs.appendChild(heightInput);
        customInputs.appendChild(applyButton);

        customSection.appendChild(customInputs);

        // Preview controls
        const previewSection = document.createElement('div');
        previewSection.className = 'preview-section';

        const previewButton = document.createElement('button');
        previewButton.className = 'preview-button';
        previewButton.textContent = 'Start Preview';
        previewButton.addEventListener('click', () => this.togglePreview());
        this.previewButton = previewButton;

        previewSection.appendChild(previewButton);

        // Combine sections
        content.appendChild(deviceSection);
        content.appendChild(customSection);
        content.appendChild(previewSection);

        this.panel.appendChild(content);

        return this.panel;
    }

    /**
     * Activate the tool
     */
    activate() {
        if (this.isActive) return;

        super.activate();

        // Show the panel
        if (this.ui) {
            this.ui.showToolPanel(this.panel);
        }
    }

    /**
     * Deactivate the tool
     */
    deactivate() {
        if (!this.isActive) return;

        // Stop preview if active
        if (this.previewActive) {
            this.stopPreview();
        }

        super.deactivate();
    }

    /**
     * Select a device for preview
     * @param {Object} device - Device object with width and height
     */
    selectDevice(device) {
        this.selectedDevice = device;

        // Update preview if active
        if (this.previewActive) {
            this.updatePreview();
        }
    }

    /**
     * Toggle preview mode
     */
    togglePreview() {
        if (this.previewActive) {
            this.stopPreview();
        } else {
            this.startPreview();
        }
    }

    /**
     * Start preview mode
     */
    startPreview() {
        if (!this.selectedDevice) {
            // Default to first device if none selected
            this.selectedDevice = this.devices[0];
        }

        this.previewActive = true;
        this.previewButton.textContent = 'Stop Preview';

        // Create preview container
        this.createPreviewContainer();

        // Update preview with selected device
        this.updatePreview();
    }

    /**
     * Stop preview mode
     */
    stopPreview() {
        this.previewActive = false;
        this.previewButton.textContent = 'Start Preview';

        // Remove preview container
        this.removePreviewContainer();
    }

    /**
     * Create the preview container
     */
    createPreviewContainer() {
        // Remove existing container if any
        this.removePreviewContainer();

        // Create container
        const container = document.createElement('div');
        container.className = 'responsive-preview-container';

        // Create toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'preview-toolbar';

        const title = document.createElement('div');
        title.className = 'preview-title';
        title.textContent = this.selectedDevice?.name || 'Preview';
        this.previewTitle = title;

        const closeButton = document.createElement('button');
        closeButton.className = 'preview-close';
        closeButton.textContent = '×';
        closeButton.addEventListener('click', () => this.stopPreview());

        toolbar.appendChild(title);
        toolbar.appendChild(closeButton);

        // Create frame container
        const frameContainer = document.createElement('div');
        frameContainer.className = 'preview-frame-container';

        // Create iframe
        const iframe = document.createElement('iframe');
        iframe.className = 'preview-iframe';
        iframe.src = window.location.href;

        frameContainer.appendChild(iframe);

        // Add to container
        container.appendChild(toolbar);
        container.appendChild(frameContainer);

        // Add to document
        document.body.appendChild(container);

        // Store references
        this.previewContainer = container;
        this.previewFrame = iframe;
    }

    /**
     * Remove the preview container
     */
    removePreviewContainer() {
        if (this.previewContainer && this.previewContainer.parentNode) {
            this.previewContainer.parentNode.removeChild(this.previewContainer);
        }

        this.previewContainer = null;
        this.previewFrame = null;
    }

    /**
     * Update the preview with current device settings
     */
    updatePreview() {
        if (
            !this.previewActive ||
            !this.selectedDevice ||
            !this.previewContainer
        ) {
            return;
        }

        const { width, height, name } = this.selectedDevice;

        // Update title
        if (this.previewTitle) {
            this.previewTitle.textContent = `${name} - ${width} × ${height}`;
        }

        // Update iframe size
        if (this.previewFrame) {
            this.previewFrame.style.width = `${width}px`;
            this.previewFrame.style.height = `${height}px`;
        }

        // Update container size to account for toolbar height
        if (this.previewContainer) {
            const toolbarHeight =
                this.previewContainer.querySelector('.preview-toolbar')
                    ?.offsetHeight || 0;
            this.previewContainer.style.width = `${width + 40}px`; // Add padding
            this.previewContainer.style.height = `${
                height + toolbarHeight + 40
            }px`; // Add toolbar height and padding
        }
    }

    /**
     * Destroy the tool
     */
    destroy() {
        // Stop preview if active
        if (this.previewActive) {
            this.stopPreview();
        }

        return super.destroy();
    }
}
