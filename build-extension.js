#!/usr/bin/env node

/**
 * Custom build script for browser extension
 * This handles the specific requirements of Chrome extensions
 * and ensures files are in the correct locations
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Directories
const SRC_DIR = path.resolve('src');
const DIST_DIR = path.resolve('dist');
const PUBLIC_DIR = path.resolve('public');
const EXTENSION_DIR = path.resolve(SRC_DIR, 'extension');

// Ensure dist directory exists
if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
}

// Create subdirectories
['js', 'css', 'icons'].forEach((dir) => {
    const dirPath = path.join(DIST_DIR, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
});

// Build steps
console.log('🔨 Building extension...');

try {
    // 1. Run TypeScript compiler
    console.log('📝 Compiling TypeScript...');
    execSync('npx tsc', { stdio: 'inherit' });

    // 2. Bundle JavaScript with Vite
    console.log('📦 Bundling with Vite...');
    execSync('npx vite build', { stdio: 'inherit' });

    // 3. Copy HTML file
    console.log('📋 Copying HTML files...');
    fs.copyFileSync(
        path.join(EXTENSION_DIR, 'popup.html'),
        path.join(DIST_DIR, 'popup.html')
    );

    // 4. Copy or create CSS file
    console.log('🎨 Copying CSS files...');
    const popupCssPath = path.join(EXTENSION_DIR, 'popup.css');
    const destCssPath = path.join(DIST_DIR, 'css', 'popup.css');

    if (fs.existsSync(popupCssPath)) {
        fs.copyFileSync(popupCssPath, destCssPath);
    } else {
        // Create default CSS if the file doesn't exist
        console.log('⚠️ popup.css not found, creating default CSS');
        const defaultCss = `
:root {
  --primary-color: #6366f1;
  --secondary-color: #4f46e5;
  --background-color: #ffffff;
  --text-color: #111827;
  --border-color: #e5e7eb;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  margin: 0;
  padding: 0;
  background-color: var(--background-color);
  color: var(--text-color);
  min-width: 300px;
  max-width: 350px;
}

.popup-container {
  padding: 16px;
}

h1 {
  font-size: 1.25rem;
  margin-top: 0;
  margin-bottom: 8px;
  color: var(--primary-color);
}

p {
  font-size: 0.875rem;
  margin-top: 0;
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 16px;
}

label {
  display: block;
  font-size: 0.875rem;
  margin-bottom: 4px;
}

select {
  width: 100%;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background-color: var(--background-color);
  font-size: 0.875rem;
  color: var(--text-color);
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 16px;
}

select:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 1px;
}

button {
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 100%;
}

button:hover {
  background-color: var(--secondary-color);
}

button:focus {
  outline: 2px solid var(--secondary-color);
  outline-offset: 2px;
}`;
        fs.writeFileSync(destCssPath, defaultCss);
    }

    // 5. Copy manifest
    console.log('📄 Copying manifest.json...');
    fs.copyFileSync(
        path.join(PUBLIC_DIR, 'manifest.json'),
        path.join(DIST_DIR, 'manifest.json')
    );

    // 6. Create or copy icons
    console.log('🖼️ Copying icons...');
    ['icon16.png', 'icon48.png', 'icon128.png'].forEach((icon) => {
        const iconSrc = path.join(PUBLIC_DIR, 'icons', icon);
        const iconDest = path.join(DIST_DIR, 'icons', icon);

        if (fs.existsSync(iconSrc)) {
            fs.copyFileSync(iconSrc, iconDest);
        } else {
            // Create placeholder icon file
            console.log(`⚠️ ${icon} not found, creating placeholder`);
            fs.writeFileSync(iconDest, '');
        }
    });

    console.log('✅ Build completed successfully!');
    console.log('📁 Extension is ready in the dist/ directory');
    console.log(
        '🔍 Load it in Chrome using chrome://extensions/ in developer mode'
    );
} catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
}
