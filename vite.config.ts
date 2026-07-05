import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Trigger redeployment to bypass transient GitHub Pages deployment failure
export default defineConfig({
  plugins: [react()],
})
