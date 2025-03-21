# Web Debugger Extension

A comprehensive browser extension for web development debugging, featuring:

-   Modern UI with Catpuccin theme support
-   Dedicated debugging interface that runs in its own window
-   Modular architecture for extensibility
-   Tab selection and management
-   Dockable interface

## Architecture

Web Debugger uses an extension page approach with these main components:

1. **Background Script**: Manages communication and extension state
2. **Popup UI**: Provides quick access to open the debugger and change settings
3. **Debugger Page**: Full-featured interface for debugging web pages

This architecture avoids content script injection issues by running the debugger interface in a separate extension window that communicates with the target page through Chrome APIs.

## Features

-   **Tab Selection**: Debug any open tab from a single interface
-   **Theme Support**: Light and dark themes with consistent styling
-   **Dockable Interface**: Position the debugger as a side panel or floating window
-   **Tab-Based UI**: Organized debugging tools (Inspector, Console, Network, Settings)

## Development Setup

```bash
# Install dependencies
npm install

# Build the extension
npm run build

# Load the extension in Chrome
# 1. Open chrome://extensions/
# 2. Enable Developer Mode
# 3. Click "Load unpacked" and select the dist/ directory
```

## Project Structure

-   `src/extension/`: Extension-specific code (background, popup, debugger)
-   `src/core/`: Core functionality and API
-   `src/ui/`: UI components and theme system
-   `src/modules/`: Feature modules and tools
-   `src/utils/`: Utility functions

## Current Status

This project is currently in active development. The extension page architecture is working, with tab targeting and basic UI functionality implemented. Next steps include implementing the actual debugging tools like DOM inspection and console functionality.

## Documentation

For detailed development notes and architectural decisions, see:

-   [Development Notes](docs/development-notes.md)
-   [Changelog](CHANGELOG.md)
