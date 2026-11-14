import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://icns.ca',
  output: 'static',
  build: { format: 'directory', inlineStylesheets: 'never' },
  vite: { build: { assetsInlineLimit: 0 } },
});
