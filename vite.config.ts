/**
 * Vite config — bundles everything locally. Poki rejects external requests
 * (CLAUDE.md §3 rule 3). The only allowed external script is the Poki SDK
 * itself, which is injected via index.html's <script> tag, not imported.
 */

import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 5173, strictPort: false },
  build: {
    target: 'es2022',
    sourcemap: true,
    // Inline small assets directly into JS to avoid extra network requests.
    assetsInlineLimit: 4096,
    rollupOptions: {
      // Explicitly no externals: phaser, fonts, etc. all get bundled.
      external: [],
      output: {
        manualChunks: undefined,
      },
    },
  },
  optimizeDeps: {
    include: ['phaser'],
  },
});
