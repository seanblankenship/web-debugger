# Web Debugger - Development Overlay Tool

A comprehensive, modern development overlay tool for debugging, design assessment, and development. This tool functions independently on any website while featuring cutting-edge UI/UX design and sophisticated animations.

![Web Debugger Preview](docs/images/preview.png)

## Features

### Core Capabilities

-   **Complete Isolation**: Uses Shadow DOM to avoid any conflicts with the host website's styles or scripts
-   **Premium User Experience**: Modern design with purposeful animations and micro-interactions
-   **Theme Support**: All four Catpuccin themes (Latte, Frappe, Macchiato, Mocha)
-   **Website Theme Toggle**: Adds light/dark mode toggle for the website (independent of the overlay's theme)
-   **Customizable Position & Size**: Drag to position and resize as needed
-   **Persistent Settings**: All preferences stored with namespaced localStorage

### Development Tools

-   **DOM Explorer**: Interactive tree view of the page structure with live editing
-   **Color Picker**: Advanced color tool with contrast checking and color scheme suggestions
-   **Font Inspector**: Analyze and visualize typography across the page
-   **Grid Visualizer**: Detect and display CSS grids and flexbox layouts
-   **Responsive Design Checker**: Test various screen sizes with interactive viewport resizing
-   **Local Storage Inspector**: View and edit localStorage with JSON formatting
-   **Performance Metrics**: Real-time performance monitoring dashboard
-   **Animation Timeline**: Visualize and control CSS animations
-   **Error Tracker**: Catch and analyze JavaScript errors

## Installation

### Option 1: Bookmarklet (Recommended for quick use)

1. Create a new bookmark in your browser
2. Name it "Web Debugger"
3. Paste the following code as the URL:

```
javascript:(function(){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/gh/yourusername/web-debugger@latest/dist/dev-overlay.js';document.head.appendChild(s);})();
```

### Option 2: Manual Integration

1. Download the `dev-overlay.js` file from the `/dist` directory
2. Add it to your project:

```html
<script src="path/to/dev-overlay.js"></script>
```

### Option 3: Development Setup

1. Clone this repository
2. Install dependencies:
    ```
    npm install
    ```
3. Start the development server:
    ```
    npm start
    ```
4. Build for production:
    ```
    npm run build
    ```

## Usage

1. Activate the overlay using the bookmarklet or by including the script
2. Drag the header to reposition the overlay
3. Click tool icons in the toolbar to activate various tools
4. Use the resize handle to adjust the size
5. Toggle between themes using the theme selector

### Keyboard Shortcuts

-   `Esc`: Close the overlay
-   `Ctrl+Shift+D`: Toggle visibility

## Browser Compatibility

-   Chrome 80+
-   Firefox 75+
-   Safari 13.1+
-   Edge 80+

## Contributing

Contributions are welcome! Please check out our [Contributing Guide](CONTRIBUTING.md) for details on how to get started.

### Development Setup

1. Fork the repository
2. Clone your fork
3. Install dependencies:
    ```
    npm install
    ```
4. Start the development server:
    ```
    npm start
    ```
5. Make your changes
6. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

-   [Catpuccin](https://github.com/catppuccin/catppuccin) for the beautiful color schemes
-   All the open-source libraries and tools that made this project possible
