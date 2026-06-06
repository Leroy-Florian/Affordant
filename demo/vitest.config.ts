import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Resolve the workspace packages to their TypeScript sources so the demo's
// E2E suites run from `demo/` directly — no prior `npm run build` needed.
// (Running from the repo root builds first via the root `pretest`; the
// published-artifact path is covered separately by `../smoke`.)
const src = (p: string) => fileURLToPath(new URL(`../packages/${p}/src/index.ts`, import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      affordant: src('client'),
      '@affordant/contract': src('contract'),
      '@affordant/server': src('server'),
      '@affordant/express': src('express'),
      '@affordant/react': src('react'),
    },
  },
  test: {
    // Vitest runs the matrix suites under tests/; the Playwright specs live in e2e/.
    include: ['tests/**/*.test.{ts,tsx}'],
  },
})
