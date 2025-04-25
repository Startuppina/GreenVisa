import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Ascolta su tutte le interfacce di rete
    port: 3000,
    watch: {
      usePolling: true,
    },
  },
  resolve: {
    alias: {
      global: 'globalThis',
    },
  },
})
