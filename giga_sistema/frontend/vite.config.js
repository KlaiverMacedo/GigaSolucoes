import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // <-- Isso é crucial para o Docker
    port: 5173,
    watch: {
      usePolling: true,
    },
  },
})