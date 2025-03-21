#!/bin/bash

# Build script for Web Debugger extension

# Run TypeScript compiler
echo "Compiling TypeScript..."
npx tsc

# Build with Vite
echo "Building with Vite..."
npx vite build

# Manually copy direct-core.ts to output
echo "Manually copying direct-core.ts to output..."
npx esbuild src/core/direct-core.ts --outfile=dist/js/core.js --platform=browser --format=esm

echo "Build complete! Extension files are in the dist directory."
echo "Load the extension in Chrome by going to chrome://extensions/, enabling Developer mode, and clicking 'Load unpacked'." 