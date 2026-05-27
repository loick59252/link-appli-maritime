import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Port par défaut
    host: true // Permet l'accès depuis d'autres appareils du réseau local
  }
})