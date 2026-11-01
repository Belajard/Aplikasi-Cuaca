import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // Path relatif agar hasil build bisa dibuka dari folder/subpath mana pun.
  base: './',
  plugins: [vue()],
  server: {
    // Dengarkan semua antarmuka jaringan, bukan hanya localhost,
    // supaya perangkat lain / simulator bisa mengakses lewat IP.
    host: true,
    port: 5173,
    // Izinkan akses lewat domain tunnel (cloudflared, ngrok, dll.).
    allowedHosts: true,
  },
  preview: {
    host: true,
    port: 4173,
    allowedHosts: true,
  },
})
