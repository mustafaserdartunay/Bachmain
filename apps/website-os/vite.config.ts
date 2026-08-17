import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  base: '/website-os/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    host: '127.0.0.1',
    port: 5300,
    strictPort: true,
    proxy: {
      '/v1': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
})
