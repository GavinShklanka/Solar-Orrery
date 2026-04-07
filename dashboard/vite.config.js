import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages: serves from /repo-name/ subdirectory
  base: '/Solar-Orrery/',
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('recharts')) return 'recharts'
          if (id.includes('d3-')) return 'd3'
          if (id.includes('react')) return 'react'
        }
      }
    }
  },
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://localhost:8002', changeOrigin: true } },
  },
})
