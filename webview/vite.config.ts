import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Read version from main package.json
const packageJson = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf-8'));

export default defineConfig({
  plugins: [react()],
  // Hindari absolute path seperti /assets/ pada HTML hasil build
  base: '',
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  build: {
    // Build hasil Vite akan diletakkan di root extension: dist/webview
    outDir: '../dist/webview',
    emptyOutDir: true,
    assetsDir: 'assets',
    manifest: true,
    sourcemap: true,
    rollupOptions: {
      input: resolve(__dirname, 'index.html')
    }
  },
  server: {
    port: 5173,
    strictPort: true
  }
});
