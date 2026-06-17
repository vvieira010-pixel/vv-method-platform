import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  cacheDir: '.vite-cache-v2',
  build: {
    outDir: 'dist-build',
    emptyOutDir: true,
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':    ['react', 'react-dom'],
          'vendor-motion':   ['motion'],
          'vendor-recharts': ['recharts'],
        },
      },
    },
  },
  server: {
    port: 5173,
    hmr: true,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  resolve: {
    extensions: ['.jsx', '.js', '.tsx', '.ts', '.json'],
  },
});
