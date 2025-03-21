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
                'content-script': resolve(__dirname, 'src/extension/content-bundle.ts'),
                popup: resolve(__dirname, 'src/extension/popup.ts')
            },
            output: {
                entryFileNames: 'js/[name].js',
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
                }
            }
        },
        cssCodeSplit: false,
        target: 'esnext',
        minify: false
    },
    publicDir: 'public'
}); 