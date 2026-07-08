import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'examples/playground',
  build: {
    outDir: resolve(__dirname, 'demo-dist'),
    emptyOutDir: true,
  },
});
