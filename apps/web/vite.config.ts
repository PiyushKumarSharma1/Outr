/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: { chunkSizeWarningLimit: 2000 },
  optimizeDeps: { exclude: ['maplibre-gl', 'maplibre-gl/dist/maplibre-gl', 'maplibre-gl/dist/maplibre-gl.js'] },
  test: { environment: 'jsdom', setupFiles: ['./src/test-setup.ts'] },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
