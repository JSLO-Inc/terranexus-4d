import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cesium from 'vite-plugin-cesium';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), cesium()],
  resolve: {
    alias: {
      '@zip.js/zip.js/lib/zip-no-worker.js': path.resolve(__dirname, 'node_modules/@zip.js/zip.js/index.js'),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/dashboard': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/operations-centre': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/operations-center': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-three': ['three'],
          'vendor-react': ['react', 'react-dom'],
          'vendor-icons': ['lucide-react'],
          'vendor-charts': ['recharts']
        }
      }
    }
  }
});
