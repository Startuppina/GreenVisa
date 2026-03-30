import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setupTests.js',
    css: true,
    globals: true,
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    hmr: true,
    watch: {
      usePolling: true,
    },
    allowedHosts: ['localhost', 'vps-0fde778b.vps.ovh.net'],
  },
})
