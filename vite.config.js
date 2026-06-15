import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Uangnya Nidia n Rizki',
        short_name: 'Nidia n Rizki',
        description: 'Aplikasi Pencatatan Keuangan Keluarga',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/apple-touch-icon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})