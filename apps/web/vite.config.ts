import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import path from 'node:path'
import yaml from '@rollup/plugin-yaml'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    yaml(),
  ],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      { find: "mmolike_rpg-application", replacement: path.resolve(__dirname, "../..", "packages/application/src") },
      { find: "mmolike_rpg-domain", replacement: path.resolve(__dirname, "../..", "packages/domain/src") },
      { find: "mmolike_rpg-content", replacement: path.resolve(__dirname, "../..", "packages/content/src") }
    ]
  },
})
