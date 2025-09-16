import { defineConfig } from 'vite'

export default defineConfig({
  // Use relative base so the app works under https://<user>.github.io/<repo>/
  base: './',
  server: { port: 5173 },
})
