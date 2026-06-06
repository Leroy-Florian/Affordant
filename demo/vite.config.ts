import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Serves the browser demos in web/. Resolves the workspace packages to their
// sources, so no build of the packages is needed to run the apps.
const src = (p: string) => fileURLToPath(new URL(`../packages/${p}/src/index.ts`, import.meta.url))

export default defineConfig({
  root: 'web',
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  resolve: {
    alias: {
      affordant: src('client'),
      '@affordant/contract': src('contract'),
      '@affordant/react': src('react'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        dashboard: fileURLToPath(new URL('./web/index.html', import.meta.url)),
        react: fileURLToPath(new URL('./web/react.html', import.meta.url)),
        vanilla: fileURLToPath(new URL('./web/vanilla.html', import.meta.url)),
      },
    },
  },
})
