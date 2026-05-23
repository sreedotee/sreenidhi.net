import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  server: { port: 5173, open: '/preview/' },
  build: {
    rollupOptions: {
      input: {
        main:    resolve(__dirname, 'index.html'),
        whatido: resolve(__dirname, 'what-i-do/index.html'),
        play:    resolve(__dirname, 'play/index.html'),
        about:   resolve(__dirname, 'about/index.html'),
        contact: resolve(__dirname, 'contact/index.html'),
        preview: resolve(__dirname, 'preview/index.html'),
        previewA: resolve(__dirname, 'preview-a/index.html'),
        previewB: resolve(__dirname, 'preview-b/index.html'),
        previewC: resolve(__dirname, 'preview-c/index.html'),
        lootbox: resolve(__dirname, 'play/lootbox-economics/index.html'),
      },
    },
  },
})
