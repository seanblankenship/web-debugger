# Changelog

All notable changes to the Web Debugger project will be documented in this file.

## [Unreleased]

### Changed

-   Pivoted from a content script-based approach to an extension page approach
-   Completely redesigned architecture to use a dedicated debugger page
-   Removed dependency on Shadow DOM and content script injection
-   Simplified message passing between components

### Added

-   New debugger UI with tabbed interface (Inspector, Console, Network, Settings)
-   Tab selection and management functionality
-   Theme system with light/dark mode support
-   Dock/undock functionality for the debugger window
-   Ability to reload the target tab from the debugger

### Fixed

-   Resolved content script initialization failures
-   Fixed CSP-related issues with module loading
-   Eliminated problems with Shadow DOM isolation
-   Solved communication issues between extension components

## [0.1.0] - 2023-03-20

### Added

-   Initial project structure and setup
-   Basic popup UI with theme toggle
-   Background service worker for extension management
-   Content script architecture (now deprecated)
-   Shadow DOM-based UI approach (now deprecated)
