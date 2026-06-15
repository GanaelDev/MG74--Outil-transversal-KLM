import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['lucide-react'],
  },
  server: {
    host: true,                  // écoute sur 0.0.0.0 (accessible depuis le conteneur)
    port: 5173,
    watch: { usePolling: true }, // HMR fiable à travers le bind mount Docker
  },
});