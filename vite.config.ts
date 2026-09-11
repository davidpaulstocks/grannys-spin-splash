/**
 * Vite config — bundles everything locally. Poki rejects external requests
 * (CLAUDE.md §3 rule 3). The only allowed external script is the Poki SDK
 * itself, which is injected via index.html's <script> tag, not imported.
 *
 * Also carries Vitest's config (the `test` key below) so unit tests share
 * one config file — see the triple-slash reference for its types.
 */

/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 5173, strictPort: false },
  test: {
    // jsdom gives Systems/ tests (e.g. SaveManager) a real `localStorage` global.
    environment: 'jsdom',
  },
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
