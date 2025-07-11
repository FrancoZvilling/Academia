import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // --- AÑADIMOS LA CONFIGURACIÓN DE PWA ---
    VitePWA({ 
      registerType: 'autoUpdate',
      // Incluye los assets más importantes en el precaché del service worker
      includeAssets: ['favicon.ico', 'apple-icon-180.png'], 
      manifest: {
        name: 'Estud-IA',
        short_name: 'EstudIA',
        description: 'Tu asistente académico para organizar materias, notas y calendario.',
        theme_color: '#ffffff', // Color de la barra de título de la app en Android
        background_color: '#ffffff', // Color de la pantalla de carga (splash screen)
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: 'manifest-icon-192.maskable.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'manifest-icon-512.maskable.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'manifest-icon-512.maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // Ícono que se adapta a diferentes formas en Android
          }
        ]
      } 
    })
  ],
})