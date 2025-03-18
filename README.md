# Web Debugger

A comprehensive development overlay tool for debugging and design assessment in web applications.

## Features

-   **Shadow DOM isolation** from the host page
-   **Catppuccin themes** (Latte, Frappe, Macchiato, Mocha)
-   **Multiple development tools** for various debugging tasks
-   **Responsive design** with draggable and resizable panels
-   **Modern UI/UX** with animations and intuitive controls
-   **Keyboard shortcuts** for efficient workflow

## Tools

### DOM Explorer

Explore and modify the DOM tree, view element properties, and inspect styles.

### Color Picker

Extract colors from the page with a color picker tool, view color details, and manage a color history.

### Font Inspector

Analyze typography including font families, sizes, weights, and line heights.

### Responsive Checker

Test page responsiveness with various viewport sizes and device presets.

### Storage Inspector

Browse and edit localStorage, sessionStorage, and cookies.

### Network Monitor

Track and analyze network requests made by the page.

### JS Validator

Validate JavaScript code and detect potential issues.

### CSS Validator

Check CSS code quality and detect potential problems.

### Spacing Visualizer

Visualize margins, paddings, and borders on page elements.

### Performance Monitor

Track real-time performance metrics including FPS, memory usage, and page load times.

### Accessibility Checker

Analyze the page for accessibility issues and suggest improvements.

### Settings Panel

Configure global settings for the debugger, including themes and keyboard shortcuts.

## Installation

1. Clone the repository:

    ```
    git clone https://github.com/yourusername/web-debugger.git
    cd web-debugger
    ```

2. Install dependencies:

    ```
    npm install
    ```

3. Build the project:

    ```
    npm run build
    ```

4. The built files will be available in the `dist` directory.

## Usage

### Including in a Web Page

Add the following script tag to your HTML file:

```html
<script src="path/to/dev-overlay.js"></script>
<script>
    // Initialize the debugger
    const debugger = new DevOverlay();
</script>
```

### Using as a Bookmarklet

Create a bookmark with the following URL:

```
javascript:(function(){const s=document.createElement('script');s.src='https://cdn.example.com/dev-overlay.js';document.body.appendChild(s);s.onload=function(){new DevOverlay();}})();
```

Replace `https://cdn.example.com/dev-overlay.js` with the actual URL to the script.

### Keyboard Shortcuts

-   `Alt + D`: Toggle debugger visibility
-   `Alt + M`: Minimize/restore debugger
-   `Esc`: Close active panel
-   `Alt + 1-9`: Activate tools (in order they appear in the toolbar)
-   `Alt + S`: Open settings panel

## Development

### Project Structure

```
web-debugger/
├── src/
│   ├── js/
│   │   ├── dev-overlay.js          # Main entry point
│   │   │   ├── modules/                # Core modules
│   │   │   │   ├── drag-manager.js
│   │   │   │   ├── icon-manager.js
│   │   │   │   ├── resize-manager.js
│   │   │   │   ├── storage-manager.js
│   │   │   │   ├── theme-manager.js
│   │   │   │   ├── ui-manager.js
│   │   │   │   └── keyboard-shortcuts-manager.js
│   │   │   ├── tools/                  # Debug tools
│   │   │   │   ├── base-tool.js
│   │   │   │   ├── color-picker.js
│   │   │   │   ├── css-validator.js
│   │   │   │   ├── dom-explorer.js
│   │   │   │   ├── font-inspector.js
│   │   │   │   ├── js-validator.js
│   │   │   │   ├── network-monitor.js
│   │   │   │   ├── responsive-checker.js
│   │   │   │   ├── spacing-visualizer.js
│   │   │   │   ├── storage-inspector.js
│   │   │   │   ├── performance-monitor.js
│   │   │   │   ├── accessibility-checker.js
│   │   │   │   └── settings-panel.js
│   │   │   └── utils/                  # Utility functions
│   │   │       ├── dom-utils.js
│   │   │       └── color-utils.js
│   │   └── css/
│   │       └── styles.css              # Styles (compiled from SCSS)
│   ├── dist/                           # Built files
│   ├── webpack.config.js               # Webpack configuration
│   ├── package.json                    # Project dependencies
│   └── README.md                       # Project documentation
```

### Build Commands

-   `npm run build`: Build for production
-   `npm run dev`: Build for development with watch mode

## License

MIT

## Credits

-   [Catppuccin](https://github.com/catppuccin/catppuccin) for the color themes
-   All the open source libraries and tools that made this project possible
