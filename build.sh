#!/bin/bash

# Build script for web-debugger extension

# Step 1: Compile TypeScript
echo "Compiling TypeScript..."
npx tsc

# Step 2: Run Vite build (will empty dist directory)
echo "Running Vite build..."
npx vite build

# Step 3: Create directories for extension files
echo "Creating directories..."
mkdir -p dist/css dist/icons

# Step 4: Copy extension files
echo "Copying extension files..."
cp src/extension/popup.html dist/
cp src/extension/popup.css dist/css/
cp public/manifest.json dist/

# Step 5: Copy or create icon files
echo "Setting up icons..."
cp public/icons/* dist/icons/ 2>/dev/null || touch dist/icons/icon16.png dist/icons/icon48.png dist/icons/icon128.png

echo "Build complete! Extension files are in the dist directory."
echo "Load the extension in Chrome by going to chrome://extensions/, enabling Developer mode, and clicking 'Load unpacked'." 