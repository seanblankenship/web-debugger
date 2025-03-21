#!/bin/bash

# Build script for Web Debugger extension

# Clean the dist directory
echo "Cleaning dist directory..."
rm -rf dist
mkdir -p dist/js dist/css dist/icons

# Run TypeScript compiler
echo "Compiling TypeScript..."
npx tsc

# Build with Vite
echo "Building with Vite..."
npx vite build

# Copy manifest and other static files
echo "Copying manifest and static files..."
cp public/manifest.json dist/
cp -r public/icons/* dist/icons/ 2>/dev/null || echo "No icons found"
cp public/popup.html dist/
cp public/debugger.html dist/

echo "Build complete! Extension files are in the dist directory."
echo "Load the extension in Chrome by going to chrome://extensions/, enabling Developer mode, and clicking 'Load unpacked'." 