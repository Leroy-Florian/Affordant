import { mkdirSync } from 'node:fs'
import { expect, test } from '@playwright/test'

// Captures PNGs of the pages (EN + a FR sample) for the README / sharing.
// Regenerate with: npx playwright test screenshots
const DIR = 'screenshots'

test('capture the pages', async ({ page, request }) => {
  mkdirSync(DIR, { recursive: true })
  await request.post('http://localhost:8787/reset')
  await page.setViewportSize({ width: 1000, height: 860 })

  // Dashboard — both backends should read as up. (Default language is English.)
  await page.goto('/')
  await expect(page.locator('.dot.up')).toHaveCount(4)
  await page.screenshot({ path: `${DIR}/dashboard.png`, fullPage: true })

  // React front (EN) — owner view.
  await page.goto('/react.html')
  await page.getByLabel(/owner/i).check()
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
  await page.screenshot({ path: `${DIR}/react.png`, fullPage: true })

  // Vanilla front (EN) — owner view.
  await page.goto('/vanilla.html')
  await page.getByLabel(/owner/i).check()
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
  await page.screenshot({ path: `${DIR}/vanilla.png`, fullPage: true })

  // React front in French — switch the language and re-shoot.
  await page.goto('/react.html')
  await page.evaluate(() => localStorage.setItem('affordant-lang', 'fr'))
  await page.reload()
  await page.getByLabel(/propriétaire/i).check()
  await expect(page.getByRole('button', { name: 'Annuler' })).toBeVisible()
  await page.screenshot({ path: `${DIR}/react.fr.png`, fullPage: true })
})
