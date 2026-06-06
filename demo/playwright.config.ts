import { defineConfig } from '@playwright/test'

const BACKEND = 'http://localhost:8787'
const WEB = 'http://localhost:4173'

// Boots the Express backend and the Vite dev server, then drives the two
// browser fronts. Run `npm run e2e:install` once to fetch the browser.
export default defineConfig({
  testDir: 'e2e',
  // Serial: the specs share one backend order, and each resets it in beforeEach.
  workers: 1,
  fullyParallel: false,
  use: { baseURL: WEB },
  webServer: [
    {
      command: 'npm run dev:express',
      url: `${BACKEND}/orders/8f3a2c`,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run web -- --port 4173 --strictPort',
      url: WEB,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
