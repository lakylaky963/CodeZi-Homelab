import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/codezi/', // Matches your Tailscale proxy subpath exactly
  plugins: [react()],
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      // Intercepts local dev socket connections and forwards them to your local Node server
      '/codezi/socket.io': {
        target: 'http://localhost:8080',
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV !== 'production',
  },
  envPrefix: 'VITE_',
})