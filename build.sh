#!/bin/bash

# Build script for Web Debugger extension

# Run TypeScript compiler
echo "Compiling TypeScript..."
npx tsc

# Build with Vite (background and popup)
echo "Building background and popup with Vite..."
npx vite build

# Build content script bundle with esbuild
echo "Building content script bundle with esbuild..."
node build-bundle.js

echo "Build complete! Extension files are in the dist directory."
echo "Load the extension in Chrome by going to chrome://extensions/, enabling Developer mode, and clicking 'Load unpacked'." 