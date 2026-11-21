import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: { outDir: 'dist/client', modulePreload: { polyfill: false } },
  plugins: [react(), tailwindcss()],
})
