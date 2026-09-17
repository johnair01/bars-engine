import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  base: '/understood-app/',
  build: {
    outDir: path.resolve(__dirname, '../public/understood-app'),
    emptyOutDir: true,
  },
});
