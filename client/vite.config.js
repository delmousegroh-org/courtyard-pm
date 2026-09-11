import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: ['courtyardpm.test'],
    open: 'http://courtyardpm.test:5173',
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
