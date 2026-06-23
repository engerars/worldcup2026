import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, '../public'),
    emptyOutDir: false,
    assetsDir: 'assets'
  },
  server: {
    port: 5173,
    proxy: {
      '/get': { target: 'http://localhost:3050', changeOrigin: true },
      '/data': { target: 'http://localhost:3050', changeOrigin: true },
      '/stadiums': { target: 'http://localhost:3050', changeOrigin: true },
      '/trophy.png': { target: 'http://localhost:3050', changeOrigin: true },
      '/api-docs': { target: 'http://localhost:3050', changeOrigin: true }
    }
  }
});
