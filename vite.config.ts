/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['gz.visionclaw.online'],
  },
  test: {
    globals: true,
    environment: 'node',
  },
})
