# Web Debugger Extension

A comprehensive browser extension for web development debugging, featuring:

-   Modern UI with theme support
-   Shadow DOM isolation from host pages
-   Modular architecture for extensibility
-   Comprehensive debugging tools

## Project Status: Work in Progress

This project is currently in early development. Working on core functionality and addressing content script initialization issues.

## Current Challenges

Currently facing issues with content script initialization and communication between background scripts and content scripts. The main error is:

```
Content script loader did not initialize properly
```

## Planned Solutions

Exploring several approaches to resolve these issues:

1. **Simplified Content Script Architecture**: Removing the multi-phase loading approach in favor of a more direct content script injection
2. **iFrame-Based Isolation**: Potential alternative to Shadow DOM for better isolation
3. **Build Configuration Improvements**: Revising Vite and TypeScript configuration for better extension support

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

-   `src/extension/`: Extension-specific code (background, content scripts, popup)
-   `src/core/`: Core functionality and API
-   `src/ui/`: UI components and theme system
-   `src/modules/`: Feature modules and tools
-   `src/utils/`: Utility functions
