#!/usr/bin/env node

/**
 * Custom build script for content script bundle
 * Uses esbuild to create a single bundle with all dependencies
 */

import { build } from 'esbuild';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function buildBundle() {
    try {
        // Build content script bundle
        await build({
            entryPoints: [
                resolve(__dirname, 'src/extension/content-bundle.ts'),
            ],
            bundle: true,
            outfile: 'dist/js/content-script.js',
            format: 'esm',
            platform: 'browser',
            target: ['chrome100'],
            external: ['chrome'],
            minify: false,
            sourcemap: true,
            logLevel: 'info',
        });

        console.log('✅ Content script bundle built successfully!');
    } catch (error) {
        console.error('❌ Error building content script bundle:', error);
        process.exit(1);
    }
}

buildBundle();
