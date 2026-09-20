import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://todd-fossil-que-map.trycloudflare.com/',
        // Local:
        // target: 'http://127.0.0.1:8000',
        target: 'https://todd-fossil-que-map.trycloudflare.com',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://127.0.0.1:8000',
        // Local:
        // target: 'ws://127.0.0.1:8000',
        target: 'https://todd-fossil-que-map.trycloudflare.com',
        ws: true,
        changeOrigin: true,
        rewriteWsOrigin: true,
      },
    },
  },
})
