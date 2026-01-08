import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Allow access from mobile devices on same network
    port: 5173,
  },
  build: {
    // Optimize for production
    minify: 'terser',
    sourcemap: false,
  },
})
