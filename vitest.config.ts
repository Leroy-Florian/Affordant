import { defineConfig } from 'vitest/config'

// Root config for `npm test` (runs every package's unit tests plus the demo's
// E2E matrix). The demo's Playwright specs live in e2e/ and are excluded here —
// they run via `npm run e2e`, not Vitest.
export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
  },
})
