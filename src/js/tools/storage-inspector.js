/**
 * Storage Inspector Tool
 * Inspects and modifies localStorage, sessionStorage, and cookies
 */
import BaseTool from '../tools/base-tool.js';

export class StorageInspector extends BaseTool {
    /**
     * Constructor
     * @param {Object} config - Configuration object
     * @param {Object} config.ui - UI manager
     * @param {Object} config.storage - Storage manager
     */
    constructor(config = {}) {
        super(config);

        this.name = 'Storage Inspector';
        this.icon = 'storage';
        this.id = 'storageInspector';
        this.description =
            'Inspect and modify localStorage, sessionStorage, and cookies';

        this.currentStorage = 'localStorage';
        this.storageData = {};
        this.initialized = false;
    }

    /**
     * Set up the panel content
     * @returns {HTMLElement} The panel content element
     */
    setupPanel() {
        // Create panel content
        const content = document.createElement('div');
        content.className = 'storage-inspector-panel';

        // Create header
        const header = document.createElement('div');
        header.className = 'panel-header';
        header.innerHTML = `<h3>${this.name}</h3>`;
        content.appendChild(header);

        // Create content
        const panelContent = document.createElement('div');
        panelContent.className = 'panel-content';

        // Storage type selector tabs
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'storage-tabs';

        const storageTypes = ['localStorage', 'sessionStorage', 'cookies'];

        storageTypes.forEach((type) => {
            const tab = document.createElement('div');
            tab.className = `storage-tab ${
                type === this.currentStorage ? 'active' : ''
            }`;
            tab.textContent = type;

            tab.addEventListener('click', () => {
                // Update active tab
                tabsContainer
                    .querySelectorAll('.storage-tab')
                    .forEach((t) => t.classList.remove('active'));
                tab.classList.add('active');

                // Switch storage type
                this.currentStorage = type;
                this.refreshStorage();
            });

            tabsContainer.appendChild(tab);
        });

        panelContent.appendChild(tabsContainer);

        // Storage data container
        const storageContainer = document.createElement('div');
        storageContainer.className = 'storage-container';

        // Storage table
        const tableContainer = document.createElement('div');
        tableContainer.className = 'storage-table-container';

        const table = document.createElement('table');
        table.className = 'storage-table';

        const tableHead = document.createElement('thead');
        tableHead.innerHTML = `
            <tr>
                <th>Key</th>
                <th>Value</th>
                <th>Actions</th>
            </tr>
        `;

        const tableBody = document.createElement('tbody');
        tableBody.className = 'storage-table-body';

        table.appendChild(tableHead);
        table.appendChild(tableBody);
        tableContainer.appendChild(table);

        storageContainer.appendChild(tableContainer);

        // Add item form
        const addForm = document.createElement('div');
        addForm.className = 'add-item-form';

        const addTitle = document.createElement('h4');
        addTitle.textContent = 'Add New Item';
        addForm.appendChild(addTitle);

        const keyInput = document.createElement('input');
        keyInput.type = 'text';
        keyInput.placeholder = 'Key';
        keyInput.className = 'key-input';
        addForm.appendChild(keyInput);

        const valueInput = document.createElement('textarea');
        valueInput.placeholder = 'Value';
        valueInput.className = 'value-input';
        addForm.appendChild(valueInput);

        const addButton = document.createElement('button');
        addButton.textContent = 'Add Item';
        addButton.addEventListener('click', () => {
            const key = keyInput.value.trim();
            const value = valueInput.value;

            if (key) {
                this.addItem(key, value);
                keyInput.value = '';
                valueInput.value = '';
            }
        });

        addForm.appendChild(addButton);

        storageContainer.appendChild(addForm);

        // Add search and filter
        const toolsContainer = document.createElement('div');
        toolsContainer.className = 'storage-tools';

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search keys...';
        searchInput.className = 'search-input';
        searchInput.addEventListener('input', () =>
            this.filterItems(searchInput.value)
        );

        const refreshButton = document.createElement('button');
        refreshButton.textContent = 'Refresh';
        refreshButton.addEventListener('click', () => this.refreshStorage());

        const clearButton = document.createElement('button');
        clearButton.textContent = 'Clear All';
        clearButton.className = 'danger-button';
        clearButton.addEventListener('click', () => this.clearStorage());

        toolsContainer.appendChild(searchInput);
        toolsContainer.appendChild(refreshButton);
        toolsContainer.appendChild(clearButton);

        storageContainer.appendChild(toolsContainer);

        panelContent.appendChild(storageContainer);
        content.appendChild(panelContent);

        // Store references
        this.tableBody = tableBody;
        this.initialized = true;

        return content;
    }

    /**
     * Activate the tool
     */
    activate() {
        if (this.isActive) return;

        super.activate();

        // Refresh storage data
        this.refreshStorage();
    }

    /**
     * Refresh storage data
     */
    refreshStorage() {
        this.loadStorageData();
        this.renderStorageData();
    }

    /**
     * Load storage data based on current storage type
     */
    loadStorageData() {
        this.storageData = {};

        try {
            switch (this.currentStorage) {
                case 'localStorage':
                    this.loadLocalStorage();
                    break;
                case 'sessionStorage':
                    this.loadSessionStorage();
                    break;
                case 'cookies':
                    this.loadCookies();
                    break;
            }
        } catch (error) {
            console.error(`Error loading ${this.currentStorage}:`, error);
        }
    }

    /**
     * Load localStorage data
     */
    loadLocalStorage() {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            let value = localStorage.getItem(key);

            try {
                // Try to parse JSON
                const parsed = JSON.parse(value);
                value = parsed;
            } catch (e) {
                // Keep as string if not valid JSON
            }

            this.storageData[key] = {
                key,
                value,
                type: typeof value,
            };
        }
    }

    /**
     * Load sessionStorage data
     */
    loadSessionStorage() {
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            let value = sessionStorage.getItem(key);

            try {
                // Try to parse JSON
                const parsed = JSON.parse(value);
                value = parsed;
            } catch (e) {
                // Keep as string if not valid JSON
            }

            this.storageData[key] = {
                key,
                value,
                type: typeof value,
            };
        }
    }

    /**
     * Load cookies data
     */
    loadCookies() {
        const cookies = document.cookie.split(';');

        cookies.forEach((cookie) => {
            const parts = cookie.trim().split('=');
            if (parts.length >= 2) {
                const key = decodeURIComponent(parts[0]);
                let value = decodeURIComponent(parts.slice(1).join('='));

                try {
                    // Try to parse JSON
                    const parsed = JSON.parse(value);
                    value = parsed;
                } catch (e) {
                    // Keep as string if not valid JSON
                }

                this.storageData[key] = {
                    key,
                    value,
                    type: typeof value,
                    isHttpOnly: false, // Browser can't detect HttpOnly cookies
                    isSecure: document.location.protocol === 'https:',
                };
            }
        });
    }

    /**
     * Render storage data in the table
     */
    renderStorageData() {
        if (!this.tableBody) return;

        this.tableBody.innerHTML = '';

        if (Object.keys(this.storageData).length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `<td colspan="3" class="empty-message">No items found in ${this.currentStorage}</td>`;
            this.tableBody.appendChild(emptyRow);
            return;
        }

        // Sort keys alphabetically
        const sortedKeys = Object.keys(this.storageData).sort();

        sortedKeys.forEach((key) => {
            const item = this.storageData[key];
            const row = document.createElement('tr');

            // Key cell
            const keyCell = document.createElement('td');
            keyCell.className = 'key-cell';
            keyCell.textContent = item.key;

            // Value cell
            const valueCell = document.createElement('td');
            valueCell.className = 'value-cell';

            const valueDisplay = document.createElement('div');
            valueDisplay.className = 'value-display';

            if (typeof item.value === 'object' && item.value !== null) {
                valueDisplay.innerHTML = `<pre>${JSON.stringify(
                    item.value,
                    null,
                    2
                )}</pre>`;
            } else {
                valueDisplay.textContent = String(item.value);
            }

            valueCell.appendChild(valueDisplay);

            // Actions cell
            const actionsCell = document.createElement('td');
            actionsCell.className = 'actions-cell';

            const editButton = document.createElement('button');
            editButton.className = 'edit-button';
            editButton.textContent = 'Edit';
            editButton.addEventListener('click', () => this.editItem(item.key));

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-button';
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () =>
                this.deleteItem(item.key)
            );

            actionsCell.appendChild(editButton);
            actionsCell.appendChild(deleteButton);

            // Add cells to row
            row.appendChild(keyCell);
            row.appendChild(valueCell);
            row.appendChild(actionsCell);

            this.tableBody.appendChild(row);
        });
    }

    /**
     * Filter items based on search text
     * @param {string} searchText - Text to search for
     */
    filterItems(searchText) {
        if (!this.tableBody) return;

        const rows = this.tableBody.querySelectorAll('tr');
        const searchLower = searchText.toLowerCase();

        rows.forEach((row) => {
            const keyCell = row.querySelector('.key-cell');

            if (!keyCell) return;

            const key = keyCell.textContent.toLowerCase();

            if (key.includes(searchLower) || searchText === '') {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    /**
     * Add a new item to storage
     * @param {string} key - Item key
     * @param {string} value - Item value
     */
    addItem(key, value) {
        try {
            switch (this.currentStorage) {
                case 'localStorage':
                    localStorage.setItem(key, value);
                    break;
                case 'sessionStorage':
                    sessionStorage.setItem(key, value);
                    break;
                case 'cookies':
                    document.cookie = `${encodeURIComponent(
                        key
                    )}=${encodeURIComponent(value)}; path=/`;
                    break;
            }

            this.refreshStorage();
        } catch (error) {
            console.error(
                `Error adding item to ${this.currentStorage}:`,
                error
            );
            alert(`Error adding item: ${error.message}`);
        }
    }

    /**
     * Edit an existing item
     * @param {string} key - Item key
     */
    editItem(key) {
        const item = this.storageData[key];

        if (!item) return;

        const value =
            typeof item.value === 'object' && item.value !== null
                ? JSON.stringify(item.value, null, 2)
                : String(item.value);

        const newValue = prompt(`Edit value for "${key}":`, value);

        if (newValue !== null) {
            try {
                switch (this.currentStorage) {
                    case 'localStorage':
                        localStorage.setItem(key, newValue);
                        break;
                    case 'sessionStorage':
                        sessionStorage.setItem(key, newValue);
                        break;
                    case 'cookies':
                        document.cookie = `${encodeURIComponent(
                            key
                        )}=${encodeURIComponent(newValue)}; path=/`;
                        break;
                }

                this.refreshStorage();
            } catch (error) {
                console.error(
                    `Error editing item in ${this.currentStorage}:`,
                    error
                );
                alert(`Error editing item: ${error.message}`);
            }
        }
    }

    /**
     * Delete an item from storage
     * @param {string} key - Item key
     */
    deleteItem(key) {
        if (!confirm(`Are you sure you want to delete "${key}"?`)) {
            return;
        }

        try {
            switch (this.currentStorage) {
                case 'localStorage':
                    localStorage.removeItem(key);
                    break;
                case 'sessionStorage':
                    sessionStorage.removeItem(key);
                    break;
                case 'cookies':
                    document.cookie = `${encodeURIComponent(
                        key
                    )}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
                    break;
            }

            this.refreshStorage();
        } catch (error) {
            console.error(
                `Error deleting item from ${this.currentStorage}:`,
                error
            );
            alert(`Error deleting item: ${error.message}`);
        }
    }

    /**
     * Clear all items from current storage
     */
    clearStorage() {
        if (
            !confirm(
                `Are you sure you want to clear all items from ${this.currentStorage}?`
            )
        ) {
            return;
        }

        try {
            switch (this.currentStorage) {
                case 'localStorage':
                    localStorage.clear();
                    break;
                case 'sessionStorage':
                    sessionStorage.clear();
                    break;
                case 'cookies':
                    // Clear all cookies
                    document.cookie.split(';').forEach((cookie) => {
                        const key = cookie.split('=')[0].trim();
                        document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
                    });
                    break;
            }

            this.refreshStorage();
        } catch (error) {
            console.error(`Error clearing ${this.currentStorage}:`, error);
            alert(`Error clearing storage: ${error.message}`);
        }
    }

    /**
     * Destroy the tool
     */
    destroy() {
        return super.destroy();
    }
}
