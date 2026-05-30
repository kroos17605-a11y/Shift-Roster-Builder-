import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { teamFileApi } from './teamFileApi'

export default defineConfig({
  plugins: [react(), tailwindcss(), teamFileApi()],
  server: {
    watch: {
      ignored: ['**/data/teams/**'],
    },
  },
})
