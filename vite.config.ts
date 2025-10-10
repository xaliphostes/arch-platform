import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    root: './',
    publicDir: 'public',
    base: '/arch-platform/', // must match your GitHub repo name
    optimizeDeps: {
        include: ['three', 'three/examples/jsm/controls/TrackballControls.js']
    },
    build: {
        outDir: 'dist'
    }
});
