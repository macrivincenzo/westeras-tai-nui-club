import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.kungfu.nu',
  output: 'static',
  build: {
    inlineStylesheets: 'auto',
    assets: '_assets'
  },
  vite: {
    build: {
      cssMinify: true,
      minify: 'terser',
      rollupOptions: {
        output: {
          manualChunks: undefined
        }
      }
    }
  }
});
