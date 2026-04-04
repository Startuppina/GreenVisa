import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
const backendTarget = process.env.VITE_BACKEND_TARGET || 'http://localhost:8080';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./tests/setupTests.js",
    css: true,
    globals: true,
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    hmr: true,
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
        secure: false,
      },
      '/uploaded_img': {
        target: backendTarget,
        changeOrigin: true,
        secure: false,
      },
    },
    watch: {
      usePolling: true,
    },
    allowedHosts: ["localhost", "vps-0fde778b.vps.ovh.net"],
  },
});
