/// <reference types="vitest/config" />
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { adminStaticPlugin } from './scripts/adminDevMiddleware';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), adminStaticPlugin()],
  resolve: {
    alias: {
      '@app': path.resolve(rootDir, 'src/app'),
      '@pages': path.resolve(rootDir, 'src/pages'),
      '@widgets': path.resolve(rootDir, 'src/widgets'),
      '@features': path.resolve(rootDir, 'src/features'),
      '@entities': path.resolve(rootDir, 'src/entities'),
      '@shared': path.resolve(rootDir, 'src/shared'),
      // Данные, локали и картинки скопированы из apps/web — пакет самостоятельный.
      '@locales': path.resolve(rootDir, 'src/locales'),
      '@assets': path.resolve(rootDir, 'assets'),
      '@legacy-data': path.resolve(rootDir, 'src/shared/legacy/spreadsAndCards'),
      '@legacy-icons': path.resolve(rootDir, 'src/shared/legacy/icons'),
      '@legacy-legal': path.resolve(rootDir, 'src/shared/legacy/legal'),
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3002',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://127.0.0.1:3002',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/shared/api/mocks/setup.ts'],
  },
});
