import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    root: './',
    publicDir: 'public',
    base: '/arch-platform/', // must match your GitHub repo name
    // assetsInclude: ['**/*.ts'], // Tell Vite to treat .ts files in public as assets
    optimizeDeps: {
        include: ['three', 'three/examples/jsm/controls/TrackballControls.js']
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            onwarn(warning, warn) {
                // Suppress warnings from node_modules
                if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
                if (warning.loc && warning.loc.file?.includes('node_modules')) return;
                warn(warning);
            }
        }
    }
});
