import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  server: { port: 5173 },
  build: {
    rollupOptions: {
      input: {
        main:               resolve(__dirname, 'index.html'),
        about:              resolve(__dirname, 'about/index.html'),
        contact:            resolve(__dirname, 'contact/index.html'),
        atelia:             resolve(__dirname, 'projects/atelia/index.html'),
        tofha:              resolve(__dirname, 'projects/tofha/index.html'),
        whering:            resolve(__dirname, 'projects/whering/index.html'),
        goldenGroup:        resolve(__dirname, 'projects/golden-group/index.html'),
        skuCoverage:        resolve(__dirname, 'projects/sku-coverage/index.html'),
        statewatch:         resolve(__dirname, 'play/statewatch/index.html'),
        communityPlatform:  resolve(__dirname, 'play/community-platform/index.html'),
        duolingoStreak:     resolve(__dirname, 'play/duolingo-streak/index.html'),
      },
    },
  },
})
