import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: '/admin/',
  plugins: [react()],
  resolve: {
    alias: {
      inflection: path.resolve(rootDir, 'src/shims/inflection.ts'),
    },
    dedupe: ['react', 'react-dom', 'react-admin'],
  },
  optimizeDeps: {
    exclude: ['inflection'],
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
