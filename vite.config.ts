import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src')
        }
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                background: resolve(__dirname, 'src/extension/background.ts'),
                'content-script': resolve(__dirname, 'src/extension/content-script.ts'),
                popup: resolve(__dirname, 'src/extension/popup.ts'),
                // Core files
                core: resolve(__dirname, 'src/core/index.ts'),
                'base-panel': resolve(__dirname, 'src/ui/components/base-panel.ts'),
                'welcome-dashboard': resolve(__dirname, 'src/ui/components/welcome-dashboard.ts'),
                'custom-element': resolve(__dirname, 'src/ui/custom-element.ts')
            },
            output: {
                entryFileNames: 'js/[name].js',
                chunkFileNames: 'js/[name]-[hash].js',
                assetFileNames: (assetInfo) => {
                    const name = assetInfo.name || '';
                    const info = name.split('.');
                    const ext = info[info.length - 1];

                    if (ext === 'css') {
                        return 'css/[name][extname]';
                    }
                    if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(name)) {
                        return 'icons/[name][extname]';
                    }
                    return 'assets/[name][extname]';
                },
                manualChunks: undefined
            }
        },
        target: 'esnext',
        minify: false
    },
    publicDir: 'public'
}); 