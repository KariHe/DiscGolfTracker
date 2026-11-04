/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  // GitHub Pages serves the app under /<repo>/
  base: command === 'build' ? '/DiscGolfTracker/' : '/',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
  },
}))
