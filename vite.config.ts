import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    root: './',
    publicDir: 'public',
    resolve: {
        alias: {
            keplerlit: 'keplerlit/dist/keplerlit.module.js'
        }
    },
    optimizeDeps: {
        include: ['keplerlit']
    },
    build: {
        outDir: 'dist'
    }
});
